// __mocks__/@/lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export interface ApiKeyInfo {
  id: string
  key: string
  tier: string
  userId: string
  userEmail?: string | null
}

// Mock del middleware que siempre pasa cuando hay API key
export function withApiMiddleware(
  handler: (request: NextRequest, context: { apiKey: ApiKeyInfo }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const apiKeyHeader = request.headers.get('x-api-key')
    
    // Si no hay API key, devolver 401
    if (!apiKeyHeader) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid or missing API key'
          }
        },
        { status: 401 }
      )
    }
    
    // Si es la key especial para rate limit test, simular rate limit
    if (apiKeyHeader === 'test-rate-limit') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded'
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date().toISOString(),
            'Retry-After': '3600'
          }
        }
      )
    }
    
    // Mock de API key válida
    const mockApiKey: ApiKeyInfo = {
      id: 'test-id',
      key: apiKeyHeader,
      tier: 'free',
      userId: 'test-user',
      userEmail: 'test@example.com'
    }
    
    // Ejecutar el handler
    const response = await handler(request, { apiKey: mockApiKey })
    
    // Agregar headers de rate limit
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', '99')
    response.headers.set('X-RateLimit-Reset', new Date().toISOString())
    
    return response
  }
}

export function apiResponse<T>(
  data: T,
  options?: {
    status?: number
    headers?: HeadersInit
    metadata?: Record<string, any>
  }
) {
  const { status = 200, headers = {}, metadata = {} } = options || {}
  
  return NextResponse.json(
    {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        ...metadata
      }
    },
    { status, headers }
  )
}

export function apiError(
  code: string,
  message: string,
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details
      }
    },
    { status }
  )
}