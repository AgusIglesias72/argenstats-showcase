// /lib/api/services/dollar.ts
import { prisma } from '@/lib/db/prisma'
import { 
  DOLLAR_TYPES,
  DOLLAR_TYPE_LABELS,
  DOLLAR_TYPE_DESCRIPTIONS,
  type DollarType
} from '@/lib/api/constants/dollar'

// Clase de error personalizada
export class DollarError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DollarError'
  }
}

// Interfaces
interface DollarRate {
  dollarType: string
  buyPrice: number
  sellPrice: number
  date: string
  lastUpdate?: Date
  averagePrice: number
  spread: number
  spreadPercentage: string
}

interface DollarCurrentData {
  [key: string]: DollarRate
}

interface DollarHistoricalPoint {
  date: string
  [key: string]: any // Para múltiples tipos de dólar
}

interface DollarComparison {
  date: string
  types: {
    type: string
    label: string
    buyPrice: number
    sellPrice: number
    averagePrice: number
    spread: number
    spreadPercentage: string
  }[]
  analysis: {
    cheapest: string
    mostExpensive: string
    averageSpread: number
    maxDifference: number
  }
}

interface CurrencyConversion {
  from: {
    currency: string
    amount: number
  }
  to: {
    currency: string
    amount: number
  }
  rate: {
    type: string
    value: number
    date: string
  }
  calculation: {
    formula: string
    fees?: number
  }
}

// Obtener cotizaciones actuales
export async function getCurrentDollarRates(type?: string): Promise<DollarCurrentData | DollarRate> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const whereClause: any = {}

  // Si se especifica tipo, buscarlo
  if (type) {
    whereClause.dollarType = type
  }

  // Buscar datos de hoy
  let rates = await prisma.dollarRates.findMany({
    where: {
      ...whereClause,
      date: today
    },
    orderBy: {
      dollarType: 'asc'
    }
  })

  // Si no hay datos de hoy, buscar los más recientes
  if (rates.length === 0) {
    const latestDate = await prisma.dollarRates.findFirst({
      where: whereClause,
      orderBy: { date: 'desc' },
      select: { date: true }
    })

    if (!latestDate) {
      throw new DollarError('NO_DATA', 'No dollar rates available')
    }

    rates = await prisma.dollarRates.findMany({
      where: {
        ...whereClause,
        date: latestDate.date
      },
      orderBy: {
        dollarType: 'asc'
      }
    })
  }

  // Si es un tipo específico, retornar solo ese
  if (type && rates.length === 1) {
    return formatDollarRate(rates[0])
  }

  // Formatear como objeto con todos los tipos
  const result: DollarCurrentData = {}
  rates.forEach(rate => {
    result[rate.dollarType] = formatDollarRate(rate)
  })

  return result
}

// Obtener datos históricos
export async function getHistoricalDollarRates(params: {
  from: string
  to: string
  type?: string
  interval: string
}): Promise<{ series: DollarHistoricalPoint[], summary: any }> {
  const fromDate = new Date(params.from)
  const toDate = new Date(params.to)

  const whereClause: any = {
    date: {
      gte: fromDate,
      lte: toDate
    },
    ...(params.type && { dollarType: params.type })
  }

  const historicalData = await prisma.dollarRates.findMany({
    where: whereClause,
    orderBy: [
      { date: 'asc' },
      { dollarType: 'asc' }
    ]
  })

  if (historicalData.length === 0) {
    throw new DollarError('NO_DATA', 'No data available for the specified period')
  }

  // Agrupar por fecha
  const groupedByDate = new Map<string, any[]>()
  historicalData.forEach(rate => {
    const dateKey = rate.date.toISOString().split('T')[0]
    if (!groupedByDate.has(dateKey)) {
      groupedByDate.set(dateKey, [])
    }
    groupedByDate.get(dateKey)!.push(rate)
  })

  // Formatear series
  let series: DollarHistoricalPoint[] = Array.from(groupedByDate.entries()).map(([date, rates]) => {
    const point: DollarHistoricalPoint = { date }
    
    rates.forEach(rate => {
      const formatted = formatDollarRate(rate)
      point[rate.dollarType] = {
        buy: rate.buyPrice,
        sell: rate.sellPrice,
        avg: formatted.averagePrice
      }
    })
    
    return point
  })

  // Aplicar agregación si es necesario
  if (params.interval === 'weekly') {
    series = aggregateByWeek(series)
  } else if (params.interval === 'monthly') {
    series = aggregateByMonth(series)
  }

  // Calcular resumen
  const allPrices = historicalData.map(r => r.sellPrice)
  const summary = {
    count: series.length,
    avgPrice: average(allPrices),
    minPrice: Math.min(...allPrices),
    maxPrice: Math.max(...allPrices),
    startPrice: historicalData[0]?.sellPrice,
    endPrice: historicalData[historicalData.length - 1]?.sellPrice,
    variation: historicalData.length > 1 
      ? ((historicalData[historicalData.length - 1].sellPrice / historicalData[0].sellPrice - 1) * 100).toFixed(2)
      : 0
  }

  return { series, summary }
}

// Comparar tipos de dólar
export async function compareDollarTypes(params: {
  date?: string
  types?: string[]
}): Promise<DollarComparison> {
  const targetDate = params.date ? new Date(params.date) : new Date()
  targetDate.setHours(0, 0, 0, 0)

  const whereClause: any = {
    date: targetDate,
    ...(params.types && params.types.length > 0 && { dollarType: { in: params.types } })
  }

  let rates = await prisma.dollarRates.findMany({
    where: whereClause,
    orderBy: { dollarType: 'asc' }
  })

  // Si no hay datos para esa fecha, buscar la más reciente
  if (rates.length === 0) {
    const latestDate = await prisma.dollarRates.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true }
    })

    if (!latestDate) {
      throw new DollarError('NO_DATA', 'No dollar rates available')
    }

    whereClause.date = latestDate.date
    rates = await prisma.dollarRates.findMany({
      where: whereClause,
      orderBy: { dollarType: 'asc' }
    })
  }

  const formattedTypes = rates.map(rate => ({
    type: rate.dollarType,
    label: DOLLAR_TYPE_LABELS[rate.dollarType] || rate.dollarType,
    buyPrice: rate.buyPrice,
    sellPrice: rate.sellPrice,
    averagePrice: (rate.buyPrice + rate.sellPrice) / 2,
    spread: rate.sellPrice - rate.buyPrice,
    spreadPercentage: ((rate.sellPrice - rate.buyPrice) / rate.buyPrice * 100).toFixed(2)
  }))

  const sellPrices = formattedTypes.map(t => t.sellPrice)
  const cheapest = formattedTypes.reduce((min, t) => t.sellPrice < min.sellPrice ? t : min)
  const mostExpensive = formattedTypes.reduce((max, t) => t.sellPrice > max.sellPrice ? t : max)

  return {
    date: rates[0].date.toISOString().split('T')[0],
    types: formattedTypes,
    analysis: {
      cheapest: cheapest.type,
      mostExpensive: mostExpensive.type,
      averageSpread: average(formattedTypes.map(t => t.spread)),
      maxDifference: mostExpensive.sellPrice - cheapest.sellPrice
    }
  }
}

// Obtener tipos disponibles
export async function getAvailableDollarTypes() {
  const types = await prisma.dollarRates.findMany({
    select: {
      dollarType: true
    },
    distinct: ['dollarType'],
    orderBy: {
      dollarType: 'asc'
    }
  })

  return types.map(t => ({
    value: t.dollarType,
    label: DOLLAR_TYPE_LABELS[t.dollarType] || t.dollarType,
    description: DOLLAR_TYPE_DESCRIPTIONS[t.dollarType] || 'Tipo de cambio'
  }))
}

// Convertir moneda
export async function convertCurrency(params: {
  amount: number
  from: string
  to: string
  type: string
}): Promise<CurrencyConversion> {
  // Obtener cotización actual del tipo especificado
  const rate = await getCurrentDollarRates(params.type) as DollarRate

  let convertedAmount: number
  let rateValue: number
  let formula: string

  if (params.from === 'USD' && params.to === 'ARS') {
    // USD a ARS: usar precio de venta
    convertedAmount = params.amount * rate.sellPrice
    rateValue = rate.sellPrice
    formula = `${params.amount} USD × ${rate.sellPrice} = ${convertedAmount.toFixed(2)} ARS`
  } else if (params.from === 'ARS' && params.to === 'USD') {
    // ARS a USD: usar precio de compra
    convertedAmount = params.amount / rate.buyPrice
    rateValue = rate.buyPrice
    formula = `${params.amount} ARS ÷ ${rate.buyPrice} = ${convertedAmount.toFixed(2)} USD`
  } else {
    // Misma moneda
    convertedAmount = params.amount
    rateValue = 1
    formula = `${params.amount} ${params.from} = ${convertedAmount} ${params.to}`
  }

  return {
    from: {
      currency: params.from,
      amount: params.amount
    },
    to: {
      currency: params.to,
      amount: parseFloat(convertedAmount.toFixed(2))
    },
    rate: {
      type: params.type,
      value: rateValue,
      date: rate.date
    },
    calculation: {
      formula,
      fees: params.type === 'TARJETA' ? 0.75 : undefined // 75% de impuestos para tarjeta
    }
  }
}

// COMPATIBILIDAD: Formato legacy
export async function getLegacyFormat(params: {
  type?: string
  date?: string
  limit: number
}) {
  const { type, date, limit } = params

  // Si no se especifica tipo ni fecha, devolver todos los tipos actuales
  if (!type && !date) {
    const current = await getCurrentDollarRates()
    if (typeof current === 'object' && !('dollarType' in current)) {
      return Object.values(current)
    }
    return [current]
  }

  // Si se especifica fecha
  if (date) {
    const targetDate = new Date(date)
    targetDate.setHours(0, 0, 0, 0)

    const whereClause: any = { date: targetDate }
    if (type) {
      whereClause.dollarType = type
    }

    let rates = await prisma.dollarRates.findMany({
      where: whereClause,
      orderBy: { dollarType: 'asc' }
    })

    // Si no hay datos, buscar el día más cercano anterior
    if (rates.length === 0) {
      const fallbackWhere: any = { date: { lte: targetDate } }
      if (type) {
        fallbackWhere.dollarType = type
      }

      rates = await prisma.dollarRates.findMany({
        where: fallbackWhere,
        orderBy: { date: 'desc' },
        take: type ? 1 : 10
      })
    }

    return rates.map(formatDollarRate)
  }

  // Si solo se especifica tipo
  if (type) {
    const rates = await prisma.dollarRates.findMany({
      where: { dollarType: type },
      orderBy: { date: 'desc' },
      take: limit
    })
    return rates.map(formatDollarRate)
  }

  // Fallback
  const rates = await prisma.dollarRates.findMany({
    orderBy: { date: 'desc' },
    take: limit
  })
  return rates.map(formatDollarRate)
}

// Funciones auxiliares
function formatDollarRate(rate: any): DollarRate {
  return {
    dollarType: rate.dollarType,
    buyPrice: rate.buyPrice,
    sellPrice: rate.sellPrice,
    date: rate.date.toISOString().split('T')[0],
    lastUpdate: rate.updatedAt,
    averagePrice: (rate.buyPrice + rate.sellPrice) / 2,
    spread: rate.sellPrice - rate.buyPrice,
    spreadPercentage: ((rate.sellPrice - rate.buyPrice) / rate.buyPrice * 100).toFixed(2)
  }
}

function average(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length
}

function aggregateByWeek(data: DollarHistoricalPoint[]): DollarHistoricalPoint[] {
  // Implementar agregación semanal
  return data
}

function aggregateByMonth(data: DollarHistoricalPoint[]): DollarHistoricalPoint[] {
  // Implementar agregación mensual
  return data
}