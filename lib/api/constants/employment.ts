// /lib/api/constants/employment.ts

export const EMPLOYMENT_CONSTANTS = {
  DEFAULT_REGION: 'Total 31 aglomerados',
  DEFAULT_VIEW: 'current',
  CACHE_TTL: 300, // 5 minutos
  
  DATA_TYPES: {
    NATIONAL: 'national',
    REGIONAL: 'regional',
    DEMOGRAPHIC: 'demographic'
  },
  
  GENDERS: ['Total', 'Varones', 'Mujeres'],
  
  AGE_GROUPS: [
    'Total',
    '14-29 años',
    '30-64 años',
    '65 años y más'
  ],
  
  DEMOGRAPHIC_SEGMENTS: [
    'Total',
    'Jefes de hogar'
  ],
  
  MAIN_REGIONS: [
    'Total 31 aglomerados',
    'GBA',
    'Partidos del Gran Buenos Aires',
    'Región NEA',
    'Región NOA',
    'Región Cuyo',
    'Región Pampeana',
    'Región Patagónica'
  ],
  
  ERROR_CODES: {
    NO_DATA: 'NO_DATA',
    INVALID_FORMAT: 'INVALID_FORMAT',
    INVALID_VIEW: 'INVALID_VIEW',
    MISSING_PARAMETERS: 'MISSING_PARAMETERS',
    INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
  },
  
  METRICS: {
    ACTIVITY_RATE: {
      name: 'Tasa de Actividad',
      description: 'Porcentaje de la población económicamente activa sobre el total de la población',
      unit: '%'
    },
    EMPLOYMENT_RATE: {
      name: 'Tasa de Empleo',
      description: 'Porcentaje de la población ocupada sobre el total de la población',
      unit: '%'
    },
    UNEMPLOYMENT_RATE: {
      name: 'Tasa de Desocupación',
      description: 'Porcentaje de la población desocupada sobre la población económicamente activa',
      unit: '%'
    }
  }
}

// Tipos exportados
export interface EmploymentMetrics {
  activityRate: number | null
  employmentRate: number | null
  unemploymentRate: number | null
}

export interface EmploymentPopulation extends EmploymentMetrics {
  totalPopulation: number | null
  economicallyActivePopulation: number | null
  employedPopulation: number | null
  unemployedPopulation: number | null
  inactivePopulation: number | null
}

export interface EmploymentFilter {
  period?: string | null
  region?: string | null
  gender?: string | null
  ageGroup?: string | null
  from?: string | null
  to?: string | null
}