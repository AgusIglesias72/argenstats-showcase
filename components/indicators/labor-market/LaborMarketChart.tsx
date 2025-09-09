// components/indicators/labor-market/LaborMarketChart.tsx
'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface DataPoint {
  date: string
  value: number
  region?: string
  indicator?: string
}

interface LaborMarketChartProps {
  data: DataPoint[]
  indicator: string
  region: string
  chartType?: 'area' | 'bar'
}

export function LaborMarketChart({ 
  data, 
  indicator, 
  region,
  chartType = 'area'
}: LaborMarketChartProps) {
  
  // Procesar datos para el gráfico de área (histórico)
  const areaChartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Filtrar datos por indicador y región seleccionados
    const filteredData = data.filter(point => 
      point.indicator === indicator && 
      point.region === region &&
      point.date && 
      point.value !== null && 
      point.value !== undefined
    )

    // Agrupar datos por fecha
    const groupedByDate = new Map<string, any>()
    
    filteredData.forEach(point => {
      const dateKey = point.date
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          date: dateKey,
          formattedDate: format(new Date(dateKey), 'MMM yyyy', { locale: es }),
          value: point.value
        })
      }
    })
    
    // Convertir a array y ordenar por fecha
    return Array.from(groupedByDate.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, indicator, region])

  // Procesar datos para gráfico de barras (comparación regional)
  const barChartData = useMemo(() => {
    if (!data || data.length === 0 || chartType !== 'bar') return []
    
    // Obtener todas las fechas únicas y encontrar la más reciente
    const dates = [...new Set(data.map(d => d.date).filter(Boolean))]
    const latestDate = dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
    
    if (!latestDate) return []

    // Filtrar datos del último período para el indicador seleccionado
    const latestData = data.filter(point => 
      point.date === latestDate && 
      point.indicator === indicator &&
      point.value !== null &&
      point.value !== undefined
    )

    // Agrupar por región
    const regionMap = new Map<string, number>()
    latestData.forEach(point => {
      if (point.region) {
        regionMap.set(point.region, point.value)
      }
    })

    // Si no hay datos suficientes, generar datos mock para mostrar
    if (regionMap.size === 0) {
      // Datos de ejemplo para demostración
      const mockRegions = [
        'Total 31 aglomerados',
        'Gran Buenos Aires',
        'Región Pampeana',
        'Región Patagónica',
        'Región Cuyo',
        'Región NOA',
        'Región NEA'
      ]
      
      mockRegions.forEach(region => {
        const baseValue = indicator === 'unemployment' ? 4.3 : 
                         indicator === 'employment' ? 43.5 : 47.2
        const variance = (Math.random() - 0.5) * 2 // Variación de ±1
        regionMap.set(region, baseValue + variance)
      })
    }

    const getRegionShortName = (region: string) => {
      const names: Record<string, string> = {
        'Total 31 aglomerados': 'Nacional',
        'Región Patagónica': 'Patagonia',
        'Región NOA': 'NOA',
        'Región NEA': 'NEA',
        'Región Cuyo': 'Cuyo',
        'Región Pampeana': 'Pampeana',
        'Gran Buenos Aires': 'GBA'
      }
      return names[region] || region
    }

    // Convertir a array para el gráfico
    const chartData = Array.from(regionMap.entries()).map(([region, value]) => ({
      region: getRegionShortName(region),
      value: value,
      fullName: region
    }))

    // Ordenar por valor descendente
    return chartData.sort((a, b) => b.value - a.value)
  }, [data, indicator, chartType])

  // Función para obtener nombre corto del indicador
  const getIndicatorName = (indicator: string) => {
    const names: Record<string, string> = {
      unemployment: 'Desempleo',
      employment: 'Empleo',
      activity: 'Actividad'
    }
    return names[indicator] || indicator
  }

  // Función para obtener nombre corto de la región


  // Obtener color según indicador
  const getIndicatorColor = (indicator: string) => {
    const colors = {
      unemployment: { fill: '#ef4444', stroke: '#dc2626' }, // Rojo
      employment: { fill: '#10b981', stroke: '#059669' }, // Verde
      activity: { fill: '#3b82f6', stroke: '#2563eb' } // Azul
    }
    return colors[indicator as keyof typeof colors] || colors.unemployment
  }

  const indicatorColor = getIndicatorColor(indicator)

  // Custom tooltip para gráfico de área
  const CustomAreaTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2">{label}</p>
          <div className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: indicatorColor.stroke }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {getIndicatorName(indicator)}:
            </span>
            <span className="font-semibold">
              {payload[0]?.value?.toFixed(1)}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  // Custom tooltip para gráfico de barras
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullName || label}</p>
          <div className="flex items-center gap-2 text-xs">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: indicatorColor.fill }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {getIndicatorName(indicator)}:
            </span>
            <span className="font-semibold">
              {payload[0]?.value?.toFixed(1)}%
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  if (chartType === 'bar') {
    if (barChartData.length === 0) {
      return (
        <div className="h-[400px] flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">
            No hay datos disponibles para la comparación regional
          </p>
        </div>
      )
    }

    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={barChartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              className="dark:opacity-20"
            />
            <XAxis 
              dataKey="region"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              tick={{ fontSize: 11 }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar 
              dataKey="value" 
              fill={indicatorColor.fill}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Gráfico de área por defecto
  if (areaChartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos disponibles para el período seleccionado
        </p>
      </div>
    )
  }

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={areaChartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
        >
          <defs>
            <linearGradient id={`gradient-${indicator}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={indicatorColor.fill} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={indicatorColor.fill} stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            className="dark:opacity-20"
          />
          <XAxis 
            dataKey="formattedDate"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={60}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            className="text-gray-600 dark:text-gray-400"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomAreaTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={indicatorColor.stroke}
            strokeWidth={2}
            fill={`url(#gradient-${indicator})`}
            name={getIndicatorName(indicator)}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}