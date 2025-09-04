// /app/api/v1/economic-activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as emaeService from '@/lib/api/services/emae'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

type ViewType = 'current' | 'historical' | 'sectors' | 'comparison'

// GET /api/v1/economic-activity
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
    
    if (cached && 'data' in cached) {
      // Si está en cache, formatearlo según se pida
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, view, 'emae'), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="emae-${view}-${new Date().toISOString().split('T')[0]}.csv"`,
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
      indicator: 'EMAE',
      view,
      format
    }

    switch (view) {
      case 'current': {
        const sector = searchParams.get('sector') || 'GENERAL'
        const adjusted = searchParams.get('adjusted') === 'true'
        
        data = await emaeService.getCurrentEmae({ 
          sectorCode: sector, 
          adjusted 
        })
        metadata.parameters = { sector, adjusted }
        break
      }
      
      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const sector = searchParams.get('sector') || 'GENERAL'
        const adjusted = searchParams.get('adjusted') === 'true'
        const interval = searchParams.get('interval') || 'monthly'
        
        if (!from || !to) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameters "from" and "to" are required for historical view',
            400
          )
        }
        
        data = await emaeService.getHistoricalEmae({ 
          from, 
          to, 
          sectorCode: sector,
          adjusted,
          interval 
        })
        metadata.parameters = { from, to, sector, adjusted, interval }
        metadata.count = data.length
        break
      }
      
      case 'sectors': {
        const date = searchParams.get('date')
        const includeVariations = searchParams.get('variations') !== 'false'
        
        data = await emaeService.getEmaeBySectors({ 
          date, 
          includeVariations 
        })
        metadata.parameters = { 
          date: date || 'latest', 
          includeVariations 
        }
        break
      }
      
      case 'comparison': {
        const sectors = searchParams.get('sectors')?.split(',') || []
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const metric = searchParams.get('metric') || 'original'
        
        if (sectors.length === 0) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameter "sectors" is required for comparison view',
            400
          )
        }
        
        if (!from || !to) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameters "from" and "to" are required for comparison view',
            400
          )
        }
        
        data = await emaeService.compareSectors({ 
          sectors, 
          from, 
          to,
          metric: metric as 'original' | 'adjusted' | 'variations'
        })
        metadata.parameters = { sectors: sectors.join(','), from, to, metric }
        break
      }
      
      default:
        return apiError(
          'INVALID_VIEW',
          `Invalid view parameter. Allowed values: ${ALLOWED_VIEWS.join(', ')}`,
          400
        )
    }

    // Guardar en cache
    const cacheData: CachedData = { data, metadata }
    await setCached(cacheKey, cacheData, 300) // 5 minutos

    // Retornar respuesta según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, view, 'emae'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="emae-${view}-${new Date().toISOString().split('T')[0]}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response
    
  } catch (error) {
    console.error('EMAE API error:', error)
    
    if (error instanceof emaeService.EmaeServiceError) {
      return apiError(error.code, error.message, 400, error.details)
    }
    
    return apiError(
      'INTERNAL_ERROR',
      'An error occurred processing your request',
      500
    )
  }
})

// OPTIONS /api/v1/economic-activity
export async function OPTIONS() {
  const documentation = {
    endpoint: '/api/v1/economic-activity',
    description: 'API para consultar datos del Estimador Mensual de Actividad Económica (EMAE) de Argentina',
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
        description: 'Obtener el EMAE más reciente',
        parameters: {
          sector: {
            type: 'string',
            default: 'GENERAL',
            options: ['GENERAL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'],
            description: 'Código del sector económico (ver tabla de sectores)'
          },
          adjusted: {
            type: 'boolean',
            default: false,
            description: 'Incluir valores desestacionalizados'
          }
        },
        example: '/api/v1/economic-activity?view=current&sector=C&adjusted=true'
      },
      historical: {
        description: 'Obtener serie histórica del EMAE',
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
          sector: {
            type: 'string',
            default: 'GENERAL',
            description: 'Código del sector económico'
          },
          adjusted: {
            type: 'boolean',
            default: false,
            description: 'Usar valores desestacionalizados'
          },
          interval: {
            type: 'string',
            default: 'monthly',
            options: ['monthly', 'quarterly', 'yearly'],
            description: 'Intervalo de agrupación'
          }
        },
        example: '/api/v1/economic-activity?view=historical&from=2023-01-01&to=2024-12-31&sector=GENERAL'
      },
      sectors: {
        description: 'Obtener EMAE desglosado por sectores',
        parameters: {
          date: {
            type: 'string',
            format: 'YYYY-MM-DD',
            default: 'latest',
            description: 'Fecha específica o "latest" para la más reciente'
          },
          variations: {
            type: 'boolean',
            default: true,
            description: 'Incluir variaciones mensuales y anuales'
          }
        },
        example: '/api/v1/economic-activity?view=sectors&date=2024-01-01'
      },
      comparison: {
        description: 'Comparar múltiples sectores en un período',
        parameters: {
          sectors: {
            type: 'string',
            required: true,
            description: 'Lista de sectores separados por comas'
          },
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
          metric: {
            type: 'string',
            default: 'original',
            options: ['original', 'adjusted', 'variations'],
            description: 'Métrica a comparar'
          }
        },
        example: '/api/v1/economic-activity?view=comparison&sectors=C,G,I&from=2023-01-01&to=2024-01-01'
      }
    },
    sectors: {
      'GENERAL': 'Nivel general',
      'A': 'Agricultura, ganadería, caza y silvicultura',
      'B': 'Pesca',
      'C': 'Industria manufacturera',
      'D': 'Suministro de electricidad, gas y agua',
      'E': 'Construcción',
      'F': 'Comercio mayorista y minorista',
      'G': 'Hoteles y restaurantes',
      'H': 'Transporte y comunicaciones',
      'I': 'Intermediación financiera',
      'J': 'Actividades inmobiliarias, empresariales y de alquiler',
      'K': 'Administración pública, defensa y seguridad social',
      'L': 'Enseñanza',
      'M': 'Servicios sociales y de salud',
      'N': 'Otras actividades de servicios comunitarios',
      'O': 'Hogares privados con servicio doméstico',
      'P': 'Impuestos netos de subsidios'
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
            indicator: 'string',
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
    }
  }

  return NextResponse.json(documentation, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key'
    }
  })
}

const ALLOWED_VIEWS = ['current', 'historical', 'sectors', 'comparison']