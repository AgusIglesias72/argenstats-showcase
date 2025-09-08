'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Home, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  MapPin,
  Calendar,
  Info,
  Download,
  ChevronRight,
  BarChart3
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface PovertyData {
  period: string
  date: string
  poverty: {
    persons: number
    households: number
    variation: {
      persons: number
      households: number
    }
  }
  indigence: {
    persons: number
    households: number
    variation: {
      persons: number
      households: number
    }
  }
}

interface RegionalData {
  region: string
  regionCode: string
  poverty: {
    persons: number
    households: number
    ranking: number
  }
  indigence: {
    persons: number
    households: number
    ranking: number
  }
}

interface HistoricalPoint {
  date: string
  period: string
  poverty: {
    persons: number
    households: number
  }
  indigence: {
    persons: number
    households: number
  }
}

interface PovertyClientProps {
  initialData: {
    current: PovertyData | null
    regionalComparison: RegionalData[]
    historical: HistoricalPoint[]
  }
}

export function PovertyClient({ initialData }: PovertyClientProps) {
  const [populationType, setPopulationType] = useState<'persons' | 'households'>('persons')
  const [metricType, setMetricType] = useState<'poverty' | 'indigence' | 'both'>('poverty')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')

  // Formatear datos para el gráfico histórico
  const chartData = initialData.historical.map(point => ({
    date: point.date,
    period: point.period,
    'Pobreza Personas': point.poverty.persons,
    'Pobreza Hogares': point.poverty.households,
    'Indigencia Personas': point.indigence.persons,
    'Indigencia Hogares': point.indigence.households,
  }))

  // Formatear datos para el gráfico de barras regional
  const regionalChartData = initialData.regionalComparison.map(region => ({
    region: region.region.includes('Total') ? 'Total País' : region.region,
    'Pobreza': populationType === 'persons' ? region.poverty.persons : region.poverty.households,
    'Indigencia': populationType === 'persons' ? region.indigence.persons : region.indigence.households,
  }))

  // Custom Tooltip para el gráfico
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {payload[0]?.payload?.period || label}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {entry.value.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  // Componente de Card de indicador
  const IndicatorCard = ({ 
    title, 
    value, 
    variation, 
    icon: Icon, 
    type,
    description 
  }: {
    title: string
    value: number
    variation: number
    icon: any
    type: 'poverty' | 'indigence'
    description: string
  }) => {
    const isPositiveChange = variation < 0 // Menor pobreza es positivo
    const bgColor = type === 'poverty' 
      ? 'bg-red-50 dark:bg-red-900/20' 
      : 'bg-orange-50 dark:bg-orange-900/20'
    const iconColor = type === 'poverty'
      ? 'text-red-600 dark:text-red-400'
      : 'text-orange-600 dark:text-orange-400'

    return (
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute inset-0 ${bgColor} opacity-50`} />
        <CardHeader className="relative pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 ${bgColor} rounded-lg`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <CardDescription className="text-xs">{description}</CardDescription>
                <CardTitle className="text-lg">{title}</CardTitle>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-bold">{value.toFixed(1)}%</p>
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositiveChange ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositiveChange ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
              {Math.abs(variation).toFixed(1)}pp
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            vs. semestre anterior
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!initialData.current) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              No hay datos disponibles
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Los datos de pobreza e indigencia no están disponibles en este momento.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Dashboard de Pobreza e Indigencia en Argentina
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Análisis interactivo de la incidencia de la pobreza e indigencia en los 
            principales aglomerados urbanos del país con datos oficiales del INDEC
          </p>
        </div>

        {/* Info del período */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 mb-6 shadow-sm border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Último dato disponible: <strong>{initialData.current.period}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Fuente: Instituto Nacional de Estadística y Censos (INDEC)
              </span>
            </div>
          </div>
        </div>

        {/* Indicadores actuales */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Indicadores actuales
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <IndicatorCard
              title="Pobreza en personas"
              value={initialData.current.poverty.persons}
              variation={initialData.current.poverty.variation.persons}
              icon={Users}
              type="poverty"
              description="Población bajo la línea de pobreza"
            />
            <IndicatorCard
              title="Pobreza en hogares"
              value={initialData.current.poverty.households}
              variation={initialData.current.poverty.variation.households}
              icon={Home}
              type="poverty"
              description="Hogares bajo la línea de pobreza"
            />
            <IndicatorCard
              title="Indigencia en personas"
              value={initialData.current.indigence.persons}
              variation={initialData.current.indigence.variation.persons}
              icon={AlertTriangle}
              type="indigence"
              description="Población en situación de indigencia"
            />
            <IndicatorCard
              title="Indigencia en hogares"
              value={initialData.current.indigence.households}
              variation={initialData.current.indigence.variation.households}
              icon={Home}
              type="indigence"
              description="Hogares en situación de indigencia"
            />
          </div>
        </div>

        {/* Análisis histórico */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle>Análisis histórico interactivo</CardTitle>
                  <CardDescription>
                    Evolución de la Pobreza e Indigencia
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={populationType} onValueChange={(v: any) => setPopulationType(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="persons">Personas</SelectItem>
                    <SelectItem value="households">Hogares</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualiza la evolución histórica por región. Selecciona la región, tipo de población y el indicador para un análisis específico.
              Gráfico interactivo con datos desde 2016.
            </p>
            
            {/* Badge indicando región seleccionada */}
            {selectedRegion !== 'Total' && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-800 dark:text-blue-300">
                    Visualizando datos de: <strong>{selectedRegion}</strong>
                  </span>
                  {selectedRegion !== 'Total' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRegion('Total')}
                      className="ml-auto text-xs"
                    >
                      Ver Total País
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-xs">
                <TabsTrigger value="chart">Gráfico</TabsTrigger>
                <TabsTrigger value="table">Tabla</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="space-y-4">
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="povertyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                        </linearGradient>
                        <linearGradient id="indigenceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey={`Pobreza ${populationType === 'persons' ? 'Personas' : 'Hogares'}`}
                        stroke="#ef4444"
                        fill="url(#povertyGradient)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey={`Indigencia ${populationType === 'persons' ? 'Personas' : 'Hogares'}`}
                        stroke="#f97316"
                        fill="url(#indigenceGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Período</th>
                        <th className="text-right p-2">Pobreza Personas</th>
                        <th className="text-right p-2">Pobreza Hogares</th>
                        <th className="text-right p-2">Indigencia Personas</th>
                        <th className="text-right p-2">Indigencia Hogares</th>
                      </tr>
                    </thead>
                    <tbody>
                      {initialData.historical.slice(-10).reverse().map((point) => (
                        <tr key={point.date} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="p-2">{point.period}</td>
                          <td className="text-right p-2">{point.poverty.persons.toFixed(1)}%</td>
                          <td className="text-right p-2">{point.poverty.households.toFixed(1)}%</td>
                          <td className="text-right p-2">{point.indigence.persons.toFixed(1)}%</td>
                          <td className="text-right p-2">{point.indigence.households.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Comparación por regiones */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-purple-600" />
                <div>
                  <CardTitle>Comparación por regiones</CardTitle>
                  <CardDescription>
                    Datos del período {initialData.current.period}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Gráfico de barras */}
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="region" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Pobreza" fill="#ef4444" />
                    <Bar dataKey="Indigencia" fill="#f97316" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla de regiones */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-800">
                      <th className="text-left p-3">Región</th>
                      <th className="text-right p-3">Pobreza Personas</th>
                      <th className="text-right p-3">Pobreza Hogares</th>
                      <th className="text-right p-3">Indigencia Personas</th>
                      <th className="text-right p-3">Indigencia Hogares</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialData.regionalComparison.map((region, idx) => (
                      <tr 
                        key={region.regionCode} 
                        className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          region.region.includes('Total') ? 'bg-red-50 dark:bg-red-900/20 font-semibold' : ''
                        }`}
                      >
                        <td className="p-3 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            idx === 0 ? 'bg-red-600' : 
                            idx === initialData.regionalComparison.length - 1 ? 'bg-green-600' : 
                            'bg-gray-400'
                          }`} />
                          {region.region}
                          <Badge variant="outline" className="text-xs">
                            #{region.poverty.ranking}
                          </Badge>
                        </td>
                        <td className="text-right p-3">{region.poverty.persons.toFixed(1)}%</td>
                        <td className="text-right p-3">{region.poverty.households.toFixed(1)}%</td>
                        <td className="text-right p-3">{region.indigence.persons.toFixed(1)}%</td>
                        <td className="text-right p-3">{region.indigence.households.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Mayor índice</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600" />
                    <span>Menor índice</span>
                  </div>
                  <span>• Datos ordenados por: Pobreza Personas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información sobre la medición */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
                <CardTitle className="text-red-900 dark:text-red-100">
                  ¿Qué es la Pobreza?
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Definición</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Se considera pobre a una persona cuando el ingreso del hogar donde reside no 
                  alcanza para adquirir la Canasta Básica Total (CBT), que incluye alimentos y 
                  servicios básicos.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Canasta Básica Total (CBT)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Incluye la Canasta Básica Alimentaria más bienes y servicios no alimentarios 
                  como vestimenta, transporte, educación, salud, vivienda, etc.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  ¿Qué es la Indigencia?
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Definición</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Se considera indigente a una persona cuando el ingreso del hogar no alcanza 
                  para adquirir la Canasta Básica Alimentaria (CBA), que cubre las necesidades 
                  nutricionales mínimas.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Canasta Básica Alimentaria (CBA)</h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Conjunto de alimentos, expresado en cantidades suficientes para satisfacer las 
                  necesidades de calorías de un hombre adulto durante un mes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guía del Dashboard */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <CardTitle>Guía del Dashboard</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Gráficos Interactivos
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visualiza la evolución histórica de pobreza e indigencia desde 2016. 
                    Filtra por región, período y tipo de indicador (personas vs hogares) 
                    para análisis específicos.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Indicadores en Tiempo Real
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visualiza los últimos datos disponibles con información de tendencias y 
                    cambios respecto al período anterior, actualizado semestralmente.
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Comparación Regional
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Compara los indicadores entre los 31 aglomerados urbanos más 
                    importantes de Argentina y identifica patrones y diferencias regionales.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Datos Oficiales INDEC
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Toda la información proviene directamente del Instituto Nacional de 
                    Estadística y Censos, garantizando confiabilidad y precisión en cada análisis.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}