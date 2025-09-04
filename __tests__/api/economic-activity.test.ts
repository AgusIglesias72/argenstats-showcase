// __tests__/api/economic-activity.test.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Mock del middleware ANTES de importar cualquier cosa que lo use
jest.mock('@/lib/api/middleware', () => ({
  withApiMiddleware: (handler: any) => handler,
  apiResponse: (data: any, options: any = {}) => {
    const { metadata = {} } = options
    return new Response(
      JSON.stringify({
        success: true,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0',
          ...metadata
        }
      }),
      { 
        status: 200,
        headers: new Headers({
          'Content-Type': 'application/json',
          'X-Cache': 'MISS'
        })
      }
    )
  },
  apiError: (code: string, message: string, status: number = 400) => {
    return new Response(
      JSON.stringify({
        success: false,
        error: { code, message }
      }),
      { status }
    )
  }
}))

// Ahora importar el route
import { GET, OPTIONS } from '@/app/api/v1/economic-activity/route'

// Mock de módulos
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    emae: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    }
  }
}))

jest.mock('@/lib/api/redis', () => ({
  redis: {
    on: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1)
  },
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined),
  invalidateCache: jest.fn().mockResolvedValue(undefined)
}))

// Helper para crear NextRequest mock
function createMockRequest(url: string, options?: { headers?: Record<string, string> }) {
  const headers = new Headers(options?.headers || {})
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    headers,
    method: 'GET'
  })
}

describe('Economic Activity (EMAE) API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/economic-activity', () => {
    it('should return current EMAE data', async () => {
      const mockEmaeData = {
        date: new Date('2024-01-01'),
        sectorCode: 'GENERAL',
        sectorName: 'Nivel general',
        originalValue: 150.5,
        seasonallyAdjustedValue: 151.2,
        cycleTrendValue: 150.8,
        monthlyVariation: 0.5,
        yearlyVariation: 3.2,
        cycleTrendVariation: 0.3,
        updatedAt: new Date()
      }

      ;(prisma.emae.findFirst as jest.Mock).mockResolvedValue(mockEmaeData)

      const request = createMockRequest('/api/v1/economic-activity')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('sector')
      expect(data.data).toHaveProperty('variations')
      expect(data.data.value).toBe(150.5)
    })

    it('should return sectors view correctly', async () => {
      const mockSectorsData = [
        {
          date: new Date('2024-01-01'),
          sectorCode: 'GENERAL',
          sectorName: 'Nivel general',
          originalValue: 150.5,
          yearlyVariation: 3.2,
          monthlyVariation: 0.5,
          seasonallyAdjustedValue: null,
          cycleTrendValue: null,
          cycleTrendVariation: null,
          updatedAt: new Date()
        },
        {
          date: new Date('2024-01-01'),
          sectorCode: 'C',
          sectorName: 'Industria manufacturera',
          originalValue: 145.3,
          yearlyVariation: 2.1,
          monthlyVariation: 0.3,
          seasonallyAdjustedValue: null,
          cycleTrendValue: null,
          cycleTrendVariation: null,
          updatedAt: new Date()
        }
      ]

      ;(prisma.emae.findFirst as jest.Mock).mockResolvedValue({ date: new Date('2024-01-01') })
      ;(prisma.emae.findMany as jest.Mock).mockResolvedValue(mockSectorsData)

      const request = createMockRequest('/api/v1/economic-activity?view=sectors')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveProperty('general')
      expect(data.data).toHaveProperty('sectors')
      expect(data.data).toHaveProperty('summary')
    })

    it('should return CSV format when requested', async () => {
      const mockEmaeData = {
        date: new Date('2024-01-01'),
        sectorCode: 'GENERAL',
        sectorName: 'Nivel general',
        originalValue: 150.5,
        monthlyVariation: 0.5,
        yearlyVariation: 3.2,
        seasonallyAdjustedValue: null,
        cycleTrendValue: null,
        cycleTrendVariation: null,
        updatedAt: new Date()
      }

      ;(prisma.emae.findFirst as jest.Mock).mockResolvedValue(mockEmaeData)

      const request = createMockRequest('/api/v1/economic-activity?format=csv')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
    })

    it('should handle sector comparison correctly', async () => {
      const mockComparisonData = [
        {
          date: new Date('2023-01-01'),
          sectorCode: 'C',
          sectorName: 'Industria manufacturera',
          originalValue: 140.0,
          yearlyVariation: 1.5,
          monthlyVariation: 0.2,
          seasonallyAdjustedValue: null,
          cycleTrendValue: null,
          cycleTrendVariation: null,
          updatedAt: new Date()
        },
        {
          date: new Date('2023-01-01'),
          sectorCode: 'G',
          sectorName: 'Hoteles y restaurantes',
          originalValue: 130.0,
          yearlyVariation: 5.2,
          monthlyVariation: 0.8,
          seasonallyAdjustedValue: null,
          cycleTrendValue: null,
          cycleTrendVariation: null,
          updatedAt: new Date()
        }
      ]

      ;(prisma.emae.findMany as jest.Mock).mockResolvedValue(mockComparisonData)

      const request = createMockRequest(
        '/api/v1/economic-activity?view=comparison&sectors=C,G&from=2023-01-01&to=2023-12-31'
      )
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveProperty('series')
      expect(data.data).toHaveProperty('statistics')
      expect(data.data.series).toHaveLength(2)
    })

    it('should return adjusted values when requested', async () => {
      const mockEmaeData = {
        date: new Date('2024-01-01'),
        sectorCode: 'GENERAL',
        sectorName: 'Nivel general',
        originalValue: 150.5,
        seasonallyAdjustedValue: 151.2,
        cycleTrendValue: 150.8,
        monthlyVariation: 0.5,
        yearlyVariation: 3.2,
        cycleTrendVariation: 0.3,
        updatedAt: new Date()
      }

      ;(prisma.emae.findFirst as jest.Mock).mockResolvedValue(mockEmaeData)

      const request = createMockRequest('/api/v1/economic-activity?adjusted=true')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data.value).toBe(151.2) // Valor desestacionalizado
      expect(data.data.metadata.isSeasonallyAdjusted).toBe(true)
    })
  })

  describe('OPTIONS /api/v1/economic-activity', () => {
    it('should return API documentation', async () => {
      const response = await OPTIONS()
      const docs = await response.json()
      
      expect(response.status).toBe(200)
      expect(docs).toHaveProperty('endpoint')
      expect(docs).toHaveProperty('views')
      expect(docs).toHaveProperty('sectors')
    })
  })
})