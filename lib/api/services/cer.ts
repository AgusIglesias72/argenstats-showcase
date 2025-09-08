// /lib/api/services/cer.ts
import { prisma } from '@/lib/db/prisma'
import { 
  CER_VARIABLE_ID, 
  CERError, 
  CERDataPoint,
  CERCalculation,
  CERViewResponse,
  CERHistoricalResponse,
  CERCalculatorResponse
} from '@/lib/api/constants/cer'

export { CERError } from '@/lib/api/constants/cer'

export async function getCurrentCER(): Promise<CERViewResponse> {
  // Obtener el valor más reciente
  const currentData = await prisma.bcraData.findFirst({
    where: { variableId: CER_VARIABLE_ID },
    orderBy: { date: 'desc' },
    include: {
      variable: true
    }
  })

  if (!currentData) {
    throw new CERError('NO_DATA', 'No hay datos disponibles del CER')
  }

  // Obtener variaciones
  const variations = await calculateVariations(currentData.date, currentData.value)

  return {
    date: currentData.date,
    value: currentData.value,
    variations,
    metadata: {
      lastUpdate: currentData.variable.updatedAt,
      source: 'BCRA'
    }
  }
}

export async function getHistoricalCER(params: {
  from: string
  to: string
  limit?: number
  aggregation?: 'daily' | 'monthly' | 'yearly'
}): Promise<CERHistoricalResponse> {
  const fromDate = new Date(params.from)
  const toDate = new Date(params.to)

  // Validar fechas
  if (fromDate >= toDate) {
    throw new CERError('INVALID_DATE_RANGE', 'La fecha desde debe ser anterior a la fecha hasta')
  }

  // Obtener datos históricos
  const historicalData = await prisma.bcraData.findMany({
    where: {
      variableId: CER_VARIABLE_ID,
      date: {
        gte: fromDate,
        lte: toDate
      }
    },
    orderBy: { date: 'asc' },
    take: params.limit
  })

  if (historicalData.length === 0) {
    throw new CERError('NO_DATA', 'No hay datos disponibles para el período solicitado')
  }

  // Procesar datos según agregación
  const processedData = params.aggregation 
    ? await aggregateData(historicalData, params.aggregation)
    : historicalData

  // Calcular variaciones para cada punto
  const series: CERDataPoint[] = []
  for (let i = 0; i < processedData.length; i++) {
    const point = processedData[i]
    const dailyVariation = i > 0 
      ? ((point.value / processedData[i-1].value - 1) * 100)
      : undefined

    series.push({
      date: point.date,
      value: point.value,
      dailyVariation
    })
  }

  const firstPoint = processedData[0]
  const lastPoint = processedData[processedData.length - 1]

  return {
    series,
    summary: {
      startDate: firstPoint.date,
      endDate: lastPoint.date,
      startValue: firstPoint.value,
      endValue: lastPoint.value,
      totalVariation: ((lastPoint.value / firstPoint.value - 1) * 100),
      averageDailyVariation: calculateAverageDailyVariation(firstPoint, lastPoint),
      dataPoints: processedData.length
    }
  }
}

export async function calculateCER(params: {
  amount: number
  from: string
  to: string
}): Promise<CERCalculatorResponse> {
  const fromDate = new Date(params.from)
  const toDate = new Date(params.to)

  // Validar monto
  if (params.amount <= 0) {
    throw new CERError('INVALID_AMOUNT', 'El monto debe ser mayor a 0')
  }

  // Obtener valores CER para ambas fechas
  const [fromCER, toCER] = await Promise.all([
    getCERForDate(fromDate),
    getCERForDate(toDate)
  ])

  if (!fromCER || !toCER) {
    throw new CERError('NO_DATA', 'No hay datos del CER disponibles para las fechas seleccionadas')
  }

  // Calcular ajuste
  const adjustedAmount = params.amount * (toCER.value / fromCER.value)
  const inflationRate = ((toCER.value / fromCER.value - 1) * 100)
  const periodInDays = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

  const calculation: CERCalculation = {
    amount: params.amount,
    fromDate,
    toDate,
    fromCER: fromCER.value,
    toCER: toCER.value,
    adjustedAmount,
    inflationRate,
    periodInDays,
    annualizedRate: periodInDays > 0 ? annualizeRate(inflationRate, periodInDays) : undefined
  }

  // Análisis adicional
  const purchasingPowerLoss = ((1 - (fromCER.value / toCER.value)) * 100)
  const equivalentTodayValue = params.amount / (toCER.value / fromCER.value)

  return {
    calculation,
    analysis: {
      realReturn: adjustedAmount - params.amount,
      purchasingPowerLoss,
      equivalentTodayValue
    }
  }
}

export async function compareCERWithIndicators(params: {
  from: string
  to: string
}): Promise<any> {
  const fromDate = new Date(params.from)
  const toDate = new Date(params.to)

  // Obtener CER
  const [fromCER, toCER] = await Promise.all([
    getCERForDate(fromDate),
    getCERForDate(toDate)
  ])

  if (!fromCER || !toCER) {
    throw new CERError('NO_DATA', 'No hay datos del CER para el período')
  }

  const cerVariation = ((toCER.value / fromCER.value - 1) * 100)

  // Aquí podrías obtener otros indicadores para comparar
  // Por ejemplo, IPC, dólar, etc.

  return {
    period: {
      from: fromDate,
      to: toDate,
      days: Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
    },
    cer: {
      variation: cerVariation,
      fromValue: fromCER.value,
      toValue: toCER.value
    },
    // Agregar otros indicadores cuando estén disponibles
    comparison: {
      message: 'Comparación con otros indicadores próximamente'
    }
  }
}

// Funciones auxiliares privadas
async function calculateVariations(date: Date, currentValue: number) {
  // Calcular fecha de hace 1 día, 1 mes y 1 año
  const oneDayAgo = new Date(date)
  oneDayAgo.setDate(date.getDate() - 1)
  
  const oneMonthAgo = new Date(date)
  oneMonthAgo.setMonth(date.getMonth() - 1)
  
  const oneYearAgo = new Date(date)
  oneYearAgo.setFullYear(date.getFullYear() - 1)

  // Obtener valores históricos
  const [dayAgo, monthAgo, yearAgo, baseValue] = await Promise.all([
    getCERForDate(oneDayAgo),
    getCERForDate(oneMonthAgo),
    getCERForDate(oneYearAgo),
    getCERForDate(new Date('2002-02-02')) // Base del CER
  ])

  return {
    daily: dayAgo ? ((currentValue / dayAgo.value - 1) * 100) : undefined,
    monthly: monthAgo ? ((currentValue / monthAgo.value - 1) * 100) : undefined,
    yearly: yearAgo ? ((currentValue / yearAgo.value - 1) * 100) : undefined,
    accumulated: baseValue ? ((currentValue / baseValue.value - 1) * 100) : undefined
  }
}

async function getCERForDate(date: Date) {
  // Buscar el valor exacto o el más cercano anterior
  return await prisma.bcraData.findFirst({
    where: {
      variableId: CER_VARIABLE_ID,
      date: {
        lte: date
      }
    },
    orderBy: { date: 'desc' }
  })
}

async function aggregateData(data: any[], aggregation: 'daily' | 'monthly' | 'yearly') {
  // Por ahora retornamos los datos sin agregar
  // Podrías implementar la lógica de agregación según necesites
  return data
}

function calculateAverageDailyVariation(firstPoint: any, lastPoint: any): number {
  const days = Math.floor((lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 0
  
  const totalVariation = (lastPoint.value / firstPoint.value) - 1
  return (Math.pow(1 + totalVariation, 1 / days) - 1) * 100
}

function annualizeRate(rate: number, days: number): number {
  if (days === 0) return 0
  const dailyRate = rate / 100 / days
  return (Math.pow(1 + dailyRate, 365) - 1) * 100
}