// components/indicators/labor-market/LaborMarketClient.tsx
'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  RefreshCw, 
  Activity,
  UserCheck,
  UserX,
  Briefcase,
  Plus
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LaborMarketChart } from './LaborMarketChart'
import { RegionalTable } from './RegionalTable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Server action para obtener datos
import { getLaborMarketDataAction, refreshLaborMarketAction } from '@/app/actions/labor-market.actions'

interface LaborMarketPageData {
  current: any
  regional: any[]
  historical: any[]
  stats: any
  demographic: any
}

interface LaborMarketClientProps {
  initialData: LaborMarketPageData
}

export function LaborMarketClient({ initialData }: LaborMarketClientProps) {
  // Estados
  const [data, setData] = useState<LaborMarketPageData>(initialData)
  
  // Estados para las series activas en el gráfico
  const [activeIndicators, setActiveIndicators] = useState<string[]>(['unemployment'])
  const [activeRegions, setActiveRegions] = useState<string[]>(['Total 31 aglomerados'])
  
  // Estados para los selectores (lo que está seleccionado pero no agregado)
  const [selectedIndicator, setSelectedIndicator] = useState<string>('unemployment')
  const [selectedRegion, setSelectedRegion] = useState<string>('Total 31 aglomerados')
  
  const [chartPeriod, setChartPeriod] = useState<'2' | '3' | '5' | '7' | '10'>('5')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Efecto para actualizar datos del gráfico cuando cambian las series activas
  useEffect(() => {
    const fetchChartData = async () => {
      if (activeIndicators.length === 0 || activeRegions.length === 0) return
      
      setIsLoadingChart(true)
      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - parseInt(chartPeriod))

        const result = await getLaborMarketDataAction({
          indicators: activeIndicators,
          regions: activeRegions,
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0]
        })
        
        if (result && result.success && result.historical) {
          setData(prev => ({
            ...prev,
            historical: result.historical
          }))
        }
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setIsLoadingChart(false)
      }
    }

    startTransition(() => {
      fetchChartData()
    })
  }, [activeIndicators, activeRegions, chartPeriod])

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshLaborMarketAction()
      
      if (result && result.success) {
        setData({
          current: result.current,
          regional: result.regional,
          historical: result.historical,
          stats: result.stats,
          demographic: result.demographic
        })
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatValue = (value: number | null, suffix = '%', showSign = false) => {
    if (value === null || value === undefined) return '-'
    const formatted = value.toFixed(1)
    if (!showSign) return `${formatted}${suffix}`
    return `${value > 0 ? '+' : ''}${formatted}${suffix}`
  }

  const getValueColor = (value: number | null, inverted = false) => {
    if (value === null) return ''
    if (inverted) {
      if (value > 0) return 'text-red-600 dark:text-red-400'
      if (value < 0) return 'text-green-600 dark:text-green-400'
    } else {
      if (value > 0) return 'text-green-600 dark:text-green-400'
      if (value < 0) return 'text-red-600 dark:text-red-400'
    }
    return 'text-gray-600 dark:text-gray-400'
  }

  // Función para agregar serie al gráfico
  const handleAddSeries = () => {
    // Verificar que no exista ya esta combinación
    const seriesExists = activeIndicators.includes(selectedIndicator) && 
                        activeRegions.includes(selectedRegion)
    
    if (seriesExists) {
      // Opcional: mostrar un mensaje de que la serie ya existe
      return
    }

    // Agregar el indicador si no está
    if (!activeIndicators.includes(selectedIndicator)) {
      if (activeIndicators.length >= 3) {
        // Reemplazar el más antiguo si ya hay 3
        setActiveIndicators([...activeIndicators.slice(1), selectedIndicator])
      } else {
        setActiveIndicators([...activeIndicators, selectedIndicator])
      }
    }

    // Agregar la región si no está
    if (!activeRegions.includes(selectedRegion)) {
      if (activeRegions.length >= 3) {
        // Reemplazar la más antigua si ya hay 3
        setActiveRegions([...activeRegions.slice(1), selectedRegion])
      } else {
        setActiveRegions([...activeRegions, selectedRegion])
      }
    }
  }

  // Función para remover serie del gráfico (llamada desde el componente hijo)
  const handleRemoveSeries = (indicator: string, region: string) => {
    // Solo remover si no es la última serie
    const totalSeries = activeIndicators.length * activeRegions.length
    if (totalSeries <= 1) return

    // Si solo queda este indicador en uso, no lo removemos
    const indicatorUsedCount = activeRegions.filter(r => 
      data.historical.some(d => d.indicator === indicator && d.region === r)
    ).length
    
    // Si solo queda esta región en uso, no la removemos
    const regionUsedCount = activeIndicators.filter(i => 
      data.historical.some(d => d.indicator === i && d.region === region)
    ).length

    // Remover indicador si no es el único
    if (indicatorUsedCount <= 1 && activeIndicators.length > 1) {
      setActiveIndicators(activeIndicators.filter(i => i !== indicator))
    }

    // Remover región si no es la única
    if (regionUsedCount <= 1 && activeRegions.length > 1) {
      setActiveRegions(activeRegions.filter(r => r !== region))
    }
  }

  // Verificar si la combinación actual ya existe
  const isCurrentSelectionActive = useMemo(() => {
    return activeIndicators.includes(selectedIndicator) && 
           activeRegions.includes(selectedRegion)
  }, [activeIndicators, activeRegions, selectedIndicator, selectedRegion])

  // Calcular variaciones (ejemplo hardcodeado, deberías calcularlo desde datos reales)
  const variations = useMemo(() => {
    // En un caso real, estas variaciones se calcularían comparando con períodos anteriores
    return {
      employment: {
        interannual: 0.1,
        quarterly: -0.1
      },
      unemployment: {
        interannual: 0.2,
        quarterly: 0.3
      },
      activity: {
        interannual: 0.2,
        quarterly: 0.0
      }
    }
  }, [data])

  if (!data.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              No hay datos disponibles
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No se pudieron cargar los datos del mercado laboral. Por favor, intenta más tarde.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Indicadores de Empleo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Seguimiento completo del mercado laboral argentino con datos oficiales del INDEC
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Indicadores actuales
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Último dato: {data.current?.period || 'T3 2024'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Fuente: INDEC (EPH)
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tasa de Empleo */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  Tasa de Empleo
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {formatValue(data.current?.employmentRate)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {variations.employment.interannual >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Var. interanual: {formatValue(variations.employment.interannual, ' pp', true)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Var. trimestral: {formatValue(variations.employment.quarterly, ' pp', true)}
                </p>
              </CardContent>
            </Card>

            {/* Tasa de Desempleo */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <UserX className="w-4 h-4" />
                  Tasa de Desempleo
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatValue(data.current?.unemploymentRate)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {variations.unemployment.interannual > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Var. interanual: {formatValue(variations.unemployment.interannual, ' pp', true)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Var. trimestral: {formatValue(variations.unemployment.quarterly, ' pp', true)}
                </p>
              </CardContent>
            </Card>

            {/* Tasa de Actividad */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  Tasa de Actividad
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {formatValue(data.current?.activityRate)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {variations.activity.interannual >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-blue-500" />
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Var. interanual: {formatValue(variations.activity.interannual, ' pp', true)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Var. trimestral: {formatValue(variations.activity.quarterly, ' pp', true)}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráfico Histórico */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Evolución del Mercado Laboral
                </CardTitle>
                <CardDescription>
                  Selecciona el indicador, región y presiona "Agregar" para visualizar en el gráfico
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
          <div className="space-y-4">
              <div className='w-full flex flex-col md:flex-row gap-4 flex-wrap justify-between'>
              {/* Selectores */}
              <div className="flex flex-row gap-2">
                {/* Indicador */}
                <div className="">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Indicador
                  </label>
                  <Select 
                    value={selectedIndicator} 
                    onValueChange={setSelectedIndicator}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona indicador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unemployment">Tasa de Desempleo</SelectItem>
                      <SelectItem value="employment">Tasa de Empleo</SelectItem>
                      <SelectItem value="activity">Tasa de Actividad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Región */}
                <div className="">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Región
                  </label>
                  <Select 
                    value={selectedRegion} 
                    onValueChange={setSelectedRegion}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona región" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Total 31 aglomerados">Nacional</SelectItem>
                      <SelectItem value="Región Patagónica">Región Patagónica</SelectItem>
                      <SelectItem value="Región NOA">Región NOA</SelectItem>
                      <SelectItem value="Región Cuyo">Región Cuyo</SelectItem>
                      <SelectItem value="Región NEA">Región NEA</SelectItem>
                      <SelectItem value="Región Pampeana">Región Pampeana</SelectItem>
                      <SelectItem value="Gran Buenos Aires">Gran Buenos Aires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Botón Agregar */}
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddSeries}
                    disabled={isCurrentSelectionActive}
                    className="mb-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar al gráfico
                  </Button>
                </div>
              </div>

              {/* Período */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Período
                </label>
                <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as any)}>
                  <TabsList className="grid w-full grid-cols-5 max-w-sm md:max-w-md">
                    <TabsTrigger value="2">2A</TabsTrigger>
                    <TabsTrigger value="3">3A</TabsTrigger>
                    <TabsTrigger value="5">5A</TabsTrigger>
                    <TabsTrigger value="7">7A</TabsTrigger>
                    <TabsTrigger value="10">10A</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
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
                <LaborMarketChart 
                  data={data.historical}
                  indicators={activeIndicators}
                  regions={activeRegions}
                  onRemoveSeries={handleRemoveSeries}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla Regional */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Estadísticas regionales
            </CardTitle>
            <CardDescription>
              Desempleo por regiones - {data.current?.period || 'T3 2024'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegionalTable data={data.regional} />
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Indicadores Principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Tasa de Actividad
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Porcentaje de la población de 14 años y más que participa activamente del mercado de trabajo, ya sea trabajando o buscando trabajo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Tasa de Empleo
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Porcentaje de la población de 14 años y más que tiene empleo. Se calcula como el cociente entre la población ocupada y la población total.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Tasa de Desocupación
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Porcentaje de la población económicamente activa que no tiene empleo pero lo busca activamente. Es el principal indicador del desempleo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Subocupación
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Situación de los ocupados que trabajan menos de 35 horas semanales por causas involuntarias y están disponibles para trabajar más horas.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Segmentación Demográfica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Desempleo Juvenil
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tasa de desempleo en el grupo etario de 14 a 29 años. Históricamente presenta valores más altos que el promedio general.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Brecha de Género
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Diferencias en las tasas de empleo y desempleo entre varones y mujeres. Las mujeres suelen tener menor tasa de empleo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Desempleo Regional
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Variaciones en las tasas de desempleo entre las diferentes regiones del país, reflejando heterogeneidades económicas territoriales.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                  Nivel Educativo
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Relación entre el nivel de instrucción alcanzado y la situación laboral, donde mayor educación generalmente reduce el desempleo.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer con fuente */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fuente:</strong> Instituto Nacional de Estadística y Censos (INDEC) - Encuesta Permanente de Hogares (EPH). 
            Los datos se actualizan trimestralmente y cubren 31 aglomerados urbanos que representan aproximadamente el 70% de la población urbana del país.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}