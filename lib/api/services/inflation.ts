// /lib/api/services/inflation.ts
import { prisma } from '@/lib/db/prisma'

export class InflationServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'InflationServiceError'
  }
}

// Interfaces para los parámetros
interface GetCurrentInflationParams {
  component?: string
  region?: string
}

interface GetHistoricalInflationParams {
  from: string
  to: string
  component?: string
  region?: string
  interval?: string
}

interface GetInflationComponentsParams {
  date?: string | null
  region?: string
}

interface GetRegionalInflationParams {
  date?: string | null
  component?: string
}

interface CalculateInflationParams {
  amount: number
  from: string
  to: string
}

export async function getCurrentInflation({ 
  component = 'GENERAL', 
  region = 'Nacional' 
}: GetCurrentInflationParams) {
  const latest = await prisma.ipc.findFirst({
    where: {
      componentCode: component,
      region: region
    },
    orderBy: {
      date: 'desc'
    }
  })

  if (!latest) {
    throw new InflationServiceError(
      'NO_DATA',
      `No inflation data found for component: ${component}, region: ${region}`
    )
  }

  return {
    date: latest.date,
    component: {
      code: latest.componentCode,
      name: latest.component,
      type: latest.componentType
    },
    region: latest.region,
    values: {
      monthly: latest.monthlyPctChange,
      yearly: latest.yearlyPctChange,
      accumulated: latest.accumulatedPctChange
    },
    index: latest.indexValue,
    lastUpdate: latest.updatedAt
  }
}

export async function getHistoricalInflation({ 
  from, 
  to, 
  component = 'GENERAL', 
  region = 'Nacional',
  interval = 'monthly'
}: GetHistoricalInflationParams) {
  const startDate = new Date(from)
  const endDate = new Date(to)
  
  if (startDate >= endDate) {
    throw new InflationServiceError(
      'INVALID_DATE_RANGE',
      'Start date must be before end date'
    )
  }

  const data = await prisma.ipc.findMany({
    where: {
      componentCode: component,
      region: region,
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
    throw new InflationServiceError(
      'NO_DATA',
      'No data found for the specified date range'
    )
  }

  // Agrupar según intervalo si es necesario
  if (interval === 'monthly') {
    return data.map(formatInflationRecord)
  }
  
  // Validar que el intervalo sea válido
  if (interval !== 'quarterly' && interval !== 'yearly') {
    throw new InflationServiceError(
      'INVALID_INTERVAL',
      'Invalid interval. Use: monthly, quarterly, or yearly'
    )
  }
  
  // Para quarterly y yearly, agrupar y promediar
  return aggregateInflationData(data, interval as 'quarterly' | 'yearly')
}

export async function getInflationComponents({ 
  date, 
  region = 'Nacional' 
}: GetInflationComponentsParams) {
  const targetDate = date && date !== 'latest' 
    ? new Date(date) 
    : await getLatestDateForRegion(region)

  const components = await prisma.ipc.findMany({
    where: {
      region: region,
      date: targetDate,
      componentType: { in: ['DIVISION', 'CLASE'] }
    },
    orderBy: [
      { componentType: 'asc' },
      { monthlyPctChange: 'desc' }
    ]
  })

  if (components.length === 0) {
    throw new InflationServiceError(
      'NO_DATA',
      'No component data found for the specified date'
    )
  }

  // Agrupar por tipo de componente
  const grouped = components.reduce((acc, comp) => {
    if (!acc[comp.componentType]) {
      acc[comp.componentType] = []
    }
    acc[comp.componentType].push({
      code: comp.componentCode,
      name: comp.component,
      monthly: comp.monthlyPctChange,
      yearly: comp.yearlyPctChange
      // Removido weight ya que no existe en el modelo
    })
    return acc
  }, {} as Record<string, any[]>)

  return {
    date: targetDate,
    region,
    components: grouped,
    summary: {
      totalComponents: components.length,
      highestIncrease: components[0] ? {
        name: components[0].component,
        monthly: components[0].monthlyPctChange,
        yearly: components[0].yearlyPctChange
      } : null,
      lowestIncrease: components[components.length - 1] ? {
        name: components[components.length - 1].component,
        monthly: components[components.length - 1].monthlyPctChange,
        yearly: components[components.length - 1].yearlyPctChange
      } : null
    }
  }
}

export async function getRegionalInflation({ 
  date, 
  component = 'GENERAL' 
}: GetRegionalInflationParams) {
  const targetDate = date && date !== 'latest'
    ? new Date(date)
    : await getLatestDate()

  const regions = await prisma.ipc.findMany({
    where: {
      componentCode: component,
      date: targetDate
    },
    orderBy: {
      region: 'asc'
    }
  })

  if (regions.length === 0) {
    throw new InflationServiceError(
      'NO_DATA', 
      'No regional data found'
    )
  }

  // Calcular promedios y estadísticas
  const monthlyValues = regions
    .map(r => r.monthlyPctChange)
    .filter((v): v is number => v !== null && v > 0)
  
  const yearlyValues = regions
    .map(r => r.yearlyPctChange)
    .filter((v): v is number => v !== null && v > 0)

  return {
    date: targetDate,
    component: {
      code: component,
      name: regions[0].component
    },
    regions: regions.map(reg => ({
      name: reg.region,
      monthly: reg.monthlyPctChange,
      yearly: reg.yearlyPctChange,
      accumulated: reg.accumulatedPctChange
    })),
    statistics: {
      monthly: monthlyValues.length > 0 ? {
        average: monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length,
        min: Math.min(...monthlyValues),
        max: Math.max(...monthlyValues)
      } : null,
      yearly: yearlyValues.length > 0 ? {
        average: yearlyValues.reduce((a, b) => a + b, 0) / yearlyValues.length,
        min: Math.min(...yearlyValues),
        max: Math.max(...yearlyValues)
      } : null
    }
  }
}

export async function calculateInflation({ 
  amount, 
  from, 
  to 
}: CalculateInflationParams) {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  
  if (fromDate >= toDate) {
    throw new InflationServiceError(
      'INVALID_DATE_RANGE',
      'Start date must be before end date'
    )
  }

  // Obtener los índices más cercanos a las fechas
  const [fromData, toData] = await Promise.all([
    prisma.ipc.findFirst({
      where: {
        componentCode: 'GENERAL',
        region: 'Nacional',
        date: {
          gte: new Date(fromDate.getFullYear(), fromDate.getMonth(), 1),
          lte: new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0)
        }
      },
      orderBy: { date: 'desc' }
    }),
    prisma.ipc.findFirst({
      where: {
        componentCode: 'GENERAL',
        region: 'Nacional',
        date: {
          gte: new Date(toDate.getFullYear(), toDate.getMonth(), 1),
          lte: new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0)
        }
      },
      orderBy: { date: 'desc' }
    })
  ])

  if (!fromData || !toData) {
    throw new InflationServiceError(
      'INSUFFICIENT_DATA',
      'No data available for one or both dates'
    )
  }

  const inflationRate = ((toData.indexValue - fromData.indexValue) / fromData.indexValue) * 100
  const adjustedAmount = amount * (toData.indexValue / fromData.indexValue)
  const purchasingPowerLoss = ((adjustedAmount - amount) / amount) * 100

  // Calcular meses entre fechas
  const monthsDiff = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  
  // Tasa anualizada
  const annualizedRate = monthsDiff > 0 
    ? (Math.pow(toData.indexValue / fromData.indexValue, 12 / monthsDiff) - 1) * 100
    : 0

  return {
    calculation: {
      originalAmount: amount,
      adjustedAmount: parseFloat(adjustedAmount.toFixed(2)),
      difference: parseFloat((adjustedAmount - amount).toFixed(2)),
      inflationRate: parseFloat(inflationRate.toFixed(2)),
      purchasingPowerLoss: parseFloat(purchasingPowerLoss.toFixed(2))
    },
    period: {
      from: {
        date: fromData.date,
        index: fromData.indexValue
      },
      to: {
        date: toData.date,
        index: toData.indexValue
      },
      months: monthsDiff,
      days: Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    },
    annualizedRate: parseFloat(annualizedRate.toFixed(2)),
    interpretation: getInflationInterpretation(inflationRate, annualizedRate, monthsDiff)
  }
}

// Funciones auxiliares
async function getLatestDate(): Promise<Date> {
  const latest = await prisma.ipc.findFirst({
    where: { componentCode: 'GENERAL', region: 'Nacional' },
    orderBy: { date: 'desc' },
    select: { date: true }
  })
  
  if (!latest) {
    throw new InflationServiceError('NO_DATA', 'No inflation data available')
  }
  
  return latest.date
}

async function getLatestDateForRegion(region: string): Promise<Date> {
  const latest = await prisma.ipc.findFirst({
    where: { region },
    orderBy: { date: 'desc' },
    select: { date: true }
  })
  
  if (!latest) {
    throw new InflationServiceError('NO_DATA', `No data available for region: ${region}`)
  }
  
  return latest.date
}

// Definir tipo para el record
interface InflationRecord {
  date: Date
  monthlyPctChange: number | null
  yearlyPctChange: number | null
  accumulatedPctChange: number | null
  indexValue: number
}

function formatInflationRecord(record: InflationRecord) {
  return {
    date: record.date,
    values: {
      monthly: record.monthlyPctChange,
      yearly: record.yearlyPctChange,
      accumulated: record.accumulatedPctChange
    },
    index: record.indexValue
  }
}

function aggregateInflationData(data: InflationRecord[], interval: 'quarterly' | 'yearly') {
  const grouped = new Map<string, InflationRecord[]>()
  
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
    const lastRecord = records[records.length - 1]
    const firstRecord = records[0]
    
    // Calcular la inflación del período
    const periodInflation = ((lastRecord.indexValue - firstRecord.indexValue) / firstRecord.indexValue) * 100
    
    // Calcular promedio mensual de variaciones
    const monthlyChanges = records
      .map(r => r.monthlyPctChange)
      .filter((v): v is number => v !== null)
    
    const averageMonthly = monthlyChanges.length > 0
      ? monthlyChanges.reduce((sum, val) => sum + val, 0) / monthlyChanges.length
      : 0

    result.push({
      period,
      startDate: firstRecord.date,
      endDate: lastRecord.date,
      values: {
        periodChange: parseFloat(periodInflation.toFixed(2)),
        averageMonthly: parseFloat(averageMonthly.toFixed(2)),
        finalYearly: lastRecord.yearlyPctChange
      },
      startIndex: firstRecord.indexValue,
      finalIndex: lastRecord.indexValue,
      dataPoints: records.length
    })
  }
  
  return result
}

function getInflationInterpretation(rate: number, annualizedRate: number, months: number): string {
  if (months <= 1) {
    return 'Período muy corto para una interpretación significativa'
  }
  
  if (annualizedRate < 10) {
    return 'Inflación baja'
  } else if (annualizedRate < 25) {
    return 'Inflación moderada'
  } else if (annualizedRate < 50) {
    return 'Inflación alta'
  } else if (annualizedRate < 100) {
    return 'Inflación muy alta'
  } else {
    return 'Hiperinflación'
  }
}