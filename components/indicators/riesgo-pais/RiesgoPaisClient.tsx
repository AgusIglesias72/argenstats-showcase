// components/indicators/riesgo-pais/RiesgoPaisClient.tsx
'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { TrendingUp, TrendingDown, Globe, Info, RefreshCw, BarChart3, Activity, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RiesgoPaisChart } from './RiesgoPaisChart'
import { RiesgoPaisPeriodsTable } from './RiesgoPaisPeriodsTable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Server action para obtener datos
import { getRiesgoPaisDataAction, refreshRiesgoPaisAction } from '@/app/actions/riesgo-pais.actions'

// Tipos
interface RiesgoPaisCurrentData {
  value: number
  date: string
  dailyChange: number
  dailyChangePercent: number
  officialValue?: number
  estimatorDiff?: number
  source: 'official' | 'estimated'
  lastUpdate?: string
}

interface JPMorganComparison {
  official: number
  estimated: number
  difference: number
  lastUpdate: string
}

interface RiesgoPaisHistoricalData {
  date: string
  value: number
  officialValue?: number
}

interface PeriodVariation {
  value: number
  percent: number
}

interface Variations {
  daily: PeriodVariation
  weekly: PeriodVariation
  monthly: PeriodVariation
  quarterly: PeriodVariation
  yearly: PeriodVariation
  ytd: PeriodVariation
}

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

interface RiesgoPaisStats {
  min: number
  max: number
  average: number
  stdDev: number
  period: string
}

interface RiesgoPaisPageData {
  current: RiesgoPaisCurrentData | null
  jpMorganData: JPMorganComparison | null
  historical: RiesgoPaisHistoricalData[]
  variations: Variations | null
  periodsData: PeriodData[]
  stats: RiesgoPaisStats | null
}

interface RiesgoPaisClientProps {
  initialData: RiesgoPaisPageData
}

export function RiesgoPaisClient({ initialData }: RiesgoPaisClientProps) {
  // Estados
  const [data, setData] = useState<RiesgoPaisPageData>(initialData)
  const [dataSource, setDataSource] = useState<'estimated' | 'official' | 'both'>('estimated')
  const [chartPeriod, setChartPeriod] = useState<'30' | '90' | '365' | '1825'>('90')
  const [chartView, setChartView] = useState<'value' | 'comparison'>('value')
  const [showReferenceLines, setShowReferenceLines] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [jpMorganUpdate, setJpMorganUpdate] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      
      // Para el valor actual del riesgo país
      const updateDate = data.current?.lastUpdate ? new Date(data.current.lastUpdate) : now
      const diff = Math.floor((now.getTime() - updateDate.getTime()) / 1000 / 60) // minutos 


      if (diff < 0) {
        setLastUpdate('Recién actualizado')
        return
      }
      
      if (diff < 60) {
        setLastUpdate(`hace ${diff} ${diff === 1 ? 'minuto' : 'minutos'}`)
      } else if (diff < 1440) { // menos de 24 horas
        const hours = Math.floor(diff / 60)
        setLastUpdate(`hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`)
      } else {
        const days = Math.floor(diff / 1440)
        setLastUpdate(`hace ${days} ${days === 1 ? 'día' : 'días'}`)
      }
      
      // Para JP Morgan
      if (data.jpMorganData?.lastUpdate) {
        const jpDate = new Date(data.jpMorganData.lastUpdate)
        const jpDiff = Math.floor((now.getTime() - jpDate.getTime()) / 1000 / 60)
        
        if (jpDiff < 60) {
          setJpMorganUpdate(`hace ${jpDiff} ${jpDiff === 1 ? 'minuto' : 'minutos'}`)
        } else if (jpDiff < 1440) {
          const hours = Math.floor(jpDiff / 60)
          setJpMorganUpdate(`hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`)
        } else {
          const days = Math.floor(jpDiff / 1440)
          setJpMorganUpdate(`hace ${days} ${days === 1 ? 'día' : 'días'}`)
        }
      }
    }
    
    updateTime()
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [data.current?.lastUpdate, data.jpMorganData?.lastUpdate])

  // Efectos para actualizar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingChart(true)
      try {
        const result = await getRiesgoPaisDataAction({
          chartPeriod: parseInt(chartPeriod),
          dataSource,
          onlyHistorical: false
        })
        

        
        if (result) {
          setData(result as RiesgoPaisPageData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoadingChart(false)
      }
    }

    startTransition(() => {
      fetchData()
    })
  }, [dataSource])

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoadingChart(true)
      try {
        const result = await getRiesgoPaisDataAction({
          chartPeriod: parseInt(chartPeriod),
          dataSource,
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
  }, [chartPeriod, dataSource])

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshRiesgoPaisAction()
      
      if (result.success) {
        setData(prev => ({
          ...prev,
          current: result.current || prev.current,
          jpMorganData: result.jpMorganData || prev.jpMorganData,
          variations: result.variations || prev.variations
        }))
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatValue = (value: number | null, suffix = '', showSign = true) => {
    if (value === null || value === undefined) return '-'
    const formatted = value.toFixed(1)
    if (!showSign) return `${formatted}${suffix}`
    return `${value > 0 ? '+' : ''}${formatted}${suffix}`
  }

  const getValueColor = (value: number | null) => {
    if (value === null) return ''
    if (value > 0) return 'text-red-600 dark:text-red-400'
    if (value < 0) return 'text-green-600 dark:text-green-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const getRiskLevel = (value: number) => {
    if (value < 500) return { label: 'Bajo', color: 'bg-green-500', textColor: 'text-green-600' }
    if (value < 1000) return { label: 'Moderado', color: 'bg-yellow-500', textColor: 'text-yellow-600' }
    if (value < 1500) return { label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-600' }
    return { label: 'Muy Alto', color: 'bg-red-500', textColor: 'text-red-600' }
  }

  const riskLevel = getRiskLevel(data.current?.value || 0)

  if (!data.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              No hay datos disponibles
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No se pudieron cargar los datos del Riesgo País. Por favor, intenta más tarde.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Riesgo País Argentina
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Seguimiento en tiempo real del indicador de riesgo soberano argentino
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
        <div className="flex items-center flex-col md:flex-row space-y-4 md:space-y-0 justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Valores actuales
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Fuente: {data.current.source === 'estimated' ? 'Estimador ArgenStats' : 'Riesgo Pais JP Morgan'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Riesgo País Actual */}
            <Card className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${riskLevel.color}`} />
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  Riesgo Pais Argenstats
                </CardDescription>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-bold">
                    {data.current.value}
                  </CardTitle>
                  <Badge className={`${riskLevel.textColor} bg-opacity-10`}>
                    {riskLevel.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">puntos básicos</span>
                  <div className={`flex items-center gap-1 ${getValueColor(data.current.dailyChange)}`}>
                    {data.current.dailyChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : data.current.dailyChange < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    <span className="text-sm font-semibold">
                      {formatValue(data.current.dailyChangePercent, '%')}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Actualizado {lastUpdate}
                </p>
              </CardContent>
            </Card>

            {/* Riesgo Pais JP Morgan */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Riesgo Pais JP Morgan
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {data.jpMorganData?.official || data.current?.officialValue || '-'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">índice oficial</p>
                {data.jpMorganData && data.current && (
                  <p className="text-xs mt-1">
                    <span className={
                      data.jpMorganData.official > data.current.value 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }>
                      {data.jpMorganData.official > data.current.value ? '+' : ''}
                      {data.jpMorganData.official - data.current.value} pb vs estimador
                    </span>
                  </p>
                )}
                {jpMorganUpdate && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Actualizado {jpMorganUpdate}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Variación Mensual */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Var. mensual
                </CardDescription>
                <CardTitle className={`text-2xl font-bold ${getValueColor(data.variations?.monthly?.percent ?? null)}`}>
                  {formatValue(data.variations?.monthly?.percent ?? null, '%')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.variations?.monthly?.percent && data.variations.monthly.percent > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : data.variations?.monthly?.percent && data.variations.monthly.percent < 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : null}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.abs(data.variations?.monthly?.value || 0)} pb
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  vs {data.current ? (data.current.value - (data.variations?.monthly?.value || 0)) : 0} pb 
                  ({format(new Date(new Date().setDate(new Date().getDate() - 30)), 'dd/MM', { locale: es })})
                </p>
              </CardContent>
            </Card>

            {/* Variación Anual */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Var. anual
                </CardDescription>
                <CardTitle className={`text-2xl font-bold ${getValueColor(data.variations?.yearly?.percent ?? null)}`}>
                  {formatValue(data.variations?.yearly?.percent ?? null, '%')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.variations?.yearly?.percent && data.variations.yearly.percent > 0 ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : data.variations?.yearly?.percent && data.variations.yearly.percent < 0 ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : null}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.abs(data.variations?.yearly?.value || 0)} pb
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  vs {data.current ? (data.current.value - (data.variations?.yearly?.value || 0)) : 0} pb 
                  ({format(new Date(new Date().setFullYear(new Date().getFullYear() - 1)), 'MM/yyyy', { locale: es })})
                </p>
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
                  Evolución del Riesgo País - Selecciona el período y tipo de visualización
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Controles */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select value={dataSource} onValueChange={(v) => setDataSource(v as 'estimated' | 'official' | 'both')}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Fuente de datos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="estimated">Estimador</SelectItem>
                    <SelectItem value="official">JP Morgan Oficial</SelectItem>
                    <SelectItem value="both">Comparación</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant={showReferenceLines ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowReferenceLines(!showReferenceLines)}
                >
                  {showReferenceLines ? 'Ocultar' : 'Mostrar'} niveles de riesgo
                </Button>
              </div>

              {/* Tabs de período */}
              <div className="flex justify-between">
                    <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as '30' | '90' | '365' | '1825')}>
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="30">1M</TabsTrigger>
                    <TabsTrigger value="90">3M</TabsTrigger>
                    <TabsTrigger value="365">1A</TabsTrigger>
                    <TabsTrigger value="1825">5A</TabsTrigger>
                    <TabsTrigger value="3650">10A</TabsTrigger>
                    <TabsTrigger value="5475">15A</TabsTrigger>
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
                <RiesgoPaisChart 
                  data={data.historical}
                  viewType={dataSource === 'both' ? 'comparison' : 'value'}
                  showReferenceLines={showReferenceLines}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Períodos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análisis por períodos
            </CardTitle>
            <CardDescription>
              Variaciones y estadísticas del Riesgo País en diferentes períodos temporales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RiesgoPaisPeriodsTable 
              periods={data.periodsData} 
              currentValue={data.current.value} 
            />
          </CardContent>
        </Card>

        {/* Información sobre el Riesgo País */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Información sobre el Riesgo País
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Conceptos básicos */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Conceptos básicos
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        ¿Qué es el Riesgo País?
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Es un indicador que mide la probabilidad de que un país no pueda cumplir con sus obligaciones de deuda externa. Se expresa en puntos básicos (pb) sobre los bonos del Tesoro de Estados Unidos.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        ¿Cómo se calcula?
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Se calcula como el diferencial (spread) entre el rendimiento de los bonos soberanos argentinos y los bonos del Tesoro de EE.UU. de similar vencimiento. Un mayor spread indica mayor riesgo percibido.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        JP Morgan EMBI+
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        El Emerging Markets Bond Index Plus es el índice de referencia más utilizado para medir el riesgo país. Se actualiza diariamente al cierre de los mercados internacionales.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Nuestro Estimador
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Calculamos un estimador propio que busca reflejar cambios en tiempo real basándose en las cotizaciones de los bonos argentinos durante el día, permitiendo un seguimiento más inmediato.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Interpretación de niveles */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    Interpretación de niveles
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Riesgo Bajo <span className="text-green-600">(0-500 pb)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Indica confianza del mercado en la capacidad de pago del país. Facilita el acceso a financiamiento internacional a tasas competitivas.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Riesgo Moderado <span className="text-yellow-600">(500-1000 pb)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Señala cierta preocupación del mercado, pero aún se considera manejable. El acceso al financiamiento puede encarecerse ligeramente.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Riesgo Alto <span className="text-orange-600">(1000-1500 pb)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Refleja alta desconfianza del mercado. El acceso a financiamiento internacional se vuelve muy costoso y limitado.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Riesgo Muy Alto <span className="text-red-600">(+1500 pb)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Indica una situación crítica donde el mercado considera muy probable un default. El acceso a financiamiento queda prácticamente cerrado.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Factores que lo afectan
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Situación fiscal, reservas del BCRA, estabilidad política, crecimiento económico, inflación, déficit de cuenta corriente, historia de pagos y condiciones globales de los mercados.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sobre el indicador
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  El Riesgo País es uno de los indicadores más importantes para evaluar la salud financiera de un país desde la perspectiva de los mercados internacionales. Afecta directamente el costo del financiamiento para el gobierno y las empresas, influye en las decisiones de inversión extranjera y puede impactar en el tipo de cambio y las tasas de interés domésticas.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Impacto en la economía</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Un riesgo país elevado encarece el crédito, desalienta la inversión y puede generar presión sobre el tipo de cambio.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Comparación regional</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Argentina históricamente ha tenido uno de los riesgos país más altos de América Latina, reflejando su historia de defaults.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Volatilidad</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Es un indicador muy volátil que puede cambiar rápidamente según las condiciones del mercado y las decisiones políticas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerta sobre volatilidad */}
        <Alert className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nota importante:</strong> El Riesgo País es un indicador volátil que puede cambiar rápidamente según las condiciones del mercado, decisiones políticas y económicas. Los valores mostrados son informativos y no constituyen asesoramiento financiero.
          </AlertDescription>
        </Alert>

        {/* Footer con fuente */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Fuente:</strong> JP Morgan EMBI+ (Emerging Markets Bond Index Plus) y estimaciones propias basadas en datos de mercado. Los datos se actualizan en tiempo real durante las horas de mercado.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}