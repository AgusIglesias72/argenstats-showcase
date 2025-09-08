// /app/api/v1/country-risk/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as countryRiskService from '@/lib/api/services/country-risk'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Definir constantes y tipos al principio
const ALLOWED_VIEWS = ['current', 'historical', 'comparison', 'statistics'] as const
type ViewType = typeof ALLOWED_VIEWS[number]

const ALLOWED_SOURCES = ['all', 'official', 'estimated'] as const
type SourceType = typeof ALLOWED_SOURCES[number]

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// TTL diferenciado por vista (en segundos)
const COUNTRY_RISK_CACHE_TTL: Record<ViewType, number> = {
  current: 300,      // 5 minutos
  historical: 1800,  // 30 minutos
  comparison: 900,   // 15 minutos
  statistics: 3600   // 1 hora
}

// Helpers para validación
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

const isValidSource = (source: string): source is SourceType => {
  return ALLOWED_SOURCES.includes(source as SourceType)
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
        return new NextResponse(convertToCSV(cached.data, `country-risk-${validView}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="country-risk-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
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
      source: 'JP Morgan / ArgenStats',
      indicator: 'Country Risk (EMBI+)',
      view: validView,
      format,
      lastUpdate: new Date().toISOString()
    }

    switch (validView) {
      case 'current': {
        data = await countryRiskService.getCurrentCountryRisk()
        break
      }

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const source = searchParams.get('source') || 'all'
        const interval = searchParams.get('interval') || 'daily'

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

        // Validar source
        if (!isValidSource(source)) {
          return apiError(
            'INVALID_SOURCE',
            `Invalid source. Allowed values: ${ALLOWED_SOURCES.join(', ')}`,
            400
          )
        }

        // Validar interval
        const validIntervals = ['daily', 'weekly', 'monthly'] as const
        if (!validIntervals.includes(interval as any)) {
          return apiError(
            'INVALID_INTERVAL',
            `Invalid interval. Allowed values: ${validIntervals.join(', ')}`,
            400
          )
        }

        data = await countryRiskService.getHistoricalCountryRisk({
          from,
          to,
          source,
          interval
        })

        metadata.parameters = { from, to, source, interval }
        metadata.count = Array.isArray(data) ? data.length : (data.series ? data.series.length : 0)
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

        data = await countryRiskService.compareOfficialVsEstimated({ from, to })
        metadata.parameters = { from, to }
        break
      }

      case 'statistics': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const source = searchParams.get('source') || 'official'

        // Si se proporcionan fechas, validarlas
        if (from && !isValidDate(from)) {
          return apiError('INVALID_DATE', 'Invalid from date format', 400)
        }
        if (to && !isValidDate(to)) {
          return apiError('INVALID_DATE', 'Invalid to date format', 400)
        }

        // Validar source
        if (!isValidSource(source)) {
          return apiError(
            'INVALID_SOURCE',
            `Invalid source. Allowed values: ${ALLOWED_SOURCES.join(', ')}`,
            400
          )
        }

        data = await countryRiskService.getCountryRiskStatistics({ 
          from: from || undefined, 
          to: to || undefined,
          source 
        })
        metadata.parameters = { from, to, source }
        break
      }
    }

    // Guardar en cache
    const cacheTTL = COUNTRY_RISK_CACHE_TTL[validView]
    if (cacheTTL > 0) {
      await setCached(cacheKey, { data, metadata }, cacheTTL)
    }

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `country-risk-${validView}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="country-risk-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('Country Risk API error:', error)
    
    if (error instanceof countryRiskService.CountryRiskError) {
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
    endpoint: '/api/v1/country-risk',
    description: 'API del Riesgo País de Argentina (EMBI+ Argentina)',
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
        description: 'Obtener el riesgo país actual',
        parameters: {},
        example: '/api/v1/country-risk?view=current',
        response: {
          date: '2025-09-04',
          official: {
            value: 880,
            source: 'JP Morgan',
            lastUpdate: '2025-09-04T00:00:00Z'
          },
          estimated: {
            value: 881,
            source: 'ArgenStats Estimator',
            lastUpdate: '2025-09-04T02:34:33Z'
          },
          spread: 1,
          spreadPercentage: 0.11
        }
      },
      historical: {
        description: 'Obtener serie histórica del riesgo país',
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
          source: {
            type: 'string',
            default: 'all',
            options: ['all', 'official', 'estimated'],
            description: 'Fuente de datos a incluir'
          },
          interval: {
            type: 'string',
            default: 'daily',
            options: ['daily', 'weekly', 'monthly'],
            description: 'Intervalo de agrupación'
          }
        },
        example: '/api/v1/country-risk?view=historical&from=2025-08-01&to=2025-09-01&source=official',
        response: {
          series: [
            {
              date: '2025-08-01',
              official: 820,
              estimated: 819,
              spread: -1
            }
          ],
          summary: {
            count: 30,
            avgOfficial: 825,
            avgEstimated: 824,
            minOfficial: 706,
            maxOfficial: 880,
            volatility: 12.5
          }
        }
      },
      comparison: {
        description: 'Comparar valores oficiales vs estimados',
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
        example: '/api/v1/country-risk?view=comparison&from=2025-08-01&to=2025-09-01',
        response: {
          period: {
            from: '2025-08-01',
            to: '2025-09-01',
            days: 31
          },
          official: {
            avg: 825,
            min: 706,
            max: 880,
            stdDev: 45.2,
            lastValue: 880
          },
          estimated: {
            avg: 824,
            min: 721,
            max: 881,
            stdDev: 44.8,
            lastValue: 881
          },
          accuracy: {
            avgDifference: 1,
            maxDifference: 75,
            correlation: 0.98,
            rmse: 15.2
          }
        }
      },
      statistics: {
        description: 'Obtener estadísticas del riesgo país',
        parameters: {
          from: {
            type: 'string',
            format: 'YYYY-MM-DD',
            description: 'Fecha de inicio (opcional, por defecto últimos 365 días)'
          },
          to: {
            type: 'string',
            format: 'YYYY-MM-DD',
            description: 'Fecha de fin (opcional, por defecto hoy)'
          },
          source: {
            type: 'string',
            default: 'official',
            options: ['all', 'official', 'estimated'],
            description: 'Fuente para las estadísticas'
          }
        },
        example: '/api/v1/country-risk?view=statistics&source=official',
        response: {
          current: 880,
          average: 825,
          median: 820,
          min: {
            value: 706,
            date: '2025-08-18'
          },
          max: {
            value: 880,
            date: '2025-09-04'
          },
          standardDeviation: 45.2,
          percentiles: {
            p25: 750,
            p50: 820,
            p75: 850,
            p90: 870
          },
          trend: 'increasing',
          volatility: 'moderate'
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
            source: 'JP Morgan / ArgenStats',
            indicator: 'Country Risk (EMBI+)',
            view: 'string',
            parameters: 'object'
          }
        }
      },
      400: {
        description: 'Bad request',
        errors: {
          INVALID_FORMAT: 'Invalid format parameter',
          INVALID_VIEW: 'Invalid view parameter',
          INVALID_DATE: 'Invalid date format',
          INVALID_DATE_RANGE: 'Invalid date range',
          INVALID_SOURCE: 'Invalid source parameter',
          INVALID_INTERVAL: 'Invalid interval parameter',
          MISSING_PARAMETERS: 'Required parameters missing'
        }
      },
      401: {
        description: 'Unauthorized - Invalid API key'
      },
      429: {
        description: 'Rate limit exceeded'
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
      description: 'El riesgo país (EMBI+ Argentina) mide el diferencial de tasa que pagan los bonos argentinos frente a los bonos del Tesoro de Estados Unidos.',
      unit: 'Puntos básicos (100 puntos básicos = 1%)',
      sources: {
        official: {
          name: 'JP Morgan',
          description: 'Valor oficial del EMBI+ Argentina calculado por JP Morgan',
          frequency: 'Diaria',
          availability: 'Con retraso de 1 día'
        },
        estimated: {
          name: 'ArgenStats Estimator',
          description: 'Estimación en tiempo real basada en el precio de bonos soberanos',
          frequency: 'Actualización continua',
          methodology: 'Cálculo basado en AL30, GD30 y otros bonos soberanos'
        }
      },
      interpretation: {
        low: '< 400 puntos - Riesgo bajo',
        moderate: '400-800 puntos - Riesgo moderado',
        high: '800-1500 puntos - Riesgo alto',
        veryHigh: '> 1500 puntos - Riesgo muy alto'
      }
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type'
    }
  })
}