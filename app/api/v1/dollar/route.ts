// /app/api/v1/dollar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as dollarService from '@/lib/api/services/dollar'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'
import { 
  DOLLAR_TYPES,
  DOLLAR_TYPE_LABELS,
  DOLLAR_TYPE_DESCRIPTIONS
} from '@/lib/api/constants/dollar'

// Definir constantes y tipos al principio
const ALLOWED_VIEWS = ['current', 'historical', 'comparison', 'types', 'calculator'] as const
type ViewType = typeof ALLOWED_VIEWS[number]

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// TTL diferenciado por vista (en segundos)
const DOLLAR_CACHE_TTL: Record<ViewType, number> = {
  current: 60,        // 1 minuto (actualización frecuente)
  historical: 1800,   // 30 minutos
  comparison: 300,    // 5 minutos
  types: 3600,        // 1 hora
  calculator: 0       // Sin cache
}

// Helpers para validación
const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

const isValidDollarType = (type: string): boolean => {
  // Aseguramos que el tipo sea uno de los permitidos, usando el tipo correcto
  return DOLLAR_TYPES.includes(type.toUpperCase() as (typeof DOLLAR_TYPES)[number])
}

// GET endpoint
export const GET = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'current'
  const format = searchParams.get('format') || 'json'
  
  // COMPATIBILIDAD: Si no hay view pero hay type o date, usar modo legacy
  const legacyType = searchParams.get('type')
  const legacyDate = searchParams.get('date')
  if (!searchParams.has('view') && (legacyType || legacyDate)) {
    return handleLegacyRequest(request)
  }

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
    // Cache
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)

    if (cached && 'data' in cached) {
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, `dollar-${validView}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="dollar-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
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
      source: 'BCRA / Ambito Financiero',
      indicator: 'Exchange Rates',
      view: validView,
      format,
      lastUpdate: new Date().toISOString()
    }

    switch (validView) {
      case 'current': {
        const type = searchParams.get('type')?.toUpperCase()
        
        if (type && !isValidDollarType(type)) {
          return apiError(
            'INVALID_TYPE',
            `Invalid dollar type. Allowed values: ${DOLLAR_TYPES.join(', ')}`,
            400
          )
        }

        data = await dollarService.getCurrentDollarRates(type || undefined)
        metadata.parameters = { type: type || 'all' }
        break
      }

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const type = searchParams.get('type')?.toUpperCase()
        const interval = searchParams.get('interval') || 'daily'

        if (!from || !to) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameters "from" and "to" are required for historical view',
            400
          )
        }

        if (!isValidDate(from) || !isValidDate(to)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD',
            400
          )
        }

        if (type && !isValidDollarType(type)) {
          return apiError(
            'INVALID_TYPE',
            `Invalid dollar type. Allowed values: ${DOLLAR_TYPES.join(', ')}`,
            400
          )
        }

        const validIntervals = ['daily', 'weekly', 'monthly'] as const
        if (!validIntervals.includes(interval as any)) {
          return apiError(
            'INVALID_INTERVAL',
            `Invalid interval. Allowed values: ${validIntervals.join(', ')}`,
            400
          )
        }

        data = await dollarService.getHistoricalDollarRates({
          from,
          to,
          type: type || undefined,
          interval
        })

        metadata.parameters = { from, to, type: type || 'all', interval }
        metadata.count = Array.isArray(data) ? data.length : (data.series ? data.series.length : 0)
        break
      }

      case 'comparison': {
        const date = searchParams.get('date')
        const types = searchParams.get('types')?.split(',').map(t => t.trim().toUpperCase())

        if (date && !isValidDate(date)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD',
            400
          )
        }

        if (types) {
          for (const type of types) {
            if (!isValidDollarType(type)) {
              return apiError(
                'INVALID_TYPE',
                `Invalid dollar type: ${type}. Allowed values: ${DOLLAR_TYPES.join(', ')}`,
                400
              )
            }
          }
        }

        data = await dollarService.compareDollarTypes({
          date: date || undefined,
          types: types || undefined
        })

        metadata.parameters = { 
          date: date || 'latest',
          types: types ? types.join(',') : 'all'
        }
        break
      }

      case 'types': {
        data = await dollarService.getAvailableDollarTypes()
        break
      }

      case 'calculator': {
        const amount = searchParams.get('amount')
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const type = searchParams.get('type')?.toUpperCase() || 'BLUE'

        if (!amount) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameter "amount" is required for calculator',
            400
          )
        }

        const parsedAmount = parseFloat(amount)
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return apiError(
            'INVALID_AMOUNT',
            'Amount must be a positive number',
            400
          )
        }

        if (!isValidDollarType(type)) {
          return apiError(
            'INVALID_TYPE',
            `Invalid dollar type. Allowed values: ${DOLLAR_TYPES.join(', ')}`,
            400
          )
        }

        // from: ARS/USD, to: ARS/USD
        const validCurrencies = ['ARS', 'USD']
        const fromCurrency = from?.toUpperCase() || 'USD'
        const toCurrency = to?.toUpperCase() || 'ARS'

        if (!validCurrencies.includes(fromCurrency) || !validCurrencies.includes(toCurrency)) {
          return apiError(
            'INVALID_CURRENCY',
            'Invalid currency. Use ARS or USD',
            400
          )
        }

        data = await dollarService.convertCurrency({
          amount: parsedAmount,
          from: fromCurrency,
          to: toCurrency,
          type
        })

        metadata.parameters = { amount: parsedAmount, from: fromCurrency, to: toCurrency, type }
        break
      }
    }

    // Guardar en cache
    const cacheTTL = DOLLAR_CACHE_TTL[validView]
    if (cacheTTL > 0) {
      await setCached(cacheKey, { data, metadata }, cacheTTL)
    }

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `dollar-${validView}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="dollar-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('Dollar API error:', error)
    
    if (error instanceof dollarService.DollarError) {
      return apiError(error.code, error.message, 400, error.details)
    }
    
    return apiError(
      'INTERNAL_ERROR',
      'An error occurred processing your request',
      500
    )
  }
})

// Función para mantener compatibilidad con el formato anterior
async function handleLegacyRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dollarType = searchParams.get('type')?.toUpperCase()
  const dateParam = searchParams.get('date')
  const limit = parseInt(searchParams.get('limit') || '30')

  try {
    const data = await dollarService.getLegacyFormat({
      type: dollarType || undefined,
      date: dateParam || undefined,
      limit
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error('Legacy dollar API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// OPTIONS endpoint
export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/v1/dollar',
    description: 'API de tipos de cambio del dólar en Argentina',
    methods: ['GET', 'OPTIONS'],
    authentication: 'API Key required (header: x-api-key) for new format',
    compatibility: {
      legacy: {
        description: 'Compatible con formato anterior sin view parameter',
        examples: [
          '/api/v1/dollar?type=BLUE',
          '/api/v1/dollar?date=2024-12-01',
          '/api/v1/dollar?type=BLUE&limit=10'
        ]
      },
      modern: {
        description: 'Nuevo formato con views',
        examples: [
          '/api/v1/dollar?view=current',
          '/api/v1/dollar?view=historical&from=2024-01-01&to=2024-12-31&type=BLUE'
        ]
      }
    },
    globalParameters: {
      format: {
        type: 'string',
        default: 'json',
        options: ['json', 'csv'],
        description: 'Response format'
      }
    },
    views: {
      current: {
        description: 'Cotizaciones actuales del dólar',
        parameters: {
          type: {
            type: 'string',
            options: DOLLAR_TYPES,
            description: 'Tipo de dólar específico (opcional, por defecto todos)'
          }
        },
        example: '/api/v1/dollar?view=current',
        response: {
          BLUE: {
            buyPrice: 1150,
            sellPrice: 1170,
            date: '2024-12-15',
            averagePrice: 1160,
            spread: 20,
            spreadPercentage: '1.74'
          }
        }
      },
      historical: {
        description: 'Serie histórica de cotizaciones',
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
          type: {
            type: 'string',
            options: DOLLAR_TYPES,
            description: 'Tipo de dólar (opcional, por defecto todos)'
          },
          interval: {
            type: 'string',
            default: 'daily',
            options: ['daily', 'weekly', 'monthly'],
            description: 'Intervalo de agrupación'
          }
        },
        example: '/api/v1/dollar?view=historical&from=2024-01-01&to=2024-12-31&type=BLUE'
      },
      comparison: {
        description: 'Comparar diferentes tipos de dólar',
        parameters: {
          date: {
            type: 'string',
            format: 'YYYY-MM-DD',
            description: 'Fecha específica (opcional, por defecto hoy)'
          },
          types: {
            type: 'string',
            description: 'Tipos a comparar separados por coma (opcional, por defecto todos)'
          }
        },
        example: '/api/v1/dollar?view=comparison&types=BLUE,OFICIAL,MEP'
      },
      types: {
        description: 'Obtener tipos de dólar disponibles',
        parameters: {},
        example: '/api/v1/dollar?view=types'
      },
      calculator: {
        description: 'Convertir entre ARS y USD',
        parameters: {
          amount: {
            type: 'number',
            required: true,
            description: 'Monto a convertir'
          },
          from: {
            type: 'string',
            default: 'USD',
            options: ['ARS', 'USD'],
            description: 'Moneda origen'
          },
          to: {
            type: 'string',
            default: 'ARS',
            options: ['ARS', 'USD'],
            description: 'Moneda destino'
          },
          type: {
            type: 'string',
            default: 'BLUE',
            options: DOLLAR_TYPES,
            description: 'Tipo de cambio a usar'
          }
        },
        example: '/api/v1/dollar?view=calculator&amount=100&from=USD&to=ARS&type=BLUE'
      }
    },
    dollarTypes: Object.fromEntries(
      DOLLAR_TYPES.map(type => [
        type,
        {
          label: DOLLAR_TYPE_LABELS[type],
          description: DOLLAR_TYPE_DESCRIPTIONS[type]
        }
      ])
    ),
    responses: {
      200: {
        description: 'Successful response'
      },
      400: {
        description: 'Bad request',
        errors: {
          INVALID_FORMAT: 'Invalid format parameter',
          INVALID_VIEW: 'Invalid view parameter',
          INVALID_TYPE: 'Invalid dollar type',
          INVALID_DATE: 'Invalid date format',
          INVALID_INTERVAL: 'Invalid interval',
          INVALID_AMOUNT: 'Invalid amount',
          INVALID_CURRENCY: 'Invalid currency',
          MISSING_PARAMETERS: 'Required parameters missing'
        }
      },
      401: {
        description: 'Unauthorized - Invalid API key (only for new format)'
      },
      500: {
        description: 'Internal server error'
      }
    },
    rateLimits: {
      free: '100 requests/hour',
      basic: '1,000 requests/hour',
      pro: '10,000 requests/hour'
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key, Content-Type'
    }
  })
}