// lib/services/emae.service.ts
import { prisma } from '@/lib/db/prisma'

export interface EmaeData {
  date: string
  sector: {
    code: string
    name: string
  }
  values: {
    index: number
    seasonallyAdjusted: number | null
    cycleTrend: number | null
    monthly: number | null
    yearly: number | null
    cycleTrendVariation: number | null
  }
}

export interface EmaeSectorData {
  sector: {
    code: string
    name: string
  }
  values: {
    index: number
    monthly: number | null
    yearly: number | null
  }
}

export interface EmaeHistoricalData {
  date: string
  values: {
    index: number
    seasonallyAdjusted: number | null
    monthly: number | null
    yearly: number | null
  }
}

class EmaeService {
  /**
   * Obtiene el EMAE más reciente para un sector
   */
  async getCurrentEmae(sectorCode: string = 'GENERAL'): Promise<EmaeData | null> {
    try {
      const latest = await prisma.emae.findFirst({
        where: {
          sectorCode
        },
        orderBy: {
          date: 'desc'
        }
      })

      if (!latest) {
        console.warn(`No se encontraron datos de EMAE para ${sectorCode}`)
        // Si no es GENERAL, intentar con GENERAL como fallback
        if (sectorCode !== 'GENERAL') {
          return this.getCurrentEmae('GENERAL')
        }
        return null
      }

      return {
        date: latest.date.toISOString().split('T')[0],
        sector: {
          code: latest.sectorCode,
          name: latest.sectorName
        },
        values: {
          index: latest.originalValue,
          seasonallyAdjusted: latest.seasonallyAdjustedValue,
          cycleTrend: latest.cycleTrendValue,
          monthly: latest.monthlyVariation,
          yearly: latest.yearlyVariation,
          cycleTrendVariation: latest.cycleTrendVariation
        }
      }
    } catch (error) {
      console.error('Error obteniendo EMAE actual:', error)
      return null
    }
  }

  /**
   * Obtiene todos los sectores con sus valores actuales
   */
  async getEmaeSectors(date?: string | null): Promise<EmaeSectorData[]> {
    try {
      let targetDate: Date

      if (date) {
        targetDate = new Date(date + 'T00:00:00')
      } else {
        // Obtener la fecha más reciente disponible
        const latestRecord = await prisma.emae.findFirst({
          orderBy: { date: 'desc' },
          select: { date: true }
        })

        if (!latestRecord) {
          console.error('No se encontraron datos de EMAE')
          return []
        }

        targetDate = latestRecord.date
      }

      // Obtener todos los sectores para esa fecha
      const sectors = await prisma.emae.findMany({
        where: {
          date: targetDate
        },
        orderBy: {
          sectorCode: 'asc'
        }
      })

      return sectors.map(sector => ({
        sector: {
          code: sector.sectorCode,
          name: sector.sectorName
        },
        values: {
          index: sector.originalValue,
          monthly: sector.monthlyVariation,
          yearly: sector.yearlyVariation
        }
      }))
    } catch (error) {
      console.error('Error obteniendo sectores del EMAE:', error)
      return []
    }
  }

  /**
   * Obtiene datos históricos del EMAE
   */
  async getHistoricalEmae(params: {
    from: string
    to: string
    sectorCode?: string
    dataType?: 'original' | 'seasonally_adjusted' | 'cycle_trend'
  }): Promise<EmaeHistoricalData[]> {
    try {
      const {
        from,
        to,
        sectorCode = 'GENERAL',
        dataType = 'original'
      } = params

      const startDate = new Date(from + 'T00:00:00')
      const endDate = new Date(to + 'T00:00:00')

      // Validación de fechas
      if (startDate >= endDate) {
        console.error('La fecha inicial debe ser anterior a la fecha final')
        return []
      }

      // Verificar si existen datos
      const count = await prisma.emae.count({
        where: {
          sectorCode,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      if (count === 0) {
        console.warn(`No hay datos históricos para ${sectorCode}`)
        // Intentar con GENERAL si no hay datos
        if (sectorCode !== 'GENERAL') {
          return this.getHistoricalEmae({ ...params, sectorCode: 'GENERAL' })
        }
        return []
      }

      const data = await prisma.emae.findMany({
        where: {
          sectorCode,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'asc'
        },
        take: 500 // Limitar resultados
      })

      return data.map(record => {
        let indexValue = record.originalValue
        
        if (dataType === 'seasonally_adjusted' && record.seasonallyAdjustedValue) {
          indexValue = record.seasonallyAdjustedValue
        } else if (dataType === 'cycle_trend' && record.cycleTrendValue) {
          indexValue = record.cycleTrendValue
        }

        return {
          date: record.date.toISOString().split('T')[0],
          values: {
            index: indexValue,
            seasonallyAdjusted: record.seasonallyAdjustedValue,
            monthly: record.monthlyVariation,
            yearly: record.yearlyVariation
          }
        }
      })
    } catch (error) {
      console.error('Error obteniendo datos históricos del EMAE:', error)
      return []
    }
  }

  /**
   * Obtiene estadísticas del EMAE
   */
  async getEmaeStats(): Promise<{
    lastUpdate: string
    general: {
      index: number
      monthly: number | null
      yearly: number | null
      seasonallyAdjusted: number | null
    }
    topGrowthSectors: EmaeSectorData[]
    topDeclineSectors: EmaeSectorData[]
  } | null> {
    try {
      // Obtener datos generales actuales
      const general = await this.getCurrentEmae('GENERAL')
      
      if (!general) {
        return null
      }

      // Obtener todos los sectores
      const sectors = await this.getEmaeSectors()
      
      // Filtrar sectores con variación interanual
      const sectorsWithYearly = sectors
        .filter(s => s.values.yearly !== null && s.sector.code !== 'GENERAL')
        .sort((a, b) => (b.values.yearly || 0) - (a.values.yearly || 0))

      const topGrowth = sectorsWithYearly.slice(0, 3)
      const topDecline = sectorsWithYearly.slice(-3).reverse()

      return {
        lastUpdate: general.date,
        general: {
          index: general.values.index,
          monthly: general.values.monthly,
          yearly: general.values.yearly,
          seasonallyAdjusted: general.values.seasonallyAdjusted
        },
        topGrowthSectors: topGrowth,
        topDeclineSectors: topDecline
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas del EMAE:', error)
      return null
    }
  }
}

// Exportar una instancia única del servicio
export const emaeService = new EmaeService()