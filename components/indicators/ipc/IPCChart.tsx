// components/indicators/ipc/IPCChart.tsx
'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'

interface IPCChartProps {
  data: Array<{
    date: string
    value: number | null
    index: number
  }>
  viewType: 'monthly' | 'yearly'
}

export function IPCChart({ data, viewType }: IPCChartProps) {
  // Procesar datos para el gráfico
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      value: item.value ?? 0
    }))
  }, [data])

  // Calcular el dominio del eje Y
  const yDomain = useMemo(() => {
    const values = processedData.map(d => d.value).filter(v => v !== 0)
    if (values.length === 0) return [0, 10]
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const padding = (max - min) * 0.1
    
    return [
      Math.floor((min - padding) * 10) / 10,
      Math.ceil((max + padding) * 10) / 10
    ]
  }, [processedData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      return (
        <Card className="p-3 border shadow-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {payload[0].value.toFixed(1)}%
            </p>
          </div>
        </Card>
      )
    }
    return null
  }

  const gradientId = `gradient-${viewType}`

  return (
    <div className="w-full h-[400px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={processedData}
          margin={{ top: 10, right: 5, left: -20, bottom: 0 }}
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
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            className="dark:stroke-gray-700"
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
          <Area
            type="monotone"
            dataKey="value"
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