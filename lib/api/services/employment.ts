// /lib/api/services/employment.ts
import { prisma } from '@/lib/db/prisma'

export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

// Tipos de respuesta
interface EmploymentCurrent {
  period: string
  date: string
  lastUpdate: string
  national: {
    activityRate: number | null
    employmentRate: number | null
    unemploymentRate: number | null
    totalPopulation: number | null
    economicallyActivePopulation: number | null
    employedPopulation: number | null
    unemployedPopulation: number | null
    inactivePopulation: number | null
  }
  regions?: {
    region: string
    activityRate: number | null
    employmentRate: number | null
    unemploymentRate: number | null
  }[]
}

interface EmploymentHistorical {
  period: string
  date: string
  activityRate: number | null
  employmentRate: number | null
  unemploymentRate: number | null
  region?: string | null
  gender?: string | null
  ageGroup?: string | null
  demographicSegment?: string | null
}

interface RegionalData {
  region: string
  activityRate: number | null
  employmentRate: number | null
  unemploymentRate: number | null
  totalPopulation: number | null
  employedPopulation: number | null
  unemployedPopulation: number | null
}

interface DemographicData {
  segment: string
  gender?: string | null
  ageGroup?: string | null
  demographicSegment?: string | null
  activityRate: number | null
  employmentRate: number | null
  unemploymentRate: number | null
  population: number | null
}

// Obtener datos actuales
export async function getCurrent(): Promise<EmploymentCurrent> {
  // Obtener el período más reciente - buscar datos nacionales o totales
  const latestData = await prisma.laborMarket.findFirst({
    where: { 
      OR: [
        { dataType: 'national', region: 'Total 31 aglomerados' },
        { dataType: 'demographic', region: 'Total 31 aglomerados', gender: 'Total', ageGroup: 'Total' }
      ]
    },
    orderBy: { date: 'desc' }
  })

  if (!latestData) {
    throw new ServiceError('NO_DATA', 'No employment data available')
  }

  // Buscar datos nacionales o el total más agregado
  const nationalData = await prisma.laborMarket.findFirst({
    where: {
      date: latestData.date,
      region: 'Total 31 aglomerados',
      OR: [
        { dataType: 'national', gender: 'Total', ageGroup: 'Total' },
        { dataType: 'demographic', gender: 'Total', ageGroup: 'Total', demographicSegment: 'Total' }
      ]
    }
  })

  // Datos por región principales (excluyendo el total nacional)
  const regionalData = await prisma.laborMarket.findMany({
    where: {
      date: latestData.date,
      dataType: 'regional',
      gender: 'Total',
      ageGroup: 'Total',
      NOT: {
        region: 'Total 31 aglomerados'
      }
    },
    select: {
      region: true,
      activityRate: true,
      employmentRate: true,
      unemploymentRate: true
    },
    take: 10,
    orderBy: { totalPopulation: 'desc' } // Ordenar por población para obtener las más importantes
  })

  return {
    period: latestData.period,
    date: latestData.date.toISOString().split('T')[0],
    lastUpdate: latestData.createdAt.toISOString(),
    national: {
      activityRate: nationalData?.activityRate || null,
      employmentRate: nationalData?.employmentRate || null,
      unemploymentRate: nationalData?.unemploymentRate || null,
      totalPopulation: nationalData?.totalPopulation || null,
      economicallyActivePopulation: nationalData?.economicallyActivePopulation || null,
      employedPopulation: nationalData?.employedPopulation || null,
      unemployedPopulation: nationalData?.unemployedPopulation || null,
      inactivePopulation: nationalData?.inactivePopulation || null
    },
    regions: regionalData.map(r => ({
      region: r.region,
      activityRate: r.activityRate,
      employmentRate: r.employmentRate,
      unemploymentRate: r.unemploymentRate
    }))
  }
}

// Obtener datos históricos
export async function getHistorical({ 
  from, 
  to, 
  region, 
  gender, 
  ageGroup,
  demographicSegment 
}: { 
  from: string
  to: string
  region?: string | null
  gender?: string | null
  ageGroup?: string | null
  demographicSegment?: string | null
}): Promise<EmploymentHistorical[]> {
  
  const where: any = {
    date: {
      gte: new Date(from),
      lte: new Date(to)
    }
  }

  // Configurar región
  if (region) {
    where.region = region
  } else {
    where.region = 'Total 31 aglomerados'
  }

  // Si hay filtros demográficos específicos
  if (gender && gender !== 'Total') {
    where.gender = gender
    where.dataType = 'demographic'
  }
  
  if (ageGroup && ageGroup !== 'Total') {
    where.ageGroup = ageGroup
    where.dataType = 'demographic'
  }

  if (demographicSegment && demographicSegment !== 'Total') {
    where.demographicSegment = demographicSegment
    where.dataType = 'demographic'
  }

  // Si no hay filtros específicos, buscar los totales
  if (!where.dataType) {
    where.gender = 'Total'
    where.ageGroup = 'Total'
    
    // Buscar nacional o demographic con totales
    where.OR = [
      { dataType: 'national' },
      { dataType: 'demographic', demographicSegment: 'Total' },
      { dataType: 'regional' }
    ]
  }

  const data = await prisma.laborMarket.findMany({
    where,
    orderBy: { date: 'asc' },
    select: {
      period: true,
      date: true,
      activityRate: true,
      employmentRate: true,
      unemploymentRate: true,
      region: true,
      gender: true,
      ageGroup: true,
      demographicSegment: true
    }
  })

  if (data.length === 0) {
    throw new ServiceError('NO_DATA', `No data found for the specified parameters. Date range: ${from} to ${to}`)
  }

  return data.map(d => ({
    period: d.period,
    date: d.date.toISOString().split('T')[0],
    activityRate: d.activityRate,
    employmentRate: d.employmentRate,
    unemploymentRate: d.unemploymentRate,
    ...(d.region && { region: d.region }),
    ...(d.gender !== 'Total' && { gender: d.gender }),
    ...(d.ageGroup !== 'Total' && { ageGroup: d.ageGroup }),
    ...(d.demographicSegment !== 'Total' && { demographicSegment: d.demographicSegment })
  }))
}

// Obtener datos por región
export async function getByRegion({ 
  period, 
  region 
}: { 
  period?: string | null
  region?: string | null
}): Promise<RegionalData[]> {
  
  const where: any = {
    dataType: 'regional',
    gender: 'Total',
    ageGroup: 'Total'
  }

  // Si se especifica período
  if (period) {
    where.period = period
  } else {
    // Obtener el período más reciente
    const latest = await prisma.laborMarket.findFirst({
      where: { dataType: 'regional' },
      orderBy: { date: 'desc' },
      select: { period: true }
    })
    if (latest) {
      where.period = latest.period
    }
  }

  // Si se especifica región específica
  if (region) {
    where.region = region
  }

  const data = await prisma.laborMarket.findMany({
    where,
    orderBy: [
      { totalPopulation: 'desc' },
      { region: 'asc' }
    ],
    select: {
      region: true,
      activityRate: true,
      employmentRate: true,
      unemploymentRate: true,
      totalPopulation: true,
      employedPopulation: true,
      unemployedPopulation: true
    }
  })

  if (data.length === 0) {
    throw new ServiceError('NO_DATA', 'No regional data found')
  }

  return data.map(d => ({
    region: d.region,
    activityRate: d.activityRate,
    employmentRate: d.employmentRate,
    unemploymentRate: d.unemploymentRate,
    totalPopulation: d.totalPopulation,
    employedPopulation: d.employedPopulation,
    unemployedPopulation: d.unemployedPopulation
  }))
}

// Obtener datos demográficos
export async function getByDemographics({ 
  period, 
  region,
  demographicType = 'all'
}: { 
  period?: string | null
  region?: string | null
  demographicType?: string | null
}): Promise<{ gender?: DemographicData[], age?: DemographicData[], segments?: DemographicData[], combined?: DemographicData[] }> {
  
  const baseWhere: any = {
    dataType: 'demographic'
  }

  // Si se especifica período
  if (period) {
    baseWhere.period = period
  } else {
    // Obtener el período más reciente
    const latest = await prisma.laborMarket.findFirst({
      where: { dataType: 'demographic' },
      orderBy: { date: 'desc' },
      select: { period: true }
    })
    if (latest) {
      baseWhere.period = latest.period
    }
  }

  // Si se especifica región
  if (region) {
    baseWhere.region = region
  } else {
    baseWhere.region = 'Total 31 aglomerados'
  }

  const result: any = {}

  // Por género (solo Varones/Mujeres, no Total)
  if (demographicType === 'all' || demographicType === 'gender') {
    const genderData = await prisma.laborMarket.findMany({
      where: {
        ...baseWhere,
        gender: { in: ['Varones', 'Mujeres'] },
        ageGroup: 'Total',
        demographicSegment: 'Total'
      },
      select: {
        gender: true,
        activityRate: true,
        employmentRate: true,
        unemploymentRate: true,
        totalPopulation: true
      }
    })

    if (genderData.length > 0) {
      result.gender = genderData.map(d => ({
        segment: d.gender!,
        gender: d.gender,
        activityRate: d.activityRate,
        employmentRate: d.employmentRate,
        unemploymentRate: d.unemploymentRate,
        population: d.totalPopulation
      }))
    }
  }

  // Por edad
  if (demographicType === 'all' || demographicType === 'age') {
    const ageData = await prisma.laborMarket.findMany({
      where: {
        ...baseWhere,
        ageGroup: { notIn: ['Total'] },
        gender: 'Total',
        demographicSegment: 'Total'
      },
      select: {
        ageGroup: true,
        activityRate: true,
        employmentRate: true,
        unemploymentRate: true,
        totalPopulation: true
      },
      distinct: ['ageGroup']
    })

    if (ageData.length > 0) {
      result.age = ageData.map(d => ({
        segment: d.ageGroup!,
        ageGroup: d.ageGroup,
        activityRate: d.activityRate,
        employmentRate: d.employmentRate,
        unemploymentRate: d.unemploymentRate,
        population: d.totalPopulation
      }))
    }
  }

  // Por segmento demográfico (como "Jefes de hogar")
  if (demographicType === 'all' || demographicType === 'segments') {
    const segmentData = await prisma.laborMarket.findMany({
      where: {
        ...baseWhere,
        demographicSegment: { notIn: ['Total'] },
        gender: 'Total',
        ageGroup: 'Total'
      },
      select: {
        demographicSegment: true,
        activityRate: true,
        employmentRate: true,
        unemploymentRate: true,
        totalPopulation: true
      },
      distinct: ['demographicSegment']
    })

    if (segmentData.length > 0) {
      result.segments = segmentData.map(d => ({
        segment: d.demographicSegment!,
        demographicSegment: d.demographicSegment,
        activityRate: d.activityRate,
        employmentRate: d.employmentRate,
        unemploymentRate: d.unemploymentRate,
        population: d.totalPopulation
      }))
    }
  }

  // Combinado (género y edad, excluyendo Total)
  if (demographicType === 'all') {
    const combinedData = await prisma.laborMarket.findMany({
      where: {
        ...baseWhere,
        gender: { notIn: ['Total'] },
        ageGroup: { notIn: ['Total'] },
        demographicSegment: 'Total'
      },
      select: {
        gender: true,
        ageGroup: true,
        activityRate: true,
        employmentRate: true,
        unemploymentRate: true,
        totalPopulation: true
      },
      take: 20
    })

    if (combinedData.length > 0) {
      result.combined = combinedData.map(d => ({
        segment: `${d.gender} - ${d.ageGroup}`,
        gender: d.gender,
        ageGroup: d.ageGroup,
        activityRate: d.activityRate,
        employmentRate: d.employmentRate,
        unemploymentRate: d.unemploymentRate,
        population: d.totalPopulation
      }))
    }
  }

  if (Object.keys(result).length === 0) {
    throw new ServiceError('NO_DATA', 'No demographic data found')
  }

  return result
}

// Obtener datos por género
export async function getByGender({ 
  period, 
  region 
}: { 
  period?: string | null
  region?: string | null
}): Promise<DemographicData[]> {
  
  const result = await getByDemographics({ 
    period, 
    region, 
    demographicType: 'gender' 
  })
  
  return result.gender || []
}

// Obtener datos por edad
export async function getByAge({ 
  period, 
  region 
}: { 
  period?: string | null
  region?: string | null
}): Promise<DemographicData[]> {
  
  const result = await getByDemographics({ 
    period, 
    region, 
    demographicType: 'age' 
  })
  
  return result.age || []
}