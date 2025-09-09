// lib/services/dollar.service.ts
import * as dollarApiService from '@/lib/api/services/dollar'

export interface DollarRate {
  dollarType: string
  buyPrice: number
  sellPrice: number
  date: string
  lastUpdate?: Date
  averagePrice: number
  spread: number
  spreadPercentage: string
}

interface DollarRateWithVariation extends DollarRate {
  variation?: {
    amount: number  // Diferencia en pesos
    percentage: number  // Diferencia en porcentaje
    previousPrice?: number  // Precio anterior para referencia
  }
}

export interface DollarCurrentData {
  [key: string]: DollarRate
}

export interface DollarHistoricalPoint {
  date: string
  [key: string]: any
}

export interface DollarHistoricalData {
  series: DollarHistoricalPoint[]
  summary: {
    count?: number
    avgPrice?: number
    minPrice?: number
    maxPrice?: number
    startPrice?: number
    endPrice?: number
    variation?: string
  }
}

export interface DollarComparison {
  date: string
  types: Array<{
    type: string
    label: string
    buyPrice: number
    sellPrice: number
    averagePrice: number
    spread: number
    spreadPercentage: string
  }>
  analysis: {
    cheapest: string
    mostExpensive: string
    averageSpread: number
    maxDifference: number
  }
}

class DollarService {
  /**
   * Obtiene las cotizaciones actuales del dólar
   * USA TU API REAL
   */
  async getCurrentRates(): Promise<DollarCurrentData> {
    try {
      // Usar tu API real
      const data = await dollarApiService.getCurrentDollarRates()
      
      // Si la API devuelve un formato diferente, transformarlo aquí
      if (data) {
        return data as DollarCurrentData
      }
      
      // Si no hay datos, usar mock como fallback
      return this.generateMockCurrentData()
    } catch (error) {
      console.error('Error fetching current dollar rates:', error)
      // En caso de error, retornar datos mock
      return this.generateMockCurrentData()
    }
  }

  /**
   * Obtiene las cotizaciones actuales con variaciones respecto al día anterior
   * NUEVO MÉTODO
   */
  async getCurrentRatesWithVariations(): Promise<Record<string, DollarRateWithVariation>> {
    try {
      // Obtener cotizaciones actuales
      const currentRates = await this.getCurrentRates()
      
      // Obtener datos históricos de los últimos 2 días para calcular variaciones
      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)
      
      const historicalData = await this.getHistoricalRates({
        from: twoDaysAgo.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
        interval: 'daily'
      })
      
      // Crear un mapa de precios anteriores
      const previousPricesMap: Record<string, number> = {}
      
      if (historicalData && historicalData.series && historicalData.series.length > 1) {
        // Ordenar por fecha para asegurar que obtenemos el día anterior
        const sortedSeries = [...historicalData.series].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        
        // El penúltimo elemento debería ser el día anterior
        const previousDayData = sortedSeries[sortedSeries.length - 2]
        
        if (previousDayData) {
          // Extraer precios del día anterior para cada tipo
          Object.keys(currentRates).forEach(type => {
            if (previousDayData[type]) {
              // Los datos pueden venir en diferentes formatos
              if (typeof previousDayData[type] === 'object') {
                previousPricesMap[type] = previousDayData[type].sell || 
                                         previousDayData[type].avg || 
                                         previousDayData[type].buy || 0
              } else if (typeof previousDayData[type] === 'number') {
                previousPricesMap[type] = previousDayData[type]
              }
            }
          })
        }
      }
      
      // Si no tenemos datos históricos, intentar con una llamada histórica de 2 días
      if (Object.keys(previousPricesMap).length === 0) {
        // Intentar obtener datos del día anterior usando el método getHistoricalRates
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        try {
          const recentHistorical = await this.getHistoricalRates({
            from: yesterdayStr,
            to: yesterdayStr,
            interval: 'daily'
          })
          
          if (recentHistorical && recentHistorical.series && recentHistorical.series.length > 0) {
            const yesterdayData = recentHistorical.series[0]
            
            Object.keys(currentRates).forEach(type => {
              if (yesterdayData[type]) {
                if (typeof yesterdayData[type] === 'object') {
                  previousPricesMap[type] = yesterdayData[type].sell || 
                                           yesterdayData[type].avg || 
                                           yesterdayData[type].buy || 0
                } else if (typeof yesterdayData[type] === 'number') {
                  previousPricesMap[type] = yesterdayData[type]
                }
              }
            })
          }
        } catch (error) {
          console.warn('Could not fetch yesterday data from historical:', error)
        }
      }
      
      // Calcular variaciones para cada tipo de dólar
      const ratesWithVariations: Record<string, DollarRateWithVariation> = {}
      
      Object.entries(currentRates).forEach(([type, rate]) => {
        const previousPrice = previousPricesMap[type]
        
        let variation = undefined
        if (previousPrice && previousPrice > 0) {
          const amount = rate.sellPrice - previousPrice
          const percentage = (amount / previousPrice) * 100
          
          variation = {
            amount: parseFloat(amount.toFixed(2)),
            percentage: parseFloat(percentage.toFixed(2)),
            previousPrice
          }
        }
        
        ratesWithVariations[type] = {
          ...rate,
          variation
        }
      })
      
      return ratesWithVariations
      
    } catch (error) {
      console.error('Error getting rates with variations:', error)
      // En caso de error, retornar datos actuales sin variaciones
      const currentRates = await this.getCurrentRates()
      const ratesWithoutVariations: Record<string, DollarRateWithVariation> = {}
      
      Object.entries(currentRates).forEach(([type, rate]) => {
        ratesWithoutVariations[type] = { ...rate }
      })
      
      return ratesWithoutVariations
    }
  }

  /**
   * Obtiene la variación de un tipo de dólar específico
   * NUEVO MÉTODO
   */
  async getDollarVariation(dollarType: string): Promise<{
    current: number
    previous: number
    variation: number
    percentage: number
    date: string
  } | null> {
    try {
      // Obtener cotizaciones con variaciones
      const ratesWithVariations = await this.getCurrentRatesWithVariations()
      const rateData = ratesWithVariations[dollarType]
      
      if (!rateData) {
        console.warn(`No data found for dollar type: ${dollarType}`)
        return null
      }
      
      if (!rateData.variation) {
        // Si no hay variación calculada, retornar valores por defecto
        return {
          current: rateData.sellPrice,
          previous: rateData.sellPrice,
          variation: 0,
          percentage: 0,
          date: rateData.date
        }
      }
      
      return {
        current: rateData.sellPrice,
        previous: rateData.variation.previousPrice || rateData.sellPrice,
        variation: rateData.variation.amount,
        percentage: rateData.variation.percentage,
        date: rateData.date
      }
      
    } catch (error) {
      console.error('Error getting dollar variation:', error)
      return null
    }
  }

  /**
   * Obtiene datos históricos del dólar
   * USA TU API REAL
   */
  async getHistoricalRates(params: {
    from: string
    to: string
    type?: string
    interval: 'daily' | 'weekly' | 'monthly'
  }): Promise<DollarHistoricalData> {
    try {
      // Usar tu API real
      const data = await dollarApiService.getHistoricalDollarRates(params)
      
      if (data && data.series && data.series.length > 0) {
        return data
      }
      
      // Si no hay datos, usar mock como fallback
      console.warn('No historical data available, using mock data')
      return this.generateMockHistoricalData(params.from, params.to, params.interval)
    } catch (error) {
      console.error('Error fetching historical dollar rates:', error)
      // En caso de error, retornar datos mock
      return this.generateMockHistoricalData(params.from, params.to, params.interval)
    }
  }

  /**
   * Compara tipos de dólar
   * USA TU API REAL
   */
  async compareTypes(params: {
    date?: string
    types?: string[]
  } = {}): Promise<DollarComparison> {
    try {
      // Usar tu API real
      const data = await dollarApiService.compareDollarTypes(params)
      
      if (data) {
        return data
      }
      
      // Si no hay datos, generar comparación desde datos actuales
      return this.generateComparisonFromCurrentData()
    } catch (error) {
      console.error('Error comparing dollar types:', error)
      return this.generateComparisonFromCurrentData()
    }
  }

  // MÉTODOS DE FALLBACK (DATOS MOCK)
  
  private generateMockCurrentData(): DollarCurrentData {
    const basePrice = 1200
    const variation = Math.random() * 100 - 50
    
    return {
      BLUE: {
        dollarType: 'BLUE',
        buyPrice: basePrice + variation,
        sellPrice: basePrice + variation + 20,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice + variation + 10,
        spread: 20,
        spreadPercentage: '1.67'
      },
      OFICIAL: {
        dollarType: 'OFICIAL',
        buyPrice: basePrice - 200,
        sellPrice: basePrice - 180,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice - 190,
        spread: 20,
        spreadPercentage: '1.67'
      },
      MEP: {
        dollarType: 'MEP',
        buyPrice: basePrice + variation - 50,
        sellPrice: basePrice + variation - 30,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice + variation - 40,
        spread: 20,
        spreadPercentage: '1.67'
      },
      CCL: {
        dollarType: 'CCL',
        buyPrice: basePrice + variation - 30,
        sellPrice: basePrice + variation - 10,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice + variation - 20,
        spread: 20,
        spreadPercentage: '1.67'
      },
      CRYPTO: {
        dollarType: 'CRYPTO',
        buyPrice: basePrice + variation - 20,
        sellPrice: basePrice + variation,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice + variation - 10,
        spread: 20,
        spreadPercentage: '1.67'
      },
      MAYORISTA: {
        dollarType: 'MAYORISTA',
        buyPrice: basePrice - 150,
        sellPrice: basePrice - 130,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice - 140,
        spread: 20,
        spreadPercentage: '1.67'
      },
      TARJETA: {
        dollarType: 'TARJETA',
        buyPrice: basePrice + 400,
        sellPrice: basePrice + 420,
        date: new Date().toISOString().split('T')[0],
        lastUpdate: new Date(),
        averagePrice: basePrice + 410,
        spread: 20,
        spreadPercentage: '1.67'
      }
    }
  }

  private generateMockHistoricalData(from: string, to: string, interval: string): DollarHistoricalData {
    const startDate = new Date(from)
    const endDate = new Date(to)
    const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    
    console.log(`📊 Generando datos mock desde ${from} hasta ${to} (${days} días, intervalo: ${interval})`)
    
    const series: DollarHistoricalPoint[] = []
    let step = 1
    
    if (interval === 'monthly') {
      step = 30
    } else if (interval === 'weekly') {
      step = 7
    } else {
      if (days > 365 * 5) {
        step = 30
      } else if (days > 365 * 2) {
        step = 7
      } else if (days > 180) {
        step = 3
      }
    }
    
    const currentBasePrices = {
      BLUE: 1250,
      OFICIAL: 980,
      MEP: 1180,
      CCL: 1200,
      CRYPTO: 1230,
      MAYORISTA: 960,
      TARJETA: 1580
    }
    
    const yearsDiff = days / 365
    const inflationFactor = Math.pow(1.5, yearsDiff)
    
    const historicalBasePrices = {
      BLUE: currentBasePrices.BLUE / inflationFactor,
      OFICIAL: currentBasePrices.OFICIAL / inflationFactor,
      MEP: currentBasePrices.MEP / inflationFactor,
      CCL: currentBasePrices.CCL / inflationFactor,
      CRYPTO: currentBasePrices.CRYPTO / inflationFactor,
      MAYORISTA: currentBasePrices.MAYORISTA / inflationFactor,
      TARJETA: currentBasePrices.TARJETA / inflationFactor
    }
    
    for (let i = 0; i <= days; i += step) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      
      const point: DollarHistoricalPoint = {
        date: currentDate.toISOString().split('T')[0]
      }
      
      const progress = i / days
      
      Object.keys(currentBasePrices).forEach(type => {
        const historicalPrice = historicalBasePrices[type as keyof typeof historicalBasePrices]
        const currentPrice = currentBasePrices[type as keyof typeof currentBasePrices]
        const basePrice = historicalPrice + (currentPrice - historicalPrice) * progress
        const seasonalPattern = Math.sin(i * 0.02) * (basePrice * 0.03)
        const randomVolatility = (Math.random() - 0.5) * (basePrice * 0.02)
        const finalPrice = Math.round(basePrice + seasonalPattern + randomVolatility)
        
        point[type] = {
          sell: finalPrice,
          buy: Math.round(finalPrice * 0.98),
          avg: Math.round(finalPrice * 0.99)
        }
      })
      
      series.push(point)
    }
    
    const allPrices = series.flatMap(p => 
      Object.keys(currentBasePrices).map(type => p[type]?.sell || 0)
    ).filter(p => p > 0)
    
    const firstPoint = series[0]
    const lastPoint = series[series.length - 1]
    const firstPrice = firstPoint?.BLUE?.sell || 0
    const lastPrice = lastPoint?.BLUE?.sell || 0
    
    return {
      series,
      summary: {
        count: series.length,
        avgPrice: Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length),
        minPrice: Math.min(...allPrices),
        maxPrice: Math.max(...allPrices),
        startPrice: firstPrice,
        endPrice: lastPrice,
        variation: firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice * 100).toFixed(2) : '0'
      }
    }
  }

  private async generateComparisonFromCurrentData(): Promise<DollarComparison> {
    const currentData = await this.getCurrentRates()
    const types = Object.keys(currentData)
    
    const comparisonTypes = types.map(type => {
      const data = currentData[type]
      return {
        type,
        label: type,
        buyPrice: data?.buyPrice || 0,
        sellPrice: data?.sellPrice || 0,
        averagePrice: data?.averagePrice || 0,
        spread: data?.spread || 0,
        spreadPercentage: data?.spreadPercentage || '0'
      }
    })
    
    const prices = comparisonTypes.map(t => t.averagePrice).filter(p => p > 0)
    const cheapest = comparisonTypes.reduce((min, t) => 
      t.averagePrice < min.averagePrice && t.averagePrice > 0 ? t : min
    )
    const mostExpensive = comparisonTypes.reduce((max, t) => 
      t.averagePrice > max.averagePrice ? t : max
    )
    
    return {
      date: new Date().toISOString(),
      types: comparisonTypes,
      analysis: {
        cheapest: cheapest?.type || '',
        mostExpensive: mostExpensive?.type || '',
        averageSpread: prices.length > 0 
          ? prices.reduce((a, b) => a + b, 0) / prices.length 
          : 0,
        maxDifference: mostExpensive && cheapest 
          ? mostExpensive.averagePrice - cheapest.averagePrice 
          : 0
      }
    }
  }
}

// Exportar una instancia única del servicio
export const dollarService = new DollarService()