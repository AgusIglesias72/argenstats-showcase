// lib/services/dollar-converter.service.ts
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

export interface ConversionResult {
  from: {
    currency: 'USD' | 'ARS'
    amount: number
  }
  to: {
    currency: 'USD' | 'ARS'
    amount: number
  }
  rate: {
    type: DollarType
    value: number
    date: string
  }
  calculation: {
    formula: string
    priceType: 'buy' | 'sell' | 'average'
  }
}

class DollarConverterService {
  /**
   * Obtiene todas las cotizaciones actuales usando la API
   */
  async getAllCurrentRates(): Promise<Record<DollarType, DollarRateData | null>> {
    try {
      const response = await fetch('/api/conversor/dollar')
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        return this.getEmptyRatesMap()
      }

      return result.data
    } catch (error) {
      console.error('Error fetching current dollar rates:', error)
      return this.getEmptyRatesMap()
    }
  }

  /**
   * Obtiene cotización histórica para una fecha específica
   */
  async getHistoricalRate(type: DollarType, date: Date): Promise<DollarRateData | null> {
    try {
      const dateString = date.toISOString().split('T')[0]
      const url = `/api/conversor/dollar?type=${type}&date=${dateString}`

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        return null
      }

      return result.data
    } catch (error) {
      console.error('Error fetching historical rate:', error)
      return null
    }
  }

  /**
   * Obtiene cotización actual de un tipo específico
   */
  async getCurrentRate(type: DollarType): Promise<DollarRateData | null> {
    try {
      // Obtener todas las cotizaciones y filtrar por tipo
      const allRates = await this.getAllCurrentRates()
      const rate = allRates[type]
      
      if (!rate) {
        return null
      }

      return rate
    } catch (error) {
      console.error('Error fetching current rate:', error)
      return null
    }
  }

  /**
   * Convierte moneda usando un tipo de dólar específico
   */
  async convertCurrency(params: {
    amount: number
    from: 'USD' | 'ARS'
    to: 'USD' | 'ARS'
    dollarType: DollarType
    priceType: 'buy' | 'sell' | 'average'
    date?: Date
  }): Promise<ConversionResult | null> {
    try {
      // Obtener cotización
      const rate = params.date 
        ? await this.getHistoricalRate(params.dollarType, params.date)
        : await this.getCurrentRate(params.dollarType)

      if (!rate) {
        return null
      }

      // Calcular tipo de cambio según el tipo de precio
      let exchangeRate: number
      switch (params.priceType) {
        case 'buy':
          exchangeRate = rate.buyPrice
          break
        case 'sell':
          exchangeRate = rate.sellPrice
          break
        case 'average':
          exchangeRate = (rate.buyPrice + rate.sellPrice) / 2
          break
        default:
          exchangeRate = (rate.buyPrice + rate.sellPrice) / 2
      }

      // Calcular conversión
      let convertedAmount: number
      let formula: string

      if (params.from === 'USD' && params.to === 'ARS') {
        convertedAmount = params.amount * exchangeRate
        formula = `${params.amount} USD × ${exchangeRate.toFixed(2)} = ${convertedAmount.toFixed(2)} ARS`
      } else if (params.from === 'ARS' && params.to === 'USD') {
        convertedAmount = params.amount / exchangeRate
        formula = `${params.amount} ARS ÷ ${exchangeRate.toFixed(2)} = ${convertedAmount.toFixed(2)} USD`
      } else {
        // Misma moneda
        convertedAmount = params.amount
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
          type: params.dollarType,
          value: exchangeRate,
          date: rate.date
        },
        calculation: {
          formula,
          priceType: params.priceType
        }
      }
    } catch (error) {
      console.error('Error converting currency:', error)
      return null
    }
  }

  /**
   * Obtiene información de tipos de dólar disponibles
   */
  getDollarTypeInfo(): Array<{
    type: DollarType
    label: string
    description: string
    color: string
  }> {
    return [
      { type: 'OFICIAL', label: 'Oficial', description: 'Cotización oficial del BCRA', color: 'blue' },
      { type: 'BLUE', label: 'Blue', description: 'Mercado paralelo', color: 'indigo' },
      { type: 'MEP', label: 'MEP', description: 'Mercado Electrónico de Pagos', color: 'green' },
      { type: 'CCL', label: 'CCL', description: 'Contado con Liquidación', color: 'purple' },
      { type: 'CRYPTO', label: 'Cripto', description: 'Criptomonedas stables', color: 'orange' },
      { type: 'MAYORISTA', label: 'Mayorista', description: 'Mercado mayorista', color: 'gray' },
      { type: 'TARJETA', label: 'Tarjeta', description: 'Compras en el exterior', color: 'red' }
    ]
  }

  // Funciones simplificadas - solo las necesarias para el conversor

  /**
   * Helper para obtener mapa vacío de rates
   */
  private getEmptyRatesMap(): Record<DollarType, DollarRateData | null> {
    return {
      OFICIAL: null,
      BLUE: null,
      MEP: null,
      CCL: null,
      CRYPTO: null,
      MAYORISTA: null,
      TARJETA: null,
    }
  }
}

// Exportar instancia singleton
export const dollarConverterService = new DollarConverterService()
