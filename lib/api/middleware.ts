// /lib/api/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Tipos
export interface ApiKeyInfo {
  id: string
  key: string
  tier: string
  userId: string
  userEmail?: string | null
  rateLimit?: number
  rateLimitRemaining?: number
  rateLimitReset?: string
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: string
  retryAfter?: number
}

// Configuración de rate limits por tier
const RATE_LIMITS = {
  free: { limit: 100, window: 3600 }, // 100 requests per hour
  basic: { limit: 1000, window: 3600 }, // 1,000 requests per hour
  pro: { limit: 10000, window: 3600 }, // 10,000 requests per hour
  enterprise: { limit: 100000, window: 3600 } // 100,000 requests per hour
} as const

/**
 * Valida la API key y retorna la información
 */
export async function validateApiKey(request: NextRequest): Promise<ApiKeyInfo | null> {
  const apiKey = request.headers.get('x-api-key')
  
  if (!apiKey) {
    return null
  }

  try {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { 
        key: apiKey,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    if (!keyRecord) {
      return null
    }

    // Actualizar última vez usada (async, no bloqueante)
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error)

    return {
      id: keyRecord.id,
      key: keyRecord.key,
      tier: keyRecord.tier,
      userId: keyRecord.userId,
      userEmail: keyRecord.userEmail
    }
  } catch (error) {
    console.error('Error validating API key:', error)
    return null
  }
}

/**
 * Verifica el rate limit para una API key
 */
export async function checkRateLimit(apiKey: ApiKeyInfo): Promise<RateLimitInfo> {
  const tierConfig = RATE_LIMITS[apiKey.tier as keyof typeof RATE_LIMITS] || RATE_LIMITS.free
  const windowStart = new Date()
  windowStart.setSeconds(windowStart.getSeconds() - tierConfig.window)

  try {
    const usageCount = await prisma.apiUsage.count({
      where: {
        apiKeyId: apiKey.id,
        timestamp: { gte: windowStart }
      }
    })

    const remaining = Math.max(0, tierConfig.limit - usageCount)
    const resetTime = new Date(windowStart.getTime() + tierConfig.window * 1000)

    return {
      limit: tierConfig.limit,
      remaining,
      reset: resetTime.toISOString(),
      retryAfter: remaining === 0 ? Math.ceil((resetTime.getTime() - Date.now()) / 1000) : undefined
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // En caso de error, permitir la request
    return {
      limit: tierConfig.limit,
      remaining: 1,
      reset: new Date().toISOString()
    }
  }
}

/**
 * Registra el uso de la API
 */
export async function logApiUsage(
  apiKeyId: string, 
  request: NextRequest, 
  statusCode: number,
  startTime: number
) {
  try {
    await prisma.apiUsage.create({
      data: {
        apiKeyId,
        endpoint: request.url,
        method: request.method,
        statusCode,
        responseTime: Date.now() - startTime,
        timestamp: new Date()
      }
    })
  } catch (error) {
    console.error('Error logging API usage:', error)
  }
}

/**
 * Middleware wrapper para endpoints de API
 */
export function withApiMiddleware(
  handler: (request: NextRequest, context: { apiKey: ApiKeyInfo }) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const startTime = Date.now()
    
    // Validar API Key
    const apiKey = await validateApiKey(request)
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid or missing API key'
          }
        },
        { 
          status: 401,
          headers: {
            'WWW-Authenticate': 'ApiKey realm="ArgenStats API"'
          }
        }
      )
    }

    // Verificar rate limit
    const rateLimit = await checkRateLimit(apiKey)
    if (rateLimit.remaining === 0) {
      // Log del intento rechazado
      await logApiUsage(apiKey.id, request, 429, startTime)
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Rate limit exceeded',
            retryAfter: rateLimit.retryAfter
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.reset,
            'Retry-After': rateLimit.retryAfter!.toString()
          }
        }
      )
    }

    try {
      // Ejecutar el handler
      const response = await handler(request, { apiKey })
      
      // Agregar headers de rate limit
      response.headers.set('X-RateLimit-Limit', rateLimit.limit.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
      response.headers.set('X-RateLimit-Reset', rateLimit.reset)
      
      // Log del uso exitoso
      await logApiUsage(apiKey.id, request, response.status, startTime)
      
      return response
    } catch (error) {
      // Log del error
      await logApiUsage(apiKey.id, request, 500, startTime)
      
      console.error('API Handler Error:', error)
      
      // Si es un error conocido, devolverlo
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details
            }
          },
          { status: error.status }
        )
      }
      
      // Error genérico
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An error occurred processing your request'
          }
        },
        { status: 500 }
      )
    }
  }
}

/**
 * Helper para respuestas estándar de API
 */
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

/**
 * Helper para respuestas de error
 */
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

/**
 * Clase de error personalizada para APIs
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Validador de parámetros comunes
 */
export function validateDateRange(from: string | null, to: string | null) {
  if (!from || !to) {
    throw new ApiError(
      'MISSING_PARAMETERS',
      'Parameters "from" and "to" are required',
      400
    )
  }

  const fromDate = new Date(from)
  const toDate = new Date(to)

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new ApiError(
      'INVALID_DATE_FORMAT',
      'Invalid date format. Use YYYY-MM-DD',
      400
    )
  }

  if (fromDate >= toDate) {
    throw new ApiError(
      'INVALID_DATE_RANGE',
      'Start date must be before end date',
      400
    )
  }

  return { fromDate, toDate }
}

/**
 * Paginación helper
 */
export function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '100')
  
  if (page < 1 || limit < 1 || limit > 1000) {
    throw new ApiError(
      'INVALID_PAGINATION',
      'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 1000',
      400
    )
  }

  return {
    page,
    limit,
    skip: (page - 1) * limit
  }
}

/**
 * Helper para agregar metadata de paginación
 */
export function addPaginationMetadata(
  metadata: Record<string, any>,
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    ...metadata,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * Helper para manejar cache headers
 */
export function setCacheHeaders(response: NextResponse, options: {
  public?: boolean
  maxAge?: number // segundos
  sMaxAge?: number // segundos para CDN
  staleWhileRevalidate?: number // segundos
} = {}) {
  const {
    public: isPublic = true,
    maxAge = 60, // 1 minuto por defecto
    sMaxAge = 300, // 5 minutos en CDN
    staleWhileRevalidate = 86400 // 1 día
  } = options

  const cacheControl = [
    isPublic ? 'public' : 'private',
    `max-age=${maxAge}`,
    `s-maxage=${sMaxAge}`,
    `stale-while-revalidate=${staleWhileRevalidate}`
  ].join(', ')

  response.headers.set('Cache-Control', cacheControl)
  return response
}

/**
 * Validador de enums
 */
export function validateEnum<T extends string>(
  value: string | null,
  enumValues: readonly T[],
  paramName: string
): T {
  if (!value || !enumValues.includes(value as T)) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `Invalid ${paramName}. Allowed values: ${enumValues.join(', ')}`,
      400
    )
  }
  return value as T
}

/**
 * Helper para formatear números en las respuestas
 */
export function formatNumber(value: number | null, decimals: number = 2): number | null {
  if (value === null) return null
  return parseFloat(value.toFixed(decimals))
}

/**
 * Helper para manejar arrays de parámetros
 */
export function parseArrayParam(param: string | null, separator: string = ','): string[] {
  if (!param) return []
  return param.split(separator).map(s => s.trim()).filter(Boolean)
}

/**
 * Middleware para validar métodos HTTP
 */
export function allowedMethods(...methods: string[]) {
  return (handler: (request: NextRequest, ...args: any[]) => Promise<Response>) => {
    return async (request: NextRequest, ...args: any[]) => {
      if (!methods.includes(request.method)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'METHOD_NOT_ALLOWED',
              message: `Method ${request.method} not allowed. Allowed methods: ${methods.join(', ')}`
            }
          },
          { 
            status: 405,
            headers: {
              'Allow': methods.join(', ')
            }
          }
        )
      }
      return handler(request, ...args)
    }
  }
}