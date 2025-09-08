// app/api/v1/labor/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import { laborMarketService } from '@/lib/api/services/labor'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

type ViewType = 'current' | 'historical' | 'by-region' | 'by-gender' | 'by-age' | 'by-demographics' | 'series' | 'summary'

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
  const validViews = ['current', 'historical', 'by-region', 'by-gender', 'by-age', 'by-demographics', 'series', 'summary']
  if (!validViews.includes(view)) {
    return apiError('INVALID_VIEW', `Invalid view. Valid options: ${validViews.join(', ')}`, 400)
  }

  try {
    // Cache
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)
    
    if (cached && 'data' in cached) {
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, `labor-market-${view}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="labor-market-${view}.csv"`,
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
        const gender = searchParams.get('gender') || undefined
        const ageGroup = searchParams.get('ageGroup') || undefined
        
        data = await laborMarketService.getLaborMarketData({
          region,
          gender,
          ageGroup,
          getCurrentPeriod: true,
          limit: 100
        })
        metadata.parameters = { region, gender, ageGroup }
        break
      }

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const region = searchParams.get('region')
        const gender = searchParams.get('gender')
        const ageGroup = searchParams.get('ageGroup')
        const limit = parseInt(searchParams.get('limit') || '200')

        if (!from || !to) {
          return apiError('MISSING_PARAMETERS', 'Parameters "from" and "to" are required for historical view', 400)
        }

        // Obtener datos históricos
        const allData = await laborMarketService.getLaborMarketData({
          region: region || undefined,
          gender: gender || undefined,
          ageGroup: ageGroup || undefined,
          limit: 1000 // Obtener más datos para filtrar
        })
        
        // Filtrar por rango de fechas
        const fromDate = new Date(from)
        const toDate = new Date(to)
        data = allData.filter((item: any) => {
          const itemDate = new Date(item.date)
          return itemDate >= fromDate && itemDate <= toDate
        }).slice(0, limit)
        
        metadata.parameters = { from, to, region, gender, ageGroup, limit }
        break
      }

      case 'by-region': {
        const period = searchParams.get('period')
        const includeNational = searchParams.get('includeNational') !== 'false'
        
        data = await laborMarketService.getLaborMarketData({
          period: period || undefined,
          dataType: includeNational ? undefined : 'regional',
          gender: 'Total',
          ageGroup: 'Total',
          getCurrentPeriod: !period,
          limit: 50
        })
        
        // Agrupar por región
        const grouped: any = {}
        for (const item of data) {
          if (!grouped[item.region]) {
            grouped[item.region] = item
          }
        }
        data = Object.values(grouped)
        
        metadata.parameters = { period, includeNational }
        break
      }

      case 'by-gender': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')
        
        data = await laborMarketService.getLaborMarketByGender({
          region: region || undefined,
          period: period || undefined
        })
        metadata.parameters = { period, region }
        break
      }

      case 'by-age': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')
        const gender = searchParams.get('gender')
        
        data = await laborMarketService.getLaborMarketByAge({
          region: region || undefined,
          period: period || undefined,
          gender: gender || undefined
        })
        metadata.parameters = { period, region, gender }
        break
      }

      case 'by-demographics': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')
        const demographicType = searchParams.get('type') || 'all'
        
        // Obtener datos demográficos
        const allData = await laborMarketService.getLaborMarketData({
          region: region || undefined,
          period: period || undefined,
          dataType: 'demographic',
          getCurrentPeriod: !period,
          limit: 200
        })
        
        // Filtrar según tipo demográfico
        if (demographicType === 'gender') {
          data = allData.filter((item: any) => 
            item.gender && item.gender !== 'Total' && (!item.ageGroup || item.ageGroup === 'Total')
          )
        } else if (demographicType === 'age') {
          data = allData.filter((item: any) => 
            item.ageGroup && item.ageGroup !== 'Total' && (!item.gender || item.gender === 'Total')
          )
        } else if (demographicType === 'segment') {
          data = allData.filter((item: any) => item.demographicSegment)
        } else {
          data = allData
        }
        
        metadata.parameters = { period, region, demographicType }
        break
      }

      case 'series': {
        const regions = searchParams.get('regions')?.split(',') || []
        const metrics = searchParams.get('metrics')?.split(',') || ['activity', 'employment', 'unemployment']
        const groupBy = (searchParams.get('groupBy') || 'quarter') as 'quarter' | 'year'
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const gender = searchParams.get('gender')
        const ageGroup = searchParams.get('ageGroup')
        
        data = await laborMarketService.getLaborMarketTimeSeries({
          regions: regions || [],
          metrics,
          groupBy,
          from: from ? new Date(from) : undefined,
          to: to ? new Date(to) : undefined,
          gender: gender || undefined   ,
          ageGroup: ageGroup || undefined
        })
        metadata.parameters = { regions, metrics, groupBy, from, to, gender, ageGroup }
        break
      }

      case 'summary': {
        const region = searchParams.get('region')
        const period = searchParams.get('period')
        
        const rawData = await laborMarketService.getLaborMarketData({
          region: region || undefined,
          period: period || undefined,
          getCurrentPeriod: !period,
          limit: 500
        })
        
        const summary = await laborMarketService.getLaborMarketSummary(rawData as any)
        data = {
          data: rawData.filter((item: any) => 
            item.gender === 'Total' && item.ageGroup === 'Total'
          ).slice(0, 10), // Solo los principales para no sobrecargar
          summary
        }
        metadata.parameters = { region, period }
        break
      }

      default:
        return apiError('INVALID_VIEW', 'Invalid view parameter', 400)
    }

    // Guardar en cache (TTL: 10 minutos)
    await setCached(cacheKey, { data, metadata }, 600)

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `labor-market-${view}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="labor-market-${view}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('Labor Market API error:', error)
    
    if ((error as any).code) {
      return apiError((error as any).code, (error as any).message, 400, (error as any).details)
    }
    
    return apiError('INTERNAL_ERROR', 'An error occurred while fetching labor market data', 500)
  }
})

// POST endpoint para consultas complejas
export const POST = withApiMiddleware(async (request: NextRequest, { apiKey }) => {
  try {
    const body = await request.json()
    const { 
      regions = [], 
      metrics = ['activity', 'employment', 'unemployment'],
      groupBy = 'quarter',
      from,
      to,
      gender,
      ageGroup
    } = body
    
    // Validar parámetros
    if (!Array.isArray(regions) || !Array.isArray(metrics)) {
      return apiError('INVALID_PARAMETERS', 'Regions and metrics must be arrays', 400)
    }
    
    if (!['quarter', 'year'].includes(groupBy)) {
      return apiError('INVALID_PARAMETER', 'GroupBy must be "quarter" or "year"', 400)
    }
    
    // Obtener series temporales
    const series = await laborMarketService.getLaborMarketTimeSeries({
      regions: regions || [],
      metrics,
      groupBy: groupBy as 'quarter' | 'year',
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      gender,
      ageGroup
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
        metrics,
        filters: { gender, ageGroup }
      }
    })
    
  } catch (error) {
    console.error('Labor Market series API error:', error)
    return apiError('INTERNAL_ERROR', 'An error occurred while processing labor market series', 500)
  }
})

// OPTIONS endpoint
export async function OPTIONS() {
  try {
    const metadata = await laborMarketService.getLaborMarketMetadata()
    
    return NextResponse.json({
      endpoint: '/api/v1/labor',
      description: 'Labor market and employment data from INDEC EPH (Encuesta Permanente de Hogares)',
      methods: ['GET', 'POST', 'OPTIONS'],
      authentication: 'API Key required (header: x-api-key)',
      parameters: {
        view: {
          type: 'string',
          enum: ['current', 'historical', 'by-region', 'by-gender', 'by-age', 'by-demographics', 'series', 'summary'],
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
          description: 'Region for filtering. Use URL-safe codes: NACIONAL (Total 31 aglomerados), GBA, PATAGONIA, NOA, NEA, CUYO, PAMPEANA'
        },
        period: {
          type: 'string',
          enum: metadata.availablePeriods.slice(0, 10).map(p => p.value),
          description: 'Period (e.g., "T1 2025", "T4 2024")'
        },
        gender: {
          type: 'string',
          enum: metadata.availableGenders.map(g => g.value),
          description: 'Filter by gender'
        },
        ageGroup: {
          type: 'string',
          enum: metadata.availableAgeGroups.map(ag => ag.value),
          description: 'Age group for filtering'
        },
        demographicSegment: {
          type: 'string',
          enum: metadata.availableDemographicSegments.map(ds => ds.value),
          description: 'Demographic segment'
        },
        // Series parameters
        regions: {
          type: 'string',
          description: 'Comma-separated list of regions for series view'
        },
        metrics: {
          type: 'string',
          description: 'Comma-separated list of metrics (activity, employment, unemployment, population)'
        },
        groupBy: {
          type: 'string',
          enum: ['quarter', 'year'],
          default: 'quarter',
          description: 'Grouping for time series'
        },
        limit: {
          type: 'integer',
          default: 100,
          description: 'Maximum number of records to return'
        },
        type: {
          type: 'string',
          enum: ['all', 'gender', 'age', 'segment'],
          description: 'Type of demographic breakdown for by-demographics view'
        }
      },
      examples: {
        current: '/api/v1/labor?view=current',
        currentByGender: '/api/v1/labor?view=current&gender=Mujeres',
        historical: '/api/v1/labor?view=historical&from=2024-01-01&to=2025-03-31',
        byRegion: '/api/v1/labor?view=by-region&period=T1 2025',
        byGender: '/api/v1/labor?view=by-gender&region=NACIONAL',
        byAge: '/api/v1/labor?view=by-age&region=GBA',
        byDemographics: '/api/v1/labor?view=by-demographics&type=gender',
        series: '/api/v1/labor?view=series&regions=NACIONAL,GBA&metrics=unemployment',
        summary: '/api/v1/labor?view=summary',
        csv: '/api/v1/labor?view=current&format=csv'
      },
      postEndpoint: {
        description: 'Use POST for complex time series queries',
        example: {
          body: {
            regions: ['NACIONAL', 'GBA', 'PATAGONIA'],
            metrics: ['activity', 'employment', 'unemployment'],
            groupBy: 'quarter',
            from: '2024-01-01',
            to: '2025-03-31',
            gender: 'Mujeres'
          }
        }
      },
      availableData: {
        regions: metadata.availableRegions.slice(0, 10),
        periods: metadata.availablePeriods.slice(0, 5),
        genders: metadata.availableGenders,
        ageGroups: metadata.availableAgeGroups.slice(0, 5),
        statistics: metadata.statistics
      },
      indicators: {
        activityRate: 'Percentage of working-age population that is economically active',
        employmentRate: 'Percentage of working-age population that is employed',
        unemploymentRate: 'Percentage of economically active population that is unemployed',
        totalPopulation: 'Total population in thousands',
        economicallyActivePopulation: 'Population that is working or actively seeking work',
        employedPopulation: 'Population currently employed',
        unemployedPopulation: 'Population actively seeking work',
        inactivePopulation: 'Population not in the labor force'
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
    console.error('Error fetching labor market metadata:', error)
    return NextResponse.json(
      { error: 'Error fetching metadata' },
      { status: 500 }
    )
  }
}