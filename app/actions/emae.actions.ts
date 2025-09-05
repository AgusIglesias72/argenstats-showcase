// app/actions/emae.actions.ts
'use server'

import { emaeService } from '@/lib/services/emae.service'
import { EMAE_SECTORS } from '@/lib/api/constants/emae'

interface GetEmaeDataParams {
  sector?: keyof typeof EMAE_SECTORS
  dataType?: 'original' | 'seasonally_adjusted' | 'cycle_trend'
  chartPeriod?: number
  onlyHistorical?: boolean
}

export async function getEmaeDataAction(params: GetEmaeDataParams) {
  const {
    sector = 'GENERAL',
    dataType = 'original',
    chartPeriod = 12,
    onlyHistorical = false
  } = params

  try {
    // Si solo necesitamos datos históricos
    if (onlyHistorical) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - chartPeriod)
      
      const historical = await emaeService.getHistoricalEmae({
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        sectorCode: sector,
        dataType
      })

      return {
        current: null,
        sectors: [],
        historical,
        stats: null
      }
    }

    // Obtener todos los datos
    const [current, sectors, historical, stats] = await Promise.all([
      // Datos actuales para el sector seleccionado
      emaeService.getCurrentEmae(sector),
      
      // Sectores para la tabla
      emaeService.getEmaeSectors(),
      
      // Datos históricos
      (async () => {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - chartPeriod)
        
        return emaeService.getHistoricalEmae({
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          sectorCode: sector,
          dataType
        })
      })(),
      
      // Estadísticas
      emaeService.getEmaeStats()
    ])

    return {
      current,
      sectors,
      historical,
      stats
    }
  } catch (error) {
    console.error('Error in getEmaeDataAction:', error)
    throw new Error('Failed to fetch EMAE data')
  }
}