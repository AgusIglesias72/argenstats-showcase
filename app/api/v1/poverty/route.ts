// app/api/v1/poverty/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import { povertyService } from '@/lib/api/services/poverty'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

type ViewType = 'current' | 'historical' | 'by-region' | 'by-metric' | 'series' | 'summary'

// GET endpoint
export const GET = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  const { searchParams } = new URL(request.url)
  const view = (searchParams.get('view') || 'current') as ViewType
  const format = searchParams.get('format') || 'json'

  // Validar formato
  if (!['json', 'csv'].includes(format)) {
    return apiError('INVALID_FORMAT', 'Invalid format. Use json or csv', 400)
  }

  // Validar view
  const validViews = ['current', 'historical', 'by-region', 'by-metric', 'series', 'summary']
  if (!validViews.includes(view)) {
    return apiError('INVALID_VIEW', `Invalid view. Valid options: ${validViews.join(', ')}`, 400)
  }

  try {
    // Cache
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)
    
    if (cached && 'data' in cached) {
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, `poverty-${view}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="poverty-${view}.csv"`,
            'X-Cache': 'HIT'
          }
        })
      }
      const response = apiResponse(cached.data, { metadata: cached.metadata })
      response.headers.set('X-Cache', 'HIT')
      return response
    }

    // Lógica según view
    let data: any
    const metadata: Record<string, any> = {
      source: 'INDEC - EPH',
      view,
      format,
      lastUpdate: new Date().toISOString()
    }

    switch (view) {
      case 'current': {
        const region = searchParams.get('region') || undefined
        const dataType = searchParams.get('type') || undefined
        
        data = await povertyService.getPovertyData({
          region,
          dataType,
          limit: 50
        })
        metadata.parameters = { region, dataType }
        break
      }

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const region = searchParams.get('region')
        const dataType = searchParams.get('type')
        const limit = parseInt(searchParams.get('limit') || '100')

        if (!from || !to) {
          return apiError('MISSING_PARAMETERS', 'Parameters "from" and "to" are required for historical view', 400)
        }

        data = await povertyService.getPovertyData({
          region: region || undefined,
          dataType: dataType || undefined,
          date: undefined, // Necesitamos ajustar el servicio para soportar rangos
          limit
        })
        
        // Filtrar por rango de fechas
        const fromDate = new Date(from)
        const toDate = new Date(to)
        data = data.filter((item: any) => {
          const itemDate = new Date(item.date)
          return itemDate >= fromDate && itemDate <= toDate
        })
        
        metadata.parameters = { from, to, region, dataType, limit }
        break
      }

      case 'by-region': {
        const period = searchParams.get('period')
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
        const semester = searchParams.get('semester') ? parseInt(searchParams.get('semester')!) : undefined
        
        data = await povertyService.getPovertyData({
          period: period || undefined,
          year,
          semester,
          dataType: 'regional'
        })
        metadata.parameters = { period, year, semester }
        break
      }

      case 'by-metric': {
        const metric = searchParams.get('metric') || 'all'
        const region = searchParams.get('region')
        const period = searchParams.get('period')
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
        
        const rawData = await povertyService.getPovertyData({
          region: region || undefined,
          period: period || undefined,
          year
        })
        
        // Formatear según métrica
        data = rawData.map((item: any) => formatByMetric(item, metric))
        metadata.parameters = { metric, region, period, year }
        break
      }

      case 'series': {
        const regions = searchParams.get('regions')?.split(',') || []
        const metrics = searchParams.get('metrics')?.split(',') || ['poverty', 'indigence']
        const groupBy = (searchParams.get('groupBy') || 'semester') as 'semester' | 'year'
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        
        data = await povertyService.getPovertyTimeSeries({
          regions,
          metrics,
          groupBy,
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined
        })
        metadata.parameters = { regions, metrics, groupBy, from, to }
        break
      }

      case 'summary': {
        const region = searchParams.get('region')
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
        const semester = searchParams.get('semester') ? parseInt(searchParams.get('semester')!) : undefined
        
        const rawData = await povertyService.getPovertyData({
          region: region || undefined,
          year,
          semester
        })
        
        const summary = await povertyService.getPovertySummary(rawData as any)
        data = {
          data: rawData,
          summary
        }
        metadata.parameters = { region, year, semester }
        break
      }

      default:
        return apiError('INVALID_VIEW', 'Invalid view parameter', 400)
    }

    // Guardar en cache (TTL: 10 minutos para pobreza ya que se actualiza menos frecuente)
    await setCached(cacheKey, { data, metadata }, 600)

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `poverty-${view}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="poverty-${view}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('Poverty API error:', error)
    
    if ((error as any).code) {
      return apiError((error as any).code, (error as any).message, 400, (error as any).details)
    }
    
    return apiError('INTERNAL_ERROR', 'An error occurred while fetching poverty data', 500)
  }
})

// POST endpoint para series temporales complejas
export const POST = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  try {
    const body = await request.json()
    const { 
      regions = [], 
      metrics = ['poverty', 'indigence'],
      groupBy = 'semester',
      from,
      to 
    } = body
    
    // Validar parámetros
    if (!Array.isArray(regions) || !Array.isArray(metrics)) {
      return apiError('INVALID_PARAMETERS', 'Regions and metrics must be arrays', 400)
    }
    
    if (!['semester', 'year'].includes(groupBy)) {
      return apiError('INVALID_PARAMETER', 'GroupBy must be "semester" or "year"', 400)
    }
    
    // Obtener series temporales
    const series = await povertyService.getPovertyTimeSeries({
      regions: regions || [],
      metrics,
      groupBy: groupBy as 'semester' | 'year',
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
    })
    
    return apiResponse(series, {
      metadata: {
        totalSeries: series.length,
        regions: series.map(s => s.region),
        dateRange: {
          from: from || null,
          to: to || null
        },
        groupBy,
        metrics
      }
    })
    
  } catch (error) {
    console.error('Poverty series API error:', error)
    return apiError('INTERNAL_ERROR', 'An error occurred while processing poverty series', 500)
  }
})

// OPTIONS endpoint
export async function OPTIONS() {
  try {
    const metadata = await povertyService.getPovertyMetadata()
    
    return NextResponse.json({
      endpoint: '/api/v1/poverty',
      description: 'Poverty and indigence data from INDEC EPH (Encuesta Permanente de Hogares)',
      methods: ['GET', 'POST', 'OPTIONS'],
      authentication: 'API Key required (header: x-api-key)',
      parameters: {
        view: {
          type: 'string',
          enum: ['current', 'historical', 'by-region', 'by-metric', 'series', 'summary'],
          default: 'current',
          description: 'Type of data to retrieve'
        },
        format: {
          type: 'string',
          enum: ['json', 'csv'],
          default: 'json',
          description: 'Response format'
        },
        // Date parameters
        from: {
          type: 'string',
          format: 'date',
          description: 'Start date for historical data (YYYY-MM-DD). Required for historical view'
        },
        to: {
          type: 'string',
          format: 'date',
          description: 'End date for historical data (YYYY-MM-DD). Required for historical view'
        },
        // Filter parameters
        region: {
          type: 'string',
          enum: metadata.availableRegions.map(r => r.value),
          description: 'Region for filtering (e.g., "NACIONAL", "GBA", "PATAGONIA")'
        },
        type: {
          type: 'string',
          enum: metadata.availableDataTypes.map(dt => dt.value),
          description: 'Data type (e.g., "national", "regional")'
        },
        year: {
          type: 'integer',
          description: 'Year for filtering (e.g., 2024)'
        },
        semester: {
          type: 'integer',
          enum: [1, 2],
          description: 'Semester (1 or 2)'
        },
        period: {
          type: 'string',
          description: 'Period identifier (e.g., "2024-S1")'
        },
        metric: {
          type: 'string',
          enum: ['poverty', 'indigence', 'gaps', 'both', 'all'],
          description: 'Specific metric to retrieve'
        },
        // Series parameters
        regions: {
          type: 'string',
          description: 'Comma-separated list of regions for series view'
        },
        metrics: {
          type: 'string',
          description: 'Comma-separated list of metrics for series view'
        },
        groupBy: {
          type: 'string',
          enum: ['semester', 'year'],
          default: 'semester',
          description: 'Grouping for time series'
        },
        limit: {
          type: 'integer',
          default: 30,
          description: 'Maximum number of records to return'
        }
      },
      examples: {
        current: '/api/v1/poverty?view=current',
        historical: '/api/v1/poverty?view=historical&from=2023-01-01&to=2024-12-31',
        byRegion: '/api/v1/poverty?view=by-region&year=2024',
        byMetric: '/api/v1/poverty?view=by-metric&metric=poverty&region=NACIONAL',
        series: '/api/v1/poverty?view=series&regions=NACIONAL,GBA&metrics=poverty,indigence',
        summary: '/api/v1/poverty?view=summary&year=2024',
        csv: '/api/v1/poverty?view=current&format=csv'
      },
      postEndpoint: {
        description: 'Use POST for complex time series queries',
        example: {
          body: {
            regions: ['NACIONAL', 'GBA', 'PATAGONIA'],
            metrics: ['poverty', 'indigence'],
            groupBy: 'semester',
            from: '2023-01-01',
            to: '2024-12-31'
          }
        }
      },
      availableData: {
        regions: metadata.availableRegions,
        periods: metadata.availablePeriods.slice(0, 5), // Mostrar solo los primeros 5
        metrics: metadata.availableMetrics,
        statistics: metadata.statistics
      },
      rateLimits: {
        free: '100 requests/hour',
        basic: '1000 requests/hour',
        pro: '10000 requests/hour'
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'x-api-key, Content-Type'
      }
    })
    
  } catch (error) {
    console.error('Error fetching poverty metadata:', error)
    return NextResponse.json(
      { error: 'Error fetching metadata' },
      { status: 500 }
    )
  }
}

// Función auxiliar para formatear por métrica
function formatByMetric(data: any, metric: string) {
  const base = {
    region: data.region,
    dataType: data.dataType,
    date: data.date,
    period: data.period,
    year: data.year,
    semester: data.semester
  }
  
  switch(metric) {
    case 'poverty':
      return {
        ...base,
        povertyRatePersons: data.poverty.persons,
        povertyRateHouseholds: data.poverty.households,
        povertyGap: data.poverty.gap,
        povertySeverity: data.poverty.severity
      }
    
    case 'indigence':
      return {
        ...base,
        indigenceRatePersons: data.indigence.persons,
        indigenceRateHouseholds: data.indigence.households,
        indigenceGap: data.indigence.gap,
        indigenceSeverity: data.indigence.severity
      }
    
    case 'gaps':
      return {
        ...base,
        povertyGap: data.poverty.gap,
        indigenceGap: data.indigence.gap,
        povertySeverity: data.poverty.severity,
        indigenceSeverity: data.indigence.severity
      }
    
    case 'both':
      return {
        ...base,
        poverty: {
          persons: data.poverty.persons,
          households: data.poverty.households
        },
        indigence: {
          persons: data.indigence.persons,
          households: data.indigence.households
        }
      }
    
    default: // 'all'
      return {
        ...base,
        ...data
      }
  }
}