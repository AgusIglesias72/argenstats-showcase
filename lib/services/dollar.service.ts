// lib/services/dollar.service.ts
import * as dollarApiService from '@/lib/api/services/dollar'

export interface DollarCurrentData {
  [key: string]: {
    dollarType: string
    buyPrice: number
    sellPrice: number
    date: string
    lastUpdate?: Date
    averagePrice: number
    spread: number
    spreadPercentage: string
  }
}

export interface DollarHistoricalData {
  series: Array<{
    date: string
    [key: string]: any
  }>
  summary: {
    count: number
    avgPrice: number
    minPrice: number
    maxPrice: number
    startPrice: number
    endPrice: number
    variation: string
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
   */
  async getCurrentRates(): Promise<DollarCurrentData> {
    try {
      const data = await dollarApiService.getCurrentDollarRates()
      return data as DollarCurrentData
    } catch (error) {
      console.error('Error fetching current dollar rates:', error)
      throw error
    }
  }

  /**
   * Obtiene datos históricos del dólar
   */
  async getHistoricalRates(params: {
    from: string
    to: string
    type?: string
    interval: 'daily' | 'weekly' | 'monthly'
  }): Promise<DollarHistoricalData> {
    try {
      const data = await dollarApiService.getHistoricalDollarRates(params)
      return data
    } catch (error) {
      console.error('Error fetching historical dollar rates:', error)
      throw error
    }
  }

  /**
   * Compara tipos de dólar
   */
  async compareTypes(params: {
    date?: string
    types?: string[]
  }): Promise<DollarComparison> {
    try {
      const data = await dollarApiService.compareDollarTypes(params)
      return data
    } catch (error) {
      console.error('Error comparing dollar types:', error)
      throw error
    }
  }

  /**
   * Obtiene tipos de dólar disponibles
   */
  async getAvailableTypes(): Promise<Array<{ value: string; label: string; description: string }>> {
    try {
      const data = await dollarApiService.getAvailableDollarTypes()
      return data
    } catch (error) {
      console.error('Error fetching available dollar types:', error)
      throw error
    }
  }
}

export const dollarService = new DollarService()
