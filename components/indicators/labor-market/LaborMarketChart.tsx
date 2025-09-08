// components/indicators/labor-market/LaborMarketChart.tsx
'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DataPoint {
  date: string
  value: number
  region?: string
  indicator?: string
}

interface LaborMarketChartProps {
  data: DataPoint[]
  indicators: string[]
  regions: string[]
  onRemoveSeries?: (indicator: string, region: string) => void
}

export function LaborMarketChart({ 
  data, 
  indicators, 
  regions,
  onRemoveSeries 
}: LaborMarketChartProps) {
  // Procesar datos para el gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Agrupar datos por fecha
    const groupedByDate = new Map<string, any>()
    
    data.forEach(point => {
      if (!point.date || point.value === null || point.value === undefined) return
      
      const dateKey = point.date
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, {
          date: dateKey,
          formattedDate: format(new Date(dateKey), 'MMM yyyy', { locale: es })
        })
      }
      
      const entry = groupedByDate.get(dateKey)
      
      // Crear clave única para cada serie
      const seriesKey = `${point.indicator || 'unemployment'}_${point.region || 'Total 31 aglomerados'}`
      entry[seriesKey] = point.value
    })
    
    // Convertir a array y ordenar por fecha
    return Array.from(groupedByDate.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data])
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
  // Generar configuración de áreas
  const areas = useMemo(() => {
    interface AreaConfig {
      key: string
      fill: string
      stroke: string
      name: string
      indicator: string
      region: string
    }
    
    const areaConfigs: AreaConfig[] = []
    
    // Paletas de colores para cada indicador
    const colorPalettes = {
      unemployment: [
        { fill: '#ef4444', stroke: '#dc2626' }, // Rojo
        { fill: '#fb923c', stroke: '#f97316' }, // Naranja
        { fill: '#fbbf24', stroke: '#f59e0b' }, // Ámbar
      ],
      employment: [
        { fill: '#10b981', stroke: '#059669' }, // Verde
        { fill: '#14b8a6', stroke: '#0d9488' }, // Teal
        { fill: '#06b6d4', stroke: '#0891b2' }, // Cyan
      ],
      activity: [
        { fill: '#3b82f6', stroke: '#2563eb' }, // Azul
        { fill: '#6366f1', stroke: '#4f46e5' }, // Índigo
        { fill: '#8b5cf6', stroke: '#7c3aed' }, // Violeta
      ]
    }
    
    indicators.forEach((indicator) => {
      const palette = colorPalettes[indicator as keyof typeof colorPalettes] || colorPalettes.unemployment
      
      regions.forEach((region, regIdx) => {
        const seriesKey = `${indicator}_${region}`
        const colors = palette[regIdx % palette.length]
        
        areaConfigs.push({
          key: seriesKey,
          fill: colors.fill,
          stroke: colors.stroke,
          name: `${getIndicatorName(indicator)} - ${getRegionShortName(region)}`,
          indicator,
          region
        })
      })
    })
    
    return areaConfigs
  }, [indicators, regions])



  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.stroke || entry.fill }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.name}:
              </span>
              <span className="font-semibold">
                {entry.value?.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  // Manejar eliminación de series
  const handleRemoveSeries = (area: any) => {
    if (onRemoveSeries && areas.length > 1) {
      onRemoveSeries(area.indicator, area.region)
    }
  }

  if (chartData.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos disponibles para el período seleccionado
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Leyenda de series activas */}
      <div className="flex flex-wrap gap-2">
        {areas.map(area => (
          <Badge
            key={area.key}
            variant="secondary"
            className="flex items-center gap-2 pr-1"
          >
            <div className="flex items-center gap-1.5">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: area.stroke }}
              />
              <span className="text-xs">
                {area.name}
              </span>
            </div>
            {areas.length > 1 && (
              <button
                onClick={() => handleRemoveSeries(area)}
                className="ml-1 p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Eliminar serie"
              >
                <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
              </button>
            )}
          </Badge>
        ))}
      </div>

      {/* Gráfico */}
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
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
            <Tooltip content={<CustomTooltip />} />
            
            {/* Renderizar áreas */}
            {areas.map((area, index) => (
              <Area
                key={area.key}
                type="monotone"
                dataKey={area.key}
                stroke={area.stroke}
                strokeWidth={2}
                fill={area.fill}
                fillOpacity={0.3}
                name={area.name}
                connectNulls
                stackId={undefined} // No apilar las áreas
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}