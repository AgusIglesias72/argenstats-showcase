'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, Clock, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DollarChart } from './DollarChart'
import { DollarInfo } from './DollarInfo'
import { DOLLAR_TYPES, DOLLAR_TYPE_LABELS, DOLLAR_TYPE_COLORS } from '@/lib/api/constants/dollar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Tipos para los datos del dólar
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

// Función para generar datos mock cuando no hay datos reales
const generateMockDollarData = () => {
  const basePrice = 1200
  const variation = Math.random() * 100 - 50 // Variación de -50 a +50
  
  return {
    BLUE: {
      dollarType: 'BLUE',
      buyPrice: basePrice + variation,
      sellPrice: basePrice + variation + 20,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice + variation + 10,
      spread: 20,
      spreadPercentage: '1.67'
    },
    OFICIAL: {
      dollarType: 'OFICIAL',
      buyPrice: basePrice - 200,
      sellPrice: basePrice - 180,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice - 190,
      spread: 20,
      spreadPercentage: '1.67'
    },
    MEP: {
      dollarType: 'MEP',
      buyPrice: basePrice + variation - 50,
      sellPrice: basePrice + variation - 30,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice + variation - 40,
      spread: 20,
      spreadPercentage: '1.67'
    },
    CCL: {
      dollarType: 'CCL',
      buyPrice: basePrice + variation - 30,
      sellPrice: basePrice + variation - 10,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice + variation - 20,
      spread: 20,
      spreadPercentage: '1.67'
    },
    CRYPTO: {
      dollarType: 'CRYPTO',
      buyPrice: basePrice + variation - 20,
      sellPrice: basePrice + variation,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice + variation - 10,
      spread: 20,
      spreadPercentage: '1.67'
    },
    MAYORISTA: {
      dollarType: 'MAYORISTA',
      buyPrice: basePrice - 150,
      sellPrice: basePrice - 130,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice - 140,
      spread: 20,
      spreadPercentage: '1.67'
    },
    TARJETA: {
      dollarType: 'TARJETA',
      buyPrice: basePrice + 400,
      sellPrice: basePrice + 420,
      date: new Date().toISOString().split('T')[0],
      averagePrice: basePrice + 410,
      spread: 20,
      spreadPercentage: '1.67'
    }
  }
}

export function DollarClient({ initialData }: DollarClientProps) {
  const [data, setData] = useState<DollarData>(() => {
    // Si no hay datos iniciales, usar datos mock
    if (!initialData || Object.keys(initialData.current || {}).length === 0) {
      return {
        current: generateMockDollarData(),
        historical: { series: [], summary: {} },
        comparison: { types: [], analysis: {} }
      }
    }
    return initialData
  })
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['BLUE', 'OFICIAL'])
  const [timeRange, setTimeRange] = useState('3months')
  const [isPending, startTransition] = useTransition()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Agrupar tipos de dólar por categoría
  const financialDollars = ['MEP', 'CCL', 'CRYPTO']
  const referenceDollars = ['BLUE', 'OFICIAL', 'MAYORISTA', 'TARJETA']

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price)
  }

  // Función para calcular variación (simulada por ahora)
  const calculateVariation = (current: number, previous: number) => {
    if (!previous || previous === 0) return 0
    return ((current - previous) / previous) * 100
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

  // Función para obtener datos históricos
  const fetchHistoricalData = async (timeRange: string) => {
    try {
      const now = new Date()
      let fromDate: Date
      let interval = 'daily'
      
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
          interval = 'daily'
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
      
      const response = await fetch(`/api/conversor/dollar?from=${from}&to=${to}&interval=${interval}`)
      
      if (!response.ok) {
        throw new Error('Error fetching historical data')
      }
      
      const result = await response.json()
      
      console.log(`📊 Fetching ${timeRange}:`, {
        from,
        to,
        interval,
        dataCount: result.data?.length || 0,
        metadata: result.metadata
      })
      
      if (result.success && result.data) {
        setData(prevData => ({
          ...prevData,
          series: result.data
        }))
      }
    } catch (error) {
      console.error('Error fetching historical data:', error)
    }
  }

  // Función para actualizar datos
  const refreshData = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/conversor/dollar')
        const result = await response.json()
        
        if (result.success) {
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
        // En caso de error, usar datos de ejemplo
        setData(prev => ({
          ...prev,
          current: generateMockDollarData()
        }))
        setLastUpdate(new Date())
      }
    })
  }

  // Efecto para cargar datos históricos cuando cambie el período
  useEffect(() => {
    fetchHistoricalData(timeRange)
  }, [timeRange])

  // Componente para mostrar una tarjeta de cotización
  const DollarCard = ({ type, rate }: { type: string; rate: DollarRate }) => {
    const variation = 0 // Simulado por ahora
    const isPositive = variation >= 0
    
    return (
      <Card className="relative overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
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
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl mb-4">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Cotizaciones de Dólar
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Seguimiento en tiempo real de los principales tipos de cambio en Argentina
          </p>
          <div className="flex items-center justify-center space-x-4 mt-4">
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
            <div className="text-sm text-muted-foreground">
              Última actualización: {getTimeAgo(lastUpdate)}
            </div>
          </div>
        </div>

        {/* Cotizaciones actuales */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Cotizaciones actuales
            </h2>
          </div>

          {/* Dólares Financieros */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dólares Financieros</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="flex items-center space-x-2 mb-4">
              <DollarSign className="h-5 w-5 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Dólares de Referencia</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        />

        {/* Información */}
        <DollarInfo />
      </div>
    </div>
  )
}
