// lib/api/services/poverty.ts
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export interface PovertyData {
  region: string
  dataType: string
  date: string
  period: string
  year: number
  semester: number
  poverty: {
    persons: number | null
    households: number | null
    gap: number | null
    severity: number | null
  }
  indigence: {
    persons: number | null
    households: number | null
    gap: number | null
    severity: number | null
  }
  variableName?: string | null
  variableValue?: number | null
  lastUpdate?: Date
}

export interface PovertySeriesData {
  region: string
  data: {
    period: string
    date: Date
    dataType: string
    povertyRate?: number | null
    povertyHouseholds?: number | null
    indigenceRate?: number | null
    indigenceHouseholds?: number | null
    povertyGap?: number | null
    indigenceGap?: number | null
  }[]
}

export interface PovertySummary {
  national: {
    povertyRate: number | null
    indigenceRate: number | null
    povertyHouseholds: number | null
    indigenceHouseholds: number | null
  } | null
  regionalHighlights: {
    highestPoverty: { region: string; value: number } | null
    lowestPoverty: { region: string; value: number } | null
    highestIndigence: { region: string; value: number } | null
    lowestIndigence: { region: string; value: number } | null
  }
  averages: {
    povertyPersons: number
    indigencePersons: number
  }
}

export interface PovertyMetadata {
  availableRegions: Array<{ value: string; label: string }>
  availablePeriods: Array<{
    value: string
    year: number
    semester: number
    date: Date
  }>
  availableDataTypes: Array<{ value: string; label: string }>
  availableMetrics: Array<{
    value: string
    label: string
    description: string
  }>
  statistics: {
    totalRecords: number
    dateRange: {
      from: Date | null
      to: Date | null
    }
    nationalAverages: {
      poverty: number | null
      indigence: number | null
    }
    extremes: {
      maxPoverty: number | null
      minPoverty: number | null
      maxIndigence: number | null
      minIndigence: number | null
    }
  }
}

class PovertyService {
  /**
   * Obtiene datos de pobreza con filtros opcionales
   */
  async getPovertyData(filters: {
    region?: string
    dataType?: string
    year?: number
    semester?: number
    period?: string
    date?: Date
    limit?: number
    getCurrentPeriod?: boolean
  } = {}): Promise<PovertyData[]> {
    try {
      const whereClause: Prisma.PovertyDataWhereInput = {}
      
      // Normalizar región si existe
      const normalizedRegion = filters.region ? this.normalizeRegionName(filters.region) : undefined
      
      // Aplicar filtros
      if (normalizedRegion) {
        whereClause.region = normalizedRegion
      }
      
      if (filters.dataType) {
        whereClause.dataType = filters.dataType
      }
      
      if (filters.year) {
        whereClause.year = filters.year
      }
      
      if (filters.semester) {
        whereClause.semester = filters.semester
      }
      
      if (filters.period) {
        whereClause.period = filters.period
      }
      
      if (filters.date) {
        whereClause.date = filters.date
      }
      
      // Si se pide el período actual y no hay otros filtros de fecha
      if (filters.getCurrentPeriod && !filters.date && !filters.year && !filters.period) {
        // Obtener el período más reciente con datos reales (no proyecciones futuras)
        const today = new Date()
        
        // Construir where para buscar el período más reciente
        const latestDataWhere: Prisma.PovertyDataWhereInput = {
          date: {
            lte: today // Solo fechas pasadas o actuales
          }
        }
        
        // Si hay filtro de región, aplicarlo también en la búsqueda del período
        if (normalizedRegion) {
          latestDataWhere.region = normalizedRegion
        }
        
        const latestData = await prisma.povertyData.findFirst({
          where: latestDataWhere,
          orderBy: {
            date: 'desc'
          },
          select: {
            date: true,
            period: true,
            region: true
          }
        })
        
        console.log('Latest data found:', latestData)
        
        if (latestData) {
          // Obtener todos los datos de ese período (manteniendo el filtro de región si existe)
          whereClause.period = latestData.period
          // La región ya está en whereClause si fue especificada
        }
      }
      
      console.log('Final whereClause:', whereClause)
      
      const data = await prisma.povertyData.findMany({
        where: whereClause,
        orderBy: [
          { date: 'desc' },
          { region: 'asc' }
        ],
        take: filters.limit || 30
      })
      
      // Si no se encontraron datos y se especificó una región, intentar con variaciones del nombre
      if (data.length === 0 && filters.region) {
        console.log(`No se encontraron datos para región: ${filters.region} (normalizada: ${normalizedRegion})`)
        
        // Buscar qué regiones están disponibles para debug
        const availableRegions = await prisma.povertyData.findMany({
          select: {
            region: true
          },
          distinct: ['region'],
          take: 20
        })
        console.log('Regiones disponibles:', [...new Set(availableRegions.map(r => r.region))])
      }
      
      return data.map(this.formatPovertyData)
      
    } catch (error) {
      console.error('Error obteniendo datos de pobreza:', error)
      throw error
    }
  }
  
  /**
   * Obtiene series temporales de pobreza
   */
  async getPovertyTimeSeries(params: {
    regions?: string[]
    metrics?: string[]
    groupBy?: 'semester' | 'year'
    from?: Date
    to?: Date
  }): Promise<PovertySeriesData[]> {
    try {
      const whereClause: Prisma.PovertyDataWhereInput = {}
      
      // Filtro por regiones - normalizar cada región
      if (params.regions && params.regions.length > 0) {
        whereClause.region = {
          in: params.regions.map(r => this.normalizeRegionName(r))
        }
      }
      
      // Filtro por rango de fechas
      if (params.from || params.to) {
        whereClause.date = {}
        if (params.from) whereClause.date.gte = params.from
        if (params.to) whereClause.date.lte = params.to
      }
      
      const data = await prisma.povertyData.findMany({
        where: whereClause,
        orderBy: [
          { date: 'asc' },
          { region: 'asc' }
        ]
      })
      
      return this.groupDataForSeries(data, params.groupBy || 'semester', params.metrics || ['poverty', 'indigence'])
      
    } catch (error) {
      console.error('Error obteniendo series temporales:', error)
      throw error
    }
  }
  
  /**
   * Obtiene un resumen estadístico de los datos
   */
  async getPovertySummary(data: any[]): Promise<PovertySummary> {
    const nationalData = data.filter(d => d.dataType === 'national')
    
    // Datos nacionales
    const national = nationalData.length > 0 ? {
      povertyRate: nationalData[0].povertyRatePersons,
      indigenceRate: nationalData[0].indigenceRatePersons,
      povertyHouseholds: nationalData[0].povertyRateHouseholds,
      indigenceHouseholds: nationalData[0].indigenceRateHouseholds
    } : null
    
    // Extremos regionales
    let highestPoverty = null
    let lowestPoverty = null
    let highestIndigence = null
    let lowestIndigence = null
    
    for (const record of data) {
      if (record.povertyRatePersons !== null) {
        if (!highestPoverty || record.povertyRatePersons > highestPoverty.value) {
          highestPoverty = { region: record.region, value: record.povertyRatePersons }
        }
        if (!lowestPoverty || record.povertyRatePersons < lowestPoverty.value) {
          lowestPoverty = { region: record.region, value: record.povertyRatePersons }
        }
      }
      
      if (record.indigenceRatePersons !== null) {
        if (!highestIndigence || record.indigenceRatePersons > highestIndigence.value) {
          highestIndigence = { region: record.region, value: record.indigenceRatePersons }
        }
        if (!lowestIndigence || record.indigenceRatePersons < lowestIndigence.value) {
          lowestIndigence = { region: record.region, value: record.indigenceRatePersons }
        }
      }
    }
    
    // Promedios
    const validPovertyData = data.filter(d => d.povertyRatePersons !== null)
    const validIndigenceData = data.filter(d => d.indigenceRatePersons !== null)
    
    const averages = {
      povertyPersons: validPovertyData.length > 0
        ? validPovertyData.reduce((sum, d) => sum + d.povertyRatePersons, 0) / validPovertyData.length
        : 0,
      indigencePersons: validIndigenceData.length > 0
        ? validIndigenceData.reduce((sum, d) => sum + d.indigenceRatePersons, 0) / validIndigenceData.length
        : 0
    }
    
    return {
      national,
      regionalHighlights: {
        highestPoverty,
        lowestPoverty,
        highestIndigence,
        lowestIndigence
      },
      averages
    }
  }
  
  /**
   * Obtiene metadatos y estadísticas disponibles
   */
  async getPovertyMetadata(): Promise<PovertyMetadata> {
    try {
      // Obtener regiones únicas
      const regions = await prisma.povertyData.findMany({
        select: {
          region: true
        },
        distinct: ['region'],
        orderBy: {
          region: 'asc'
        }
      })
      
      // Obtener períodos disponibles
      const periods = await prisma.povertyData.findMany({
        select: {
          period: true,
          year: true,
          semester: true,
          date: true
        },
        distinct: ['period'],
        orderBy: {
          date: 'desc'
        }
      })
      
      // Obtener tipos de datos disponibles
      const dataTypes = await prisma.povertyData.findMany({
        select: {
          dataType: true
        },
        distinct: ['dataType']
      })
      
      // Estadísticas generales
      const stats = await prisma.povertyData.aggregate({
        _count: true,
        _max: {
          date: true,
          povertyRatePersons: true,
          indigenceRatePersons: true
        },
        _min: {
          date: true,
          povertyRatePersons: true,
          indigenceRatePersons: true
        },
        _avg: {
          povertyRatePersons: true,
          indigenceRatePersons: true
        }
      })
      
      return {
        availableRegions: regions.map(r => ({
          value: r.region,
          label: this.getRegionLabel(r.region)
        })),
        availablePeriods: periods.map(p => ({
          value: p.period,
          year: p.year,
          semester: p.semester,
          date: p.date
        })),
        availableDataTypes: dataTypes.map(dt => ({
          value: dt.dataType,
          label: this.getDataTypeLabel(dt.dataType)
        })),
        availableMetrics: [
          { value: 'poverty', label: 'Pobreza', description: 'Tasa de pobreza por personas y hogares' },
          { value: 'indigence', label: 'Indigencia', description: 'Tasa de indigencia por personas y hogares' },
          { value: 'gaps', label: 'Brechas', description: 'Brechas de pobreza e indigencia' },
          { value: 'severity', label: 'Severidad', description: 'Severidad de la pobreza e indigencia' },
          { value: 'all', label: 'Todos', description: 'Todos los indicadores disponibles' }
        ],
        statistics: {
          totalRecords: stats._count,
          dateRange: {
            from: stats._min.date,
            to: stats._max.date
          },
          nationalAverages: {
            poverty: stats._avg.povertyRatePersons,
            indigence: stats._avg.indigenceRatePersons
          },
          extremes: {
            maxPoverty: stats._max.povertyRatePersons,
            minPoverty: stats._min.povertyRatePersons,
            maxIndigence: stats._max.indigenceRatePersons,
            minIndigence: stats._min.indigenceRatePersons
          }
        }
      }
      
    } catch (error) {
      console.error('Error obteniendo metadatos de pobreza:', error)
      throw error
    }
  }
  
  /**
   * Formatea datos de pobreza para la respuesta
   */
  private formatPovertyData(data: any): PovertyData {
    return {
      region: data.region,
      dataType: data.dataType,
      date: data.date.toISOString().split('T')[0],
      period: data.period,
      year: data.year,
      semester: data.semester,
      poverty: {
        persons: data.povertyRatePersons,
        households: data.povertyRateHouseholds,
        gap: data.povertyGap,
        severity: data.povertySeverity
      },
      indigence: {
        persons: data.indigenceRatePersons,
        households: data.indigenceRateHouseholds,
        gap: data.indigenceGap,
        severity: data.indigenceSeverity
      },
      variableName: data.variableName,
      variableValue: data.variableValue,
      lastUpdate: data.updatedAt
    }
  }
  
  /**
   * Agrupa datos para series temporales
   */
  private groupDataForSeries(
    data: any[],
    groupBy: 'semester' | 'year',
    metrics: string[]
  ): PovertySeriesData[] {
    const grouped = new Map<string, Map<string, any>>()
    
    for (const record of data) {
      const key = groupBy === 'year' ? record.year.toString() : record.period
      const region = record.region
      
      if (!grouped.has(region)) {
        grouped.set(region, new Map())
      }
      
      const regionData = grouped.get(region)!
      
      if (!regionData.has(key)) {
        regionData.set(key, {
          period: key,
          date: record.date,
          dataType: record.dataType
        })
      }
      
      const periodData = regionData.get(key)!
      
      // Agregar métricas solicitadas
      if (metrics.includes('poverty')) {
        periodData.povertyRate = record.povertyRatePersons
        periodData.povertyHouseholds = record.povertyRateHouseholds
      }
      
      if (metrics.includes('indigence')) {
        periodData.indigenceRate = record.indigenceRatePersons
        periodData.indigenceHouseholds = record.indigenceRateHouseholds
      }
      
      if (metrics.includes('gaps')) {
        periodData.povertyGap = record.povertyGap
        periodData.indigenceGap = record.indigenceGap
      }
      
      regionData.set(key, periodData)
    }
    
    // Convertir a array de series
    const result: PovertySeriesData[] = []
    
    for (const [region, periods] of grouped.entries()) {
      result.push({
        region,
        data: Array.from(periods.values())
      })
    }
    
    return result
  }
  
  /**
   * Normaliza el nombre de la región para búsquedas
   */
  private normalizeRegionName(region: string): string {
    const mappings: Record<string, string> = {
      // Mapeos para nombres comunes a los reales en la BD
      'NACIONAL': 'Total 31 aglomerados',
      'TOTAL_NACIONAL': 'Total 31 aglomerados',
      'ARGENTINA': 'Total 31 aglomerados',
      'PAIS': 'Total 31 aglomerados',
      'TOTAL': 'Total 31 aglomerados',
      
      // Gran Buenos Aires
      'GBA': 'Gran Buenos Aires',
      'GRAN_BUENOS_AIRES': 'Gran Buenos Aires',
      'GRAN BUENOS AIRES': 'Gran Buenos Aires',
      
      // Regiones exactas como están en la BD
      'PATAGONIA': 'Patagonia',
      'PAMPEANA': 'Pampeana',
      'CUYO': 'Cuyo',
      'NOROESTE': 'Noroeste',
      'NORESTE': 'Noreste',
      'NOA': 'Noroeste',
      'NEA': 'Noreste',
      
      // Por si acaso, mantener los nombres exactos
      'Patagonia': 'Patagonia',
      'Pampeana': 'Pampeana',
      'Cuyo': 'Cuyo',
      'Noroeste': 'Noroeste',
      'Noreste': 'Noreste',
      'Gran Buenos Aires': 'Gran Buenos Aires',
      'Total 31 aglomerados': 'Total 31 aglomerados'
    }
    
    // Primero intentar con uppercase
    const upperRegion = region.toUpperCase()
    if (mappings[upperRegion]) {
      return mappings[upperRegion]
    }
    
    // Luego intentar con el nombre original
    if (mappings[region]) {
      return mappings[region]
    }
    
    // Si no hay mapeo, devolver el original
    return region
  }
  
  /**
   * Obtiene etiqueta para región
   */
  private getRegionLabel(region: string): string {
    const labels: Record<string, string> = {
      // Nombres como están en la BD -> Labels amigables
      'Total 31 aglomerados': 'Total Nacional',
      'Gran Buenos Aires': 'Gran Buenos Aires (GBA)',
      'Patagonia': 'Patagonia',
      'Pampeana': 'Región Pampeana',
      'Cuyo': 'Región de Cuyo',
      'Noroeste': 'Noroeste Argentino (NOA)',
      'Noreste': 'Noreste Argentino (NEA)',
      
      // Por compatibilidad con códigos
      'NACIONAL': 'Total Nacional',
      'GBA': 'Gran Buenos Aires',
      'NOA': 'Noroeste Argentino',
      'NEA': 'Noreste Argentino',
      'PAMPEANA': 'Región Pampeana',
      'PATAGONIA': 'Patagonia',
      'CUYO': 'Región de Cuyo'
    }
    
    return labels[region] || region
  }
  
  /**
   * Obtiene etiqueta para tipo de datos
   */
  private getDataTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'national': 'Nacional',
      'regional': 'Regional',
      'urban': 'Urbano',
      'rural': 'Rural'
    }
    
    return labels[type] || type
  }
}

export const povertyService = new PovertyService()
export default povertyService