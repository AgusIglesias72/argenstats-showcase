// components/indicators/dollar/DollarClient.tsx
'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Clock, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarChart } from './DollarChart'
import { DollarInfo } from './DollarInfo'
import { DOLLAR_TYPE_LABELS, DOLLAR_TYPE_COLORS } from '@/lib/api/constants/dollar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Server Actions
import { 
  fetchCurrentDollarRates, 
  fetchHistoricalDollarRates 
} from '@/app/actions/dollar.actions'

interface DollarRate {
  dollarType: string
  buyPrice: number
  sellPrice: number
  date: string
  lastUpdate?: Date
  averagePrice: number
  spread: number
  spreadPercentage: string
  variation?: {
    amount: number
    percentage: number
    previousPrice?: number
  }
}

interface DollarCurrentData {
  [key: string]: DollarRate
}

interface DollarData {
  current: DollarCurrentData
  historical: {
    series: any[]
    summary: any
  }
  comparison: any
}

interface DollarClientProps {
  initialData: DollarData
}

export function DollarClient({ initialData }: DollarClientProps) {
  const [data, setData] = useState<DollarData>(initialData)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['BLUE', 'OFICIAL'])
  const [timeRange, setTimeRange] = useState('3months')
  const [isPending, startTransition] = useTransition()
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Manejar hidratación
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-actualización al cargar la página
  useEffect(() => {
    if (isClient && isInitialLoad) {
      // Actualizar datos inmediatamente al cargar
      refreshData()
      setIsInitialLoad(false)
    }
  }, [isClient])

  // Opcional: Auto-refresh cada 5 minutos (300000 ms)
  useEffect(() => {
    if (isClient) {
      const interval = setInterval(() => {
        refreshDataSilently()
      }, 300000) // 5 minutos

      return () => clearInterval(interval)
    }
  }, [isClient])

  // Agrupar tipos de dólar por categoría
  const financialDollars = ['MEP', 'CCL', 'CRYPTO']
  const referenceDollars = ['BLUE', 'OFICIAL', 'MAYORISTA', 'TARJETA']

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Función para formatear precio compacto (para móvil)
  const formatCompactPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Función corregida para obtener el tiempo transcurrido
  const getTimeAgo = (dateString: string | Date | undefined) => {
    // Evitar problemas de hidratación
    if (!isClient) {
      return 'Actualizando...'
    }

    try {
      let date: Date
      
      // Manejar diferentes tipos de entrada
      if (!dateString) {
        return 'Recién actualizado'
      } else if (dateString instanceof Date) {
        date = dateString
      } else {
        date = new Date(dateString)
      }
      
      const now = new Date()
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Recién actualizado'
      }
      
      // Si la fecha es futura (error en datos), mostrar como recién actualizado
      if (date > now) {
        return 'Recién actualizado'
      }
      
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) {
        return 'Hace menos de 1 min'
      } else if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} min`
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60)
        return `Hace ${hours}h`
      } else {
        const days = Math.floor(diffInMinutes / 1440)
        if (days === 1) {
          return 'Ayer'
        } else if (days < 7) {
          return `Hace ${days} días`
        } else {
          // Para fechas más antiguas, mostrar la fecha completa
          return format(date, 'dd/MM/yyyy', { locale: es })
        }
      }
    } catch (error) {
      console.error('Error parsing date:', dateString, error)
      return 'Recién actualizado'
    }
  }

  // Función para calcular variación real comparando con día anterior
  const getVariation = (type: string, currentPrice: number) => {
    try {
      // Primero verificar si el rate ya tiene variación calculada desde el servidor
      const rate = data.current[type]
      if (rate && rate.variation) {
        return rate.variation.percentage
      }
      
      // Si no, intentar calcular desde datos históricos
      if (data.historical && data.historical.series && data.historical.series.length > 0) {
        // Ordenar por fecha descendente
        const sortedData = [...data.historical.series].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        
        // Buscar el precio anterior para este tipo de dólar
        for (let i = 1; i < sortedData.length; i++) {
          const previousData = sortedData[i]
          
          // Buscar el campo que corresponde a este tipo de dólar
          const sellKey = `${type}_sell`
          const buyKey = `${type}_buy`
          const avgKey = `${type}_avg`
          
          let previousPrice = null
          
          if (previousData[sellKey]) {
            previousPrice = previousData[sellKey]
          } else if (previousData[avgKey]) {
            previousPrice = previousData[avgKey]
          } else if (previousData[buyKey]) {
            previousPrice = previousData[buyKey]
          } else if (previousData[type]) {
            // A veces viene directamente como el tipo o como objeto
            if (typeof previousData[type] === 'object') {
              previousPrice = previousData[type].sell || previousData[type].avg || previousData[type].buy
            } else {
              previousPrice = previousData[type]
            }
          }
          
          if (previousPrice && previousPrice > 0) {
            // Calcular variación porcentual
            const variation = ((currentPrice - previousPrice) / previousPrice) * 100
            return variation
          }
        }
      }
      
      // Si no hay datos históricos, retornar 0
      return 0
      
    } catch (error) {
      console.error('Error calculating variation for', type, error)
      return 0
    }
  }

  // Función para obtener datos históricos
  const fetchHistoricalData = useCallback(async (timeRange: string) => {
    if (!isClient) return
    
    setIsLoadingHistorical(true)
    try {
      const now = new Date()
      let fromDate: Date
      let interval: 'daily' | 'weekly' | 'monthly' = 'daily'
      
      switch (timeRange) {
        case '3months':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          interval = 'daily'
          break
        case '6months':
          fromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          interval = 'daily'
          break
        case '1year':
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          interval = 'daily'
          break
        case '5years':
          fromDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000)
          interval = 'weekly'
          break
        case '10years':
          fromDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000)
          interval = 'monthly'
          break
        case '15years':
          fromDate = new Date(now.getTime() - 15 * 365 * 24 * 60 * 60 * 1000)
          interval = 'monthly'
          break
        default:
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      }
      
      const from = fromDate.toISOString().split('T')[0]
      const to = now.toISOString().split('T')[0]
      
      const result = await fetchHistoricalDollarRates({
        from,
        to,
        interval
      })
      
      if (result.success && result.data) {
        setData(prevData => ({
          ...prevData,
          historical: result.data
        }))
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
    } finally {
      setIsLoadingHistorical(false)
    }
  }, [isClient])

  // Función para actualizar datos con indicador de carga
  const refreshData = async () => {
    startTransition(async () => {
      try {
        const result = await fetchCurrentDollarRates()
        
        if (result.success && result.data) {
          setData(prev => ({
            ...prev,
            current: result.data
          }))
          if (isClient) {
            setLastUpdate(new Date())
          }
        }
        
        await fetchHistoricalData(timeRange)
      } catch (error) {
        console.error('Error refreshing data:', error)
      }
    })
  }

  // Función para actualizar datos silenciosamente (sin indicador de carga)
  const refreshDataSilently = async () => {
    try {
      const result = await fetchCurrentDollarRates()
      
      if (result.success && result.data) {
        setData(prev => ({
          ...prev,
          current: result.data
        }))
        if (isClient) {
          setLastUpdate(new Date())
        }
      }
      
      // También actualizar datos históricos silenciosamente
      const now = new Date()
      let fromDate: Date
      let interval: 'daily' | 'weekly' | 'monthly' = 'daily'
      
      switch (timeRange) {
        case '3months':
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          interval = 'daily'
          break
        case '6months':
          fromDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
          interval = 'daily'
          break
        case '1year':
          fromDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          interval = 'daily'
          break
        case '5years':
          fromDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000)
          interval = 'weekly'
          break
        case '10years':
          fromDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000)
          interval = 'monthly'
          break
        case '15years':
          fromDate = new Date(now.getTime() - 15 * 365 * 24 * 60 * 60 * 1000)
          interval = 'monthly'
          break
        default:
          fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      }
      
      const from = fromDate.toISOString().split('T')[0]
      const to = now.toISOString().split('T')[0]
      
      const historicalResult = await fetchHistoricalDollarRates({
        from,
        to,
        interval
      })
      
      if (historicalResult.success && historicalResult.data) {
        setData(prevData => ({
          ...prevData,
          historical: historicalResult.data
        }))
      }
    } catch (error) {
      console.error('Error in silent refresh:', error)
    }
  }

  // Efecto para cargar datos históricos cuando cambie el período
  useEffect(() => {
    if (timeRange && isClient && !isInitialLoad) {
      fetchHistoricalData(timeRange)
    }
  }, [timeRange, isClient, isInitialLoad, fetchHistoricalData])

  // Componente para mostrar una tarjeta de cotización
  const DollarCard = ({ type, rate }: { type: string; rate: DollarRate }) => {
    // Calcular variación - primero intenta usar la que viene del servidor, si no calcularla
    const variation = rate.variation?.percentage || getVariation(type, rate.sellPrice)
    const isPositive = variation > 0
    const isNegative = variation < 0
    
    return (
      <>
        {/* Versión Desktop */}
        <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow 
        duration-300 hidden md:block">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 
          to-transparent rounded-bl-full" />
          <CardHeader className="relative pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {DOLLAR_TYPE_LABELS[type] || type}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {type}
                  </CardDescription>
                </div>
              </div>
              {(
                <Badge 
                  variant={isPositive ? "destructive" : isNegative ? "default" : "secondary"}
                  className="text-xs"
                >
                  {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : isNegative ? <ArrowDown className="h-3 w-3 mr-1" /> : null}
                  {Math.abs(variation).toFixed(2)}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm text-muted-foreground mb-1">Compra</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(rate.buyPrice)}
                </p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm text-muted-foreground mb-1">Venta</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatPrice(rate.sellPrice)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Actualizado</span>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{getTimeAgo(rate.lastUpdate || rate.date)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Versión Móvil */}
        <Card className="md:hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: DOLLAR_TYPE_COLORS[type] || '#10b981' }}
                />
                <div>
                  <p className="font-semibold text-sm text-gray-900 dark:text-white">
                    {DOLLAR_TYPE_LABELS[type] || type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {type}
                  </p>
                </div>
              </div>
              {(
                <Badge 
                  variant={isPositive ? "destructive" : isNegative ? "default" : "secondary"}
                  className="text-xs h-5"
                >
                  {isPositive ? <ArrowUp className="h-3 w-3" /> : isNegative ? <ArrowDown className="h-3 w-3" /> : null}
                  {Math.abs(variation).toFixed(1)}%
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                <p className="text-xs text-muted-foreground">Compra</p>
                <p className="font-bold text-sm">
                  {formatCompactPrice(rate.buyPrice)}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-2">
                <p className="text-xs text-muted-foreground">Venta</p>
                <p className="font-bold text-sm">
                  {formatCompactPrice(rate.sellPrice)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{getTimeAgo(rate.lastUpdate || rate.date)}</span>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  // Mostrar loading durante la hidratación
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Cargando cotizaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl md:rounded-2xl mb-3 md:mb-4">
            <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
            Cotizaciones de Dólar
          </h1>
          <p className="text-sm md:text-lg text-gray-600 dark:text-gray-400">
            <span className="hidden md:inline">Seguimiento en tiempo real de los principales tipos de cambio en Argentina</span>
            <span className="md:hidden">Tipos de cambio en Argentina</span>
          </p>
          <div className="flex items-center justify-center space-x-4 mt-3 md:mt-4">
            <Button
              onClick={refreshData}
              disabled={isPending}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
     
          </div>
        </div>

        {/* Cotizaciones actuales */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden md:inline">Cotizaciones actuales</span>
              <span className="md:hidden">Cotizaciones</span>
            </h2>
          </div>

          {/* Dólares Financieros */}
          <div className="mb-4 md:mb-6">
            <div className="flex items-center space-x-2 mb-3 md:mb-4">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <h3 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">
                Dólares Financieros
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-6">
              {financialDollars.map(type => {
                const rate = data.current[type]
                return rate ? (
                  <DollarCard key={type} type={type} rate={rate} />
                ) : null
              })}
            </div>
          </div>

          {/* Dólares de Referencia */}
          <div>
            <div className="flex items-center space-x-2 mb-3 md:mb-4">
              <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              <h3 className="text-base md:text-xl font-semibold text-gray-900 dark:text-white">
                Dólares de Referencia
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
              {referenceDollars.map(type => {
                const rate = data.current[type]
                return rate ? (
                  <DollarCard key={type} type={type} rate={rate} />
                ) : null
              })}
            </div>
          </div>
        </div>

        {/* Análisis Histórico */}
        <DollarChart 
          data={data.historical}
          selectedTypes={selectedTypes}
          timeRange={timeRange}
          onTypesChange={setSelectedTypes}
          onTimeRangeChange={setTimeRange}
          isLoading={isLoadingHistorical}
        />

        {/* Información */}
        <DollarInfo />
      </div>
    </div>
  )
}