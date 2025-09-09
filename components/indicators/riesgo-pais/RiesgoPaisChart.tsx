// components/indicators/riesgo-pais/RiesgoPaisChart.tsx
'use client'

import { useMemo } from 'react'
import { 
  AreaChart, 
  Area, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Dot
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface RiesgoPaisChartProps {
  data: Array<{
    date: string
    value: number
    officialValue?: number
  }>
  viewType: 'value' | 'comparison'
  showReferenceLines?: boolean
}

export function RiesgoPaisChart({ 
  data, 
  viewType = 'value',
  showReferenceLines = true 
}: RiesgoPaisChartProps) {
  
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      // Para el eje X: formato simple
      formattedDate: format(new Date(item.date), 'dd MMM', { locale: es }),
      // Para el tooltip: fecha completa
      fullDate: format(new Date(item.date), 'dd MMM yyyy', { locale: es })
    }))
  }, [data])


  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      // Usar directamente la fecha del payload, NO el label
      const exactDate = payload[0].payload.fullDate
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
            {exactDate}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Riesgo País: <span className="font-semibold text-gray-900 dark:text-white">
                {payload[0].value} pb
              </span>
            </p>
            {viewType === 'comparison' && payload[1] && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                JP Morgan: <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {payload[1].value} pb
                </span>
              </p>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, value } = props
    if (value > 1500) {
      return (
        <Dot 
          cx={cx} 
          cy={cy} 
          r={3} 
          fill="#ef4444" 
          stroke="#fff" 
          strokeWidth={1}
        />
      )
    }
    return null
  }

  const minValue = Math.min(...data.map(d => d.value))
  const maxValue = Math.max(...data.map(d => d.value))
  const yDomain = [
    Math.floor(minValue / 100) * 100 - 100,
    Math.ceil(maxValue / 100) * 100 + 100
  ]

  // Generar ticks dinámicos para el eje Y
  const generateYTicks = () => {
    const ticks = []
    const step = maxValue > 2000 ? 500 : maxValue > 1000 ? 250 : 100
    const start = Math.floor(minValue / step) * step
    const end = Math.ceil(maxValue / step) * step
    
    for (let i = start; i <= end; i += step) {
      ticks.push(i)
    }
    
    // Asegurar que siempre incluimos los niveles de referencia importantes
    if (!ticks.includes(500)) ticks.push(500)
    if (!ticks.includes(1000)) ticks.push(1000)
    if (!ticks.includes(1500)) ticks.push(1500)
    
    return ticks.sort((a, b) => a - b)
  }

  const yTicks = generateYTicks()

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart 
        data={chartData}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <defs>
          <linearGradient id="colorRiesgo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3}/>
            <stop offset="50%" stopColor="#ef4444" stopOpacity={0.15}/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05}/>
          </linearGradient>
          <linearGradient id="colorOfficial" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05}/>
          </linearGradient>
        </defs>

        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#e5e7eb" 
          strokeOpacity={0.5}
          vertical={false}
        />
        
        <XAxis 
          dataKey="formattedDate" 
          stroke="#6b7280"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          tick={{ fill: '#6b7280' }}
          interval="preserveEnd"
          tickFormatter={(value, index) => {
            // Mostrar solo algunos ticks para evitar amontonamiento
            const totalTicks = chartData.length
            if (totalTicks <= 10) return value
            if (totalTicks <= 30) {
              return index % 3 === 0 ? value : ''
            }
            if (totalTicks <= 60) {
              return index % 5 === 0 ? value : ''
            }
            return index % Math.ceil(totalTicks / 15) === 0 ? value : ''
          }}
        />
        
        <YAxis 
          stroke="#6b7280"
          fontSize={11}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
          domain={yDomain}
          ticks={yTicks}
          tick={{ fill: '#6b7280' }}
          label={{ 
            value: 'Puntos básicos', 
            angle: -90, 
            position: 'insideLeft',
            style: { fontSize: 11, fill: '#6b7280' }
          }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        {showReferenceLines && (
          <>
            {/* Zona de riesgo bajo */}
            <ReferenceLine 
              y={500} 
              stroke="#10b981" 
              strokeDasharray="5 5" 
              strokeOpacity={0.6}
              label={{ 
                value: "Riesgo Bajo", 
                position: "right",
                style: { fontSize: 11, fill: '#10b981' }
              }}
            />
            
            {/* Zona de riesgo moderado */}
            <ReferenceLine 
              y={1000} 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              strokeOpacity={0.6}
              label={{ 
                value: "Riesgo Moderado", 
                position: "right",
                style: { fontSize: 11, fill: '#f59e0b' }
              }}
            />
            
            {/* Zona de riesgo alto */}
            <ReferenceLine 
              y={1500} 
              stroke="#ef4444" 
              strokeDasharray="5 5" 
              strokeOpacity={0.6}
              label={{ 
                value: "Riesgo Alto", 
                position: "right",
                style: { fontSize: 11, fill: '#ef4444' }
              }}
            />
          </>
        )}
        
        <Area
          type="monotone"
          dataKey="value"
          stroke="#ef4444"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorRiesgo)"
          name="Riesgo País"
          dot={chartData.length <= 50 ? { r: 2, fill: '#ef4444' } : false}
        />
        
        {viewType === 'comparison' && (
          <Line
            type="monotone"
            dataKey="officialValue"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="JP Morgan EMBI+"
          />
        )}

        {viewType === 'comparison' && (
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="line"
            wrapperStyle={{
              fontSize: '12px',
              paddingTop: '10px'
            }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}