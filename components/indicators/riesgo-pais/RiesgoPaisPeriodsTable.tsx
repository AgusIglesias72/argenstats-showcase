// components/indicators/riesgo-pais/RiesgoPaisPeriodsTable.tsx
'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PeriodData {
  period: string
  value: number
  change: number
  changePercent: number
  min: number
  max: number
  average: number
  startDate: string
  endDate: string
}

interface RiesgoPaisPeriodsTableProps {
  periods: PeriodData[]
  currentValue: number
}

export function RiesgoPaisPeriodsTable({ periods, currentValue }: RiesgoPaisPeriodsTableProps) {
  const [sortBy, setSortBy] = useState<'period' | 'change' | 'percent'>('period')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: 'period' | 'change' | 'percent') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDirection('asc')
    }
  }

  const sortedPeriods = [...periods].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'change':
        comparison = a.change - b.change
        break
      case 'percent':
        comparison = a.changePercent - b.changePercent
        break
      default:
        // Orden personalizado para períodos
        const periodOrder = ['Diario', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual', 'YTD']
        comparison = periodOrder.indexOf(a.period) - periodOrder.indexOf(b.period)
    }
    
    return sortDirection === 'asc' ? comparison : -comparison
  })

  const getChangeIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />
    if (value < 0) return <TrendingDown className="w-4 h-4" />
    return <Minus className="w-4 h-4" />
  }

  const getChangeColor = (value: number) => {
    if (value > 0) return 'text-red-600 dark:text-red-400'
    if (value < 0) return 'text-green-600 dark:text-green-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getRiskLevel = (value: number) => {
    if (value < 500) return { label: 'Bajo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' }
    if (value < 1000) return { label: 'Moderado', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' }
    if (value < 1500) return { label: 'Alto', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' }
    return { label: 'Muy Alto', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead 
              className="cursor-pointer select-none"
              onClick={() => handleSort('period')}
            >
              <div className="flex items-center gap-1">
                Período
                {sortBy === 'period' && (
                  sortDirection === 'asc' ? 
                    <ArrowUp className="w-3 h-3" /> : 
                    <ArrowDown className="w-3 h-3" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">Valor Inicial</TableHead>
            <TableHead className="text-right">Valor Actual</TableHead>
            <TableHead 
              className="text-right cursor-pointer select-none"
              onClick={() => handleSort('change')}
            >
              <div className="flex items-center justify-end gap-1">
                Variación (pb)
                {sortBy === 'change' && (
                  sortDirection === 'asc' ? 
                    <ArrowUp className="w-3 h-3" /> : 
                    <ArrowDown className="w-3 h-3" />
                )}
              </div>
            </TableHead>
            <TableHead 
              className="text-right cursor-pointer select-none"
              onClick={() => handleSort('percent')}
            >
              <div className="flex items-center justify-end gap-1">
                Variación (%)
                {sortBy === 'percent' && (
                  sortDirection === 'asc' ? 
                    <ArrowUp className="w-3 h-3" /> : 
                    <ArrowDown className="w-3 h-3" />
                )}
              </div>
            </TableHead>
            <TableHead className="text-right">Mínimo</TableHead>
            <TableHead className="text-right">Máximo</TableHead>
            <TableHead className="text-right">Promedio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPeriods.map((period) => {
            const initialValue = currentValue - period.change
            const minRisk = getRiskLevel(period.min)
            const maxRisk = getRiskLevel(period.max)
            
            return (
              <TableRow key={period.period} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {period.period}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {Math.round(initialValue)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm font-semibold">
                  {currentValue}
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn("flex items-center justify-end gap-1", getChangeColor(period.change))}>
                    {getChangeIcon(period.change)}
                    <span className="font-mono text-sm font-medium">
                      {period.change > 0 ? '+' : ''}{period.change}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn("flex items-center justify-end gap-1", getChangeColor(period.changePercent))}>
                    <span className="font-mono text-sm font-medium">
                      {period.changePercent > 0 ? '+' : ''}{period.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-mono text-sm">{period.min}</span>
                    <Badge variant="outline" className={cn("text-xs px-1 py-0", minRisk.color)}>
                      {minRisk.label[0]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-mono text-sm">{period.max}</span>
                    <Badge variant="outline" className={cn("text-xs px-1 py-0", maxRisk.color)}>
                      {maxRisk.label[0]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {period.average}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Leyenda de niveles */}
      <div className="mt-4 flex items-center justify-end gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 dark:text-gray-400">Niveles:</span>
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs">
            B: Bajo (&lt;500)
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">
            M: Moderado (500-1000)
          </Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 text-xs">
            A: Alto (1000-1500)
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">
            MA: Muy Alto (&gt;1500)
          </Badge>
        </div>
      </div>
    </div>
  )
}