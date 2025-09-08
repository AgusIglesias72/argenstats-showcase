// app/api/conversor/dollar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export type DollarType = 'BLUE' | 'CCL' | 'CRYPTO' | 'MEP' | 'MAYORISTA' | 'OFICIAL' | 'TARJETA'

export interface DollarRateData {
  date: string
  dollarType: DollarType
  buyPrice: number
  sellPrice: number
  spread?: number
  lastUpdated?: string
  minutesAgo?: number
}

// GET /api/conversor/dollar - Obtiene cotizaciones (actuales o históricas)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const date = searchParams.get('date')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const interval = searchParams.get('interval') || 'daily'

    let rates: any[] = []
    let targetDate: Date

    // Si hay parámetros from y to, es una consulta histórica por rango
    if (from && to) {
      const fromDate = new Date(from)
      const toDate = new Date(to)
      
      fromDate.setHours(0, 0, 0, 0)
      toDate.setHours(23, 59, 59, 999)

      // Obtener datos históricos en el rango
      rates = await prisma.dollarRates.findMany({
        where: {
          date: {
            gte: fromDate,
            lte: toDate
          },
          ...(type && { dollarType: type })
        },
        orderBy: [
          { date: 'asc' },
          { dollarType: 'asc' }
        ]
      })

      // Agrupar por fecha y formatear para el gráfico
      const groupedByDate = new Map<string, any[]>()
      rates.forEach(rate => {
        const dateKey = rate.date.toISOString().split('T')[0]
        if (!groupedByDate.has(dateKey)) {
          groupedByDate.set(dateKey, [])
        }
        groupedByDate.get(dateKey)!.push(rate)
      })

      // Formatear series para el gráfico
      const series = Array.from(groupedByDate.entries()).map(([date, dayRates]) => {
        const point: any = { date }
        
        dayRates.forEach(rate => {
          point[rate.dollarType] = {
            buy: rate.buyPrice,
            sell: rate.sellPrice,
            avg: (rate.buyPrice + rate.sellPrice) / 2
          }
        })
        
        return point
      })

      // Aplicar agregación solo para períodos muy largos (más de 2 años)
      let finalSeries = series
      const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
      
      console.log(`🔍 API Debug:`, {
        from,
        to,
        interval,
        daysDiff,
        originalCount: series.length,
        willAggregate: daysDiff > 730 && interval === 'monthly'
      })
      
      if (daysDiff > 730 && interval === 'monthly') {
        // Solo para períodos de más de 2 años, usar agregación mensual
        finalSeries = aggregateByMonth(series)
        console.log(`📈 Aggregated to monthly:`, finalSeries.length, 'points')
      }
      // Para todos los demás casos, mantener datos diarios

      return NextResponse.json({
        success: true,
        data: finalSeries,
        metadata: {
          from,
          to,
          interval,
          count: finalSeries.length,
          types: type ? [type] : Array.from(new Set(rates.map(r => r.dollarType)))
        }
      })
    }

    if (date) {
      // Datos históricos para una fecha específica
      targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)

      if (type) {
        // Un tipo específico para una fecha
        rates = await prisma.dollarRates.findMany({
          where: {
            dollarType: type,
            date: { lte: targetDate }
          },
          orderBy: { date: 'desc' },
          take: 1
        })
      } else {
        // Todos los tipos para una fecha
        rates = await prisma.dollarRates.findMany({
          where: {
            date: targetDate
          },
          orderBy: {
            dollarType: 'asc'
          }
        })

        // Si no hay datos para esa fecha exacta, buscar la más cercana anterior
        if (rates.length === 0) {
          const latestDate = await prisma.dollarRates.findFirst({
            where: {
              date: { lte: targetDate }
            },
            orderBy: { date: 'desc' },
            select: { date: true }
          })

          if (latestDate) {
            rates = await prisma.dollarRates.findMany({
              where: {
                date: latestDate.date
              },
              orderBy: {
                dollarType: 'asc'
              }
            })
          }
        }
      }
    } else {
      // Datos actuales (más recientes)
      const latestDate = await prisma.dollarRates.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true }
      })

      if (!latestDate) {
        return NextResponse.json({ 
          success: false, 
          error: 'No hay datos disponibles' 
        })
      }

      targetDate = latestDate.date

      if (type) {
        // Un tipo específico actual
        rates = await prisma.dollarRates.findMany({
          where: {
            dollarType: type,
            date: targetDate
          }
        })
      } else {
        // Todos los tipos actuales
        rates = await prisma.dollarRates.findMany({
          where: {
            date: targetDate
          },
          orderBy: {
            dollarType: 'asc'
          }
        })
      }
    }

    if (rates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No hay datos disponibles para la fecha especificada' 
      })
    }

    // Si se pidió un tipo específico, devolver solo ese
    if (type && rates.length === 1) {
      const rate = rates[0]
      const result = {
        date: rate.date.toISOString().split('T')[0],
        dollarType: rate.dollarType.toUpperCase() as DollarType,
        buyPrice: rate.buyPrice,
        sellPrice: rate.sellPrice,
        spread: rate.sellPrice - rate.buyPrice,
        lastUpdated: rate.updatedAt?.toISOString(),
        minutesAgo: rate.updatedAt ? Math.floor((Date.now() - rate.updatedAt.getTime()) / 60000) : undefined
      }
      return NextResponse.json({ 
        success: true, 
        data: result 
      })
    }

    // Mapear a formato esperado por el conversor
    const ratesMap: Record<DollarType, DollarRateData | null> = {
      OFICIAL: null,
      BLUE: null,
      MEP: null,
      CCL: null,
      CRYPTO: null,
      MAYORISTA: null,
      TARJETA: null,
    }

    rates.forEach(rate => {
      const type = rate.dollarType.toUpperCase() as DollarType
      if (type in ratesMap) {
        ratesMap[type] = {
          date: rate.date.toISOString().split('T')[0],
          dollarType: type,
          buyPrice: rate.buyPrice,
          sellPrice: rate.sellPrice,
          spread: rate.sellPrice - rate.buyPrice,
          lastUpdated: rate.updatedAt?.toISOString(),
          minutesAgo: rate.updatedAt ? Math.floor((Date.now() - rate.updatedAt.getTime()) / 60000) : undefined
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: ratesMap 
    })

  } catch (error) {
    console.error('Error fetching dollar rates:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, { status: 500 })
  }
}

// Funciones de agregación
function aggregateByWeek(series: any[]) {
  const weeklyData = new Map<string, any>()
  
  series.forEach(point => {
    const date = new Date(point.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Lunes de la semana
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, { date: weekKey })
    }
    
    const weekPoint = weeklyData.get(weekKey)
    Object.keys(point).forEach(key => {
      if (key !== 'date' && point[key]) {
        if (!weekPoint[key]) {
          weekPoint[key] = { values: [] }
        }
        weekPoint[key].values.push(point[key])
      }
    })
  })
  
  // Calcular promedios semanales
  return Array.from(weeklyData.values()).map(point => {
    const result: any = { date: point.date }
    Object.keys(point).forEach(key => {
      if (key !== 'date' && point[key].values) {
        const values = point[key].values
        result[key] = {
          buy: values.reduce((sum: number, v: any) => sum + v.buy, 0) / values.length,
          sell: values.reduce((sum: number, v: any) => sum + v.sell, 0) / values.length,
          avg: values.reduce((sum: number, v: any) => sum + v.avg, 0) / values.length
        }
      }
    })
    return result
  })
}

function aggregateByMonth(series: any[]) {
  const monthlyData = new Map<string, any>()
  
  series.forEach(point => {
    const date = new Date(point.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { date: `${monthKey}-01` })
    }
    
    const monthPoint = monthlyData.get(monthKey)
    Object.keys(point).forEach(key => {
      if (key !== 'date' && point[key]) {
        if (!monthPoint[key]) {
          monthPoint[key] = { values: [] }
        }
        monthPoint[key].values.push(point[key])
      }
    })
  })
  
  // Calcular promedios mensuales
  return Array.from(monthlyData.values()).map(point => {
    const result: any = { date: point.date }
    Object.keys(point).forEach(key => {
      if (key !== 'date' && point[key].values) {
        const values = point[key].values
        result[key] = {
          buy: values.reduce((sum: number, v: any) => sum + v.buy, 0) / values.length,
          sell: values.reduce((sum: number, v: any) => sum + v.sell, 0) / values.length,
          avg: values.reduce((sum: number, v: any) => sum + v.avg, 0) / values.length
        }
      }
    })
    return result
  })
}
