// /lib/api/services/country-risk.ts
import { prisma } from '@/lib/db/prisma'

// Clase de error personalizada
export class CountryRiskError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CountryRiskError'
  }
}

// Interfaces
interface CountryRiskCurrent {
  date: Date
  official: {
    value: number | null
    source: string
    lastUpdate: Date | null
  }
  estimated: {
    value: number | null
    source: string
    lastUpdate: Date | null
  }
  spread: number | null
  spreadPercentage: number | null
}

interface CountryRiskDataPoint {
  date: Date
  official: number | null
  estimated: number | null
  spread: number | null
}

interface CountryRiskHistorical {
  series: CountryRiskDataPoint[]
  summary: {
    count: number
    avgOfficial: number | null
    avgEstimated: number | null
    minOfficial: number | null
    maxOfficial: number | null
    minEstimated: number | null
    maxEstimated: number | null
    volatility: number | null
  }
}

interface CountryRiskComparison {
  period: {
    from: Date
    to: Date
    days: number
  }
  official: {
    avg: number
    min: number
    max: number
    stdDev: number
    lastValue: number | null
  }
  estimated: {
    avg: number
    min: number
    max: number
    stdDev: number
    lastValue: number | null
  }
  accuracy: {
    avgDifference: number
    maxDifference: number
    correlation: number
    rmse: number
  }
}

interface CountryRiskStatistics {
  current: number | null
  average: number
  median: number
  min: {
    value: number
    date: Date
  }
  max: {
    value: number
    date: Date
  }
  standardDeviation: number
  percentiles: {
    p25: number
    p50: number
    p75: number
    p90: number
  }
  trend: 'increasing' | 'decreasing' | 'stable'
  volatility: 'low' | 'moderate' | 'high' | 'extreme'
}

// Obtener riesgo país actual
export async function getCurrentCountryRisk(): Promise<CountryRiskCurrent> {
  const currentData = await prisma.countryRisk.findFirst({
    orderBy: { date: 'desc' }
  })

  if (!currentData) {
    throw new CountryRiskError('NO_DATA', 'No country risk data available')
  }

  const spread = (currentData.embiOfficial && currentData.embiEstimated) 
    ? currentData.embiEstimated - currentData.embiOfficial 
    : null

  const spreadPercentage = (currentData.embiOfficial && spread !== null) 
    ? (spread / currentData.embiOfficial) * 100 
    : null

  return {
    date: currentData.date,
    official: {
      value: currentData.embiOfficial,
      source: currentData.sourceOfficial || 'JP Morgan',
      lastUpdate: currentData.date
    },
    estimated: {
      value: currentData.embiEstimated,
      source: currentData.sourceEstimated || 'ArgenStats Estimator',
      lastUpdate: currentData.lastUpdate
    },
    spread,
    spreadPercentage
  }
}

// Obtener datos históricos
export async function getHistoricalCountryRisk(params: {
  from: string
  to: string
  source: string
  interval: string
}): Promise<CountryRiskHistorical> {
  const fromDate = new Date(params.from)
  const toDate = new Date(params.to)

  const historicalData = await prisma.countryRisk.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate
      }
    },
    orderBy: { date: 'asc' }
  })

  if (historicalData.length === 0) {
    throw new CountryRiskError('NO_DATA', 'No data available for the specified period')
  }

  // Filtrar por source si es necesario
  let series: CountryRiskDataPoint[] = historicalData.map(d => {
    const includeOfficial = params.source !== 'estimated'
    const includeEstimated = params.source !== 'official'
    
    // Solo calcular spread si incluimos ambas fuentes
    let spread = null
    if (includeOfficial && includeEstimated && d.embiOfficial && d.embiEstimated) {
      spread = d.embiEstimated - d.embiOfficial
    }
    
    return {
      date: d.date,
      official: includeOfficial ? d.embiOfficial : null,
      estimated: includeEstimated ? d.embiEstimated : null,
      spread: spread
    }
  })

  // Agregar por intervalo si es necesario
  if (params.interval === 'weekly') {
    series = aggregateByWeek(series)
  } else if (params.interval === 'monthly') {
    series = aggregateByMonth(series)
  }

  // Calcular resumen
  const officialValues = historicalData
    .filter(d => d.embiOfficial !== null)
    .map(d => d.embiOfficial!) as number[]
  
  const estimatedValues = historicalData
    .filter(d => d.embiEstimated !== null)
    .map(d => d.embiEstimated!) as number[]

  return {
    series,
    summary: {
      count: series.length,
      avgOfficial: officialValues.length > 0 ? average(officialValues) : null,
      avgEstimated: estimatedValues.length > 0 ? average(estimatedValues) : null,
      minOfficial: officialValues.length > 0 ? Math.min(...officialValues) : null,
      maxOfficial: officialValues.length > 0 ? Math.max(...officialValues) : null,
      minEstimated: estimatedValues.length > 0 ? Math.min(...estimatedValues) : null,
      maxEstimated: estimatedValues.length > 0 ? Math.max(...estimatedValues) : null,
      volatility: officialValues.length > 0 ? calculateVolatility(officialValues) : null
    }
  }
}

// Comparar oficial vs estimado
export async function compareOfficialVsEstimated(params: {
  from: string
  to: string
}): Promise<CountryRiskComparison> {
  const fromDate = new Date(params.from)
  const toDate = new Date(params.to)

  const data = await prisma.countryRisk.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate
      }
    },
    orderBy: { date: 'asc' }
  })

  if (data.length === 0) {
    throw new CountryRiskError('NO_DATA', 'No data available for comparison')
  }

  const officialValues = data
    .filter(d => d.embiOfficial !== null)
    .map(d => d.embiOfficial!) as number[]
  
  const estimatedValues = data
    .filter(d => d.embiEstimated !== null)
    .map(d => d.embiEstimated!) as number[]

  const differences = data
    .filter(d => d.embiOfficial !== null && d.embiEstimated !== null)
    .map(d => Math.abs(d.embiEstimated! - d.embiOfficial!))

  const lastData = data[data.length - 1]

  return {
    period: {
      from: fromDate,
      to: toDate,
      days: Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    },
    official: {
      avg: average(officialValues),
      min: Math.min(...officialValues),
      max: Math.max(...officialValues),
      stdDev: standardDeviation(officialValues),
      lastValue: lastData.embiOfficial
    },
    estimated: {
      avg: average(estimatedValues),
      min: Math.min(...estimatedValues),
      max: Math.max(...estimatedValues),
      stdDev: standardDeviation(estimatedValues),
      lastValue: lastData.embiEstimated
    },
    accuracy: {
      avgDifference: average(differences),
      maxDifference: Math.max(...differences),
      correlation: calculateCorrelation(officialValues, estimatedValues),
      rmse: calculateRMSE(officialValues, estimatedValues)
    }
  }
}

// Obtener estadísticas
export async function getCountryRiskStatistics(params: {
  from?: string
  to?: string
  source: string
}): Promise<CountryRiskStatistics> {
  // Si no se especifican fechas, usar últimos 365 días
  const toDate = params.to ? new Date(params.to) : new Date()
  const fromDate = params.from ? new Date(params.from) : new Date(toDate.getTime() - 365 * 24 * 60 * 60 * 1000)

  const data = await prisma.countryRisk.findMany({
    where: {
      date: {
        gte: fromDate,
        lte: toDate
      }
    },
    orderBy: { date: 'asc' }
  })

  if (data.length === 0) {
    throw new CountryRiskError('NO_DATA', 'No data available for statistics')
  }

  // Seleccionar valores según source
  const values = data.map(d => {
    if (params.source === 'official') return d.embiOfficial
    if (params.source === 'estimated') return d.embiEstimated
    // Si es 'all', preferir oficial cuando esté disponible
    return d.embiOfficial || d.embiEstimated
  }).filter(v => v !== null) as number[]

  if (values.length === 0) {
    throw new CountryRiskError('NO_DATA', 'No valid values for statistics')
  }

  const sortedValues = [...values].sort((a, b) => a - b)
  const currentValue = values[values.length - 1]
  
  // Encontrar fechas de min y max
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const minData = data.find(d => 
    (params.source === 'official' ? d.embiOfficial : d.embiEstimated) === minValue
  )
  const maxData = data.find(d => 
    (params.source === 'official' ? d.embiOfficial : d.embiEstimated) === maxValue
  )

  // Calcular tendencia
  const trend = calculateTrend(values)
  
  // Calcular volatilidad
  const volatility = calculateVolatilityLevel(values)

  return {
    current: currentValue,
    average: average(values),
    median: percentile(sortedValues, 50),
    min: {
      value: minValue,
      date: minData!.date
    },
    max: {
      value: maxValue,
      date: maxData!.date
    },
    standardDeviation: standardDeviation(values),
    percentiles: {
      p25: percentile(sortedValues, 25),
      p50: percentile(sortedValues, 50),
      p75: percentile(sortedValues, 75),
      p90: percentile(sortedValues, 90)
    },
    trend,
    volatility
  }
}

// Funciones auxiliares
function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function standardDeviation(values: number[]): number {
  const avg = average(values)
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(average(squaredDiffs))
}

function percentile(sortedValues: number[], p: number): number {
  const index = (p / 100) * (sortedValues.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  if (lower === upper) return sortedValues[lower]
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
}

function calculateVolatility(values: number[]): number {
  const returns = []
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i-1]) / values[i-1])
  }
  return standardDeviation(returns) * Math.sqrt(252) * 100 // Anualizado
}

function calculateVolatilityLevel(values: number[]): 'low' | 'moderate' | 'high' | 'extreme' {
  const vol = calculateVolatility(values)
  if (vol < 20) return 'low'
  if (vol < 40) return 'moderate'
  if (vol < 60) return 'high'
  return 'extreme'
}

function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable'
  
  // Comparar promedio de primera mitad vs segunda mitad
  const mid = Math.floor(values.length / 2)
  const firstHalf = average(values.slice(0, mid))
  const secondHalf = average(values.slice(mid))
  
  const change = ((secondHalf - firstHalf) / firstHalf) * 100
  
  if (change > 5) return 'increasing'
  if (change < -5) return 'decreasing'
  return 'stable'
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  const xMean = average(x.slice(0, n))
  const yMean = average(y.slice(0, n))
  
  let numerator = 0
  let xDenom = 0
  let yDenom = 0
  
  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean
    const yDiff = y[i] - yMean
    numerator += xDiff * yDiff
    xDenom += xDiff * xDiff
    yDenom += yDiff * yDiff
  }
  
  return numerator / Math.sqrt(xDenom * yDenom)
}

function calculateRMSE(actual: number[], predicted: number[]): number {
  const n = Math.min(actual.length, predicted.length)
  let sumSquaredErrors = 0
  
  for (let i = 0; i < n; i++) {
    sumSquaredErrors += Math.pow(actual[i] - predicted[i], 2)
  }
  
  return Math.sqrt(sumSquaredErrors / n)
}

function aggregateByWeek(data: CountryRiskDataPoint[]): CountryRiskDataPoint[] {
  if (data.length === 0) return []
  
  const weeks = new Map<string, CountryRiskDataPoint[]>()
  
  data.forEach(point => {
    const date = new Date(point.date)
    const year = date.getFullYear()
    const week = getWeekNumber(date)
    const key = `${year}-W${week.toString().padStart(2, '0')}`
    
    if (!weeks.has(key)) {
      weeks.set(key, [])
    }
    weeks.get(key)!.push(point)
  })
  
  return Array.from(weeks.entries()).map(([_, weekData]) => {
    const officialValues = weekData.filter(d => d.official !== null).map(d => d.official!)
    const estimatedValues = weekData.filter(d => d.estimated !== null).map(d => d.estimated!)
    
    const avgOfficial = officialValues.length > 0 ? average(officialValues) : null
    const avgEstimated = estimatedValues.length > 0 ? average(estimatedValues) : null
    
    return {
      date: weekData[weekData.length - 1].date, // Usar la última fecha de la semana
      official: avgOfficial,
      estimated: avgEstimated,
      spread: (avgOfficial && avgEstimated) ? avgEstimated - avgOfficial : null
    }
  })
}

function aggregateByMonth(data: CountryRiskDataPoint[]): CountryRiskDataPoint[] {
  if (data.length === 0) return []
  
  const months = new Map<string, CountryRiskDataPoint[]>()
  
  data.forEach(point => {
    const date = new Date(point.date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${month.toString().padStart(2, '0')}`
    
    if (!months.has(key)) {
      months.set(key, [])
    }
    months.get(key)!.push(point)
  })
  
  return Array.from(months.entries()).map(([key, monthData]) => {
    const officialValues = monthData.filter(d => d.official !== null).map(d => d.official!)
    const estimatedValues = monthData.filter(d => d.estimated !== null).map(d => d.estimated!)
    
    const avgOfficial = officialValues.length > 0 ? average(officialValues) : null
    const avgEstimated = estimatedValues.length > 0 ? average(estimatedValues) : null
    
    // Usar el último día del mes con datos
    const lastDate = monthData[monthData.length - 1].date
    
    return {
      date: lastDate,
      official: avgOfficial,
      estimated: avgEstimated,
      spread: (avgOfficial && avgEstimated) ? avgEstimated - avgOfficial : null
    }
  })
}

// Función auxiliar para obtener el número de semana
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}