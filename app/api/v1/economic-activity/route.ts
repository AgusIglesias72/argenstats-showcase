// /app/api/v1/economic-activity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as emaeService from '@/lib/api/services/emae'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'
import { 
  EMAE_SECTORS,
  EMAE_SECTOR_INFO,
  EMAE_DATA_TYPES,
  EMAE_VARIATION_TYPES,
  type EmaeSectorCode
} from '@/lib/api/constants/emae'

// Definir constantes y tipos al principio
const ALLOWED_VIEWS = ['current', 'historical', 'sectors', 'comparison'] as const
type ViewType = typeof ALLOWED_VIEWS[number]

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// Helpers para validación
const isValidSector = (sector: string): sector is EmaeSectorCode => {
  return sector in EMAE_SECTORS
}

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

const isValidMetric = (metric: string): metric is 'original' | 'adjusted' | 'variations' => {
  return ['original', 'adjusted', 'variations'].includes(metric)
}

const isValidInterval = (interval: string): interval is 'monthly' | 'quarterly' | 'yearly' => {
  return ['monthly', 'quarterly', 'yearly'].includes(interval)
}

// GET /api/v1/economic-activity
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
    // Intentar obtener de cache
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)
    
    if (cached && 'data' in cached) {
      // Si está en cache, formatearlo según se pida
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, `emae-${validView}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="emae-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
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
      view: validView,
      format
    }

    switch (validView) {
      case 'current': {
        const sectorParam = searchParams.get('sector') || 'GENERAL'
        const adjusted = searchParams.get('adjusted') === 'true'
        
        // Validar sector
        if (!isValidSector(sectorParam)) {
          return apiError(
            'INVALID_SECTOR',
            `Invalid sector. Allowed values: ${Object.keys(EMAE_SECTORS).join(', ')}`,
            400
          )
        }
        
        data = await emaeService.getCurrentEmae({ 
          sectorCode: sectorParam, 
          adjusted 
        })
        metadata.parameters = { sector: sectorParam, adjusted }
        break
      }
      
      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const sectorParam = searchParams.get('sector') || 'GENERAL'
        const adjusted = searchParams.get('adjusted') === 'true'
        const interval = searchParams.get('interval') || 'monthly'
        
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
        
        // Validar sector
        if (!isValidSector(sectorParam)) {
          return apiError(
            'INVALID_SECTOR',
            `Invalid sector. Allowed values: ${Object.keys(EMAE_SECTORS).join(', ')}`,
            400
          )
        }
        
        // Validar interval
        if (!isValidInterval(interval)) {
          return apiError(
            'INVALID_INTERVAL',
            'Invalid interval. Allowed values: monthly, quarterly, yearly',
            400
          )
        }
        
        data = await emaeService.getHistoricalEmae({ 
          from, 
          to, 
          sectorCode: sectorParam,
          adjusted,
          interval 
        })
        metadata.parameters = { from, to, sector: sectorParam, adjusted, interval }
        metadata.count = data.length
        break
      }
      
      case 'sectors': {
        const date = searchParams.get('date')
        const includeVariations = searchParams.get('variations') !== 'false'
        
        // Validar fecha si se proporciona
        if (date && date !== 'latest' && !isValidDate(date)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD or "latest"',
            400
          )
        }
        
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
        const sectorsParam = searchParams.get('sectors')
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const metric = searchParams.get('metric') || 'original'
        
        if (!sectorsParam) {
          return apiError(
            'MISSING_PARAMETERS',
            'Parameter "sectors" is required for comparison view',
            400
          )
        }
        
        const sectors = sectorsParam.split(',').map(s => s.trim())
        
        // Validar cada sector
        for (const sector of sectors) {
          if (!isValidSector(sector)) {
            return apiError(
              'INVALID_SECTOR',
              `Invalid sector: ${sector}. Allowed values: ${Object.keys(EMAE_SECTORS).join(', ')}`,
              400
            )
          }
        }
        
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
        
        // Validar metric
        if (!isValidMetric(metric)) {
          return apiError(
            'INVALID_METRIC',
            'Invalid metric. Allowed values: original, adjusted, variations',
            400
          )
        }
        
        data = await emaeService.compareSectors({ 
          sectors: sectors as EmaeSectorCode[], 
          from, 
          to,
          metric
        })
        metadata.parameters = { sectors: sectorsParam, from, to, metric }
        break
      }
    }

    // TTL diferenciado por vista
    const getCacheTTL = (view: ViewType): number => {
      switch(view) {
        case 'current': return 300      // 5 minutos
        case 'historical': return 3600   // 1 hora
        case 'sectors': return 600       // 10 minutos
        case 'comparison': return 1800   // 30 minutos
        default: return 300
      }
    }

    // Guardar en cache
    const ttl = getCacheTTL(validView)
    const cacheData: CachedData = { data, metadata }
    await setCached(cacheKey, cacheData, ttl)

    // Retornar respuesta según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `emae-${validView}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="emae-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
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
            options: Object.keys(EMAE_SECTORS),
            descriptions: EMAE_SECTORS,
            description: 'Código del sector económico'
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
            options: Object.keys(EMAE_SECTORS),
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
        description: 'Obtener EMAE desglosado por todos los sectores',
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
            description: 'Lista de códigos de sectores separados por comas',
            example: 'C,D,G,I'
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
        example: '/api/v1/economic-activity?view=comparison&sectors=C,D,G&from=2023-01-01&to=2024-01-01'
      }
    },
    sectors: {
      description: 'Códigos de sectores económicos disponibles',
      codes: EMAE_SECTORS,
      details: Object.entries(EMAE_SECTOR_INFO).reduce((acc, [code, info]) => ({
        ...acc,
        [code]: {
          name: EMAE_SECTORS[code as EmaeSectorCode],
          percentage: info.percentage,
          description: info.description
        }
      }), {})
    },
    dataTypes: EMAE_DATA_TYPES,
    variationTypes: EMAE_VARIATION_TYPES,
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
        },
        errors: {
          INVALID_FORMAT: 'Invalid format parameter',
          INVALID_VIEW: 'Invalid view parameter',
          INVALID_SECTOR: 'Invalid sector code',
          INVALID_DATE: 'Invalid date format',
          INVALID_INTERVAL: 'Invalid interval parameter',
          INVALID_METRIC: 'Invalid metric parameter',
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
    examples: {
      current: {
        description: 'Obtener EMAE actual del sector manufacturero',
        request: 'GET /api/v1/economic-activity?view=current&sector=D',
        response: {
          success: true,
          data: {
            date: '2024-01-01',
            sector: 'D',
            sectorName: 'Industria manufacturera',
            originalValue: 142.5,
            monthlyVariation: 1.2,
            yearlyVariation: 3.5,
            percentage: 18.9
          }
        }
      },
      historical: {
        description: 'Serie histórica del nivel general',
        request: 'GET /api/v1/economic-activity?view=historical&from=2023-01-01&to=2024-01-01&sector=GENERAL',
        response: {
          success: true,
          data: [
            {
              date: '2023-01-01',
              originalValue: 135.2,
              monthlyVariation: 0.5,
              yearlyVariation: 2.1
            }
          ]
        }
      },
      sectors: {
        description: 'Todos los sectores para una fecha',
        request: 'GET /api/v1/economic-activity?view=sectors&date=latest',
        response: {
          success: true,
          data: {
            date: '2024-01-01',
            sectors: [
              {
                code: 'D',
                name: 'Industria manufacturera',
                originalValue: 142.5,
                percentage: 18.9,
                monthlyVariation: 1.2,
                yearlyVariation: 3.5
              }
            ]
          }
        }
      }
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