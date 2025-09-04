// app/api/v1/dollar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dollarType = searchParams.get('type')?.toUpperCase()
    const dateParam = searchParams.get('date')
    const limit = parseInt(searchParams.get('limit') || '30')
    
    // Si no se especifica tipo, devolver todos los tipos para la fecha actual
    if (!dollarType && !dateParam) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const rates = await prisma.dollarRates.findMany({
        where: {
          date: today
        },
        orderBy: {
          dollarType: 'asc'
        }
      })
      
      if (rates.length === 0) {
        // Si no hay datos para hoy, buscar el día más reciente
        const latestRates = await prisma.dollarRates.findMany({
          orderBy: {
            date: 'desc'
          },
          take: 10
        })
        
        return NextResponse.json(latestRates.map(formatDollarRate))
      }
      
      return NextResponse.json(rates.map(formatDollarRate))
    }
    
    // Si se especifica una fecha
    if (dateParam) {
      const targetDate = new Date(dateParam)
      targetDate.setHours(0, 0, 0, 0)
      
      const whereClause: any = {
        date: targetDate
      }
      
      if (dollarType) {
        whereClause.dollarType = dollarType
      }
      
      let rates = await prisma.dollarRates.findMany({
        where: whereClause,
        orderBy: {
          dollarType: 'asc'
        }
      })
      
      // Si no hay datos para esa fecha exacta, buscar el día más cercano anterior
      if (rates.length === 0) {
        const fallbackWhereClause: any = {
          date: {
            lte: targetDate
          }
        }
        
        if (dollarType) {
          fallbackWhereClause.dollarType = dollarType
        }
        
        rates = await prisma.dollarRates.findMany({
          where: fallbackWhereClause,
          orderBy: {
            date: 'desc'
          },
          take: dollarType ? 1 : 10
        })
      }
      
      return NextResponse.json(rates.map(formatDollarRate))
    }
    
    // Si solo se especifica tipo sin fecha, devolver datos recientes
    if (dollarType) {
      const rates = await prisma.dollarRates.findMany({
        where: {
          dollarType: dollarType
        },
        orderBy: {
          date: 'desc'
        },
        take: limit
      })
      
      return NextResponse.json(rates.map(formatDollarRate))
    }
    
    // Fallback: devolver datos más recientes
    const latestRates = await prisma.dollarRates.findMany({
      orderBy: {
        date: 'desc'
      },
      take: limit
    })
    
    return NextResponse.json(latestRates.map(formatDollarRate))
    
  } catch (error) {
    console.error('Error fetching dollar rates:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función auxiliar para formatear la respuesta
function formatDollarRate(rate: any) {
  return {
    dollarType: rate.dollarType,
    buyPrice: rate.buyPrice,
    sellPrice: rate.sellPrice,
    date: rate.date.toISOString().split('T')[0],
    lastUpdate: rate.updatedAt,
    // Campos adicionales útiles para el frontend
    averagePrice: (rate.buyPrice + rate.sellPrice) / 2,
    spread: rate.sellPrice - rate.buyPrice,
    spreadPercentage: ((rate.sellPrice - rate.buyPrice) / rate.buyPrice * 100).toFixed(2)
  }
}

// API para obtener tipos de dólar disponibles
export async function OPTIONS(request: NextRequest) {
  try {
    const availableTypes = await prisma.dollarRates.findMany({
      select: {
        dollarType: true
      },
      distinct: ['dollarType'],
      orderBy: {
        dollarType: 'asc'
      }
    })
    
    const typeInfo = availableTypes.map(type => ({
      value: type.dollarType,
      label: getDollarTypeLabel(type.dollarType),
      description: getDollarTypeDescription(type.dollarType)
    }))
    
    return NextResponse.json({
      availableTypes: typeInfo,
      totalTypes: availableTypes.length
    })
    
  } catch (error) {
    console.error('Error fetching available dollar types:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Funciones auxiliares para mapear tipos
function getDollarTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    'OFICIAL': 'Dólar Oficial',
    'BLUE': 'Dólar Blue',
    'MEP': 'Dólar MEP',
    'CCL': 'Dólar CCL',
    'CRYPTO': 'Dólar Crypto',
    'MAYORISTA': 'Dólar Mayorista',
    'TARJETA': 'Dólar Tarjeta'
  }
  
  return labels[type] || type
}

function getDollarTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'OFICIAL': 'Cotización del Banco Central',
    'BLUE': 'Mercado paralelo',
    'MEP': 'Mercado Electrónico de Pagos',
    'CCL': 'Contado con Liquidación',
    'CRYPTO': 'Cotización en criptomonedas',
    'MAYORISTA': 'Mercado mayorista',
    'TARJETA': 'Dólar turista + impuestos'
  }
  
  return descriptions[type] || 'Tipo de cambio especial'
}