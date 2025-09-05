// /lib/api/constants/cer.ts
export const CER_VARIABLE_ID = 30

export const CER_METADATA = {
  name: 'Coeficiente de Estabilización de Referencia (CER)',
  description: 'Índice diario que refleja la evolución del IPC publicado por el BCRA',
  source: 'Banco Central de la República Argentina',
  unit: 'Índice base 2/2/2002 = 1',
  frequency: 'Diaria',
  startDate: '2002-02-02',
  category: 'Índices de Ajuste'
}

export interface CERDataPoint {
  date: Date
  value: number
  dailyVariation?: number
  monthlyVariation?: number
  yearlyVariation?: number
  accumulatedVariation?: number
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

export interface CERViewResponse {
  yearly_change: any
  current_value: any
  date: Date
  value: number
  variations: {
    daily?: number
    monthly?: number
    yearly?: number
    accumulated?: number
  }
  metadata?: {
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

export interface CERCalculatorResponse {
  calculation: CERCalculation
  analysis: {
    realReturn: number
    purchasingPowerLoss: number
    equivalentTodayValue: number
  }
  comparison?: {
    officialInflation?: number
    dollarVariation?: number
  }
}

export type CERViewType = 'current' | 'historical' | 'calculator' | 'comparison'

export const CER_CACHE_TTL = {
  current: 300, // 5 minutos
  historical: 3600, // 1 hora
  calculator: 0, // Sin cache
  comparison: 300 // 5 minutos
}

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