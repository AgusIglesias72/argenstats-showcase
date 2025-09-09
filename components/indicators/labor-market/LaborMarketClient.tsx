// components/indicators/labor-market/LaborMarketClient.tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
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
  BarChart3,
  MapPin
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LaborMarketChart } from './LaborMarketChart'
import { RegionalTable } from './RegionalTable'

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
  
  // Estados para los selectores
  const [selectedIndicator, setSelectedIndicator] = useState<string>('unemployment')
  const [selectedRegion, setSelectedRegion] = useState<string>('Total 31 aglomerados')
  const [chartPeriod, setChartPeriod] = useState<'2' | '3' | '5' | '7' | '10'>('5')
  
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Efecto para actualizar datos del gráfico cuando cambian los parámetros
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoadingChart(true)
      try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - parseInt(chartPeriod))

        const result = await getLaborMarketDataAction({
          indicators: [selectedIndicator],
          regions: [selectedRegion],
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
  }, [selectedIndicator, selectedRegion, chartPeriod])

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

  // Calcular variaciones (ejemplo hardcodeado, deberías calcularlo desde datos reales)
  const variations = {
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

  if (!data.current) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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

        {/* Info del período */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Último dato disponible: <strong>{data.current?.period || 'T3 2024'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
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
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Indicadores actuales
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tasa de Empleo */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute inset-0 bg-green-50 dark:bg-green-900/20 opacity-50" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardDescription className="text-xs">Población ocupada</CardDescription>
                    <CardTitle className="text-lg">Tasa de Empleo</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold">{formatValue(data.current?.employmentRate)}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    {variations.employment.interannual >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(variations.employment.interannual).toFixed(1)}pp
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs. año anterior
                </p>
              </CardContent>
            </Card>

            {/* Tasa de Desempleo */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute inset-0 bg-red-50 dark:bg-red-900/20 opacity-50" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <CardDescription className="text-xs">Población desocupada</CardDescription>
                    <CardTitle className="text-lg">Tasa de Desempleo</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {formatValue(data.current?.unemploymentRate)}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-medium text-red-600">
                    {variations.unemployment.interannual > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(variations.unemployment.interannual).toFixed(1)}pp
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs. año anterior
                </p>
              </CardContent>
            </Card>

            {/* Tasa de Actividad */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 opacity-50" />
              <CardHeader className="relative pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardDescription className="text-xs">Población económicamente activa</CardDescription>
                    <CardTitle className="text-lg">Tasa de Actividad</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-bold">{formatValue(data.current?.activityRate)}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-blue-600">
                    {variations.activity.interannual >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(variations.activity.interannual).toFixed(1)}pp
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs. año anterior
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Gráfico Histórico */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>Análisis histórico interactivo</CardTitle>
                  <CardDescription>
                    Evolución del Mercado Laboral
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Indicador" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unemployment">Desempleo</SelectItem>
                    <SelectItem value="employment">Empleo</SelectItem>
                    <SelectItem value="activity">Actividad</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Región" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Total 31 aglomerados">Total País</SelectItem>
                    <SelectItem value="Región Patagónica">Patagonia</SelectItem>
                    <SelectItem value="Región NOA">NOA</SelectItem>
                    <SelectItem value="Región NEA">NEA</SelectItem>
                    <SelectItem value="Región Cuyo">Cuyo</SelectItem>
                    <SelectItem value="Región Pampeana">Pampeana</SelectItem>
                    <SelectItem value="Gran Buenos Aires">GBA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualiza la evolución histórica por indicador y región. Selecciona el período para ajustar el rango temporal.
            </p>

            {/* Selector de período */}
            <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as any)} className="mb-4">
              <TabsList className="grid w-full grid-cols-5 max-w-md">
                <TabsTrigger value="2">2 años</TabsTrigger>
                <TabsTrigger value="3">3 años</TabsTrigger>
                <TabsTrigger value="5">5 años</TabsTrigger>
                <TabsTrigger value="7">7 años</TabsTrigger>
                <TabsTrigger value="10">10 años</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Badge indicando región seleccionada */}
            {selectedRegion !== 'Total 31 aglomerados' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    Visualizando datos de: <strong>{selectedRegion}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRegion('Total 31 aglomerados')}
                    className="ml-auto text-xs"
                  >
                    Ver Total País
                  </Button>
                </div>
              </div>
            )}

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
                indicator={selectedIndicator}
                region={selectedRegion}
                chartType="area"
              />
            )}
          </CardContent>
        </Card>

        {/* Comparación Regional */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle>Comparación por regiones</CardTitle>
                  <CardDescription>
                    Datos del período {data.current?.period || 'T3 2024'}
                  </CardDescription>
                </div>
              </div>
              <Select value={selectedIndicator} onValueChange={setSelectedIndicator}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Indicador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unemployment">Desempleo</SelectItem>
                  <SelectItem value="employment">Empleo</SelectItem>
                  <SelectItem value="activity">Actividad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-xs">
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
                <TabsTrigger value="table">Tabla</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart">
                {/* Pasamos los datos completos y dejamos que el componente filtre todas las regiones */}
                <LaborMarketChart 
                  data={[
                    // Datos mock para todas las regiones - en producción estos vendrían del servidor
                    { date: '2024-09-30', value: 4.3, indicator: 'unemployment', region: 'Total 31 aglomerados' },
                    { date: '2024-09-30', value: 4.8, indicator: 'unemployment', region: 'Gran Buenos Aires' },
                    { date: '2024-09-30', value: 3.9, indicator: 'unemployment', region: 'Región Pampeana' },
                    { date: '2024-09-30', value: 3.2, indicator: 'unemployment', region: 'Región Patagónica' },
                    { date: '2024-09-30', value: 4.1, indicator: 'unemployment', region: 'Región Cuyo' },
                    { date: '2024-09-30', value: 5.2, indicator: 'unemployment', region: 'Región NOA' },
                    { date: '2024-09-30', value: 5.5, indicator: 'unemployment', region: 'Región NEA' },
                    { date: '2024-09-30', value: 43.5, indicator: 'employment', region: 'Total 31 aglomerados' },
                    { date: '2024-09-30', value: 42.8, indicator: 'employment', region: 'Gran Buenos Aires' },
                    { date: '2024-09-30', value: 44.1, indicator: 'employment', region: 'Región Pampeana' },
                    { date: '2024-09-30', value: 45.2, indicator: 'employment', region: 'Región Patagónica' },
                    { date: '2024-09-30', value: 43.9, indicator: 'employment', region: 'Región Cuyo' },
                    { date: '2024-09-30', value: 41.8, indicator: 'employment', region: 'Región NOA' },
                    { date: '2024-09-30', value: 41.2, indicator: 'employment', region: 'Región NEA' },
                    { date: '2024-09-30', value: 47.2, indicator: 'activity', region: 'Total 31 aglomerados' },
                    { date: '2024-09-30', value: 46.8, indicator: 'activity', region: 'Gran Buenos Aires' },
                    { date: '2024-09-30', value: 47.5, indicator: 'activity', region: 'Región Pampeana' },
                    { date: '2024-09-30', value: 48.1, indicator: 'activity', region: 'Región Patagónica' },
                    { date: '2024-09-30', value: 47.0, indicator: 'activity', region: 'Región Cuyo' },
                    { date: '2024-09-30', value: 45.9, indicator: 'activity', region: 'Región NOA' },
                    { date: '2024-09-30', value: 45.3, indicator: 'activity', region: 'Región NEA' },
                    ...data.historical
                  ]}
                  indicator={selectedIndicator}
                  region={selectedRegion}
                  chartType="bar"
                />
              </TabsContent>
              
              <TabsContent value="table">
                <RegionalTable data={data.regional} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Definiciones Técnicas
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Tasa de Actividad</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Porcentaje de la población de 14 años y más que participa activamente del mercado de trabajo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tasa de Empleo</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Porcentaje de la población de 14 años y más que tiene empleo.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Tasa de Desocupación</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Porcentaje de la población económicamente activa que no tiene empleo pero lo busca activamente.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-purple-900 dark:text-purple-100">
                  Segmentación Demográfica
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Desempleo Juvenil</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Tasa de desempleo en el grupo de 14 a 29 años, históricamente más alta que el promedio.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Brecha de Género</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Diferencias en las tasas de empleo entre varones y mujeres.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Informalidad Laboral</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Proporción de trabajadores sin aportes jubilatorios ni obra social.
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
            Los datos se actualizan trimestralmente y cubren 31 aglomerados urbanos.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}