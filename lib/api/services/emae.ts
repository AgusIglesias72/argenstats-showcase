// /lib/api/services/emae.ts
import { prisma } from '@/lib/db/prisma'
import { EMAE_SECTORS } from '@/lib/api/constants/emae'

export class EmaeServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'EmaeServiceError'
  }
}

// Interfaces
interface GetCurrentEmaeParams {
  sectorCode?: string
  adjusted?: boolean
}

interface GetHistoricalEmaeParams {
  from: string
  to: string
  sectorCode?: string
  adjusted?: boolean
  interval?: string
}

interface GetEmaeBySectorsParams {
  date?: string | null
  includeVariations?: boolean
}

interface CompareSectorsParams {
  sectors: string[]
  from: string
  to: string
  metric?: 'original' | 'adjusted' | 'variations'
}

interface EmaeRecord {
  [x: string]: any
  date: Date
  sectorCode: string
  sectorName: string
  originalValue: number
  seasonallyAdjustedValue: number | null
  cycleTrendValue: number | null
  monthlyVariation: number | null
  yearlyVariation: number | null
  cycleTrendVariation: number | null
}

// Obtener EMAE actual
export async function getCurrentEmae({ 
  sectorCode = 'GENERAL', 
  adjusted = false 
}: GetCurrentEmaeParams) {
  const latest = await prisma.emae.findFirst({
    where: {
      sectorCode: sectorCode
    },
    orderBy: {
      date: 'desc'
    }
  })

  if (!latest) {
    throw new EmaeServiceError(
      'NO_DATA',
      `No EMAE data found for sector: ${sectorCode}`
    )
  }

  // Obtener el valor del mes anterior para calcular variación
  const previousMonth = new Date(latest.date)
  previousMonth.setMonth(previousMonth.getMonth() - 1)
  
  const previousData = await prisma.emae.findFirst({
    where: {
      sectorCode: sectorCode,
      date: previousMonth
    }
  })

  return formatCurrentEmae(latest, previousData, adjusted)
}

// Obtener serie histórica
export async function getHistoricalEmae({ 
  from, 
  to, 
  sectorCode = 'GENERAL',
  adjusted = false,
  interval = 'monthly'
}: GetHistoricalEmaeParams) {
  const startDate = new Date(from)
  const endDate = new Date(to)
  
  if (startDate >= endDate) {
    throw new EmaeServiceError(
      'INVALID_DATE_RANGE',
      'Start date must be before end date'
    )
  }

  const data = await prisma.emae.findMany({
    where: {
      sectorCode: sectorCode,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: {
      date: 'asc'
    }
  })

  if (data.length === 0) {
    throw new EmaeServiceError(
      'NO_DATA',
      'No data found for the specified date range'
    )
  }

  // Agrupar según intervalo
  if (interval === 'monthly') {
    return data.map(record => formatEmaeRecord(record, adjusted))
  }
  
  if (interval !== 'quarterly' && interval !== 'yearly') {
    throw new EmaeServiceError(
      'INVALID_INTERVAL',
      'Invalid interval. Use: monthly, quarterly, or yearly'
    )
  }
  
  return aggregateEmaeData(data, interval as 'quarterly' | 'yearly', adjusted)
}

// Obtener EMAE por sectores
export async function getEmaeBySectors({ 
  date, 
  includeVariations = true 
}: GetEmaeBySectorsParams) {
  const targetDate = date && date !== 'latest' 
    ? new Date(date) 
    : await getLatestEmaeDate()

  const sectors = await prisma.emae.findMany({
    where: {
      date: targetDate
    },
    orderBy: [
      { sectorCode: 'asc' }
    ]
  })

  if (sectors.length === 0) {
    throw new EmaeServiceError(
      'NO_DATA',
      'No sector data found for the specified date'
    )
  }

  // Agrupar por tipo de sector
  const generalSector = sectors.find(s => s.sectorCode === 'GENERAL')
  const productiveSectors = sectors.filter(s => 
    !['GENERAL', 'P'].includes(s.sectorCode)
  ).sort((a, b) => (b.yearlyVariation || 0) - (a.yearlyVariation || 0))

  const taxSector = sectors.find(s => s.sectorCode === 'P')

  return {
    date: targetDate,
    general: generalSector ? formatSectorData(generalSector, includeVariations) : null,
    sectors: {
      productive: productiveSectors.map(s => formatSectorData(s, includeVariations)),
      taxes: taxSector ? formatSectorData(taxSector, includeVariations) : null
    },
    summary: {
      totalSectors: sectors.length,
      positiveSectors: productiveSectors.filter(s => (s.yearlyVariation || 0) > 0).length,
      negativeSectors: productiveSectors.filter(s => (s.yearlyVariation || 0) < 0).length,
      bestPerformer: productiveSectors[0] ? {
        code: productiveSectors[0].sectorCode,
        name: productiveSectors[0].sectorName,
        variation: productiveSectors[0].yearlyVariation
      } : null,
      worstPerformer: productiveSectors[productiveSectors.length - 1] ? {
        code: productiveSectors[productiveSectors.length - 1].sectorCode,
        name: productiveSectors[productiveSectors.length - 1].sectorName,
        variation: productiveSectors[productiveSectors.length - 1].yearlyVariation
      } : null
    }
  }
}

// Comparar sectores
export async function compareSectors({ 
  sectors, 
  from, 
  to,
  metric = 'original'
}: CompareSectorsParams) {
  const startDate = new Date(from)
  const endDate = new Date(to)
  
  if (startDate >= endDate) {
    throw new EmaeServiceError(
      'INVALID_DATE_RANGE',
      'Start date must be before end date'
    )
  }

  if (sectors.length === 0 || sectors.length > 10) {
    throw new EmaeServiceError(
      'INVALID_SECTORS',
      'Please provide between 1 and 10 sectors to compare'
    )
  }

  // Validar que los sectores existan
  const validSectors = Object.keys(EMAE_SECTORS)
  const invalidSectors = sectors.filter(s => !validSectors.includes(s))
  
  if (invalidSectors.length > 0) {
    throw new EmaeServiceError(
      'INVALID_SECTORS',
      `Invalid sector codes: ${invalidSectors.join(', ')}`,
      { validSectors }
    )
  }

  const data = await prisma.emae.findMany({
    where: {
      sectorCode: { in: sectors },
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: [
      { date: 'asc' },
      { sectorCode: 'asc' }
    ]
  })

  if (data.length === 0) {
    throw new EmaeServiceError(
      'NO_DATA',
      'No data found for the specified sectors and date range'
    )
  }

  return formatComparison(data, sectors, metric)
}

// Funciones auxiliares
async function getLatestEmaeDate(): Promise<Date> {
  const latest = await prisma.emae.findFirst({
    where: { sectorCode: 'GENERAL' },
    orderBy: { date: 'desc' },
    select: { date: true }
  })
  
  if (!latest) {
    throw new EmaeServiceError('NO_DATA', 'No EMAE data available')
  }
  
  return latest.date
}

function formatCurrentEmae(
  current: EmaeRecord, 
  previous: EmaeRecord | null,
  adjusted: boolean
) {
  const baseValue = adjusted && current.seasonallyAdjustedValue 
    ? current.seasonallyAdjustedValue 
    : current.originalValue

  const previousValue = previous ? (
    adjusted && previous.seasonallyAdjustedValue 
      ? previous.seasonallyAdjustedValue 
      : previous.originalValue
  ) : null

  const calculatedMonthlyVariation = previousValue 
    ? ((baseValue - previousValue) / previousValue) * 100 
    : null

  return {
    date: current.date,
    sector: {
      code: current.sectorCode,
      name: current.sectorName
    },
    value: baseValue,
    originalValue: current.originalValue,
    seasonallyAdjusted: adjusted ? current.seasonallyAdjustedValue : undefined,
    cycleTrend: current.cycleTrendValue,
    variations: {
      monthly: current.monthlyVariation || calculatedMonthlyVariation,
      yearly: current.yearlyVariation,
      cycleTrend: current.cycleTrendVariation
    },
    metadata: {
      lastUpdate: current.updatedAt,
      isSeasonallyAdjusted: adjusted
    }
  }
}

function formatEmaeRecord(record: EmaeRecord, adjusted: boolean) {
  const value = adjusted && record.seasonallyAdjustedValue 
    ? record.seasonallyAdjustedValue 
    : record.originalValue

  return {
    date: record.date,
    value: value,
    originalValue: record.originalValue,
    seasonallyAdjusted: adjusted ? record.seasonallyAdjustedValue : undefined,
    variations: {
      monthly: record.monthlyVariation,
      yearly: record.yearlyVariation
    }
  }
}

function formatSectorData(sector: EmaeRecord, includeVariations: boolean) {
  const base = {
    code: sector.sectorCode,
    name: sector.sectorName,
    value: sector.originalValue,
    index: sector.originalValue
  }

  if (!includeVariations) {
    return base
  }

  return {
    ...base,
    variations: {
      monthly: sector.monthlyVariation,
      yearly: sector.yearlyVariation
    },
    seasonallyAdjusted: sector.seasonallyAdjustedValue
  }
}

function aggregateEmaeData(
  data: EmaeRecord[], 
  interval: 'quarterly' | 'yearly',
  adjusted: boolean
) {
  const grouped = new Map<string, EmaeRecord[]>()
  
  data.forEach(record => {
    const date = new Date(record.date)
    let key: string
    
    if (interval === 'quarterly') {
      const quarter = Math.floor(date.getMonth() / 3) + 1
      key = `${date.getFullYear()}-Q${quarter}`
    } else {
      key = date.getFullYear().toString()
    }
    
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(record)
  })
  
  const result = []
  
  for (const [period, records] of grouped) {
    const values = records.map(r => 
      adjusted && r.seasonallyAdjustedValue ? r.seasonallyAdjustedValue : r.originalValue
    )
    
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
    const lastRecord = records[records.length - 1]
    
    result.push({
      period,
      startDate: records[0].date,
      endDate: lastRecord.date,
      value: parseFloat(avgValue.toFixed(2)),
      originalValue: parseFloat((records.reduce((sum, r) => sum + r.originalValue, 0) / records.length).toFixed(2)),
      variations: {
        yearly: lastRecord.yearlyVariation
      },
      dataPoints: records.length
    })
  }
  
  return result
}

function formatComparison(
  data: EmaeRecord[], 
  sectors: string[],
  metric: 'original' | 'adjusted' | 'variations'
) {
  // Agrupar por fecha
  const byDate = new Map<string, EmaeRecord[]>()
  
  data.forEach(record => {
    const dateKey = record.date.toISOString().split('T')[0]
    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, [])
    }
    byDate.get(dateKey)!.push(record)
  })
  
  const series = sectors.map(sectorCode => {
    const sectorData = data.filter(d => d.sectorCode === sectorCode)
    const sectorInfo = sectorData[0]
    
    return {
      sector: {
        code: sectorCode,
        name: sectorInfo?.sectorName || EMAE_SECTORS[sectorCode as keyof typeof EMAE_SECTORS] || sectorCode
      },
      data: sectorData.map(record => {
        if (metric === 'variations') {
          return {
            date: record.date,
            monthly: record.monthlyVariation,
            yearly: record.yearlyVariation
          }
        }
        
        const value = metric === 'adjusted' && record.seasonallyAdjustedValue
          ? record.seasonallyAdjustedValue
          : record.originalValue
          
        return {
          date: record.date,
          value: value
        }
      })
    }
  })
  
  // Calcular estadísticas
  const stats = series.map(s => {
    const values = s.data.map(d => 
      metric === 'variations' ? d.yearly || 0 : d.value
    ).filter(v => v !== null && v !== undefined) as number[]
    
    return {
      sector: s.sector,
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((sum, v) => sum + v, 0) / values.length,
      lastValue: values[values.length - 1]
    }
  })
  
  return {
    period: {
      from: data[0].date,
      to: data[data.length - 1].date
    },
    metric,
    series,
    statistics: stats.sort((a, b) => b.lastValue - a.lastValue)
  }
}