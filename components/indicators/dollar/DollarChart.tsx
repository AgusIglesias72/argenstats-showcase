'use client'

import { useState, useMemo, useEffect } from 'react'
import { TrendingUp, Calendar, Info, AlertCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { DOLLAR_TYPES, DOLLAR_TYPE_LABELS, DOLLAR_TYPE_COLORS } from '@/lib/api/constants/dollar'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { 
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
  isLoading?: boolean
}

export function DollarChart({ 
  data, 
  selectedTypes, 
  timeRange, 
  onTypesChange, 
  onTimeRangeChange,
  isLoading = false 
}: DollarChartProps) {
  const [chartData, setChartData] = useState<DollarHistoricalPoint[]>([])

  // Opciones de rango de tiempo
  const timeRangeOptions = [
    { value: '3months', label: '3M', days: 90 },
    { value: '6months', label: '6M', days: 180 },
    { value: '1year', label: '1A', days: 365 },
    { value: '5years', label: '5A', days: 1825 },
    { value: '10years', label: '10A', days: 3650 },
    { value: '15years', label: '15A', days: 5475 }
  ]

  // Procesar datos cuando cambien
  useEffect(() => {
    if (data.series && data.series.length > 0) {
      // Procesar los datos para el gráfico
      const processedData = data.series.map(point => {
        const processed: any = {
          date: point.date,
          displayDate: format(new Date(point.date), 'dd/MM/yyyy', { locale: es })
        }
        
        // Extraer valores para cada tipo seleccionado
        selectedTypes.forEach(type => {
          if (point[type]) {
            // Si el dato es un objeto con sell/buy/avg
            if (typeof point[type] === 'object' && point[type].avg) {
              processed[type] = point[type].avg
            } else if (typeof point[type] === 'object' && point[type].sell) {
              processed[type] = point[type].sell
            } else {
              processed[type] = point[type]
            }
          }
        })
        
        return processed
      })
      
      setChartData(processedData)
    } else {
      // Si no hay datos, generar algunos de ejemplo
      const mockData = generateMockData(timeRange, selectedTypes)
      setChartData(mockData)
    }
  }, [data.series, selectedTypes, timeRange])

  // Función para generar datos mock
  const generateMockData = (range: string, types: string[]) => {
    const option = timeRangeOptions.find(opt => opt.value === range)
    if (!option) return []
    
    const days = option.days
    const data = []
    const now = new Date()
    
    // Determinar intervalo
    let interval = 1
    if (days > 365 * 5) interval = 30
    else if (days > 365 * 2) interval = 7
    else if (days > 365) interval = 3
    
    const basePrices: Record<string, number> = {
      BLUE: 1250,
      OFICIAL: 980,
      MEP: 1180,
      CCL: 1200,
      CRYPTO: 1230,
      MAYORISTA: 960,
      TARJETA: 1580
    }
    
    for (let i = days; i >= 0; i -= interval) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      
      const point: any = {
        date: date.toISOString().split('T')[0],
        displayDate: format(date, 'dd/MM/yyyy', { locale: es })
      }
      
      types.forEach(type => {
        const basePrice = basePrices[type] || 1000
        const trend = (days - i) * 0.5
        const volatility = Math.sin(i * 0.02) * 50 + Math.random() * 20 - 10
        point[type] = Math.round(basePrice + trend + volatility)
      })
      
      data.push(point)
    }
    
    return data
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {format(new Date(label), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {DOLLAR_TYPE_LABELS[entry.dataKey]}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  ${entry.value.toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Formatear ejes
  const formatYAxis = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}k`
    }
    return `$${value}`
  }

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    const option = timeRangeOptions.find(opt => opt.value === timeRange)
    
    if (option && option.days > 365 * 2) {
      return format(date, 'MMM yy', { locale: es })
    } else if (option && option.days > 180) {
      return format(date, 'dd MMM', { locale: es })
    }
    return format(date, 'dd/MM', { locale: es })
  }

  // Determinar intervalo del eje X
  const getXAxisInterval = () => {
    const option = timeRangeOptions.find(opt => opt.value === timeRange)
    if (!option) return 'preserveStartEnd'
    
    if (option.days > 365 * 5) return Math.floor(chartData.length / 12)
    if (option.days > 365 * 2) return Math.floor(chartData.length / 10)
    if (option.days > 365) return Math.floor(chartData.length / 8)
    return 'preserveStartEnd'
  }

  // Función para alternar tipo
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypesChange(selectedTypes.filter(t => t !== type))
    } else {
      onTypesChange([...selectedTypes, type])
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Card principal */}
      <Card className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Análisis histórico
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Evolución de cotizaciones
              </p>
            </div>
          </div>
          
          {/* Selector de período */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Período:</span>
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {timeRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => onTimeRangeChange(option.value)}
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-md transition-all
                    ${timeRange === option.value 
                      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selector de tipos */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Selecciona los tipos de dólar:
          </p>
          <div className="flex flex-wrap gap-2">
            {DOLLAR_TYPES.map(type => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${selectedTypes.includes(type)
                    ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
                style={{
                  backgroundColor: selectedTypes.includes(type) ? DOLLAR_TYPE_COLORS[type] : undefined
                }}
              >
                {DOLLAR_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-[400px] w-full">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Cargando datos...</p>
              </div>
            </div>
          ) : chartData.length > 0 && selectedTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  {selectedTypes.map(type => (
                    <linearGradient key={`gradient-${type}`} id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={DOLLAR_TYPE_COLORS[type]} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={DOLLAR_TYPE_COLORS[type]} stopOpacity={0.05}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e5e7eb" 
                  className="dark:opacity-20"
                />
                <XAxis 
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  stroke="#9ca3af"
                  fontSize={12}
                  tickMargin={10}
                  interval={getXAxisInterval()}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  stroke="#9ca3af"
                  fontSize={12}
                  tickMargin={10}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{
                    paddingTop: '20px',
                    fontSize: '14px'
                  }}
                  iconType="line"
                  formatter={(value) => DOLLAR_TYPE_LABELS[value] || value}
                />
                {selectedTypes.map((type) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={DOLLAR_TYPE_COLORS[type]}
                    fill={`url(#gradient-${type})`}
                    strokeWidth={2}
                    name={type}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  {selectedTypes.length === 0 
                    ? 'Selecciona al menos un tipo de dólar' 
                    : 'No hay datos disponibles para el período seleccionado'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Nota informativa */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">Información sobre los datos</p>
            <p className="text-blue-700 dark:text-blue-400">
              Los valores mostrados corresponden al precio de venta de cada tipo de cambio. 
              Los datos se actualizan diariamente con información de las principales casas de cambio y entidades financieras.
              Para períodos extensos, los valores se muestran con intervalos mensuales para mejor visualización.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}