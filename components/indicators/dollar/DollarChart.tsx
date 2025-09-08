'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { DOLLAR_TYPES, DOLLAR_TYPE_LABELS, DOLLAR_TYPE_COLORS } from '@/lib/api/constants/dollar'
import { format, subDays, subMonths, subYears } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

interface DollarHistoricalPoint {
  date: string
  [key: string]: any
}

interface DollarChartProps {
  data: {
    series: DollarHistoricalPoint[]
    summary: any
  }
  selectedTypes: string[]
  timeRange: string
  onTypesChange: (types: string[]) => void
  onTimeRangeChange: (range: string) => void
}

export function DollarChart({ 
  data, 
  selectedTypes, 
  timeRange, 
  onTypesChange, 
  onTimeRangeChange 
}: DollarChartProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  // Opciones de rango de tiempo
  const timeRangeOptions = [
    { value: '3months', label: '3M' },
    { value: '6months', label: '6M' },
    { value: '1year', label: '1A' },
    { value: '5years', label: '5A' },
    { value: '10years', label: '10A' },
    { value: '15years', label: '15A' }
  ]

  // Generar datos históricos mock si no hay datos reales
  const generateMockHistoricalData = (days: number) => {
    const data = []
    const basePrice = 1200
    const now = new Date()
    
    // Para períodos largos, generar menos puntos para mejor rendimiento
    // Pero asegurar que cubra todo el período solicitado
    const step = days > 1000 ? Math.ceil(days / 300) : 1
    
    for (let i = days; i >= 0; i -= step) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      // Variación más realista para períodos largos
      const dayVariation = Math.sin(i * 0.1) * 50 + Math.random() * 20 - 10
      const baseVariation = Math.sin(i * 0.05) * 100
      
      // Tendencia a largo plazo (inflación acumulada)
      const longTermTrend = (days - i) * 0.5
      
      const point: any = {
        date: date.toISOString().split('T')[0]
      }
      
      // Generar datos para cada tipo de dólar
      selectedTypes.forEach(type => {
        let price = basePrice + baseVariation + dayVariation + longTermTrend
        
        switch (type) {
          case 'BLUE':
            price += 50 + Math.random() * 30
            break
          case 'OFICIAL':
            price -= 200 + Math.random() * 20
            break
          case 'MEP':
            price += 20 + Math.random() * 20
            break
          case 'CCL':
            price += 30 + Math.random() * 20
            break
          case 'CRYPTO':
            price += 40 + Math.random() * 30
            break
          case 'MAYORISTA':
            price -= 150 + Math.random() * 20
            break
          case 'TARJETA':
            price += 400 + Math.random() * 50
            break
        }
        
        point[type] = Math.max(100, Math.round(price))
      })
      
      data.push(point)
    }
    
    return data
  }

  // Filtrar y procesar datos según el rango de tiempo seleccionado
  const filteredData = useMemo(() => {
    const now = new Date()
    let startDate: Date
    let endDate: Date
    
    switch (timeRange) {
      case '3months':
        startDate = subMonths(now, 3)
        endDate = now
        break
      case '6months':
        startDate = subMonths(now, 6)
        endDate = now
        break
      case '1year':
        startDate = subYears(now, 1)
        endDate = now
        break
      case '5years':
        startDate = subYears(now, 5)
        endDate = now
        break
      case '10years':
        startDate = subYears(now, 10)
        endDate = now
        break
      case '15years':
        startDate = subYears(now, 15)
        endDate = now
        break
      default:
        startDate = subMonths(now, 3)
        endDate = now
    }
    
    // Si hay datos reales, usarlos
    if (data.series && data.series.length > 0) {
      const filtered = data.series.filter(point => {
        const pointDate = new Date(point.date)
        return pointDate >= startDate && pointDate <= endDate
      })
      
      // Procesar datos para el gráfico
      return filtered.map(point => {
        const processedPoint: any = { date: point.date }
        
        // Procesar cada tipo de dólar seleccionado
        selectedTypes.forEach(type => {
          if (point[type]) {
            // Usar el precio promedio si está disponible, sino el precio de venta
            processedPoint[type] = point[type].avg || point[type].sell || 0
          }
        })
        
        return processedPoint
      })
    }
    
    // Si no hay datos reales, retornar array vacío para que se muestre el mensaje de "No hay datos"
    return []
  }, [data.series, timeRange, selectedTypes])

  // Función para alternar selección de tipo
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  // Función para actualizar datos
  const refreshData = async () => {
    setIsUpdating(true)
    try {
      // Aquí se haría la llamada a la API para obtener datos actualizados
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulación
    } finally {
      setIsUpdating(false)
    }
  }

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM', { locale: es })
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {format(new Date(label), 'dd MMM yyyy', { locale: es })}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.stroke || entry.fill }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {DOLLAR_TYPE_LABELS[entry.dataKey] || entry.dataKey}:
              </span>
              <span className="font-semibold">
                {formatPrice(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Calcular estadísticas básicas
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null
    
    const stats: any = {}
    
    selectedTypes.forEach(type => {
      const values = filteredData
        .map(point => point[type]?.avg || point[type]?.sell || 0)
        .filter(val => val > 0)
      
      if (values.length > 0) {
        const min = Math.min(...values)
        const max = Math.max(...values)
        const latest = values[values.length - 1]
        const first = values[0]
        const variation = first > 0 ? ((latest - first) / first) * 100 : 0
        
        stats[type] = {
          min,
          max,
          latest,
          variation
        }
      }
    })
    
    return stats
  }, [filteredData, selectedTypes])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Análisis histórico</CardTitle>
              <CardDescription>Evolución de cotizaciones</CardDescription>
            </div>
          </div>
          <Button
            onClick={refreshData}
            disabled={isUpdating}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Controles */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Selección de tipos */}
          <div className="flex-1">
            <p className="text-sm font-medium mb-2">Selecciona los tipos de dólar:</p>
            <div className="flex flex-wrap gap-2">
              {DOLLAR_TYPES.map(type => (
                <Button
                  key={type}
                  variant={selectedTypes.includes(type) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleType(type)}
                  className="text-xs"
                >
                  {DOLLAR_TYPE_LABELS[type] || type}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Selección de rango de tiempo */}
          <div>
            <p className="text-sm font-medium mb-2">Período:</p>
            <div className="flex gap-1">
              {timeRangeOptions.map(option => (
                <Button
                  key={option.value}
                  variant={timeRange === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onTimeRangeChange(option.value)}
                  className="text-xs px-3"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico interactivo */}
        <div className="h-96 w-full">
          {filteredData.length > 0 && selectedTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(value)}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
                  className="text-xs"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {selectedTypes.map((type, index) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={DOLLAR_TYPE_COLORS[type] || '#6b7280'}
                    fill={DOLLAR_TYPE_COLORS[type] || '#6b7280'}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name={DOLLAR_TYPE_LABELS[type] || type}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full bg-muted/20 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-medium text-muted-foreground">
                    {selectedTypes.length === 0 ? 'Selecciona tipos de dólar' : 'No hay datos disponibles'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedTypes.length === 0 
                      ? 'Elige al menos un tipo de dólar para visualizar' 
                      : 'Intenta cambiar el rango de tiempo o actualizar los datos'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas */}
        {stats && selectedTypes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedTypes.map(type => {
              const typeStats = stats[type]
              if (!typeStats) return null
              
              const isPositive = typeStats.variation >= 0
              
              return (
                <Card key={type} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: DOLLAR_TYPE_COLORS[type] || '#6b7280' }}
                      />
                      <span className="font-medium text-sm">
                        {DOLLAR_TYPE_LABELS[type] || type}
                      </span>
                    </div>
                    <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                      {isPositive ? '+' : ''}{typeStats.variation.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Actual:</span>
                      <span className="font-medium">{formatPrice(typeStats.latest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mínimo:</span>
                      <span>{formatPrice(typeStats.min)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Máximo:</span>
                      <span>{formatPrice(typeStats.max)}</span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

      </CardContent>
    </Card>
  )
}
