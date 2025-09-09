// components/indicators/ipc/IPCClient.tsx
'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { TrendingUp, TrendingDown, Percent, Info, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IPCChart } from './IPCChart'
import { IPCComponentsTable } from './IPCComponentsTable'
import { IPC_REGIONS, IPC_COMPONENTS } from '@/lib/api/constants/inflation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Server action para obtener datos
import { getIPCDataAction } from '@/app/actions/ipc.actions'
import { IPCComponentSelect } from './IPCComponentSelect'

// Tipos que coinciden con el servicio
interface IPCCurrentData {
  date: string
  component: {
    code: string
    name: string
    type: string
  }
  region: string
  values: {
    monthly: number | null
    yearly: number | null
    accumulated: number | null
  }
  index: number
}

interface IPCComponentData {
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

interface IPCHistoricalData {
  date: string
  values: {
    monthly: number | null
    yearly: number | null
    accumulated: number | null
  }
  index: number
}

interface IPCPageData {
  current: IPCCurrentData | null
  components: IPCComponentData[]
  historical: IPCHistoricalData[]
}

interface IPCClientProps {
  initialData: IPCPageData
}

export function IPCClient({ initialData }: IPCClientProps) {
  // TODOS los hooks DEBEN estar al principio, sin condiciones
  const [data, setData] = useState<IPCPageData>(initialData)
  const [selectedRegion, setSelectedRegion] = useState<keyof typeof IPC_REGIONS>('Nacional')
  const [selectedComponent, setSelectedComponent] = useState<keyof typeof IPC_COMPONENTS>('GENERAL')
  const [chartPeriod, setChartPeriod] = useState<'12' | '36' | '60' | '84'>('12')
  const [chartView, setChartView] = useState<'monthly' | 'yearly'>('monthly')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isPending, startTransition] = useTransition()

  // useEffect para actualizar TODOS los datos cuando cambian los filtros principales
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoadingChart(true)
      try {
        const result = await getIPCDataAction({
          component: selectedComponent,
          region: selectedRegion,
          chartPeriod: parseInt(chartPeriod)
        })
        
        if (result) {
          setData(result)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoadingChart(false)
      }
    }

    // Solo ejecutar si hay cambios en los filtros
    if (selectedComponent !== 'GENERAL' || selectedRegion !== 'Nacional') {
      startTransition(() => {
        fetchAllData()
      })
    }
  }, [selectedRegion, selectedComponent])

  // useEffect separado para actualizar solo el histórico cuando cambia el período
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoadingChart(true)
      try {
        const endDate = new Date()
        const months = parseInt(chartPeriod)
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)
        
        const result = await getIPCDataAction({
          component: selectedComponent,
          region: selectedRegion,
          chartPeriod: months,
          onlyHistorical: true
        })
        
        if (result && result.historical) {
          setData(prev => ({
            ...prev,
            historical: result.historical
          }))
        }
      } catch (error) {
        console.error('Error fetching historical data:', error)
      } finally {
        setIsLoadingChart(false)
      }
    }

    startTransition(() => {
      fetchHistoricalData()
    })
  }, [chartPeriod])

  // useMemo para calcular datos del gráfico
  const chartData = useMemo(() => {
    if (!data.historical || data.historical.length === 0) {
      return []
    }
    return data.historical.map(item => ({
      date: format(new Date(item.date), 'MMM yyyy', { locale: es }),
      value: chartView === 'monthly' 
        ? item.values.monthly 
        : item.values.yearly,
      index: item.index
    }))
  }, [data.historical, chartView])

  // Función para refrescar datos
  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const result = await getIPCDataAction({
        component: selectedComponent,
        region: selectedRegion,
        chartPeriod: parseInt(chartPeriod)
      })
      
      if (result) {
        setData(result)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Funciones de formato
  const formatValue = (value: number | null, suffix = '%') => {
    if (value === null) return '-'
    const formatted = value.toFixed(1)
    return `${value > 0 ? '+' : ''}${formatted}${suffix}`
  }

  const getValueColor = (value: number | null) => {
    if (value === null) return ''
    if (value > 5) return 'text-red-600 dark:text-red-400'
    if (value > 3) return 'text-orange-600 dark:text-orange-400'
    if (value > 0) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  // AHORA sí, después de TODOS los hooks, verificamos los datos
  if (!data.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              No hay datos disponibles
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No se pudieron cargar los datos del IPC. Por favor, intenta más tarde.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Índice de Precios al Consumidor
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Seguimiento de la evolución de precios por regiones y rubros
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <div className="flex items-center flex-col md:flex-row space-y-4 md:space-y-0 justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Valores actuales
              {selectedComponent !== 'GENERAL' && (
                <Badge variant="secondary">{IPC_COMPONENTS[selectedComponent]}</Badge>
              )}
              {selectedRegion !== 'Nacional' && (
                <Badge variant="secondary">{IPC_REGIONS[selectedRegion]}</Badge>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Último dato: {format(new Date(data.current.date), 'MMMM yyyy', { locale: es })}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing || isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing || isPending ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Variación Mensual */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Variación mensual
                </CardDescription>
                <CardTitle className={`text-3xl font-bold ${getValueColor(data.current.values.monthly)}`}>
                  {formatValue(data.current.values.monthly)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.current.values.monthly && data.current.values.monthly > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    vs. mes anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Variación Interanual */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-1">
                  <Percent className="w-4 h-4" />
                  Variación interanual
                </CardDescription>
                <CardTitle className={`text-3xl font-bold ${getValueColor(data.current.values.yearly)}`}>
                  {formatValue(data.current.values.yearly)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.current.values.yearly && data.current.values.yearly > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    últimos 12 meses
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Variación Acumulada */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Variación acumulada
                </CardDescription>
                <CardTitle className={`text-3xl font-bold ${getValueColor(data.current.values.accumulated)}`}>
                  {formatValue(data.current.values.accumulated)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.current.values.accumulated && data.current.values.accumulated > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    en el año
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Análisis Histórico */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Análisis histórico
                </CardTitle>
                <CardDescription>
                  Evolución del IPC - Selecciona el rango de tiempo, región y rubro para visualizar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Controles */}
              <div className="flex flex-col sm:flex-row gap-4">
                <IPCComponentSelect
                  value={selectedComponent}
                  onChange={(v) => setSelectedComponent(v as keyof typeof IPC_COMPONENTS)}
                  className="w-full sm:w-[250px]"
                />

                <Select value={selectedRegion} onValueChange={(v) => setSelectedRegion(v as keyof typeof IPC_REGIONS)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Seleccionar región" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(IPC_REGIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs de período y tipo de variación */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'monthly' | 'yearly')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="monthly">Mensual</TabsTrigger>
                    <TabsTrigger value="yearly">Interanual</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as '12' | '36' | '60' | '84')}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="12">1 año</TabsTrigger>
                    <TabsTrigger value="36">3 años</TabsTrigger>
                    <TabsTrigger value="60">5 años</TabsTrigger>
                    <TabsTrigger value="84">7 años</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Gráfico */}
              {isLoadingChart || isPending ? (
                <div className="h-[400px] flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">Cargando datos...</p>
                  </div>
                </div>
              ) : (
                <IPCChart 
                  data={chartData}
                  viewType={chartView}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Rubros */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Rubros y categorías
            </CardTitle>
            <CardDescription>
              Variación por rubros del {selectedRegion !== 'Nacional' ? `${IPC_REGIONS[selectedRegion]} - ` : ''}
              {data.components.length > 0 
                ? format(new Date(data.components[0].date), 'MMMM yyyy', { locale: es })
                : 'Datos no disponibles'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IPCComponentsTable components={data.components} />
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rubros Principales del IPC</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Alimentos y bebidas no alcohólicas
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Productos alimentarios básicos, carnes, lácteos, frutas, verduras, cereales, aceites y bebidas sin alcohol. Es uno de los rubros de mayor peso en la canasta familiar.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Vivienda, agua, electricidad y otros combustibles
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gastos de alquiler, expensas, servicios de electricidad, gas, agua, y combustibles para calefacción. Incluye mantenimiento y reparaciones menores del hogar.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Transporte
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Costos de transporte público, combustibles, mantenimiento vehicular, seguros automotores y servicios de transporte. Incluye tanto transporte privado como público.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Categorías de Análisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  IPC Núcleo
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Excluye los precios de los alimentos no elaborados y los combustibles, proporcionando una medida de la inflación subyacente menos volátil.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Estacional
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Incluye productos cuyos precios presentan variaciones estacionales significativas, como alimentos frescos y servicios turísticos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Regulados
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bienes y servicios cuyos precios son fijados o influenciados por el sector público, como servicios públicos, combustibles y medicamentos.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer con fuente */}
        <Alert className="mt-8">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fuente:</strong> Instituto Nacional de Estadística y Censos (INDEC). Los datos se actualizan mensualmente con la publicación oficial.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}