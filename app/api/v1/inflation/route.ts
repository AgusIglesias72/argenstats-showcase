// /app/api/v1/inflation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as inflationService from '@/lib/api/services/inflation'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Definir tipo para el cache
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// Definir tipo para las vistas
type ViewType = 'current' | 'historical' | 'components' | 'regions' | 'calculator'

export const GET = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  const { searchParams } = new URL(request.url)
  const view = (searchParams.get('view') || 'current') as ViewType
  const format = searchParams.get('format') || 'json'
  
  // Validar formato
  if (!['json', 'csv'].includes(format)) {
    return apiError(
      'INVALID_FORMAT',
      'Invalid format. Allowed values: json, csv',
      400
    )
  }
  
  try {
    // Intentar obtener de cache
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)
    
    if (cached && 'data' in cached) {  // Verificar que tiene la propiedad data
      // Si está en cache, formatearlo según se pida
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, view), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="inflation-${view}-${new Date().toISOString().split('T')[0]}.csv"`,
            'X-Cache': 'HIT'
          }
        })
      }
      
      // Agregar header de cache hit
      const response = apiResponse(cached.data, { metadata: cached.metadata })
      response.headers.set('X-Cache', 'HIT')
      return response
    }
    
    // Si no está en cache, obtener datos
    let data: any
    const metadata: Record<string, any> = {
      source: 'INDEC',
      view,
      format
    }

    switch (view) {
      case 'current': {
        const component = searchParams.get('component') || 'GENERAL'
        const region = searchParams.get('region') || 'Nacional'
        
        data = await inflationService.getCurrentInflation({ component, region })
        metadata.parameters = { component, region }
        break
      }
      
      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const component = searchParams.get('component') || 'GENERAL'
        const region = searchParams.get('region') || 'Nacional'
        const interval = searchParams.get('interval') || 'monthly'
        
        if (!from || !to) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameters "from" and "to" are required for historical view',
            400
          )
        }
        
        data = await inflationService.getHistoricalInflation({ 
          from, to, component, region, interval 
        })
        metadata.parameters = { from, to, component, region, interval }
        metadata.count = data.length
        break
      }
      
      case 'components': {
        const date = searchParams.get('date')
        const region = searchParams.get('region') || 'Nacional'
        
        data = await inflationService.getInflationComponents({ date, region })
        metadata.parameters = { date: date || 'latest', region }
        break
      }
      
      case 'regions': {
        const date = searchParams.get('date')
        const component = searchParams.get('component') || 'GENERAL'
        
        data = await inflationService.getRegionalInflation({ date, component })
        metadata.parameters = { date: date || 'latest', component }
        break
      }
      
      case 'calculator': {
        const amount = searchParams.get('amount')
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        
        if (!amount || !from || !to) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameters "amount", "from", and "to" are required for calculator',
            400
          )
        }
        
        data = await inflationService.calculateInflation({ 
          amount: parseFloat(amount), 
          from, 
          to 
        })
        metadata.parameters = { amount, from, to }
        break
      }
      
      default:
        return apiError(
          'INVALID_VIEW',
          `Invalid view parameter. Allowed values: ${ALLOWED_VIEWS.join(', ')}`,
          400
        )
    }

    // Guardar en cache (excepto calculator)
    // Ahora TypeScript entiende que view puede ser 'calculator'
    if (view !== 'calculator') {
      const cacheData: CachedData = { data, metadata }
      await setCached(cacheKey, cacheData, 300) // 5 minutos
    }

    // Retornar respuesta según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, view), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inflation-${view}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response
    
  } catch (error) {
    console.error('Inflation API error:', error)
    
    if (error instanceof inflationService.InflationServiceError) {
      return apiError(error.code, error.message, 400, error.details)
    }
    
    return apiError(
      'INTERNAL_ERROR',
      'An error occurred processing your request',
      500
    )
  }
})

// OPTIONS /api/v1/inflation
export async function OPTIONS() {
  const documentation = {
    endpoint: '/api/v1/inflation',
    description: 'API para consultar datos de inflación (IPC) de Argentina',
    methods: ['GET', 'OPTIONS'],
    authentication: 'API Key required (header: x-api-key)',
    views: {
      current: {
        description: 'Obtener la inflación actual',
        parameters: {
          component: {
            type: 'string',
            default: 'GENERAL',
            options: ['GENERAL', 'ALIMENTOS', 'VESTIMENTA', 'VIVIENDA', 'EQUIPAMIENTO', 
                     'SALUD', 'TRANSPORTE', 'COMUNICACION', 'RECREACION', 'EDUCACION', 
                     'RESTAURANTES', 'BIENES', 'SERVICIOS'],
            description: 'Componente del IPC'
          },
          region: {
            type: 'string',
            default: 'Nacional',
            options: ['Nacional', 'GBA', 'Pampeana', 'Noroeste', 'Noreste', 'Cuyo', 'Patagonia'],
            description: 'Región geográfica'
          }
        },
        example: '/api/v1/inflation?view=current&component=ALIMENTOS&region=GBA'
      },
      historical: {
        description: 'Obtener serie histórica de inflación',
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
          component: {
            type: 'string',
            default: 'GENERAL',
            description: 'Componente del IPC'
          },
          region: {
            type: 'string',
            default: 'Nacional',
            description: 'Región geográfica'
          },
          interval: {
            type: 'string',
            default: 'monthly',
            options: ['monthly', 'quarterly', 'yearly'],
            description: 'Intervalo de agrupación'
          }
        },
        example: '/api/v1/inflation?view=historical&from=2023-01-01&to=2024-12-31'
      },
      components: {
        description: 'Obtener inflación desglosada por componentes',
        parameters: {
          date: {
            type: 'string',
            format: 'YYYY-MM-DD',
            default: 'latest',
            description: 'Fecha específica o "latest" para la más reciente'
          },
          region: {
            type: 'string',
            default: 'Nacional',
            description: 'Región geográfica'
          }
        },
        example: '/api/v1/inflation?view=components&date=2024-12-01'
      },
      regions: {
        description: 'Obtener inflación por regiones',
        parameters: {
          date: {
            type: 'string',
            format: 'YYYY-MM-DD',
            default: 'latest',
            description: 'Fecha específica'
          },
          component: {
            type: 'string',
            default: 'GENERAL',
            description: 'Componente del IPC'
          }
        },
        example: '/api/v1/inflation?view=regions&component=ALIMENTOS'
      },
      calculator: {
        description: 'Calcular el valor ajustado por inflación',
        parameters: {
          amount: {
            type: 'number',
            required: true,
            description: 'Monto a calcular'
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
        example: '/api/v1/inflation?view=calculator&amount=1000&from=2020-01-01&to=2024-12-01'
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
            source: 'string',
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
    globalParameters: {
      format: {
        type: 'string',
        default: 'json',
        options: ['json', 'csv'],
        description: 'Response format. CSV format will trigger file download.'
      }
    },
  }

  return NextResponse.json(documentation, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key'
    }
  })
}

const ALLOWED_VIEWS = ['current', 'historical', 'components', 'regions', 'calculator']
