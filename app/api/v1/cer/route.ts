// /app/api/v1/cer/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as cerService from '@/lib/api/services/cer'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Definir constantes y tipos al principio
const ALLOWED_VIEWS = ['current', 'historical', 'calculator', 'comparison'] as const
type ViewType = typeof ALLOWED_VIEWS[number]

const ALLOWED_AGGREGATIONS = ['daily', 'monthly', 'yearly'] as const
type AggregationType = typeof ALLOWED_AGGREGATIONS[number]

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// TTL diferenciado por vista (en segundos)
const CER_CACHE_TTL: Record<ViewType, number> = {
  current: 300,      // 5 minutos
  historical: 3600,  // 1 hora
  calculator: 0,     // Sin cache
  comparison: 1800   // 30 minutos
}

// Helpers para validación
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

const isValidAggregation = (aggregation: string): aggregation is AggregationType => {
  return ALLOWED_AGGREGATIONS.includes(aggregation as AggregationType)
}

// GET endpoint
export const GET = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'current'
  const format = searchParams.get('format') || 'json'

  // Validar formato
  if (!['json', 'csv'].includes(format)) {
    return apiError(
      'INVALID_FORMAT', 
      'Invalid format. Allowed values: json, csv', 
      400
    )
  }

  // Validar view
  if (!ALLOWED_VIEWS.includes(view as ViewType)) {
    return apiError(
      'INVALID_VIEW',
      `Invalid view parameter. Allowed values: ${ALLOWED_VIEWS.join(', ')}`,
      400
    )
  }

  const validView = view as ViewType

  try {
    // Generar cache key
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)

    // Si hay cache, retornar
    if (cached && 'data' in cached) {
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, `cer-${validView}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="cer-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
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
      indicator: 'CER',
      view: validView,
      format,
      lastUpdate: new Date().toISOString()
    }

    switch (validView) {
      case 'current':
        data = await cerService.getCurrentCER()
        break

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const limit = searchParams.get('limit')
        const aggregation = searchParams.get('aggregation')

        // Validar parámetros requeridos
        if (!from || !to) {
          return apiError(
            'MISSING_PARAMETERS', 
            'Parameters "from" and "to" are required for historical view', 
            400
          )
        }

        // Validar fechas
        if (!isValidDate(from) || !isValidDate(to)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD',
            400
          )
        }

        // Validar que from sea anterior a to
        if (new Date(from) >= new Date(to)) {
          return apiError(
            'INVALID_DATE_RANGE',
            'Start date must be before end date',
            400
          )
        }

        // Validar limit si existe
        if (limit) {
          const parsedLimit = parseInt(limit, 10)
          if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 10000) {
            return apiError(
              'INVALID_LIMIT',
              'Limit must be a positive number between 1 and 10000',
              400
            )
          }
        }

        // Validar aggregation si existe
        if (aggregation && !isValidAggregation(aggregation)) {
          return apiError(
            'INVALID_AGGREGATION',
            `Invalid aggregation. Allowed values: ${ALLOWED_AGGREGATIONS.join(', ')}`,
            400
          )
        }

        data = await cerService.getHistoricalCER({
          from,
          to,
          limit: limit ? parseInt(limit, 10) : undefined,
          aggregation: aggregation as AggregationType | undefined
        })

        metadata.parameters = { from, to, limit, aggregation }
        metadata.count = Array.isArray(data) ? data.length : (data.series ? data.series.length : 0)
        break
      }

      case 'calculator': {
        const amount = searchParams.get('amount')
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Validar parámetros requeridos
        if (!amount || !from || !to) {
          return apiError(
            'MISSING_PARAMETERS', 
            'Parameters "amount", "from" and "to" are required for calculator', 
            400
          )
        }

        // Validar amount
        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return apiError(
            'INVALID_AMOUNT', 
            'Amount must be a positive number', 
            400
          )
        }

        // Validar fechas
        if (!isValidDate(from) || !isValidDate(to)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD',
            400
          )
        }

        // Validar que from sea anterior o igual a to
        if (new Date(from) > new Date(to)) {
          return apiError(
            'INVALID_DATE_RANGE',
            'Start date must be before or equal to end date',
            400
          )
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

        // Validar parámetros requeridos
        if (!from || !to) {
          return apiError(
            'MISSING_PARAMETERS', 
            'Parameters "from" and "to" are required for comparison view', 
            400
          )
        }

        // Validar fechas
        if (!isValidDate(from) || !isValidDate(to)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD',
            400
          )
        }

        // Validar que from sea anterior a to
        if (new Date(from) >= new Date(to)) {
          return apiError(
            'INVALID_DATE_RANGE',
            'Start date must be before end date',
            400
          )
        }

        data = await cerService.compareCERWithIndicators({ from, to })
        metadata.parameters = { from, to }
        break
      }
    }

    // Guardar en cache (excepto calculator)
    const cacheTTL = CER_CACHE_TTL[validView]
    if (cacheTTL > 0) {
      await setCached(cacheKey, { data, metadata }, cacheTTL)
    }

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `cer-${validView}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="cer-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('CER API error:', error)
    
    if (error instanceof cerService.CERError) {
      return apiError(error.code, error.message, 400, error.details)
    }
    
    return apiError(
      'INTERNAL_ERROR', 
      'An error occurred processing your request', 
      500
    )
  }
})

// OPTIONS endpoint
export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/v1/cer',
    description: 'API del Coeficiente de Estabilización de Referencia (CER) - Índice de ajuste por inflación',
    methods: ['GET', 'OPTIONS'],
    authentication: 'API Key required (header: x-api-key)',
    globalParameters: {
      format: {
        type: 'string',
        default: 'json',
        options: ['json', 'csv'],
        description: 'Response format. CSV format will trigger file download.'
      }
    },
    views: {
      current: {
        description: 'Obtener el valor CER más reciente',
        parameters: {},
        example: '/api/v1/cer?view=current',
        response: {
          date: '2024-12-15',
          value: 1254.32,
          dailyVariation: 0.12,
          monthlyVariation: 2.5,
          yearlyVariation: 112.3
        }
      },
      historical: {
        description: 'Obtener serie histórica del CER',
        parameters: {
          from: {
            type: 'string',
            required: true,
            format: 'YYYY-MM-DD',
            description: 'Fecha de inicio'
          },
          to: {
            type: 'string',
            required: true,
            format: 'YYYY-MM-DD',
            description: 'Fecha de fin'
          },
          limit: {
            type: 'integer',
            min: 1,
            max: 10000,
            description: 'Límite de resultados (máximo 10000)'
          },
          aggregation: {
            type: 'string',
            options: ['daily', 'monthly', 'yearly'],
            description: 'Tipo de agregación temporal'
          }
        },
        example: '/api/v1/cer?view=historical&from=2024-01-01&to=2024-12-31',
        response: {
          series: [
            {
              date: '2024-01-01',
              value: 1123.45,
              variation: 0.11
            }
          ],
          summary: {
            count: 365,
            startValue: 1123.45,
            endValue: 1254.32,
            totalVariation: 11.65
          }
        }
      },
      calculator: {
        description: 'Calcular ajuste por CER entre dos fechas',
        parameters: {
          amount: {
            type: 'number',
            required: true,
            min: 0.01,
            description: 'Monto a ajustar (debe ser positivo)'
          },
          from: {
            type: 'string',
            required: true,
            format: 'YYYY-MM-DD',
            description: 'Fecha inicial'
          },
          to: {
            type: 'string',
            required: true,
            format: 'YYYY-MM-DD',
            description: 'Fecha final'
          }
        },
        example: '/api/v1/cer?view=calculator&amount=10000&from=2020-01-01&to=2024-12-01',
        response: {
          originalAmount: 10000,
          adjustedAmount: 45321.50,
          cerFrom: 234.56,
          cerTo: 1063.21,
          variationPct: 353.22,
          fromDate: '2020-01-01',
          toDate: '2024-12-01'
        }
      },
      comparison: {
        description: 'Comparar CER con otros indicadores (IPC, Dólar, etc.)',
        parameters: {
          from: {
            type: 'string',
            required: true,
            format: 'YYYY-MM-DD',
            description: 'Fecha de inicio'
          },
          to: {
            type: 'string',
            required: true,
            format: 'YYYY-MM-DD',
            description: 'Fecha de fin'
          }
        },
        example: '/api/v1/cer?view=comparison&from=2023-01-01&to=2024-01-01',
        response: {
          period: {
            from: '2023-01-01',
            to: '2024-01-01'
          },
          cer: {
            initialValue: 876.54,
            finalValue: 1123.45,
            variation: 28.17
          },
          ipc: {
            initialValue: 432.10,
            finalValue: 567.89,
            variation: 31.42
          },
          dollar: {
            initialValue: 189.50,
            finalValue: 823.00,
            variation: 334.30
          }
        }
      }
    },
    responses: {
      200: {
        description: 'Successful response',
        schema: {
          success: true,
          data: 'object | array',
          metadata: {
            timestamp: 'ISO 8601 datetime',
            version: 'string',
            source: 'BCRA',
            indicator: 'CER',
            view: 'string',
            parameters: 'object'
          }
        }
      },
      400: {
        description: 'Bad request',
        schema: {
          success: false,
          error: {
            code: 'string',
            message: 'string',
            details: 'object (optional)'
          }
        },
        errors: {
          INVALID_FORMAT: 'Invalid format parameter',
          INVALID_VIEW: 'Invalid view parameter',
          INVALID_DATE: 'Invalid date format',
          INVALID_DATE_RANGE: 'Invalid date range',
          INVALID_AMOUNT: 'Invalid amount value',
          INVALID_LIMIT: 'Invalid limit value',
          INVALID_AGGREGATION: 'Invalid aggregation type',
          MISSING_PARAMETERS: 'Required parameters missing'
        }
      },
      401: {
        description: 'Unauthorized - Invalid API key'
      },
      429: {
        description: 'Rate limit exceeded',
        headers: {
          'X-RateLimit-Limit': 'number',
          'X-RateLimit-Remaining': 'number',
          'X-RateLimit-Reset': 'ISO 8601 datetime',
          'Retry-After': 'seconds'
        }
      },
      500: {
        description: 'Internal server error'
      }
    },
    rateLimits: {
      free: '100 requests/hour',
      basic: '1,000 requests/hour',
      pro: '10,000 requests/hour',
      enterprise: '100,000 requests/hour'
    },
    data: {
      source: 'Banco Central de la República Argentina (BCRA)',
      frequency: 'Diaria',
      startDate: '2002-02-02',
      lastUpdate: 'Actualización diaria',
      description: 'El CER es un índice de ajuste diario que refleja la evolución de la inflación, utilizado para actualizar valores de contratos, préstamos y obligaciones.',
      formula: 'CER(t) = CER(t-1) * (1 + tasa_diaria)',
      usage: [
        'Préstamos hipotecarios UVA',
        'Plazo fijos ajustables',
        'Contratos de alquiler',
        'Obligaciones judiciales'
      ]
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type'
    }
  })
}