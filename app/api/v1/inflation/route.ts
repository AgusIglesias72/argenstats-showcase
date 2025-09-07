// /app/api/v1/inflation/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as inflationService from '@/lib/api/services/inflation'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'
import { 
  IPC_COMPONENTS, 
  IPC_REGIONS,
  CORE_IPC_COMPONENTS,
  CATEGORY_COMPONENTS,
  type IPCComponentCode,
  type IPCRegion
} from '@/lib/api/constants/inflation'

// Definir constantes y tipos al principio
const ALLOWED_VIEWS = ['current', 'historical', 'components', 'regions', 'calculator'] as const
type ViewType = typeof ALLOWED_VIEWS[number]

// Definir tipo para el cache
interface CachedData {
  data: any
  metadata: Record<string, any>
}

// Helpers para validación
const isValidComponent = (component: string): component is IPCComponentCode => {
  return component in IPC_COMPONENTS
}

const isValidRegion = (region: string): region is IPCRegion => {
  return region in IPC_REGIONS
}

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}

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
        return new NextResponse(convertToCSV(cached.data, validView), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="inflation-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
            'X-Cache': 'HIT'
          }
        })
      }
      
      const response = apiResponse(cached.data, { metadata: cached.metadata })
      response.headers.set('X-Cache', 'HIT')
      return response
    }
    
    // Si no está en cache, obtener datos
    let data: any
    const metadata: Record<string, any> = {
      source: 'INDEC',
      view: validView,
      format
    }

    switch (validView) {
      case 'current': {
        const componentParam = searchParams.get('component') || 'GENERAL'
        const regionParam = searchParams.get('region') || 'Nacional'
        
        // Validar component
        if (!isValidComponent(componentParam)) {
          return apiError(
            'INVALID_COMPONENT',
            `Invalid component. Allowed values: ${Object.keys(IPC_COMPONENTS).join(', ')}`,
            400
          )
        }
        
        // Validar region
        if (!isValidRegion(regionParam)) {
          return apiError(
            'INVALID_REGION',
            `Invalid region. Allowed values: ${Object.keys(IPC_REGIONS).join(', ')}`,
            400
          )
        }
        
        data = await inflationService.getCurrentInflation({ 
          component: componentParam, 
          region: regionParam 
        })
        metadata.parameters = { component: componentParam, region: regionParam }
        break
      }
      
      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const componentParam = searchParams.get('component') || 'GENERAL'
        const regionParam = searchParams.get('region') || 'Nacional'
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
        
        // Validar component
        if (!isValidComponent(componentParam)) {
          return apiError(
            'INVALID_COMPONENT',
            `Invalid component. Allowed values: ${Object.keys(IPC_COMPONENTS).join(', ')}`,
            400
          )
        }
        
        // Validar region
        if (!isValidRegion(regionParam)) {
          return apiError(
            'INVALID_REGION',
            `Invalid region. Allowed values: ${Object.keys(IPC_REGIONS).join(', ')}`,
            400
          )
        }
        
        // Validar interval
        const validIntervals = ['monthly', 'quarterly', 'yearly'] as const
        if (!validIntervals.includes(interval as any)) {
          return apiError(
            'INVALID_INTERVAL',
            `Invalid interval. Allowed values: ${validIntervals.join(', ')}`,
            400
          )
        }
        
        data = await inflationService.getHistoricalInflation({ 
          from, 
          to, 
          component: componentParam, 
          region: regionParam, 
          interval 
        })
        metadata.parameters = { from, to, component: componentParam, region: regionParam, interval }
        metadata.count = data.length
        break
      }
      
      case 'components': {
        const date = searchParams.get('date')
        const regionParam = searchParams.get('region') || 'Nacional'
        
        // Validar fecha si se proporciona
        if (date && date !== 'latest' && !isValidDate(date)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD or "latest"',
            400
          )
        }
        
        // Validar region
        if (!isValidRegion(regionParam)) {
          return apiError(
            'INVALID_REGION',
            `Invalid region. Allowed values: ${Object.keys(IPC_REGIONS).join(', ')}`,
            400
          )
        }
        
        data = await inflationService.getInflationComponents({ 
          date, 
          region: regionParam 
        })
        metadata.parameters = { date: date || 'latest', region: regionParam }
        break
      }
      
      case 'regions': {
        const date = searchParams.get('date')
        const componentParam = searchParams.get('component') || 'GENERAL'
        
        // Validar fecha si se proporciona
        if (date && date !== 'latest' && !isValidDate(date)) {
          return apiError(
            'INVALID_DATE',
            'Invalid date format. Use YYYY-MM-DD or "latest"',
            400
          )
        }
        
        // Validar component
        if (!isValidComponent(componentParam)) {
          return apiError(
            'INVALID_COMPONENT',
            `Invalid component. Allowed values: ${Object.keys(IPC_COMPONENTS).join(', ')}`,
            400
          )
        }
        
        data = await inflationService.getRegionalInflation({ 
          date, 
          component: componentParam 
        })
        metadata.parameters = { date: date || 'latest', component: componentParam }
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
        
        data = await inflationService.calculateInflation({ 
          amount: parsedAmount, 
          from, 
          to 
        })
        metadata.parameters = { amount, from, to }
        break
      }
    }

    // TTL diferenciado por vista
    const getCacheTTL = (view: ViewType): number => {
      switch(view) {
        case 'current': return 300      // 5 minutos
        case 'historical': return 3600   // 1 hora
        case 'components': return 600    // 10 minutos
        case 'regions': return 600       // 10 minutos
        case 'calculator': return 0      // No cache
        default: return 300
      }
    }

    // Guardar en cache (excepto calculator)
    const ttl = getCacheTTL(validView)
    if (ttl > 0) {
      const cacheData: CachedData = { data, metadata }
      await setCached(cacheKey, cacheData, ttl)
    }

    // Retornar respuesta según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, validView), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="inflation-${validView}-${new Date().toISOString().split('T')[0]}.csv"`,
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
            options: Object.keys(IPC_COMPONENTS),
            descriptions: IPC_COMPONENTS,
            description: 'Componente del IPC'
          },
          region: {
            type: 'string',
            default: 'Nacional',
            options: Object.keys(IPC_REGIONS),
            descriptions: IPC_REGIONS,
            description: 'Región geográfica'
          }
        },
        example: '/api/v1/inflation?view=current&component=RUBRO_ALIMENTOS&region=GBA'
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
            options: Object.keys(IPC_COMPONENTS),
            description: 'Componente del IPC'
          },
          region: {
            type: 'string',
            default: 'Nacional',
            options: Object.keys(IPC_REGIONS),
            description: 'Región geográfica'
          },
          interval: {
            type: 'string',
            default: 'monthly',
            options: ['monthly', 'quarterly', 'yearly'],
            description: 'Intervalo de agrupación'
          }
        },
        example: '/api/v1/inflation?view=historical&from=2023-01-01&to=2024-12-31&component=GENERAL'
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
            options: Object.keys(IPC_REGIONS),
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
            options: Object.keys(IPC_COMPONENTS),
            description: 'Componente del IPC'
          }
        },
        example: '/api/v1/inflation?view=regions&component=RUBRO_ALIMENTOS'
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
    components: {
      description: 'Componentes disponibles del IPC',
      core: {
        description: 'Rubros principales',
        codes: CORE_IPC_COMPONENTS,
        details: CORE_IPC_COMPONENTS.reduce((acc, code) => ({
          ...acc,
          [code]: IPC_COMPONENTS[code as IPCComponentCode]
        }), {})
      },
      categories: {
        description: 'Categorías especiales',
        codes: CATEGORY_COMPONENTS,
        details: CATEGORY_COMPONENTS.reduce((acc, code) => ({
          ...acc,
          [code]: IPC_COMPONENTS[code as IPCComponentCode]
        }), {})
      },
      all: Object.keys(IPC_COMPONENTS)
    },
    regions: {
      description: 'Regiones disponibles',
      codes: Object.keys(IPC_REGIONS),
      details: IPC_REGIONS
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
    examples: {
      current: {
        description: 'Obtener inflación actual general',
        request: 'GET /api/v1/inflation?view=current',
        response: {
          success: true,
          data: {
            date: '2024-12-01',
            component: 'GENERAL',
            region: 'Nacional',
            monthlyPctChange: 2.7,
            yearlyPctChange: 166.0,
            accumulatedPctChange: 112.0,
            indexValue: 1254.32
          }
        }
      },
      historical: {
        description: 'Serie histórica de inflación',
        request: 'GET /api/v1/inflation?view=historical&from=2024-01-01&to=2024-12-31',
        response: {
          success: true,
          data: [
            {
              date: '2024-01-01',
              monthlyPctChange: 20.6,
              yearlyPctChange: 254.2,
              accumulatedPctChange: 20.6
            }
          ]
        }
      },
      calculator: {
        description: 'Calcular valor ajustado',
        request: 'GET /api/v1/inflation?view=calculator&amount=1000&from=2020-01-01&to=2024-12-01',
        response: {
          success: true,
          data: {
            originalAmount: 1000,
            adjustedAmount: 12543.21,
            totalInflation: 1154.32,
            inflationPct: 1154.32,
            fromDate: '2020-01-01',
            toDate: '2024-12-01'
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