'use client'

import { useState, useEffect, useTransition } from 'react'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Clock, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarChart } from './DollarChart'
import { DollarInfo } from './DollarInfo'
import { DOLLAR_TYPE_LABELS, DOLLAR_TYPE_COLORS } from '@/lib/api/constants/dollar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
// Importar Server Actions
import { 
  fetchCurrentDollarRates, 
  fetchHistoricalDollarRates 
} from '@/app/actions/dollar.actions'

// Tipos importados del servicio
interface DollarRate {
  dollarType: string
  buyPrice: number
  sellPrice: number
  date: string
  lastUpdate?: Date
  averagePrice: number
  spread: number
  spreadPercentage: string
}

interface DollarCurrentData {
  [key: string]: DollarRate
}

interface DollarHistoricalPoint {
  date: string
  [key: string]: any
}

interface DollarComparison {
  date: string
  types: {
    type: string
    label: string
    buyPrice: number
    sellPrice: number
    averagePrice: number
    spread: number
    spreadPercentage: string
  }[]
  analysis: {
    cheapest: string
    mostExpensive: string
    averageSpread: number
    maxDifference: number
  }
}

interface DollarData {
  current: DollarCurrentData
  historical: {
    series: DollarHistoricalPoint[]
    summary: any
  }
  comparison: DollarComparison
}

interface DollarClientProps {
  initialData: DollarData
}

export function DollarClient({ initialData }: DollarClientProps) {
  const [data, setData] = useState<DollarData>(initialData)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['BLUE', 'OFICIAL'])
  const [timeRange, setTimeRange] = useState('3months')
  const [isPending, startTransition] = useTransition()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoadingHistorical, setIsLoadingHistorical] = useState(false)

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

  // Función para obtener el tiempo transcurrido
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} min`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `Hace ${hours}h`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `Hace ${days} días`
    }
  }

  // Función para obtener datos históricos usando Server Actions
  const fetchHistoricalData = async (timeRange: string) => {
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
      
      console.log(`📊 Solicitando datos históricos:`, {
        timeRange,
        from,
        to,
        interval
      })
      
      // Usar Server Action para obtener datos históricos
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
  }

  // Función para actualizar datos usando Server Actions
  const refreshData = async () => {
    startTransition(async () => {
      try {
        // Usar Server Action para obtener datos actuales
        const result = await fetchCurrentDollarRates()
        
        if (result.success && result.data) {
          setData(prev => ({
            ...prev,
            current: result.data
          }))
          setLastUpdate(new Date())
        }
        
        // También actualizar datos históricos
        await fetchHistoricalData(timeRange)
      } catch (error) {
        console.error('Error refreshing data:', error)
      }
    })
  }

  // Efecto para cargar datos históricos cuando cambie el período
  useEffect(() => {
    if (timeRange) {
      fetchHistoricalData(timeRange)
    }
  }, [timeRange])

  // Componente para mostrar una tarjeta de cotización - VERSION DESKTOP
  const DollarCard = ({ type, rate }: { type: string; rate: DollarRate }) => {
    const variation = 0 // Por ahora simulado
    const isPositive = variation >= 0
    
    return (
      <>
        {/* Versión Desktop - Se oculta en móvil */}
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
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className="text-xs"
              >
                {isPositive ? '+' : ''}{variation.toFixed(2)}%
              </Badge>
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
                <span>{getTimeAgo(new Date(rate.date))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Versión Móvil - Más compacta */}
        <Card className="md:hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="">
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
              <Badge 
                variant={isPositive ? "default" : "destructive"}
                className="text-xs h-5"
              >
                {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                {Math.abs(variation).toFixed(1)}%
              </Badge>
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
              <span>{getTimeAgo(new Date(rate.date))}</span>
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header - Más compacto en móvil */}
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
            <div className="text-xs md:text-sm text-muted-foreground">
              {getTimeAgo(lastUpdate)}
            </div>
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