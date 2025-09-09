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
      // Para el eje X: formato con mes abreviado y año corto
      formattedDate: format(new Date(item.date), 'dd MMM yy', { locale: es }),
      // Para el tooltip: mismo formato que el eje X
      fullDate: format(new Date(item.date), 'dd MMM yy', { locale: es })
    }))
  }, [data])


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      // Para datasets grandes, usar el label del eje X que es más preciso
      const exactDate = label || payload[0].payload.fullDate
      
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
  
  // Calcular dominio más robusto que siempre incluya el 0
  const yDomain = (() => {
    const padding = (maxValue - minValue) * 0.1 // 10% de padding
    const min = Math.max(0, Math.floor(minValue - padding))
    const max = Math.ceil(maxValue + padding)
    
    // Asegurar que siempre incluya el 0 si los valores son positivos
    if (minValue >= 0) {
      return [0, max]
    }
    
    return [min, max]
  })()

  // Generar ticks dinámicos para el eje Y
  const generateYTicks = (): number[] => {
    const ticks: number[] = []
    const range = maxValue - minValue
    const step = range > 2000 ? 500 : range > 1000 ? 250 : range > 500 ? 100 : 50
    
    // Usar el dominio calculado para generar ticks
    const start = Math.floor(yDomain[0] / step) * step
    const end = Math.ceil(yDomain[1] / step) * step
    
    for (let i = start; i <= end; i += step) {
      if (i >= yDomain[0] && i <= yDomain[1]) {
        ticks.push(i)
      }
    }
    
    // Asegurar que siempre incluimos el 0 si está en el rango
    if (yDomain[0] <= 0 && yDomain[1] >= 0 && !ticks.includes(0)) {
      ticks.push(0)
    }
    
    // Agregar niveles de referencia importantes si están en el rango
    const referenceLevels = [500, 1000, 1500]
    referenceLevels.forEach(level => {
      if (yDomain[0] <= level && yDomain[1] >= level && !ticks.includes(level)) {
        ticks.push(level)
      }
    })
    
    return ticks.sort((a, b) => a - b)
  }

  const yTicks = generateYTicks()

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart 
        data={chartData}
        margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
        syncId="riesgo-pais-chart"
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
          fontSize={9}
          tickLine={true}
          axisLine={{ stroke: '#e5e7eb' }}
          tick={{ fill: '#6b7280' }}
          interval={(() => {
            // Calcular interval considerando mobile y temporalidades cortas
            const totalTicks = chartData.length
            
            // Para temporalidades muy cortas (1M, 3M), limitar a 5 fechas máximo
            if (totalTicks <= 40) return 8 // Mostrar cada 4
            if (totalTicks <= 80) return 25 // Mostrar cada 5
            if (totalTicks <= 150) return 12 // Mostrar cada 6
            return Math.ceil(totalTicks / 5) // Máximo 5 fechas para mobile
          })()}
          textAnchor="end"
          height={60}
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
        
        <Tooltip 
          content={<CustomTooltip />}
          allowEscapeViewBox={{ x: false, y: false }}
          isAnimationActive={false}
          cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        
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
          connectNulls={false}
          isAnimationActive={chartData.length < 200}
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