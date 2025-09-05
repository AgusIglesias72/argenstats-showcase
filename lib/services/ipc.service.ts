// lib/services/ipc.service.ts
import { prisma } from '@/lib/db/prisma'
import { IPC_COMPONENTS, IPC_REGIONS } from '@/lib/api/constants/inflation'

export interface IPCData {
  date: string
  component: {
    code: string
    name: string
    type: string
  }
  region: string
  values: {
    monthly: number | null
    yearly: number | null
    accumulated: number | null
  }
  index: number
}

export interface IPCHistoricalData {
  date: string
  values: {
    monthly: number | null
    yearly: number | null
    accumulated: number | null
  }
  index: number
}

export interface IPCComponentData {
  component: {
    code: string
    name: string
    type: string
  }
  values: {
    monthly: number | null
    yearly: number | null
    accumulated: number | null
  }
  index: number
  date: string
}

class IPCService {
  /**
   * Obtiene el IPC más reciente para un componente y región
   */
  async getCurrentIPC(
    componentCode: keyof typeof IPC_COMPONENTS = 'GENERAL',
    region: keyof typeof IPC_REGIONS = 'Nacional'
  ): Promise<IPCData | null> {
    try {
      const latest = await prisma.ipc.findFirst({
        where: {
          componentCode,
          region
        },
        orderBy: {
          date: 'desc'
        }
      })

      if (!latest) {
        console.error(`No se encontraron datos de IPC para ${componentCode} en ${region}`)
        return null
      }

      return {
        date: latest.date.toISOString().split('T')[0],
        component: {
          code: latest.componentCode,
          name: latest.component,
          type: latest.componentType
        },
        region: latest.region,
        values: {
          monthly: latest.monthlyPctChange,
          yearly: latest.yearlyPctChange,
          accumulated: latest.accumulatedPctChange
        },
        index: latest.indexValue
      }
    } catch (error) {
      console.error('Error obteniendo IPC actual:', error)
      return null
    }
  }

  /**
   * Obtiene todos los componentes del IPC para una fecha o la más reciente
   */
  async getIPCComponents(
    date?: string | null,
    region: keyof typeof IPC_REGIONS = 'Nacional'
  ): Promise<IPCComponentData[]> {
    try {
      let targetDate: Date

      if (date) {
        targetDate = new Date(date + 'T00:00:00')
      } else {
        // Obtener la fecha más reciente disponible
        const latestRecord = await prisma.ipc.findFirst({
          where: { region },
          orderBy: { date: 'desc' },
          select: { date: true }
        })

        if (!latestRecord) {
          console.error('No se encontraron datos de IPC')
          return []
        }

        targetDate = latestRecord.date
      }

      // Obtener todos los componentes para esa fecha
      const components = await prisma.ipc.findMany({
        where: {
          date: targetDate,
          region
        },
        orderBy: {
          componentCode: 'asc'
        }
      })

      return components.map(comp => ({
        component: {
          code: comp.componentCode,
          name: comp.component,
          type: comp.componentType
        },
        values: {
          monthly: comp.monthlyPctChange,
          yearly: comp.yearlyPctChange,
          accumulated: comp.accumulatedPctChange
        },
        index: comp.indexValue,
        date: comp.date.toISOString().split('T')[0]
      }))
    } catch (error) {
      console.error('Error obteniendo componentes del IPC:', error)
      return []
    }
  }

  /**
   * Obtiene datos históricos del IPC
   */
  async getHistoricalIPC(params: {
    from: string
    to: string
    componentCode?: keyof typeof IPC_COMPONENTS
    region?: keyof typeof IPC_REGIONS
    interval?: 'monthly' | 'quarterly' | 'yearly'
  }): Promise<IPCHistoricalData[]> {
    try {
      const {
        from,
        to,
        componentCode = 'GENERAL',
        region = 'Nacional',
        interval = 'monthly'
      } = params

      const startDate = new Date(from + 'T00:00:00')
      const endDate = new Date(to + 'T00:00:00')

      // Validación de fechas
      if (startDate >= endDate) {
        console.error('La fecha inicial debe ser anterior a la fecha final')
        return []
      }

      // Primero verificar si existen datos para esta combinación
      const count = await prisma.ipc.count({
        where: {
          componentCode,
          region,
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      if (count === 0) {
        console.warn(`No hay datos históricos para ${componentCode} en ${region}, usando GENERAL`)
        // Si no hay datos, intentar con GENERAL
        if (componentCode !== 'GENERAL') {
          return this.getHistoricalIPC({ ...params, componentCode: 'GENERAL' })
        }
        // Si tampoco hay GENERAL, intentar con Nacional
        if (region !== 'Nacional') {
          return this.getHistoricalIPC({ ...params, region: 'Nacional' })
        }
        return []
      }

      const data = await prisma.ipc.findMany({
        where: {
          componentCode,
          region,
          date: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: {
          date: 'asc'
        },
        take: 500 // Limitar resultados para evitar sobrecargas
      })

      // Si no necesitamos agrupar, devolver directamente
      if (interval === 'monthly') {
        return data.map(record => ({
          date: record.date.toISOString().split('T')[0],
          values: {
            monthly: record.monthlyPctChange,
            yearly: record.yearlyPctChange,
            accumulated: record.accumulatedPctChange
          },
          index: record.indexValue
        }))
      }

      // Agrupar por trimestre o año si es necesario
      return this.aggregateData(data, interval)
    } catch (error: any) {
      // Manejo específico para errores de timeout
      if (error.code === 'P2024') {
        console.error('Timeout de conexión a la base de datos. Reintentando con menos datos...')
        // Reducir el período y reintentar
        const newFrom = new Date(params.to)
        newFrom.setFullYear(newFrom.getFullYear() - 1) // Solo último año
        return this.getHistoricalIPC({
          ...params,
          from: newFrom.toISOString().split('T')[0]
        })
      }
      console.error('Error obteniendo datos históricos del IPC:', error)
      return []
    }
  }

  /**
   * Obtiene el IPC por regiones para una fecha específica
   */
  async getIPCByRegions(
    date?: string | null,
    componentCode: keyof typeof IPC_COMPONENTS = 'GENERAL'
  ): Promise<IPCData[]> {
    try {
      let targetDate: Date

      if (date) {
        targetDate = new Date(date + 'T00:00:00')
      } else {
        // Obtener la fecha más reciente
        const latestRecord = await prisma.ipc.findFirst({
          where: { componentCode },
          orderBy: { date: 'desc' },
          select: { date: true }
        })

        if (!latestRecord) {
          console.error('No se encontraron datos de IPC')
          return []
        }

        targetDate = latestRecord.date
      }

      const regionalData = await prisma.ipc.findMany({
        where: {
          date: targetDate,
          componentCode
        },
        orderBy: {
          region: 'asc'
        }
      })

      return regionalData.map(record => ({
        date: record.date.toISOString().split('T')[0],
        component: {
          code: record.componentCode,
          name: record.component,
          type: record.componentType
        },
        region: record.region,
        values: {
          monthly: record.monthlyPctChange,
          yearly: record.yearlyPctChange,
          accumulated: record.accumulatedPctChange
        },
        index: record.indexValue
      }))
    } catch (error) {
      console.error('Error obteniendo IPC por regiones:', error)
      return []
    }
  }

  /**
   * Calcula el ajuste por inflación entre dos fechas
   */
  async calculateInflationAdjustment(params: {
    amount: number
    from: string
    to: string
    componentCode?: keyof typeof IPC_COMPONENTS
    region?: keyof typeof IPC_REGIONS
  }): Promise<{
    originalAmount: number
    adjustedAmount: number
    inflationRate: number
    purchasingPowerLoss: number
    period: {
      from: string
      to: string
      months: number
    }
  } | null> {
    try {
      const {
        amount,
        from,
        to,
        componentCode = 'GENERAL',
        region = 'Nacional'
      } = params

      const fromDate = new Date(from + 'T00:00:00')
      const toDate = new Date(to + 'T00:00:00')

      // Validaciones
      if (amount <= 0) {
        console.error('El monto debe ser mayor a 0')
        return null
      }

      if (fromDate >= toDate) {
        console.error('La fecha inicial debe ser anterior a la fecha final')
        return null
      }

      // Obtener índices para ambas fechas
      const [fromData, toData] = await Promise.all([
        prisma.ipc.findFirst({
          where: {
            componentCode,
            region,
            date: {
              lte: fromDate
            }
          },
          orderBy: { date: 'desc' }
        }),
        prisma.ipc.findFirst({
          where: {
            componentCode,
            region,
            date: {
              lte: toDate
            }
          },
          orderBy: { date: 'desc' }
        })
      ])

      if (!fromData || !toData) {
        console.error('No se encontraron datos para las fechas especificadas')
        return null
      }

      // Calcular ajuste
      const adjustedAmount = amount * (toData.indexValue / fromData.indexValue)
      const inflationRate = ((toData.indexValue / fromData.indexValue) - 1) * 100
      const purchasingPowerLoss = (1 - (fromData.indexValue / toData.indexValue)) * 100

      // Calcular diferencia en meses
      const monthsDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + 
                        (toDate.getMonth() - fromDate.getMonth())

      return {
        originalAmount: amount,
        adjustedAmount: parseFloat(adjustedAmount.toFixed(2)),
        inflationRate: parseFloat(inflationRate.toFixed(2)),
        purchasingPowerLoss: parseFloat(purchasingPowerLoss.toFixed(2)),
        period: {
          from: from,
          to: to,
          months: monthsDiff
        }
      }
    } catch (error) {
      console.error('Error calculando ajuste por inflación:', error)
      return null
    }
  }

  /**
   * Obtiene estadísticas del IPC
   */
  async getIPCStats(region: keyof typeof IPC_REGIONS = 'Nacional'): Promise<{
    lastUpdate: string
    currentInflation: {
      monthly: number | null
      yearly: number | null
      accumulated: number | null
    }
    averages: {
      last3Months: number | null
      last6Months: number | null
      last12Months: number | null
    }
  } | null> {
    try {
      // Obtener el dato más reciente
      const current = await this.getCurrentIPC('GENERAL', region)
      
      if (!current) {
        return null
      }

      // Calcular promedios históricos
      const endDate = new Date(current.date)
      const threeMonthsAgo = new Date(endDate)
      threeMonthsAgo.setMonth(endDate.getMonth() - 3)
      
      const sixMonthsAgo = new Date(endDate)
      sixMonthsAgo.setMonth(endDate.getMonth() - 6)
      
      const twelveMonthsAgo = new Date(endDate)
      twelveMonthsAgo.setMonth(endDate.getMonth() - 12)

      const [last3Months, last6Months, last12Months] = await Promise.all([
        this.calculateAverageInflation(threeMonthsAgo, endDate, region),
        this.calculateAverageInflation(sixMonthsAgo, endDate, region),
        this.calculateAverageInflation(twelveMonthsAgo, endDate, region)
      ])

      return {
        lastUpdate: current.date,
        currentInflation: current.values,
        averages: {
          last3Months,
          last6Months,
          last12Months
        }
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas del IPC:', error)
      return null
    }
  }

  /**
   * Calcula el promedio de inflación mensual para un período
   */
  private async calculateAverageInflation(
    from: Date,
    to: Date,
    region: string
  ): Promise<number | null> {
    try {
      const data = await prisma.ipc.findMany({
        where: {
          componentCode: 'GENERAL',
          region,
          date: {
            gte: from,
            lte: to
          }
        },
        select: {
          monthlyPctChange: true
        }
      })

      if (data.length === 0) return null

      const validValues = data
        .map(d => d.monthlyPctChange)
        .filter((v): v is number => v !== null)

      if (validValues.length === 0) return null

      const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length
      return parseFloat(average.toFixed(2))
    } catch (error) {
      console.error('Error calculando promedio de inflación:', error)
      return null
    }
  }

  /**
   * Agrupa datos por trimestre o año
   */
  private aggregateData(
    data: any[],
    interval: 'quarterly' | 'yearly'
  ): IPCHistoricalData[] {
    // Implementación simplificada - en producción podrías hacer un agrupamiento más sofisticado
    if (interval === 'quarterly') {
      // Tomar un dato cada 3 meses
      return data.filter((_, index) => index % 3 === 0).map(record => ({
        date: record.date.toISOString().split('T')[0],
        values: {
          monthly: record.monthlyPctChange,
          yearly: record.yearlyPctChange,
          accumulated: record.accumulatedPctChange
        },
        index: record.indexValue
      }))
    }

    // Yearly: tomar un dato cada 12 meses
    return data.filter((_, index) => index % 12 === 0).map(record => ({
      date: record.date.toISOString().split('T')[0],
      values: {
        monthly: record.monthlyPctChange,
        yearly: record.yearlyPctChange,
        accumulated: record.accumulatedPctChange
      },
      index: record.indexValue
    }))
  }
}

// Exportar una instancia única del servicio
export const ipcService = new IPCService()