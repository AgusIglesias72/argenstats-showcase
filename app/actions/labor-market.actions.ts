// app/actions/labor-market.actions.ts
'use server'

import { laborMarketService } from '@/lib/services/labor-market.service'
import { revalidatePath } from 'next/cache'

interface GetLaborMarketDataParams {
  indicators: string[]
  regions: string[]
  from: string
  to: string
}

export async function getLaborMarketDataAction(params: GetLaborMarketDataParams) {
  try {
    const historical = await laborMarketService.getHistoricalData(params)
    
    return {
      historical,
      success: true
    }
  } catch (error) {
    console.error('Error fetching labor market data:', error)
    return {
      historical: [],
      success: false,
      error: 'Error al obtener datos del mercado laboral'
    }
  }
}

export async function refreshLaborMarketAction() {
  try {
    // Obtener todos los datos actualizados
    const [current, regional, stats, demographic] = await Promise.all([
      laborMarketService.getCurrentNationalData(),
      laborMarketService.getRegionalData(),
      laborMarketService.getStats(),
      laborMarketService.getDemographicData()
    ])

    // Obtener datos históricos (últimos 5 años por defecto)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 5)
    
    const historical = await laborMarketService.getHistoricalData({
      indicators: ['unemployment', 'employment', 'activity'],
      regions: ['Total 31 aglomerados'],
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0]
    })

    // Revalidar la página
    revalidatePath('/indicadores/empleo')

    return {
      current,
      regional,
      historical,
      stats,
      demographic,
      success: true
    }
  } catch (error) {
    console.error('Error refreshing labor market data:', error)
    return {
      current: null,
      regional: [],
      historical: [],
      stats: null,
      demographic: null,
      success: false,
      error: 'Error al actualizar datos del mercado laboral'
    }
  }
}