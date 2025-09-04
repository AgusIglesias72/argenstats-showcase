// __tests__/integration/inflation-api.test.ts
import { NextRequest } from 'next/server'

// Mock del middleware
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
          'Content-Type': 'application/json'
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

import { GET } from '@/app/api/v1/inflation/route'

// Mock de Prisma
jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    ipc: {
      findFirst: jest.fn().mockResolvedValue({
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
      })
    }
  }
}))

// Mock de Redis
jest.mock('@/lib/api/redis', () => ({
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined)
}))

describe('Inflation API Integration', () => {
  it('should handle complete flow from request to response', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/v1/inflation?view=current'),
      {
        headers: {
          'x-api-key': 'test-api-key'
        },
        method: 'GET'
      }
    )

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('success', true)
    expect(data.data).toHaveProperty('values')
  })
})