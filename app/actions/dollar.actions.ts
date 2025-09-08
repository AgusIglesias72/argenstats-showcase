'use server'

import { dollarService } from '@/lib/services/dollar.service'

/**
 * Server Action para obtener cotizaciones actuales
 */
export async function fetchCurrentDollarRates() {
  try {
    const data = await dollarService.getCurrentRates()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching current rates:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

/**
 * Server Action para obtener datos históricos
 */
export async function fetchHistoricalDollarRates(params: {
  from: string
  to: string
  type?: string
  interval: 'daily' | 'weekly' | 'monthly'
}) {
  try {
    console.log('📊 Server Action - Fetching historical data:', params)
    const data = await dollarService.getHistoricalRates(params)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching historical rates:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}

/**
 * Server Action para comparar tipos de dólar
 */
export async function compareDollarTypes(params?: {
  date?: string
  types?: string[]
}) {
  try {
    const data = await dollarService.compareTypes(params || {})
    return { success: true, data }
  } catch (error) {
    console.error('Error comparing dollar types:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}