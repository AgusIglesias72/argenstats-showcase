// components/indicators/emae/EmaeClient.tsx
'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { TrendingUp, TrendingDown, Activity, Info, RefreshCw, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmaeChart } from './EmaeChart'
import { EmaeSectorsTable } from './EmaeSectorsTable'
import { EmaeSectorSelect } from './EmaeSectorsSelect'
import { EMAE_SECTORS, EMAE_DATA_TYPES } from '@/lib/api/constants/emae'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Server action para obtener datos
import { getEmaeDataAction } from '@/app/actions/emae.actions'

// Tipos
interface EmaeCurrentData {
  date: string
  sector: {
    code: string
    name: string
  }
  values: {
    index: number
    seasonallyAdjusted: number | null
    cycleTrend: number | null
    monthly: number | null
    yearly: number | null
    cycleTrendVariation: number | null
  }
}

interface EmaeSectorData {
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

interface EmaeHistoricalData {
  date: string
  values: {
    index: number
    seasonallyAdjusted: number | null
    monthly: number | null
    yearly: number | null
  }
}

interface EmaeStats {
  lastUpdate: string
  general: {
    index: number
    monthly: number | null
    yearly: number | null
    seasonallyAdjusted: number | null
  }
  topGrowthSectors: EmaeSectorData[]
  topDeclineSectors: EmaeSectorData[]
}

interface EmaePageData {
  current: EmaeCurrentData | null
  sectors: EmaeSectorData[]
  historical: EmaeHistoricalData[]
  stats: EmaeStats | null
}

interface EmaeClientProps {
  initialData: EmaePageData
}

export function EmaeClient({ initialData }: EmaeClientProps) {
  // Estados
  const [data, setData] = useState<EmaePageData>(initialData)
  const [selectedSector, setSelectedSector] = useState<keyof typeof EMAE_SECTORS>('GENERAL')
  const [dataType, setDataType] = useState<'original' | 'seasonally_adjusted'>('original')
  const [chartPeriod, setChartPeriod] = useState<'12' | '60' | '120' | '240'>('12')
  const [chartView, setChartView] = useState<'index' | 'monthly' | 'yearly'>('index')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingChart, setIsLoadingChart] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Efectos para actualizar datos
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingChart(true)
      try {
        const result = await getEmaeDataAction({
          sector: selectedSector,
          dataType,
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

    startTransition(() => {
      fetchData()
    })
  }, [selectedSector, dataType])

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoadingChart(true)
      try {
        const result = await getEmaeDataAction({
          sector: selectedSector,
          dataType,
          chartPeriod: parseInt(chartPeriod),
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

  // Calcular datos para el gráfico
  const chartData = useMemo(() => {
    if (!data.historical || data.historical.length === 0) {
      return []
    }
    
    return data.historical.map(item => ({
      date: format(new Date(item.date), 'MMM yyyy', { locale: es }),
      value: chartView === 'index' 
        ? item.values.index 
        : chartView === 'monthly'
        ? item.values.monthly
        : item.values.yearly,
      index: item.values.index,
      seasonallyAdjusted: item.values.seasonallyAdjusted
    }))
  }, [data.historical, chartView])

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const result = await getEmaeDataAction({
        sector: selectedSector,
        dataType,
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

  const formatValue = (value: number | null, suffix = '%', showSign = true) => {
    if (value === null) return '-'
    const formatted = value.toFixed(1)
    if (!showSign) return formatted
    return `${value > 0 ? '+' : ''}${formatted}${suffix}`
  }

  const getValueColor = (value: number | null) => {
    if (value === null) return ''
    if (value > 0) return 'text-green-600 dark:text-green-400'
    if (value < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  if (!data.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              No hay datos disponibles
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No se pudieron cargar los datos del EMAE. Por favor, intenta más tarde.
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
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Estimador Mensual de Actividad Económica
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Seguimiento de la evolución de la actividad económica a nivel nacional
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Valores actuales
              {selectedSector !== 'GENERAL' && (
                <Badge variant="secondary">{EMAE_SECTORS[selectedSector]}</Badge>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Valor del índice */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  Valor del índice
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {data.current.values.index.toFixed(1)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Base 2004 = 100
                </p>
              </CardContent>
            </Card>

            {/* Variación Mensual */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Var. mensual
                </CardDescription>
                <CardTitle className={`text-2xl font-bold ${getValueColor(data.current.values.monthly)}`}>
                  {formatValue(data.current.values.monthly)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.current.values.monthly && data.current.values.monthly > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : data.current.values.monthly && data.current.values.monthly < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : null}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    vs. mes anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Variación Interanual */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Var. interanual
                </CardDescription>
                <CardTitle className={`text-2xl font-bold ${getValueColor(data.current.values.yearly)}`}>
                  {formatValue(data.current.values.yearly)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data.current.values.yearly && data.current.values.yearly > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : data.current.values.yearly && data.current.values.yearly < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : null}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    vs. año anterior
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Serie desestacionalizada */}
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-full" />
              <CardHeader className="relative pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  Serie desestacionalizada
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {data.current.values.seasonallyAdjusted 
                    ? data.current.values.seasonallyAdjusted.toFixed(1)
                    : '-'
                  }
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sin efectos estacionales
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
                  Evolución del EMAE - Selecciona el sector, tipo de visualización y rango de tiempo
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Controles */}
              <div className="flex flex-col sm:flex-row gap-4">
                <EmaeSectorSelect 
                  value={selectedSector}
                  onChange={(v) => setSelectedSector(v as keyof typeof EMAE_SECTORS)}
                  className="w-full sm:w-[300px]"
                />

                <Select value={dataType} onValueChange={(v) => setDataType(v as 'original' | 'seasonally_adjusted')}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Tipo de serie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EMAE_DATA_TYPES).slice(0, 2).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tabs de vista y período */}
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <Tabs value={chartView} onValueChange={(v) => setChartView(v as 'index' | 'monthly' | 'yearly')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="index">Índice</TabsTrigger>
                    <TabsTrigger value="monthly">Var. Mensual</TabsTrigger>
                    <TabsTrigger value="yearly">Var. Interanual</TabsTrigger>
                  </TabsList>
                </Tabs>

                <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as '12' | '60' | '120' | '240')}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="12">1 año</TabsTrigger>
                    <TabsTrigger value="60">5 años</TabsTrigger>
                    <TabsTrigger value="120">10 años</TabsTrigger>
                    <TabsTrigger value="240">20 años</TabsTrigger>
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
                <EmaeChart 
                  data={chartData}
                  viewType={chartView}
                  dataType={dataType}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabla de Sectores */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sectores económicos
            </CardTitle>
            <CardDescription>
              Desempeño por sector económico - Datos a {format(new Date(data.current.date), 'MMMM yyyy', { locale: es })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmaeSectorsTable sectors={data.sectors} />
          </CardContent>
        </Card>

        {/* Información sobre sectores económicos */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Información sobre los sectores económicos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sectores Productivos Principales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Sectores Productivos Principales
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Industria Manufacturera <span className="text-blue-600">(18.9% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sector que transforma físicamente y químicamente materiales, sustancias o componentes en productos nuevos. Incluye desde alimentos y textiles hasta automotores y productos químicos.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Comercio mayorista y minorista <span className="text-blue-600">(12.4% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Abarca el comercio de productos agropecuarios, industriales nacionales, importados y exportaciones, junto con mantenimiento y reparación de automotores.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Actividades inmobiliarias y empresariales <span className="text-blue-600">(11% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Incluye servicios inmobiliarios, alquiler de viviendas, actividades jurídicas y contables, alquiler de equipos, y servicios empresariales como informática y seguridad.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Agricultura, ganadería y silvicultura <span className="text-blue-600">(8.1% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Comprende cultivos agrícolas como soja, trigo, maíz, y actividades pecuarias incluyendo producción bovina, lechería, carne aviar y huevos.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Transporte y comunicaciones <span className="text-blue-600">(6.1% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Servicios de transporte de pasajeros y cargas por vía férrea, automotor, aéreo y fluvial, así como telefonía, servicios postales, Internet y transmisión audiovisual.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Explotación de minas y canteras <span className="text-blue-600">(5% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Extracción de petróleo, gas natural y minerales metalíferos no ferrosos, junto con sus servicios relacionados.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sectores de Servicios */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    Sectores de Servicios
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Administración pública y defensa <span className="text-purple-600">(4.4% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Servicios administrativos del gobierno nacional, provincial y municipal, incluyendo seguridad y defensa nacional.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Enseñanza <span className="text-purple-600">(3.5% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Servicios educativos públicos y privados en todos los niveles, desde educación inicial hasta universitaria y formación profesional.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Intermediación financiera <span className="text-purple-600">(3.1% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Servicios bancarios, seguros, casas de cambio y otros servicios financieros incluyendo obras sociales y medicina prepaga.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Construcción <span className="text-purple-600">(3.1% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Actividades de construcción residencial, comercial e infraestructura, medida a través de indicadores como el ISAC y empleo sectorial.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Servicios sociales y de salud <span className="text-purple-600">(2.7% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Servicios de salud públicos y privados, incluyendo hospitales, clínicas, centros de salud y servicios médicos especializados.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Electricidad, gas y agua <span className="text-purple-600">(1.8% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Generación, transmisión y distribución de energía eléctrica, servicios de gas natural y distribución de agua potable y saneamiento.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-1">
                        Hoteles y restaurantes <span className="text-purple-600">(1.4% del PIB)</span>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Servicios de alojamiento temporal y gastronómicos, incluyendo hoteles, restaurantes, bares y servicios de catering.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Sobre el EMAE
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  El Estimador Mensual de Actividad Económica (EMAE) refleja la evolución mensual de la actividad económica del conjunto de los sectores productivos a nivel nacional. Este indicador permite anticipar las tasas de variación del Producto Interno Bruto (PIB) trimestral.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Serie Original</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Refleja los valores tal como se miden, incluyendo efectos estacionales y calendario.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Serie Desestacionalizada</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Elimina los efectos estacionales y de calendario para mostrar la tendencia subyacente.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Tendencia-Ciclo</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Muestra la dirección general de la economía sin fluctuaciones irregulares.
                    </p>
                  </div>
                </div>
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