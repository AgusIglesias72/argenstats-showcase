// /app/api/v1/cer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as cerService from '@/lib/api/services/cer'
import { getCached, setCached } from '@/lib/api/redis'
import { getCacheKey } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'
import { CER_CACHE_TTL, CERError, CERViewType } from '@/lib/api/constants/cer'

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// GET endpoint
export const GET = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  const { searchParams } = new URL(request.url)
  const view = (searchParams.get('view') || 'current') as CERViewType
  const format = searchParams.get('format') || 'json'

  // Validar formato
  if (!['json', 'csv'].includes(format)) {
    return apiError('INVALID_FORMAT', 'Formato inválido. Use: json o csv', 400)
  }

  try {
    // Generar cache key
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)

    // Si hay cache, retornar
    if (cached && 'data' in cached) {
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, view, 'cer'), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="cer-${view}-${new Date().toISOString().split('T')[0]}.csv"`,
            'X-Cache': 'HIT'
          }
        })
      }

      const response = apiResponse(cached.data, { metadata: cached.metadata })
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    // Procesar según vista
    let data: any
    const metadata: Record<string, any> = {
      source: 'BCRA',
      view,
      format,
      indicator: 'CER'
    }

    switch (view) {
      case 'current':
        data = await cerService.getCurrentCER()
        break

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const limit = searchParams.get('limit')
        const aggregation = searchParams.get('aggregation')

        if (!from || !to) {
          return apiError('MISSING_PARAMETERS', 'Parámetros "from" y "to" son requeridos', 400)
        }

        data = await cerService.getHistoricalCER({
          from,
          to,
          limit: limit ? parseInt(limit, 10) : undefined,
          aggregation: aggregation as any
        })

        metadata.parameters = { from, to, limit, aggregation }
        metadata.count = data.series.length
        break
      }

      case 'calculator': {
        const amount = searchParams.get('amount')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        if (!amount || !from || !to) {
          return apiError('MISSING_PARAMETERS', 'Parámetros "amount", "from" y "to" son requeridos', 400)
        }

        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return apiError('INVALID_AMOUNT', 'El monto debe ser un número mayor a 0', 400)
        }

        data = await cerService.calculateCER({
          amount: parsedAmount,
          from,
          to
        })

        metadata.parameters = { amount: parsedAmount, from, to }
        break
      }

      case 'comparison': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        if (!from || !to) {
          return apiError('MISSING_PARAMETERS', 'Parámetros "from" y "to" son requeridos', 400)
        }

        data = await cerService.compareCERWithIndicators({ from, to })
        metadata.parameters = { from, to }
        break
      }

      default:
        return apiError('INVALID_VIEW', 'Vista inválida', 400)
    }

    // Guardar en cache (excepto calculator)
    const cacheTTL = CER_CACHE_TTL[view]
    if (cacheTTL > 0) {
      await setCached(cacheKey, { data, metadata }, cacheTTL)
    }

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, view, 'cer'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cer-${view}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('CER API error:', error)
    
    if (error instanceof CERError) {
      return apiError(error.code, error.message, 400, error.details)
    }
    
    return apiError('INTERNAL_ERROR', 'Error al procesar la solicitud', 500)
  }
})

// OPTIONS endpoint
export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/v1/cer',
    description: 'API del Coeficiente de Estabilización de Referencia (CER)',
    methods: ['GET', 'OPTIONS'],
    authentication: 'API Key requerida (header: x-api-key)',
    parameters: {
      view: {
        type: 'string',
        enum: ['current', 'historical', 'calculator', 'comparison'],
        default: 'current',
        description: 'Vista de datos a retornar'
      },
      format: {
        type: 'string',
        enum: ['json', 'csv'],
        default: 'json',
        description: 'Formato de respuesta'
      },
      // Parámetros específicos por vista
      historical: {
        from: {
          type: 'string',
          format: 'date',
          required: true,
          description: 'Fecha inicial (YYYY-MM-DD)'
        },
        to: {
          type: 'string',
          format: 'date',
          required: true,
          description: 'Fecha final (YYYY-MM-DD)'
        },
        limit: {
          type: 'integer',
          description: 'Límite de resultados'
        },
        aggregation: {
          type: 'string',
          enum: ['daily', 'monthly', 'yearly'],
          description: 'Tipo de agregación temporal'
        }
      },
      calculator: {
        amount: {
          type: 'number',
          required: true,
          description: 'Monto a ajustar'
        },
        from: {
          type: 'string',
          format: 'date',
          required: true,
          description: 'Fecha inicial'
        },
        to: {
          type: 'string',
          format: 'date',
          required: true,
          description: 'Fecha final'
        }
      }
    },
    examples: {
      current: '/api/v1/cer',
      historical: '/api/v1/cer?view=historical&from=2024-01-01&to=2024-12-31',
      calculator: '/api/v1/cer?view=calculator&amount=10000&from=2020-01-01&to=2024-01-01',
      comparison: '/api/v1/cer?view=comparison&from=2023-01-01&to=2024-01-01',
      csv: '/api/v1/cer?view=historical&from=2024-01-01&to=2024-12-31&format=csv'
    },
    rateLimit: {
      free: '100 requests/hour',
      basic: '1000 requests/hour',
      pro: '10000 requests/hour'
    },
    data: {
      source: 'Banco Central de la República Argentina',
      frequency: 'Diaria',
      startDate: '2002-02-02',
      lastUpdate: 'Actualización diaria'
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type'
    }
  })
}