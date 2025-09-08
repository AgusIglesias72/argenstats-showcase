// components/indicators/labor-market/RegionalTable.tsx
'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MapPin,
  Users,
  Briefcase,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RegionalData {
  region: string
  unemploymentRate: number
  employmentRate: number
  activityRate: number
  variationInterannual?: number
  variationTrimestral?: number
}

interface RegionalTableProps {
  data: RegionalData[]
}

type SortField = 'region' | 'unemploymentRate' | 'employmentRate' | 'activityRate' | 'variationInterannual'
type SortOrder = 'asc' | 'desc'

export function RegionalTable({ data }: RegionalTableProps) {
  const [sortField, setSortField] = useState<SortField>('unemploymentRate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    return [...data].sort((a, b) => {
      let aVal: any = a[sortField]
      let bVal: any = b[sortField]
      
      // Manejar valores undefined/null
      if (aVal === undefined || aVal === null) aVal = 0
      if (bVal === undefined || bVal === null) bVal = 0
      
      // Para strings (region)
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      // Para números
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })
  }, [data, sortField, sortOrder])

  // Función para manejar el ordenamiento
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Función para obtener el color según el valor
  const getValueColor = (value: number, type: 'unemployment' | 'employment' | 'activity' | 'variation') => {
    if (type === 'unemployment') {
      if (value >= 8) return 'text-red-600 dark:text-red-400'
      if (value >= 6) return 'text-orange-600 dark:text-orange-400'
      return 'text-green-600 dark:text-green-400'
    }
    
    if (type === 'employment') {
      if (value >= 45) return 'text-green-600 dark:text-green-400'
      if (value >= 40) return 'text-orange-600 dark:text-orange-400'
      return 'text-red-600 dark:text-red-400'
    }
    
    if (type === 'activity') {
      if (value >= 48) return 'text-green-600 dark:text-green-400'
      if (value >= 45) return 'text-orange-600 dark:text-orange-400'
      return 'text-red-600 dark:text-red-400'
    }
    
    if (type === 'variation') {
      if (value > 0) return 'text-red-600 dark:text-red-400'
      if (value < 0) return 'text-green-600 dark:text-green-400'
      return 'text-gray-600 dark:text-gray-400'
    }
    
    return ''
  }

  // Función para obtener el ícono de tendencia
  const getTrendIcon = (value?: number) => {
    if (value === undefined || value === null) return null
    
    if (value > 0) {
      return <TrendingUp className="w-3 h-3 text-red-500" />
    } else if (value < 0) {
      return <TrendingDown className="w-3 h-3 text-green-500" />
    } else {
      return <Minus className="w-3 h-3 text-gray-500" />
    }
  }

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (!data || data.length === 0) return null
    
    const unemploymentRates = data.map(d => d.unemploymentRate).filter(v => v !== null && v !== undefined)
    const employmentRates = data.map(d => d.employmentRate).filter(v => v !== null && v !== undefined)
    
    return {
      avgUnemployment: unemploymentRates.reduce((a, b) => a + b, 0) / unemploymentRates.length,
      avgEmployment: employmentRates.reduce((a, b) => a + b, 0) / employmentRates.length,
      maxUnemployment: Math.max(...unemploymentRates),
      minUnemployment: Math.min(...unemploymentRates),
      maxEmployment: Math.max(...employmentRates),
      minEmployment: Math.min(...employmentRates)
    }
  }, [data])

  // Función para formatear el nombre de la región
  const formatRegionName = (region: string) => {
    const shortNames: Record<string, string> = {
      'Región Patagónica': 'Patagonia',
      'Región NOA': 'NOA',
      'Región NEA': 'NEA', 
      'Región Cuyo': 'Cuyo',
      'Región Pampeana': 'Pampeana',
      'Gran Buenos Aires': 'GBA',
      'Partidos del Gran Buenos Aires': 'Partidos GBA'
    }
    return shortNames[region] || region
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No hay datos regionales disponibles
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Resumen de estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Promedio Desempleo
            </div>
            <div className="text-lg font-semibold">
              {stats.avgUnemployment.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Promedio Empleo
            </div>
            <div className="text-lg font-semibold">
              {stats.avgEmployment.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Mayor Desempleo
            </div>
            <div className="text-lg font-semibold text-red-600 dark:text-red-400">
              {stats.maxUnemployment.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Menor Desempleo
            </div>
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {stats.minUnemployment.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-800/50">
              <TableHead className="font-semibold">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('region')}
                >
                  <MapPin className="w-4 h-4 mr-1" />
                  Región
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('unemploymentRate')}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Desempleo
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('employmentRate')}
                >
                  <Briefcase className="w-4 h-4 mr-1" />
                  Empleo
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('activityRate')}
                >
                  <Activity className="w-4 h-4 mr-1" />
                  Actividad
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort('variationInterannual')}
                >
                  Var. Interanual
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, index) => (
              <TableRow 
                key={row.region}
                className={cn(
                  "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                  index === 0 && sortField === 'unemploymentRate' && sortOrder === 'desc' &&
                  "bg-red-50/30 dark:bg-red-900/10",
                  index === sortedData.length - 1 && sortField === 'unemploymentRate' && sortOrder === 'desc' &&
                  "bg-green-50/30 dark:bg-green-900/10"
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {formatRegionName(row.region)}
                    {row.region === 'Región Patagónica' && (
                      <Badge variant="outline" className="text-xs">
                        Mejor
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-semibold",
                    getValueColor(row.unemploymentRate, 'unemployment')
                  )}>
                    {row.unemploymentRate.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-semibold",
                    getValueColor(row.employmentRate, 'employment')
                  )}>
                    {row.employmentRate.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className={cn(
                    "font-semibold",
                    getValueColor(row.activityRate, 'activity')
                  )}>
                    {row.activityRate.toFixed(1)}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {row.variationInterannual !== undefined ? (
                    <div className="flex items-center justify-center gap-1">
                      {getTrendIcon(row.variationInterannual)}
                      <span className={cn(
                        "text-sm",
                        getValueColor(row.variationInterannual, 'variation')
                      )}>
                        {row.variationInterannual > 0 ? '+' : ''}
                        {row.variationInterannual.toFixed(1)} pp
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Mejor desempeño</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Mayor desafío</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-semibold">pp:</span>
          <span>puntos porcentuales</span>
        </div>
      </div>
    </div>
  )
}