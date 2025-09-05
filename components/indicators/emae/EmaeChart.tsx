// components/indicators/emae/EmaeChart.tsx
'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell
} from 'recharts'
import { Card } from '@/components/ui/card'

interface EmaeChartProps {
  data: Array<{
    date: string
    value: number | null
    index: number
    seasonallyAdjusted: number | null
  }>
  viewType: 'index' | 'monthly' | 'yearly'
  dataType: 'original' | 'seasonally_adjusted'
}

export function EmaeChart({ data, viewType, dataType }: EmaeChartProps) {
  // Procesar datos para el gráfico
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      value: item.value ?? 0,
      displayValue: viewType === 'index' 
        ? (dataType === 'seasonally_adjusted' && item.seasonallyAdjusted 
          ? item.seasonallyAdjusted 
          : item.index)
        : item.value ?? 0
    }))
  }, [data, viewType, dataType])

  // Calcular el dominio del eje Y según el tipo de vista
  const yDomain = useMemo(() => {
    const values = processedData.map(d => d.displayValue).filter(v => v !== null)
    if (values.length === 0) return [0, 10]
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    if (viewType === 'index') {
      // Para índices, usar el rango completo con padding
      const padding = (max - min) * 0.1
      return [
        Math.floor(min - padding),
        Math.ceil(max + padding)
      ]
    } else {
      // Para variaciones, incluir siempre el 0 y agregar padding
      const absMax = Math.max(Math.abs(min), Math.abs(max))
      const padding = absMax * 0.2
      return [
        Math.floor(Math.min(-padding, min - 1)),
        Math.ceil(Math.max(padding, max + 1))
      ]
    }
  }, [processedData, viewType])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const value = payload[0].value
      const original = payload[0].payload
      
      return (
        <Card className="p-3 border shadow-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            {viewType === 'index' ? (
              <>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {value.toFixed(1)}
                </p>
              
              </>
            ) : (
              <p className={`text-lg font-bold ${
                value > 0 ? 'text-green-600 dark:text-green-400' : 
                value < 0 ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {value > 0 ? '+' : ''}{value.toFixed(1)}%
              </p>
            )}
          </div>
        </Card>
      )
    }
    return null
  }

  const gradientId = `gradient-${viewType}-${dataType}`
  const isVariation = viewType === 'monthly' || viewType === 'yearly'

  // Usar BarChart para variaciones, AreaChart para índices
  if (isVariation) {
    return (
      <div className="w-full h-[400px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              className="dark:stroke-gray-700"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              className="dark:stroke-gray-700"
              interval="preserveStartEnd"
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              className="dark:stroke-gray-700"
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
            <Bar
              dataKey="displayValue"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            >
              {
                // Usamos la propiedad 'fill' en cada celda para colorear según el valor
                processedData.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.displayValue > 0 ? '#10b981' : '#ef4444'}
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // AreaChart para índices
  return (
    <div className="w-full h-[400px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={processedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#e5e7eb" 
            className="dark:stroke-gray-700"
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            className="dark:stroke-gray-700"
            interval="preserveStartEnd"
          />
          <YAxis
            domain={yDomain}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            className="dark:stroke-gray-700"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="displayValue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            animationDuration={500}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}