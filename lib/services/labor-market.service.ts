// lib/services/labor-market.service.ts
import { prisma } from '@/lib/db/prisma'
import { unstable_cache } from 'next/cache'

interface CurrentLaborData {
  date: string
  period: string
  activityRate: number | null
  employmentRate: number | null
  unemploymentRate: number | null
  region: string
  gender?: string | null
  ageGroup?: string | null
  demographicSegment?: string | null
}

interface RegionalData {
  region: string
  unemploymentRate: number
  employmentRate: number
  activityRate: number
  variationInterannual?: number
  variationTrimestral?: number
}

interface HistoricalDataPoint {
  date: string
  value: number
  region?: string
  indicator?: string
}

interface LaborStats {
  nationalAverage: {
    activityRate: number
    employmentRate: number
    unemploymentRate: number
  }
  bestPerforming: {
    region: string
    unemploymentRate: number
  }
  worstPerforming: {
    region: string
    unemploymentRate: number
  }
  youthUnemployment: number | null
  genderGap: {
    male: number
    female: number
    difference: number
  } | null
}

class LaborMarketService {
  // Obtener datos actuales nacionales
  async getCurrentNationalData(): Promise<CurrentLaborData | null> {
    try {
      const current = await prisma.laborMarket.findFirst({
        where: {
          dataType: 'regional',
          region: 'Total 31 aglomerados',
          gender: 'Total',
          ageGroup: 'Total'
        },
        orderBy: {
          date: 'desc'
        }
      })

      if (!current) {
        return null
      }

      return {
        date: current.date.toISOString(),
        period: current.period,
        activityRate: current.activityRate,
        employmentRate: current.employmentRate,
        unemploymentRate: current.unemploymentRate,
        region: current.region,
        gender: current.gender,
        ageGroup: current.ageGroup,
        demographicSegment: current.demographicSegment
      }
    } catch (error) {
      console.error('Error fetching current national data:', error)
      return null
    }
  }

  // Obtener datos regionales
  async getRegionalData(): Promise<RegionalData[]> {
    try {
      const regions = [
        'Región Patagónica',
        'Región NOA',
        'Región Cuyo',
        'Región NEA',
        'Región Pampeana',
        'Gran Buenos Aires',
        'Partidos del Gran Buenos Aires'
      ]

      const latestDate = await prisma.laborMarket.findFirst({
        where: {
          dataType: 'regional'
        },
        orderBy: {
          date: 'desc'
        },
        select: {
          date: true
        }
      })

      if (!latestDate) return []

      const regionalData = await prisma.laborMarket.findMany({
        where: {
          date: latestDate.date,
          dataType: 'regional',
          region: { in: regions },
          gender: 'Total',
          ageGroup: 'Total'
        }
      })

      // Obtener datos del año anterior para calcular variación
      const lastYear = new Date(latestDate.date)
      lastYear.setFullYear(lastYear.getFullYear() - 1)

      const lastYearData = await prisma.laborMarket.findMany({
        where: {
          date: {
            gte: new Date(lastYear.getFullYear(), lastYear.getMonth() - 1, 1),
            lte: new Date(lastYear.getFullYear(), lastYear.getMonth() + 1, 31)
          },
          dataType: 'regional',
          region: { in: regions },
          gender: 'Total',
          ageGroup: 'Total'
        }
      })

      return regionalData.map(current => {
        const lastYearRegion = lastYearData.find(d => d.region === current.region)
        
        return {
          region: current.region,
          unemploymentRate: current.unemploymentRate || 0,
          employmentRate: current.employmentRate || 0,
          activityRate: current.activityRate || 0,
          variationInterannual: lastYearRegion && current.unemploymentRate && lastYearRegion.unemploymentRate
            ? current.unemploymentRate - lastYearRegion.unemploymentRate
            : undefined,
          variationTrimestral: undefined // Implementar si tienes datos trimestrales
        }
      })
    } catch (error) {
      console.error('Error fetching regional data:', error)
      return []
    }
  }

  // Obtener datos históricos para gráfico
  async getHistoricalData(params: {
    indicators: string[] // ['unemployment', 'employment', 'activity']
    regions: string[]
    from: string
    to: string
  }): Promise<HistoricalDataPoint[]> {
    try {
      const { indicators, regions, from, to } = params

      const data = await prisma.laborMarket.findMany({
        where: {
          date: {
            gte: new Date(from),
            lte: new Date(to)
          },
          region: { in: regions },
          gender: 'Total',
          ageGroup: 'Total'
        },
        orderBy: {
          date: 'asc'
        }
      })

      const historicalData: HistoricalDataPoint[] = []

      data.forEach(record => {
        indicators.forEach(indicator => {
          let value: number | null = null
          
          switch(indicator) {
            case 'unemployment':
              value = record.unemploymentRate
              break
            case 'employment':
              value = record.employmentRate
              break
            case 'activity':
              value = record.activityRate
              break
          }

          if (value !== null) {
            historicalData.push({
              date: record.date.toISOString().split('T')[0],
              value,
              region: record.region,
              indicator
            })
          }
        })
      })

      return historicalData
    } catch (error) {
      console.error('Error fetching historical data:', error)
      return []
    }
  }

  // Obtener datos demográficos
  async getDemographicData() {
    try {
      const latestDate = await prisma.laborMarket.findFirst({
        where: {
          dataType: 'demographic'
        },
        orderBy: {
          date: 'desc'
        },
        select: {
          date: true
        }
      })

      if (!latestDate) return null

      // Desempleo juvenil
      const youthData = await prisma.laborMarket.findFirst({
        where: {
          date: latestDate.date,
          dataType: 'demographic',
          ageGroup: '14-29 años',
          gender: 'Total'
        }
      })

      // Brecha de género
      const maleData = await prisma.laborMarket.findFirst({
        where: {
          date: latestDate.date,
          dataType: 'demographic',
          gender: 'Varones',
          ageGroup: 'Total'
        }
      })

      const femaleData = await prisma.laborMarket.findFirst({
        where: {
          date: latestDate.date,
          dataType: 'demographic',
          gender: 'Mujeres',
          ageGroup: 'Total'
        }
      })

      return {
        youth: youthData ? {
          unemploymentRate: youthData.unemploymentRate,
          employmentRate: youthData.employmentRate,
          activityRate: youthData.activityRate
        } : null,
        gender: maleData && femaleData ? {
          male: {
            unemploymentRate: maleData.unemploymentRate,
            employmentRate: maleData.employmentRate,
            activityRate: maleData.activityRate
          },
          female: {
            unemploymentRate: femaleData.unemploymentRate,
            employmentRate: femaleData.employmentRate,
            activityRate: femaleData.activityRate
          }
        } : null
      }
    } catch (error) {
      console.error('Error fetching demographic data:', error)
      return null
    }
  }

  // Obtener estadísticas generales
  async getStats(): Promise<LaborStats | null> {
    try {
      const nationalData = await this.getCurrentNationalData()
      const regionalData = await this.getRegionalData()
      const demographicData = await this.getDemographicData()

      if (!nationalData || regionalData.length === 0) {
        return null
      }

      // Encontrar mejor y peor región por desempleo
      const sortedByUnemployment = [...regionalData].sort((a, b) => 
        (a.unemploymentRate || 0) - (b.unemploymentRate || 0)
      )

      const bestPerforming = sortedByUnemployment[0]
      const worstPerforming = sortedByUnemployment[sortedByUnemployment.length - 1]

      return {
        nationalAverage: {
          activityRate: nationalData.activityRate || 0,
          employmentRate: nationalData.employmentRate || 0,
          unemploymentRate: nationalData.unemploymentRate || 0
        },
        bestPerforming: {
          region: bestPerforming.region,
          unemploymentRate: bestPerforming.unemploymentRate
        },
        worstPerforming: {
          region: worstPerforming.region,
          unemploymentRate: worstPerforming.unemploymentRate
        },
        youthUnemployment: demographicData?.youth?.unemploymentRate || null,
        genderGap: demographicData?.gender ? {
          male: demographicData.gender.male.unemploymentRate || 0,
          female: demographicData.gender.female.unemploymentRate || 0,
          difference: (demographicData.gender.female.unemploymentRate || 0) - 
                     (demographicData.gender.male.unemploymentRate || 0)
        } : null
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return null
    }
  }

  // Versiones con caché
  getCurrentNationalCached = unstable_cache(
    async () => this.getCurrentNationalData(),
    ['labor-market-current'],
    { revalidate: 3600, tags: ['labor-market'] }
  )

  getRegionalCached = unstable_cache(
    async () => this.getRegionalData(),
    ['labor-market-regional'],
    { revalidate: 3600, tags: ['labor-market'] }
  )

  getStatsCached = unstable_cache(
    async () => this.getStats(),
    ['labor-market-stats'],
    { revalidate: 3600, tags: ['labor-market'] }
  )
}

export const laborMarketService = new LaborMarketService()