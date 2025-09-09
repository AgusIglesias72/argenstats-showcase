import { prisma } from '@/lib/db/prisma'

/**
 * Obtiene los últimos datos del dólar oficial
 */
export async function getLatestDollarData() {
  try {
    const latestDollar = await prisma.dollarRates.findFirst({
      where: {
        dollarType: 'OFICIAL'
      },
      orderBy: {
        date: 'desc'
      }
    })

    if (!latestDollar) {
      return {
        buyPrice: null,
        sellPrice: null,
        variation: 0,
        lastUpdate: new Date()
      }
    }

    // Obtener el valor del día anterior para calcular variación
    const previousDayDollar = await prisma.dollarRates.findFirst({
      where: {
        dollarType: 'OFICIAL',
        date: {
          lt: latestDollar.date
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    const variation = previousDayDollar 
      ? ((latestDollar.sellPrice - previousDayDollar.sellPrice) / previousDayDollar.sellPrice) * 100
      : 0

    return {
      buyPrice: latestDollar.buyPrice,
      sellPrice: latestDollar.sellPrice,
      variation: variation,
      lastUpdate: latestDollar.updatedAt
    }
  } catch (error) {
    console.error('Error fetching dollar data:', error)
    return {
      buyPrice: null,
      sellPrice: null,
      variation: 0,
      lastUpdate: new Date()
    }
  }
}

/**
 * Obtiene los últimos datos del IPC (inflación)
 */
export async function getLatestInflationData() {
  try {
    // Obtener el último IPC general nacional
    const latestIPC = await prisma.ipc.findFirst({
      where: {
        componentCode: 'GENERAL',
        region: 'Nacional'
      },
      orderBy: {
        date: 'desc'
      }
    })

    if (!latestIPC) {
      return {
        monthly: null,
        yearly: null,
        accumulated: null,
        date: null
      }
    }

    return {
      monthly: latestIPC.monthlyPctChange,
      yearly: latestIPC.yearlyPctChange,
      accumulated: latestIPC.accumulatedPctChange,
      date: latestIPC.date
    }
  } catch (error) {
    console.error('Error fetching IPC data:', error)
    return {
      monthly: null,
      yearly: null,
      accumulated: null,
      date: null
    }
  }
}

/**
 * Obtiene los últimos datos del EMAE
 */
export async function getLatestEmaeData() {
  try {
    const latestEMAE = await prisma.emae.findFirst({
      where: {
        sectorCode: 'GENERAL'
      },
      orderBy: {
        date: 'desc'
      }
    })

    if (!latestEMAE) {
      return {
        monthlyVariation: null,
        yearlyVariation: null,
        indexValue: null,
        date: null
      }
    }

    return {
      monthlyVariation: latestEMAE.monthlyVariation,
      yearlyVariation: latestEMAE.yearlyVariation,
      indexValue: latestEMAE.originalValue,
      date: latestEMAE.date
    }
  } catch (error) {
    console.error('Error fetching EMAE data:', error)
    return {
      monthlyVariation: null,
      yearlyVariation: null,
      indexValue: null,
      date: null
    }
  }
}

/**
 * Obtiene los últimos datos del Riesgo País
 */
export async function getLatestCountryRiskData() {
  try {
    const latestRisk = await prisma.countryRisk.findFirst({
      orderBy: {
        date: 'desc'
      }
    })

    if (!latestRisk) {
      return {
        value: null,
        dailyVariation: 0,
        monthlyVariation: 0,
        yearlyVariation: 0,
        lastUpdate: new Date()
      }
    }

    // Usar el valor oficial si está disponible, sino el estimado
    const currentValue = latestRisk.embiEstimated ?? latestRisk.embiOfficial ?? null

    if (!currentValue) {
      return {
        value: null,
        dailyVariation: 0,
        monthlyVariation: 0,
        yearlyVariation: 0,
        lastUpdate: latestRisk.lastUpdate
      }
    }

    // Calcular variaciones
    const yesterday = new Date(latestRisk.date)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastMonth = new Date(latestRisk.date)
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const lastYear = new Date(latestRisk.date)
    lastYear.setFullYear(lastYear.getFullYear() - 1)

    const [yesterdayRisk, lastMonthRisk, lastYearRisk] = await Promise.all([
      prisma.countryRisk.findFirst({
        where: { date: yesterday },
        orderBy: { date: 'desc' }
      }),
      prisma.countryRisk.findFirst({
        where: { 
          date: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() - 2),
            lte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 2)
          }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.countryRisk.findFirst({
        where: { 
          date: {
            gte: new Date(lastYear.getFullYear(), lastYear.getMonth(), lastYear.getDate() - 5),
            lte: new Date(lastYear.getFullYear(), lastYear.getMonth(), lastYear.getDate() + 5)
          }
        },
        orderBy: { date: 'desc' }
      })
    ])

    const yesterdayValue = yesterdayRisk ? (yesterdayRisk.embiOfficial ?? yesterdayRisk.embiEstimated ?? 0) : 0
    const lastMonthValue = lastMonthRisk ? (lastMonthRisk.embiOfficial ?? lastMonthRisk.embiEstimated ?? 0) : 0
    const lastYearValue = lastYearRisk ? (lastYearRisk.embiOfficial ?? lastYearRisk.embiEstimated ?? 0) : 0

    const dailyVariation = yesterdayValue ? ((currentValue - yesterdayValue) / yesterdayValue) * 100 : 0
    const monthlyVariation = lastMonthValue ? ((currentValue - lastMonthValue) / lastMonthValue) * 100 : 0
    const yearlyVariation = lastYearValue ? ((currentValue - lastYearValue) / lastYearValue) * 100 : 0

    return {
      value: currentValue,
      dailyVariation,
      monthlyVariation,
      yearlyVariation,
      lastUpdate: latestRisk.lastUpdate
    }
  } catch (error) {
    console.error('Error fetching country risk data:', error)
    return {
      value: null,
      dailyVariation: 0,
      monthlyVariation: 0,
      yearlyVariation: 0,
      lastUpdate: new Date()
    }
  }
}

/**
 * Obtiene todos los indicadores principales para el dashboard
 */
export async function getMainIndicatorsData() {
  const [dollar, inflation, emae, countryRisk] = await Promise.all([
    getLatestDollarData(),
    getLatestInflationData(),
    getLatestEmaeData(),
    getLatestCountryRiskData()
  ])

  return {
    dollar,
    inflation,
    emae,
    countryRisk
  }
}

/**
 * Formatea una fecha para mostrar solo mes y año
 */
export function formatMonthYear(date: Date | null): string {
  if (!date) return 'Sin datos'
  
  const dateObj = new Date(date)
  const month = dateObj.toLocaleDateString('es-AR', { month: 'long' })
  const year = dateObj.getFullYear()
  
  // Capitalizar primera letra del mes
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1)
  
  return `${monthCapitalized} ${year}`
}

/**
 * Formatea una fecha para mostrar
 */
export function formatIndicatorDate(date: Date | null): string {
  if (!date) return 'Sin datos'
  
  const now = new Date()
  const dateObj = new Date(date)
  
  // Si es hoy
  if (dateObj.toDateString() === now.toDateString()) {
    return `Hoy ${dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`
  }
  
  // Si es de este año
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString('es-AR', { month: 'long', day: 'numeric' })
  }
  
  // Si es de otro año
  return dateObj.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

/**
 * Formatea un número para mostrar como moneda
 */
export function formatCurrency(value: number | null, decimals: number = 2): string {
  if (value === null) return '-'
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value)
}

/**
 * Formatea un porcentaje para mostrar
 */
export function formatPercentage(value: number | null, decimals: number = 1): string {
  if (value === null) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}