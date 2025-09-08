// lib/api/services/labor.ts
import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'

export interface LaborMarketData {
  date: string
  period: string
  dataType: string
  region: string
  gender?: string | null
  ageGroup?: string | null
  demographicSegment?: string | null
  rates: {
    activity: number | null
    employment: number | null
    unemployment: number | null
  }
  population: {
    total: number | null
    economicallyActive: number | null
    employed: number | null
    unemployed: number | null
    inactive: number | null
  }
  lastUpdate?: Date
}

export interface LaborMarketSummary {
  national: {
    activityRate: number | null
    employmentRate: number | null
    unemploymentRate: number | null
    totalPopulation: number | null
  } | null
  byGender: {
    male: {
      activityRate: number | null
      employmentRate: number | null
      unemploymentRate: number | null
    } | null
    female: {
      activityRate: number | null
      employmentRate: number | null
      unemploymentRate: number | null
    } | null
  }
  byAgeGroup: Array<{
    ageGroup: string
    activityRate: number | null
    employmentRate: number | null
    unemploymentRate: number | null
  }>
  regionalHighlights: {
    highestUnemployment: { region: string; value: number } | null
    lowestUnemployment: { region: string; value: number } | null
    highestActivity: { region: string; value: number } | null
    lowestActivity: { region: string; value: number } | null
  }
}

export interface LaborMarketSeriesData {
  region: string
  data: {
    period: string
    date: Date
    activityRate?: number | null
    employmentRate?: number | null
    unemploymentRate?: number | null
    totalPopulation?: number | null
  }[]
}

export interface LaborMarketMetadata {
  availableRegions: Array<{ value: string; label: string }>
  availablePeriods: Array<{
    value: string
    date: Date
  }>
  availableGenders: Array<{ value: string; label: string }>
  availableAgeGroups: Array<{ value: string; label: string }>
  availableDemographicSegments: Array<{ value: string; label: string }>
  statistics: {
    totalRecords: number
    dateRange: {
      from: Date | null
      to: Date | null
    }
    nationalAverages: {
      activityRate: number | null
      employmentRate: number | null
      unemploymentRate: number | null
    }
  }
}

class LaborMarketService {
  /**
   * Obtiene datos del mercado laboral con filtros opcionales
   */
  async getLaborMarketData(filters: {
    region?: string
    dataType?: string
    period?: string
    date?: Date
    gender?: string
    ageGroup?: string
    demographicSegment?: string
    limit?: number
    getCurrentPeriod?: boolean
  } = {}): Promise<LaborMarketData[]> {
    try {
      const whereClause: Prisma.LaborMarketWhereInput = {}
      
      // Normalizar región si existe
      const normalizedRegion = filters.region ? this.normalizeRegionName(filters.region) : undefined
      
      // Aplicar filtros
      if (normalizedRegion) {
        whereClause.region = normalizedRegion
      }
      
      if (filters.dataType) {
        whereClause.dataType = filters.dataType
      }
      
      if (filters.period) {
        whereClause.period = filters.period
      }
      
      if (filters.date) {
        whereClause.date = filters.date
      }
      
      if (filters.gender) {
        whereClause.gender = this.normalizeGender(filters.gender)
      }
      
      if (filters.ageGroup) {
        whereClause.ageGroup = filters.ageGroup
      }
      
      if (filters.demographicSegment) {
        whereClause.demographicSegment = filters.demographicSegment
      }
      
      // Si se pide el período actual y no hay otros filtros de fecha
      if (filters.getCurrentPeriod && !filters.date && !filters.period) {
        const today = new Date()
        
        // Construir where para buscar el período más reciente
        const latestDataWhere: Prisma.LaborMarketWhereInput = {
          date: {
            lte: today
          }
        }
        
        // Aplicar filtros adicionales para encontrar el período
        if (normalizedRegion) {
          latestDataWhere.region = normalizedRegion
        }
        
        if (filters.gender) {
          latestDataWhere.gender = this.normalizeGender(filters.gender)
        }
        
        const latestData = await prisma.laborMarket.findFirst({
          where: latestDataWhere,
          orderBy: {
            date: 'desc'
          },
          select: {
            date: true,
            period: true
          }
        })
        
        if (latestData) {
          whereClause.period = latestData.period
        }
      }
      
      const data = await prisma.laborMarket.findMany({
        where: whereClause,
        orderBy: [
          { date: 'desc' },
          { region: 'asc' },
          { gender: 'asc' },
          { ageGroup: 'asc' }
        ],
        take: filters.limit || 100
      })
      
      return data.map(this.formatLaborMarketData)
      
    } catch (error) {
      console.error('Error obteniendo datos del mercado laboral:', error)
      throw error
    }
  }
  
  /**
   * Obtiene datos agrupados por género
   */
  async getLaborMarketByGender(filters: {
    region?: string
    period?: string
    date?: Date
  } = {}): Promise<any> {
    try {
      const whereClause: Prisma.LaborMarketWhereInput = {
        gender: { not: null }
      }
      
      if (filters.region) {
        whereClause.region = this.normalizeRegionName(filters.region)
      }
      
      if (filters.period) {
        whereClause.period = filters.period
      }
      
      if (filters.date) {
        whereClause.date = filters.date
      } else {
        // Si no hay fecha, buscar el período más reciente
        const latestData = await prisma.laborMarket.findFirst({
          where: filters.region ? { region: this.normalizeRegionName(filters.region) } : {},
          orderBy: { date: 'desc' },
          select: { period: true }
        })
        
        if (latestData) {
          whereClause.period = latestData.period
        }
      }
      
      const data = await prisma.laborMarket.findMany({
        where: whereClause,
        orderBy: [
          { region: 'asc' },
          { gender: 'asc' }
        ]
      })
      
      // Agrupar por género
      const grouped = this.groupByGender(data)
      return grouped
      
    } catch (error) {
      console.error('Error obteniendo datos por género:', error)
      throw error
    }
  }
  
  /**
   * Obtiene datos agrupados por grupo etario
   */
  async getLaborMarketByAge(filters: {
    region?: string
    period?: string
    date?: Date
    gender?: string
  } = {}): Promise<any> {
    try {
      const whereClause: Prisma.LaborMarketWhereInput = {
        ageGroup: { not: null }
      }
      
      if (filters.region) {
        whereClause.region = this.normalizeRegionName(filters.region)
      }
      
      if (filters.period) {
        whereClause.period = filters.period
      }
      
      if (filters.date) {
        whereClause.date = filters.date
      } else {
        // Si no hay fecha, buscar el período más reciente
        const latestData = await prisma.laborMarket.findFirst({
          where: filters.region ? { region: this.normalizeRegionName(filters.region) } : {},
          orderBy: { date: 'desc' },
          select: { period: true }
        })
        
        if (latestData) {
          whereClause.period = latestData.period
        }
      }
      
      if (filters.gender) {
        whereClause.gender = this.normalizeGender(filters.gender)
      }
      
      const data = await prisma.laborMarket.findMany({
        where: whereClause,
        orderBy: [
          { region: 'asc' },
          { ageGroup: 'asc' }
        ]
      })
      
      // Agrupar por edad
      const grouped = this.groupByAge(data)
      return grouped
      
    } catch (error) {
      console.error('Error obteniendo datos por edad:', error)
      throw error
    }
  }
  
  /**
   * Obtiene series temporales del mercado laboral
   */
  async getLaborMarketTimeSeries(params: {
    regions?: string[]
    metrics?: string[]
    groupBy?: 'quarter' | 'year'
    from?: Date
    to?: Date
    gender?: string
    ageGroup?: string
  }): Promise<LaborMarketSeriesData[]> {
    try {
      const whereClause: Prisma.LaborMarketWhereInput = {}
      
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
      
      // Filtros adicionales
      if (params.gender) {
        whereClause.gender = this.normalizeGender(params.gender)
      }
      
      if (params.ageGroup) {
        whereClause.ageGroup = params.ageGroup
      }
      
      const data = await prisma.laborMarket.findMany({
        where: whereClause,
        orderBy: [
          { date: 'asc' },
          { region: 'asc' }
        ]
      })
      
      return this.groupDataForSeries(data, params.groupBy || 'quarter', params.metrics || ['activity', 'employment', 'unemployment'])
      
    } catch (error) {
      console.error('Error obteniendo series temporales:', error)
      throw error
    }
  }
  
  /**
   * Obtiene un resumen estadístico de los datos
   */
  async getLaborMarketSummary(data: any[]): Promise<LaborMarketSummary> {
    const nationalData = data.filter(d => 
      d.dataType === 'national' && 
      d.gender === 'Total' && 
      d.ageGroup === 'Total'
    )
    
    // Datos nacionales
    const national = nationalData.length > 0 ? {
      activityRate: nationalData[0].activityRate,
      employmentRate: nationalData[0].employmentRate,
      unemploymentRate: nationalData[0].unemploymentRate,
      totalPopulation: nationalData[0].totalPopulation
    } : null
    
    // Por género
    const maleData = data.find(d => d.gender === 'Varones' && d.ageGroup === 'Total')
    const femaleData = data.find(d => d.gender === 'Mujeres' && d.ageGroup === 'Total')
    
    const byGender = {
      male: maleData ? {
        activityRate: maleData.activityRate,
        employmentRate: maleData.employmentRate,
        unemploymentRate: maleData.unemploymentRate
      } : null,
      female: femaleData ? {
        activityRate: femaleData.activityRate,
        employmentRate: femaleData.employmentRate,
        unemploymentRate: femaleData.unemploymentRate
      } : null
    }
    
    // Por grupo etario
    const ageGroups = data
      .filter(d => d.ageGroup && d.ageGroup !== 'Total' && d.gender === 'Total')
      .map(d => ({
        ageGroup: d.ageGroup,
        activityRate: d.activityRate,
        employmentRate: d.employmentRate,
        unemploymentRate: d.unemploymentRate
      }))
    
    // Extremos regionales
    const regionalData = data.filter(d => 
      d.dataType === 'regional' && 
      d.gender === 'Total' && 
      d.ageGroup === 'Total'
    )
    
    let highestUnemployment = null
    let lowestUnemployment = null
    let highestActivity = null
    let lowestActivity = null
    
    for (const record of regionalData) {
      if (record.unemploymentRate !== null) {
        if (!highestUnemployment || record.unemploymentRate > highestUnemployment.value) {
          highestUnemployment = { region: record.region, value: record.unemploymentRate }
        }
        if (!lowestUnemployment || record.unemploymentRate < lowestUnemployment.value) {
          lowestUnemployment = { region: record.region, value: record.unemploymentRate }
        }
      }
      
      if (record.activityRate !== null) {
        if (!highestActivity || record.activityRate > highestActivity.value) {
          highestActivity = { region: record.region, value: record.activityRate }
        }
        if (!lowestActivity || record.activityRate < lowestActivity.value) {
          lowestActivity = { region: record.region, value: record.activityRate }
        }
      }
    }
    
    return {
      national,
      byGender,
      byAgeGroup: ageGroups,
      regionalHighlights: {
        highestUnemployment,
        lowestUnemployment,
        highestActivity,
        lowestActivity
      }
    }
  }
  
  /**
   * Obtiene metadatos y estadísticas disponibles
   */
  async getLaborMarketMetadata(): Promise<LaborMarketMetadata> {
    try {
      // Obtener regiones únicas
      const regions = await prisma.laborMarket.findMany({
        select: { region: true },
        distinct: ['region'],
        orderBy: { region: 'asc' }
      })
      
      // Obtener períodos disponibles
      const periods = await prisma.laborMarket.findMany({
        select: {
          period: true,
          date: true
        },
        distinct: ['period'],
        orderBy: { date: 'desc' }
      })
      
      // Obtener géneros únicos
      const genders = await prisma.laborMarket.findMany({
        select: { gender: true },
        distinct: ['gender'],
        where: { gender: { not: null } },
        orderBy: { gender: 'asc' }
      })
      
      // Obtener grupos etarios
      const ageGroups = await prisma.laborMarket.findMany({
        select: { ageGroup: true },
        distinct: ['ageGroup'],
        where: { ageGroup: { not: null } },
        orderBy: { ageGroup: 'asc' }
      })
      
      // Obtener segmentos demográficos
      const demographicSegments = await prisma.laborMarket.findMany({
        select: { demographicSegment: true },
        distinct: ['demographicSegment'],
        where: { demographicSegment: { not: null } }
      })
      
      // Estadísticas generales
      const stats = await prisma.laborMarket.aggregate({
        _count: true,
        _max: { date: true },
        _min: { date: true },
        _avg: {
          activityRate: true,
          employmentRate: true,
          unemploymentRate: true
        }
      })
      
      return {
        availableRegions: regions.map(r => ({
          value: r.region,
          label: this.getRegionLabel(r.region)
        })),
        availablePeriods: periods.map(p => ({
          value: p.period,
          date: p.date
        })),
        availableGenders: genders.map(g => ({
          value: g.gender || '',
          label: this.getGenderLabel(g.gender || '')
        })),
        availableAgeGroups: ageGroups.map(ag => ({
          value: ag.ageGroup || '',
          label: ag.ageGroup || ''
        })),
        availableDemographicSegments: demographicSegments.map(ds => ({
          value: ds.demographicSegment || '',
          label: ds.demographicSegment || ''
        })),
        statistics: {
          totalRecords: stats._count,
          dateRange: {
            from: stats._min.date,
            to: stats._max.date
          },
          nationalAverages: {
            activityRate: stats._avg.activityRate,
            employmentRate: stats._avg.employmentRate,
            unemploymentRate: stats._avg.unemploymentRate
          }
        }
      }
      
    } catch (error) {
      console.error('Error obteniendo metadatos del mercado laboral:', error)
      throw error
    }
  }
  
  /**
   * Formatea datos del mercado laboral para la respuesta
   */
  private formatLaborMarketData(data: any): LaborMarketData {
    return {
      date: data.date.toISOString().split('T')[0],
      period: data.period,
      dataType: data.dataType,
      region: data.region,
      gender: data.gender,
      ageGroup: data.ageGroup,
      demographicSegment: data.demographicSegment,
      rates: {
        activity: data.activityRate,
        employment: data.employmentRate,
        unemployment: data.unemploymentRate
      },
      population: {
        total: data.totalPopulation,
        economicallyActive: data.economicallyActivePopulation,
        employed: data.employedPopulation,
        unemployed: data.unemployedPopulation,
        inactive: data.inactivePopulation
      },
      lastUpdate: data.updatedAt
    }
  }
  
  /**
   * Agrupa datos por género
   */
  private groupByGender(data: any[]): any {
    const grouped: any = {}
    
    for (const record of data) {
      const region = record.region
      const gender = record.gender || 'Total'
      
      if (!grouped[region]) {
        grouped[region] = {}
      }
      
      grouped[region][gender] = {
        activityRate: record.activityRate,
        employmentRate: record.employmentRate,
        unemploymentRate: record.unemploymentRate,
        totalPopulation: record.totalPopulation,
        employedPopulation: record.employedPopulation,
        unemployedPopulation: record.unemployedPopulation
      }
    }
    
    return grouped
  }
  
  /**
   * Agrupa datos por edad
   */
  private groupByAge(data: any[]): any {
    const grouped: any = {}
    
    for (const record of data) {
      const region = record.region
      const ageGroup = record.ageGroup || 'Total'
      
      if (!grouped[region]) {
        grouped[region] = {}
      }
      
      grouped[region][ageGroup] = {
        activityRate: record.activityRate,
        employmentRate: record.employmentRate,
        unemploymentRate: record.unemploymentRate,
        totalPopulation: record.totalPopulation
      }
    }
    
    return grouped
  }
  
  /**
   * Agrupa datos para series temporales
   */
  private groupDataForSeries(
    data: any[],
    groupBy: 'quarter' | 'year',
    metrics: string[]
  ): LaborMarketSeriesData[] {
    const grouped = new Map<string, Map<string, any>>()
    
    for (const record of data) {
      const key = groupBy === 'year' 
        ? new Date(record.date).getFullYear().toString()
        : record.period
      const region = record.region
      
      if (!grouped.has(region)) {
        grouped.set(region, new Map())
      }
      
      const regionData = grouped.get(region)!
      
      if (!regionData.has(key)) {
        regionData.set(key, {
          period: key,
          date: record.date,
          count: 0,
          activityRate: 0,
          employmentRate: 0,
          unemploymentRate: 0,
          totalPopulation: 0
        })
      }
      
      const periodData = regionData.get(key)!
      
      // Promediar los valores si hay múltiples registros
      periodData.count++
      if (metrics.includes('activity') && record.activityRate) {
        periodData.activityRate = ((periodData.activityRate * (periodData.count - 1)) + record.activityRate) / periodData.count
      }
      if (metrics.includes('employment') && record.employmentRate) {
        periodData.employmentRate = ((periodData.employmentRate * (periodData.count - 1)) + record.employmentRate) / periodData.count
      }
      if (metrics.includes('unemployment') && record.unemploymentRate) {
        periodData.unemploymentRate = ((periodData.unemploymentRate * (periodData.count - 1)) + record.unemploymentRate) / periodData.count
      }
      if (metrics.includes('population') && record.totalPopulation) {
        periodData.totalPopulation = ((periodData.totalPopulation * (periodData.count - 1)) + record.totalPopulation) / periodData.count
      }
      
      regionData.set(key, periodData)
    }
    
    // Convertir a array de series
    const result: LaborMarketSeriesData[] = []
    
    for (const [region, periods] of grouped.entries()) {
      const data = Array.from(periods.values()).map(p => ({
        period: p.period,
        date: p.date,
        activityRate: p.activityRate || null,
        employmentRate: p.employmentRate || null,
        unemploymentRate: p.unemploymentRate || null,
        totalPopulation: p.totalPopulation || null
      }))
      
      result.push({ region, data })
    }
    
    return result
  }
  
  /**
   * Normaliza el nombre de la región
   */
  private normalizeRegionName(region: string): string {
    const mappings: Record<string, string> = {
      // Mapeos para nombres comunes
      'NACIONAL': 'Total 31 aglomerados',
      'TOTAL_NACIONAL': 'Total 31 aglomerados',
      'TOTAL': 'Total 31 aglomerados',
      
      // Regiones
      'GBA': 'GBA',
      'GRAN_BUENOS_AIRES': 'GBA',
      'PARTIDOS_GBA': 'Partidos del Gran Buenos Aires',
      'PARTIDOS': 'Partidos del Gran Buenos Aires',
      
      'PATAGONIA': 'Región Patagónica',
      'PATAGONICA': 'Región Patagónica',
      'PAMPEANA': 'Región Pampeana',
      'CUYO': 'Región Cuyo',
      'NOA': 'Región NOA',
      'NOROESTE': 'Región NOA',
      'NEA': 'Región NEA',
      'NORESTE': 'Región NEA'
    }
    
    const upperRegion = region.toUpperCase()
    return mappings[upperRegion] || region
  }
  
  /**
   * Normaliza el género
   */
  private normalizeGender(gender: string): string {
    const mappings: Record<string, string> = {
      'HOMBRE': 'Varones',
      'HOMBRES': 'Varones',
      'VARON': 'Varones',
      'VARONES': 'Varones',
      'MASCULINO': 'Varones',
      'M': 'Varones',
      
      'MUJER': 'Mujeres',
      'MUJERES': 'Mujeres',
      'FEMENINO': 'Mujeres',
      'F': 'Mujeres',
      
      'TOTAL': 'Total',
      'TODOS': 'Total',
      'AMBOS': 'Total'
    }
    
    const upperGender = gender.toUpperCase()
    return mappings[upperGender] || gender
  }
  
  /**
   * Obtiene etiqueta para región
   */
  private getRegionLabel(region: string): string {
    const labels: Record<string, string> = {
      'Total 31 aglomerados': 'Total Nacional',
      'GBA': 'Gran Buenos Aires',
      'Partidos del Gran Buenos Aires': 'Partidos del GBA',
      'Región Patagónica': 'Patagonia',
      'Región Pampeana': 'Región Pampeana',
      'Región Cuyo': 'Cuyo',
      'Región NOA': 'Noroeste Argentino',
      'Región NEA': 'Noreste Argentino'
    }
    
    return labels[region] || region
  }
  
  /**
   * Obtiene etiqueta para género
   */
  private getGenderLabel(gender: string): string {
    const labels: Record<string, string> = {
      'Varones': 'Hombres',
      'Mujeres': 'Mujeres',
      'Total': 'Total'
    }
    
    return labels[gender] || gender
  }
}

export const laborMarketService = new LaborMarketService()
export default laborMarketService