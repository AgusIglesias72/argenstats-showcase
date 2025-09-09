// lib/services/riesgo-pais.service.ts
import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'

// IMPORTANTE: Ajustar estos nombres según tu schema de Prisma
// Si tu tabla se llama diferente (ej: "CountryRisk", "riesgo_pais", etc.), 
// cambiar aquí el nombre
const TABLE_NAME = 'country_risk' // <- CAMBIAR ESTE NOMBRE POR EL CORRECTO DE TU SCHEMA

interface RiesgoPaisRecord {
  id: string
  date: Date
  embiOfficial: number | null
  embiEstimated: number | null
  lastUpdate: Date
  sourceOfficial: string | null
  sourceEstimated: string | null
  createdAt: Date
  updatedAt: Date
}

interface CurrentRiesgoPais {
  value: number
  date: string
  dailyChange: number
  dailyChangePercent: number
  officialValue?: number
  estimatorDiff?: number
  source: 'official' | 'estimated'
  lastUpdate?: string // Agregamos para el estimador
}

interface JPMorganComparison {
  official: number
  estimated: number
  difference: number
  lastUpdate: string // Ahora será la fecha cuando cambió el valor
}

interface HistoricalParams {
  from: string
  to: string
  interval?: 'daily' | 'weekly' | 'monthly'
  source?: 'official' | 'estimated' | 'both'
}

interface PeriodVariation {
  value: number
  percent: number
}

interface Variations {
  daily: PeriodVariation
  weekly: PeriodVariation
  monthly: PeriodVariation
  quarterly: PeriodVariation
  yearly: PeriodVariation
  ytd: PeriodVariation
}

class RiesgoPaisService {
  // Obtener el valor actual del riesgo país (preferir estimador sobre oficial)
  async getCurrentRiesgoPais(): Promise<CurrentRiesgoPais | null> {
    try {
      const current = await prisma.countryRisk.findFirst({
        orderBy: {
          date: 'desc'
        }
      })

      if (!current) {
        return null
      }

      const value = current.embiEstimated || current.embiOfficial || 0

      // Obtener el valor del día anterior
      const yesterday = new Date(current.date)
      yesterday.setDate(yesterday.getDate() - 1)

      const previousDay = await prisma.countryRisk.findFirst({
        where: {
          date: {
            lte: yesterday
          }
        },
        orderBy: {
          date: 'desc'
        }
      })

      const previousValue = previousDay 
        ? (previousDay.embiEstimated || previousDay.embiOfficial || 0)
        : value

      const dailyChange = value - previousValue
      const dailyChangePercent = previousValue !== 0 
        ? ((value - previousValue) / previousValue) * 100 
        : 0

      return {
        value,
        date: current.date.toISOString(),
        dailyChange,
        dailyChangePercent,
        officialValue: current.embiOfficial || undefined,
        estimatorDiff: current.embiEstimated && current.embiOfficial 
          ? current.embiEstimated - current.embiOfficial 
          : undefined,
        source: current.embiEstimated ? 'estimated' : 'official',
        // Para el estimador, usar lastUpdate que es cuando se actualizó
        lastUpdate: current.embiEstimated ? current.lastUpdate.toISOString() : undefined
      }
    } catch (error) {
      console.error('Error fetching current riesgo país:', error)
      return null
    }
  }

  // Obtener comparación entre JP Morgan oficial y estimador
  async getJPMorganComparison(): Promise<JPMorganComparison | null> {
    try {
      // Buscar el último registro con valor oficial de JP Morgan
      const latestOfficial = await prisma.countryRisk.findFirst({
        where: {
          embiOfficial: { not: null }
        },
        orderBy: {
          date: 'desc'
        }
      })

      if (!latestOfficial || !latestOfficial.embiOfficial) {
        return null
      }

      const currentOfficialValue = latestOfficial.embiOfficial

      // Buscar cuándo fue la última vez que el valor oficial fue diferente
      // Esto nos dirá cuándo cambió al valor actual
      const lastDifferentOfficial = await prisma.countryRisk.findFirst({
        where: {
          embiOfficial: {
            not: currentOfficialValue
          },
          date: {
            lt: latestOfficial.date
          }
        },
        orderBy: {
          date: 'desc'
        }
      })

      // La fecha de actualización de JP Morgan es:
      // - Si encontramos un valor diferente anterior: la fecha del primer registro con el valor actual
      // - Si no hay valor diferente (siempre fue el mismo): la fecha del registro más antiguo con este valor
      let jpMorganUpdateDate: Date

      if (lastDifferentOfficial) {
        // Buscar el primer registro después del último valor diferente que tenga el valor actual
        const firstWithCurrentValue = await prisma.countryRisk.findFirst({
          where: {
            embiOfficial: currentOfficialValue,
            date: {
              gt: lastDifferentOfficial.date
            }
          },
          orderBy: {
            date: 'asc'
          }
        })
        jpMorganUpdateDate = firstWithCurrentValue?.date || latestOfficial.date
      } else {
        // Si no hay valor diferente, buscar el registro más antiguo con el valor actual
        const oldestWithCurrentValue = await prisma.countryRisk.findFirst({
          where: {
            embiOfficial: currentOfficialValue
          },
          orderBy: {
            date: 'asc'
          }
        })
        jpMorganUpdateDate = oldestWithCurrentValue?.date || latestOfficial.date
      }

      // Buscar el último registro con estimador
      const latestEstimated = await prisma.countryRisk.findFirst({
        where: {
          embiEstimated: { not: null }
        },
        orderBy: {
          date: 'desc'
        }
      })

      const official = currentOfficialValue
      const estimated = latestEstimated?.embiEstimated || official

      return {
        official,
        estimated,
        difference: estimated - official,
        lastUpdate: jpMorganUpdateDate.toISOString() // Fecha cuando cambió al valor actual
      }
    } catch (error) {
      console.error('Error fetching JP Morgan comparison:', error)
      return null
    }
  }

  // Obtener datos históricos
  async getHistoricalRiesgoPais(params: HistoricalParams) {
    const { from, to, interval = 'daily', source = 'estimated' } = params

    try {
      const fromDate = new Date(from)
      const toDate = new Date(to)

      let data: any[] = []

      if (interval === 'daily') {
        // Para datos diarios, traer directamente
        data = await prisma.countryRisk.findMany({
          where: {
            date: {
              gte: fromDate,
              lte: toDate
            }
          },
          orderBy: {
            date: 'asc'
          }
        })
      } else {
        // Para intervalos semanales o mensuales, necesitamos agrupar
        // Como Prisma no soporta GROUP BY directamente, usamos raw query
        if (interval === 'weekly') {
          data = await prisma.$queryRaw`
            SELECT 
              DATE_TRUNC('week', date) as date,
              AVG(COALESCE("embiEstimated", "embiOfficial")) as value,
              AVG("embiOfficial") as "officialValue"
            FROM "${TABLE_NAME}"
            WHERE date >= ${fromDate} AND date <= ${toDate}
            GROUP BY DATE_TRUNC('week', date)
            ORDER BY date ASC
          `
        } else if (interval === 'monthly') {
          data = await prisma.$queryRaw`
            SELECT 
              DATE_TRUNC('month', date) as date,
              AVG(COALESCE("embiEstimated", "embiOfficial")) as value,
              AVG("embiOfficial") as "officialValue"
            FROM "${TABLE_NAME}"
            WHERE date >= ${fromDate} AND date <= ${toDate}
            GROUP BY DATE_TRUNC('month', date)
            ORDER BY date ASC
          `
        }
      }

      return data.map(record => {
        let value: number
        let officialValue: number | undefined

        if (interval === 'daily') {
          // Para datos diarios, usar los valores directamente
          if (source === 'official') {
            value = record.embiOfficial || 0
          } else if (source === 'estimated') {
            value = record.embiEstimated || record.embiOfficial || 0
          } else {
            value = record.embiEstimated || record.embiOfficial || 0
            officialValue = record.embiOfficial || undefined
          }
        } else {
          // Para datos agrupados, ya vienen procesados
          value = Math.round(record.value || 0)
          if (source === 'both') {
            officialValue = record.officialValue ? Math.round(record.officialValue) : undefined
          }
        }

        return {
          date: record.date.toISOString().split('T')[0],
          value,
          ...(officialValue !== undefined && { officialValue })
        }
      })
    } catch (error) {
      console.error('Error fetching historical riesgo país:', error)
      return []
    }
  }

  // Obtener variaciones por período
  async getVariations(): Promise<Variations | null> {
    try {
      // Obtener valor actual
      const currentData = await this.getCurrentRiesgoPais()
      if (!currentData) return null
      
      const currentValue = currentData.value
      const currentDate = new Date(currentData.date)
      
      // Calcular las fechas objetivo para cada período
      const targetDates = {
        daily: new Date(currentDate.getTime() - 24 * 60 * 60 * 1000),
        weekly: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000),
        monthly: new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000),
        quarterly: new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000),
        yearly: new Date(currentDate.getTime() - 365 * 24 * 60 * 60 * 1000),
        ytd: new Date(currentDate.getFullYear(), 0, 1)
      }
      
      const variations: Variations = {
        daily: { value: 0, percent: 0 },
        weekly: { value: 0, percent: 0 },
        monthly: { value: 0, percent: 0 },
        quarterly: { value: 0, percent: 0 },
        yearly: { value: 0, percent: 0 },
        ytd: { value: 0, percent: 0 }
      }
      
      // Calcular variaciones para cada período
      for (const [period, targetDate] of Object.entries(targetDates)) {
        // Buscar el registro más cercano a la fecha objetivo
        // Primero intentar encontrar un registro exacto o posterior
        let historicalData = await prisma.countryRisk.findFirst({
          where: {
            date: {
              gte: targetDate,
              lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            date: 'asc'
          }
        })
        
        // Si no encontramos, buscar el más cercano anterior
        if (!historicalData) {
          historicalData = await prisma.countryRisk.findFirst({
            where: {
              date: {
                lt: targetDate
              }
            },
            orderBy: {
              date: 'desc'
            }
          })
        }
        
        if (historicalData) {
          const historicalValue = historicalData.embiEstimated || historicalData.embiOfficial || 0
          if (historicalValue > 0) {
            const change = currentValue - historicalValue
            const changePercent = (change / historicalValue) * 100
            
            variations[period as keyof Variations] = {
              value: Math.round(change),
              percent: Math.round(changePercent * 100) / 100
            }
          }
        }
      }
      
      return variations
    } catch (error) {
      console.error('Error calculating variations:', error)
      return null
    }
  }

  // Obtener estadísticas para un período
  async getPeriodStats(days: number) {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Usar agregación de Prisma
      const stats = await prisma.countryRisk.aggregate({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        _avg: {
          embiEstimated: true,
          embiOfficial: true
        },
        _min: {
          embiEstimated: true,
          embiOfficial: true
        },
        _max: {
          embiEstimated: true,
          embiOfficial: true
        }
      })

      if (!stats) {
        return null
      }

      // Calcular el valor combinado para cada estadística
      const minValue = Math.min(
        stats._min.embiEstimated || Infinity,
        stats._min.embiOfficial || Infinity
      )
      const maxValue = Math.max(
        stats._max.embiEstimated || 0,
        stats._max.embiOfficial || 0
      )
      const avgValue = (stats._avg.embiEstimated || stats._avg.embiOfficial || 0)

      return {
        min: Math.round(minValue === Infinity ? 0 : minValue),
        max: Math.round(maxValue),
        average: Math.round(avgValue),
        stdDev: 0, // Prisma no soporta STDDEV directamente
        period: `${days} días`
      }
    } catch (error) {
      console.error('Error fetching period stats:', error)
      return null
    }
  }

  // Obtener datos detallados para todos los períodos
  async getPeriodsData() {
    try {
      const current = await this.getCurrentRiesgoPais()
      if (!current) return []

      const periods = [
        { name: 'Diario', days: 1 },
        { name: 'Semanal', days: 7 },
        { name: 'Mensual', days: 30 },
        { name: 'Trimestral', days: 90 },
        { name: 'Semestral', days: 180 },
        { name: 'Anual', days: 365 },
        { name: 'YTD', days: -1 } // Caso especial para Year-to-Date
      ]

      const periodsData = []

      for (const period of periods) {
        let startDate: Date
        const endDate = new Date()

        if (period.days === -1) {
          // Year-to-Date
          startDate = new Date(endDate.getFullYear(), 0, 1)
        } else {
          startDate = new Date()
          startDate.setDate(startDate.getDate() - period.days)
        }

        // Obtener valor inicial del período
        const initialData = await prisma.countryRisk.findFirst({
          where: {
            date: {
              gte: startDate,
              lt: new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          orderBy: {
            date: 'asc'
          }
        })

        // Obtener estadísticas del período
        const periodRecords = await prisma.countryRisk.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate
            }
          }
        })

        if (!initialData) {
          const initialData = await prisma.countryRisk.findFirst({
            where: {
              date: {
                lt: startDate
              }
            },
            orderBy: {
              date: 'desc'
            }
          })
        }

        if (initialData && periodRecords.length > 0) {
          const values = periodRecords.map(r => r.embiEstimated || r.embiOfficial || 0)
          const minValue = Math.min(...values)
          const maxValue = Math.max(...values)
          const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length

          const initialValue = initialData.embiEstimated || initialData.embiOfficial || current.value
          const change = current.value - initialValue
          const changePercent = initialValue !== 0 
            ? ((current.value - initialValue) / initialValue) * 100 
            : 0

          periodsData.push({
            period: period.name,
            value: current.value,
            change: Math.round(change),
            changePercent: Math.round(changePercent * 100) / 100,
            min: Math.round(minValue),
            max: Math.round(maxValue),
            average: Math.round(avgValue),
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          })
        }
      }

      return periodsData
    } catch (error) {
      console.error('Error fetching periods data:', error)
      return []
    }
  }

  // Obtener datos para un rango específico con cache
  getHistoricalCached = unstable_cache(
    async (from: string, to: string) => {
      return this.getHistoricalRiesgoPais({ from, to })
    },
    ['riesgo-pais-historical'],
    {
      revalidate: 300, // 5 minutos
      tags: ['riesgo-pais']
    }
  )

  // Obtener el último valor con cache
  getCurrentCached = unstable_cache(
    async () => {
      return this.getCurrentRiesgoPais()
    },
    ['riesgo-pais-current'],
    {
      revalidate: 60, // 1 minuto
      tags: ['riesgo-pais']
    }
  )
}

export const riesgoPaisService = new RiesgoPaisService()