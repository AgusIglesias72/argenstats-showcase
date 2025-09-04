import { prisma } from '@/lib/db/prisma'

export class DataUpdater {
  async updateIPC(data: {
    date: Date
    value: number
    variation?: number
    source?: string
  }) {
    try {
      // Buscar o crear el indicador IPC
      const indicator = await prisma.indicator.upsert({
        where: { slug: 'ipc' },
        update: {},
        create: {
          slug: 'ipc',
          name: 'Índice de Precios al Consumidor',
          description: 'Mide la evolución de los precios de bienes y servicios',
          unit: '%',
          source: 'INDEC',
          category: 'precios',
          isActive: true
        }
      })

      // Crear o actualizar el valor
      const indicatorValue = await prisma.indicatorValue.upsert({
        where: {
          indicatorId_date: {
            indicatorId: indicator.id,
            date: data.date
          }
        },
        update: {
          value: data.value,
          variation: data.variation
        },
        create: {
          indicatorId: indicator.id,
          date: data.date,
          value: data.value,
          variation: data.variation
        }
      })

      return indicatorValue
    } catch (error) {
      console.error('Error updating IPC:', error)
      throw error
    }
  }

  async updateEMAE(data: {
    date: Date
    value: number
    indexValue?: number
    yearOverYear?: number
    monthOverMonth?: number
  }) {
    try {
      const indicator = await prisma.indicator.upsert({
        where: { slug: 'emae' },
        update: {},
        create: {
          slug: 'emae',
          name: 'Estimador Mensual de Actividad Económica',
          description: 'Indicador de la evolución mensual de la actividad económica',
          unit: 'índice',
          source: 'INDEC',
          category: 'actividad',
          isActive: true
        }
      })

      const indicatorValue = await prisma.indicatorValue.upsert({
        where: {
          indicatorId_date: {
            indicatorId: indicator.id,
            date: data.date
          }
        },
        update: {
          value: data.value,
          variation: data.monthOverMonth,
          metadata: {
            indexValue: data.indexValue,
            yearOverYear: data.yearOverYear,
            monthOverMonth: data.monthOverMonth
          }
        },
        create: {
          indicatorId: indicator.id,
          date: data.date,
          value: data.value,
          variation: data.monthOverMonth,
          metadata: {
            indexValue: data.indexValue,
            yearOverYear: data.yearOverYear,
            monthOverMonth: data.monthOverMonth
          }
        }
      })

      return indicatorValue
    } catch (error) {
      console.error('Error updating EMAE:', error)
      throw error
    }
  }
}