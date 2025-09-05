// components/indicators/emae/EmaeSectorsTable.tsx
'use client'

import { useState, useMemo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronUp, ChevronDown, TrendingUp, TrendingDown, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { EMAE_SECTORS } from '@/lib/api/constants/emae'

interface SectorData {
  sector: {
    code: string
    name: string
  }
  values: {
    index: number
    monthly: number | null
    yearly: number | null
  }
}

interface EmaeSectorsTableProps {
  sectors: SectorData[]
}

type SortField = 'name' | 'monthly' | 'yearly'
type SortDirection = 'asc' | 'desc'

export function EmaeSectorsTable({ sectors }: EmaeSectorsTableProps) {
  const [sortField, setSortField] = useState<SortField>('yearly')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAll, setShowAll] = useState(false)

  const sortedSectors = useMemo(() => {
    const sorted = [...sectors].sort((a, b) => {
      let aValue: number | string | null
      let bValue: number | string | null

      switch (sortField) {
        case 'name':
          aValue = a.sector.name
          bValue = b.sector.name
          break
        case 'monthly':
          aValue = a.values.monthly ?? -999
          bValue = b.values.monthly ?? -999
          break
        case 'yearly':
          aValue = a.values.yearly ?? -999
          bValue = b.values.yearly ?? -999
          break
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      return 0
    })

    return sorted
  }, [sectors, sortField, sortDirection])

  const displayedSectors = showAll ? sortedSectors : sortedSectors.slice(0, 10)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatValue = (value: number | null, p0?: boolean, code?: string) => {
    if (value === null) return <span className="text-gray-400">-</span>
    
    const formatted = value.toFixed(1)
    const isPositive = value > 0
    const isNegative = value < 0
    
    const color = isPositive 
      ? 'text-green-600 dark:text-green-400' 
      : isNegative
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400'
    
    return (
      <span className={`font-medium ${color} flex items-center justify-center gap-1`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : isNegative ? (
          <TrendingDown className="w-3 h-3" />
        ) : null}
        {isPositive ? '+' : ''}{formatted}%
      </span>
    )
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUp className="w-3 h-3 opacity-30" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3" />
      : <ChevronDown className="w-3 h-3" />
  }

  // Obtener sectores top y bottom
  const topGrowth = sortedSectors
    .filter(s => s.values.yearly !== null && s.sector.code !== 'GENERAL')
    .slice(0, 3)
  
  const topDecline = sortedSectors
    .filter(s => s.values.yearly !== null && s.sector.code !== 'GENERAL')
    .slice(-3)
    .reverse()

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Mini resumen */}
        {topGrowth.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Sectores con mayor crecimiento
              </h4>
              <div className="space-y-1">
                {topGrowth.map(sector => (
                  <div key={sector.sector.code} className="flex items-center justify-between">
                    <span className="text-sm truncate max-w-[200px]">
                      {sector.sector.name}
                    </span>
                    <Badge variant="outline" className="text-green-600 dark:text-green-400">
                      +{sector.values.yearly?.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            
            {topDecline.length > 0 && topDecline.some(s => (s.values.yearly ?? 0) < 0) && (
              <div>
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Sectores con mayor caída
                </h4>
                <div className="space-y-1">
                  {topDecline
                    .filter(s => (s.values.yearly ?? 0) < 0)
                    .map(sector => (
                      <div key={sector.sector.code} className="flex items-center justify-between">
                        <span className="text-sm truncate max-w-[200px]">
                          {sector.sector.name}
                        </span>
                        <Badge variant="outline" className="text-red-600 dark:text-red-400">
                          {sector.values.yearly?.toFixed(1)}%
                        </Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabla principal */}
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="w-[50%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('name')}
                  >
                    SECTOR
                    <SortIcon field="name" />
                  </Button>
                </TableHead>

                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('yearly')}
                  >
                    <div className="flex items-center gap-1">
                      VAR. INTERANUAL
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variación respecto al mismo mes del año anterior</p>
                        </TooltipContent>
                      </Tooltip>
                      <SortIcon field="yearly" />
                    </div>
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedSectors.map((sector, index) => (
                <TableRow 
                  key={sector.sector.code}
                  className={sector.sector.code === 'GENERAL' 
                    ? 'bg-blue-50 dark:bg-blue-950/20 font-semibold' 
                    : ''
                  }
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{sector.sector.name}</span>
                      {sector.sector.code === 'GENERAL' && (
                        <Badge variant="secondary" className="text-xs">
                          General
                        </Badge>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">
                    {formatValue(sector.values.yearly)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedSectors.length > 10 && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Ver todos ({sortedSectors.length} sectores)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}