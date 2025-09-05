// components/indicators/ipc/IPCComponentsTable.tsx
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

interface Component {
  component: {
    code: string
    name: string
    type: string
  }
  values: {
    monthly: number | null
    yearly: number | null
    accumulated: number | null
  }
  index: number
  date: string
}

interface IPCComponentsTableProps {
  components: Component[]
}

type SortField = 'name' | 'monthly' | 'yearly' | 'accumulated'
type SortDirection = 'asc' | 'desc'

export function IPCComponentsTable({ components }: IPCComponentsTableProps) {
  const [sortField, setSortField] = useState<SortField>('monthly')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAll, setShowAll] = useState(false)

  const sortedComponents = useMemo(() => {
    const sorted = [...components].sort((a, b) => {
      let aValue: number | string | null
      let bValue: number | string | null

      switch (sortField) {
        case 'name':
          aValue = a.component.name
          bValue = b.component.name
          break
        case 'monthly':
          aValue = a.values.monthly ?? -999
          bValue = b.values.monthly ?? -999
          break
        case 'yearly':
          aValue = a.values.yearly ?? -999
          bValue = b.values.yearly ?? -999
          break
        case 'accumulated':
          aValue = a.values.accumulated ?? -999
          bValue = b.values.accumulated ?? -999
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
  }, [components, sortField, sortDirection])

  const displayedComponents = showAll ? sortedComponents : sortedComponents.slice(0, 10)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const formatValue = (value: number | null) => {
    if (value === null) return <span className="text-gray-400">-</span>
    
    const formatted = value.toFixed(1)
    const isPositive = value > 0
    const color = isPositive 
      ? value > 5 
        ? 'text-red-600 dark:text-red-400' 
        : 'text-orange-600 dark:text-orange-400'
      : 'text-green-600 dark:text-green-400'
    
    return (
      <span className={`font-medium ${color} flex items-center gap-1`}>
        {isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
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

  // Agrupar por tipo de componente
  const componentsByType = useMemo(() => {
    const grouped: Record<string, Component[]> = {}
    sortedComponents.forEach(comp => {
      const type = comp.component.type || 'Otros'
      if (!grouped[type]) {
        grouped[type] = []
      }
      grouped[type].push(comp)
    })
    return grouped
  }, [sortedComponents])

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Todos los rubros del IPC - Datos a {new Date(components[0]?.date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </div>
        
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="w-[40%]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('name')}
                  >
                    CATEGORÍA / RUBRO
                    <SortIcon field="name" />
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('monthly')}
                  >
                    <div className="flex items-center gap-1">
                      VAR. MENSUAL
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variación respecto al mes anterior</p>
                        </TooltipContent>
                      </Tooltip>
                      <SortIcon field="monthly" />
                    </div>
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
                <TableHead className="text-center hidden sm:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold hover:bg-transparent"
                    onClick={() => handleSort('accumulated')}
                  >
                    <div className="flex items-center gap-1">
                      VAR. ACUMULADA
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Variación acumulada en el año</p>
                        </TooltipContent>
                      </Tooltip>
                      <SortIcon field="accumulated" />
                    </div>
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedComponents.map((component, index) => (
                <TableRow 
                  key={component.component.code}
                  className={index === 0 && component.component.code === 'GENERAL' 
                    ? 'bg-blue-50 dark:bg-blue-950/20 font-semibold' 
                    : ''
                  }
                >
                  <TableCell className="font-medium">
                    {component.component.name}
                    {component.component.code === 'GENERAL' && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (Índice General)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatValue(component.values.monthly)}
                  </TableCell>
                  <TableCell className="text-center">
                    {formatValue(component.values.yearly)}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    {formatValue(component.values.accumulated)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {sortedComponents.length > 10 && (
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
                  Ver todos ({sortedComponents.length} rubros)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}