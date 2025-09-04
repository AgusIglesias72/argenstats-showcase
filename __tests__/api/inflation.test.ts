// __tests__/api/inflation.test.ts
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
import { GET, OPTIONS } from '@/app/api/v1/inflation/route'

// Mock de módulos
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    ipc: {
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

describe('Inflation API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/inflation', () => {
    it('should return current inflation data', async () => {
      const mockIpcData = {
        date: new Date('2024-01-01'),
        component: 'Nivel general',
        componentCode: 'GENERAL',
        componentType: 'GENERAL',
        region: 'Nacional',
        monthlyPctChange: 3.5,
        yearlyPctChange: 42.0,
        accumulatedPctChange: 15.0,
        indexValue: 150.5,
        updatedAt: new Date()
      }

      ;(prisma.ipc.findFirst as jest.Mock).mockResolvedValue(mockIpcData)

      const request = createMockRequest('/api/v1/inflation')
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toMatchObject({
        values: {
          monthly: 3.5,
          yearly: 42.0,
          accumulated: 15.0
        }
      })
    })

    it('should calculate inflation correctly', async () => {
      const mockFromData = {
        date: new Date('2023-01-01'),
        component: 'Nivel general',
        componentCode: 'GENERAL',
        componentType: 'GENERAL',
        region: 'Nacional',
        indexValue: 100,
        monthlyPctChange: null,
        yearlyPctChange: null,
        accumulatedPctChange: null
      }
      
      const mockToData = {
        date: new Date('2024-01-01'),
        component: 'Nivel general',
        componentCode: 'GENERAL',
        componentType: 'GENERAL',
        region: 'Nacional',
        indexValue: 150,
        monthlyPctChange: null,
        yearlyPctChange: null,
        accumulatedPctChange: null
      }

      ;(prisma.ipc.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockFromData)
        .mockResolvedValueOnce(mockToData)

      const request = createMockRequest(
        '/api/v1/inflation?view=calculator&amount=1000&from=2023-01-01&to=2024-01-01'
      )
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data.calculation.inflationRate).toBe(50.00)
      expect(data.data.calculation.adjustedAmount).toBe(1500.00)
    })

    it('should return CSV format when requested', async () => {
      const mockIpcData = {
        date: new Date('2024-01-01'),
        component: 'Nivel general',
        componentCode: 'GENERAL',
        componentType: 'GENERAL',
        region: 'Nacional',
        monthlyPctChange: 3.5,
        yearlyPctChange: 42.0,
        accumulatedPctChange: 15.0,
        indexValue: 150.5,
        updatedAt: new Date()
      }

      ;(prisma.ipc.findFirst as jest.Mock).mockResolvedValue(mockIpcData)

      const request = createMockRequest('/api/v1/inflation?format=csv')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/csv')
    })

    it('should handle historical view with date range', async () => {
      const mockHistoricalData = [
        {
          date: new Date('2023-01-01'),
          componentCode: 'GENERAL',
          component: 'Nivel general',
          region: 'Nacional',
          monthlyPctChange: 2.5,
          yearlyPctChange: 35.0,
          accumulatedPctChange: 2.5,
          indexValue: 120
        },
        {
          date: new Date('2023-02-01'),
          componentCode: 'GENERAL',
          component: 'Nivel general',
          region: 'Nacional',
          monthlyPctChange: 3.0,
          yearlyPctChange: 38.0,
          accumulatedPctChange: 5.5,
          indexValue: 123.6
        }
      ]

      ;(prisma.ipc.findMany as jest.Mock).mockResolvedValue(mockHistoricalData)

      const request = createMockRequest(
        '/api/v1/inflation?view=historical&from=2023-01-01&to=2023-12-31'
      )
      
      const response = await GET(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.data).toHaveLength(2)
      expect(data.metadata.count).toBe(2)
    })
  })

  describe('OPTIONS /api/v1/inflation', () => {
    it('should return API documentation', async () => {
      const response = await OPTIONS()
      const docs = await response.json()
      
      expect(response.status).toBe(200)
      expect(docs).toHaveProperty('endpoint')
      expect(docs).toHaveProperty('views')
      expect(docs).toHaveProperty('responses')
    })
  })
})