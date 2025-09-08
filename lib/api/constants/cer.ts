// /lib/api/constants/cer.ts
export const CER_VARIABLE_ID = 30

export const CER_VIEWS = ['current', 'historical', 'calculator', 'comparison'] as const
export type CERViewType = typeof CER_VIEWS[number]

// Tipos de agregación
export const CER_AGGREGATIONS = ['daily', 'monthly', 'yearly'] as const
export type CERAggregationType = typeof CER_AGGREGATIONS[number]

// TTL de cache por vista (en segundos)
export const CER_CACHE_TTL: Record<CERViewType, number> = {
  current: 300,      // 5 minutos
  historical: 3600,  // 1 hora
  calculator: 0,     // Sin cache
  comparison: 1800   // 30 minutos
}

// Clase de error personalizada para CER
export class CERError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'CERError'
  }
}

// Tipos de datos
export interface CERDataPoint {
  date: Date
  value: number
  dailyVariation?: number
  monthlyVariation?: number
  yearlyVariation?: number
}

export interface CERVariations {
  daily?: number
  monthly?: number
  yearly?: number
  accumulated?: number
}

export interface CERViewResponse {
  date: Date
  value: number
  variations: CERVariations
  metadata: {
    lastUpdate: Date
    source: string
  }
}

export interface CERHistoricalResponse {
  series: CERDataPoint[]
  summary: {
    startDate: Date
    endDate: Date
    startValue: number
    endValue: number
    totalVariation: number
    averageDailyVariation: number
    dataPoints: number
  }
}

export interface CERCalculation {
  amount: number
  fromDate: Date
  toDate: Date
  fromCER: number
  toCER: number
  adjustedAmount: number
  inflationRate: number
  periodInDays: number
  annualizedRate?: number
}

export interface CERCalculatorResponse {
  calculation: CERCalculation
  analysis: {
    realReturn: number
    purchasingPowerLoss: number
    equivalentTodayValue: number
  }
}

export interface CERComparisonResponse {
  period: {
    from: Date
    to: Date
    days: number
  }
  cer: {
    variation: number
    fromValue: number
    toValue: number
  }
  ipc?: {
    variation: number
    fromValue: number
    toValue: number
  }
  dollar?: {
    variation: number
    fromValue: number
    toValue: number
  }
  comparison?: {
    message?: string
    [key: string]: any
  }
}

// Códigos de error
export const CER_ERROR_CODES = {
  NO_DATA: 'NO_DATA',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const

// Información del CER
export const CER_INFO = {
  name: 'Coeficiente de Estabilización de Referencia',
  acronym: 'CER',
  source: 'Banco Central de la República Argentina (BCRA)',
  frequency: 'Diaria',
  startDate: '2002-02-02',
  baseValue: 1.0,
  description: 'Índice de ajuste diario que refleja la evolución de la inflación',
  formula: 'CER(t) = CER(t-1) * (1 + tasa_diaria)',
  usage: [
    'Préstamos hipotecarios UVA',
    'Plazo fijos ajustables',
    'Contratos de alquiler',
    'Obligaciones judiciales',
    'Bonos CER'
  ]
}