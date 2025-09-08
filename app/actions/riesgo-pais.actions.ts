// app/actions/riesgo-pais.actions.ts
'use server'

import { riesgoPaisService } from '@/lib/services/riesgo-pais.service'

interface GetRiesgoPaisDataParams {
  chartPeriod?: number
  dataSource?: 'estimated' | 'official' | 'both'
  onlyHistorical?: boolean
}

export async function getRiesgoPaisDataAction(params: GetRiesgoPaisDataParams = {}) {
  const { 
    chartPeriod = 90, 
    dataSource = 'estimated',
    onlyHistorical = false 
  } = params

  try {
    // Si solo necesitamos datos históricos
    if (onlyHistorical) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - chartPeriod)

      const historical = await riesgoPaisService.getHistoricalRiesgoPais({
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        source: dataSource === 'both' ? 'both' : dataSource
      })

      return { historical }
    }

    // Obtener todos los datos
    const [current, jpMorganData, variations, periodsData] = await Promise.all([
      riesgoPaisService.getCurrentRiesgoPais(),
      riesgoPaisService.getJPMorganComparison(),
      riesgoPaisService.getVariations(),
      riesgoPaisService.getPeriodsData()
    ])

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - chartPeriod)

    const historical = await riesgoPaisService.getHistoricalRiesgoPais({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      source: dataSource === 'both' ? 'both' : dataSource
    })

    // Obtener estadísticas adicionales
    const stats = await riesgoPaisService.getPeriodStats(chartPeriod)

    return {
      current,
      jpMorganData,
      historical,
      variations,
      periodsData,
      stats
    }
  } catch (error) {
    console.error('Error in getRiesgoPaisDataAction:', error)
    throw new Error('Failed to fetch Riesgo País data')
  }
}

export async function refreshRiesgoPaisAction() {
  try {
    const [current, jpMorganData, variations] = await Promise.all([
      riesgoPaisService.getCurrentRiesgoPais(),
      riesgoPaisService.getJPMorganComparison(),
      riesgoPaisService.getVariations()
    ])

    return {
      current,
      jpMorganData,
      variations,
      success: true
    }
  } catch (error) {
    console.error('Error refreshing Riesgo País:', error)
    return {
      success: false,
      error: 'Failed to refresh data'
    }
  }
}