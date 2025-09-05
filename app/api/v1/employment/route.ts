// /app/api/v1/employment/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withApiMiddleware, apiResponse, apiError } from '@/lib/api/middleware'
import * as employmentService from '@/lib/api/services/employment'
import { getCacheKey, getCached, setCached } from '@/lib/api/cache'
import { convertToCSV } from '@/lib/api/formatters/csv'

// Tipos
interface CachedData {
  data: any
  metadata: Record<string, any>
}

type ViewType = 'current' | 'historical' | 'by-region' | 'by-demographics' | 'by-gender' | 'by-age'

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
  const validViews = ['current', 'historical', 'by-region', 'by-demographics', 'by-gender', 'by-age']
  if (!validViews.includes(view)) {
    return apiError('INVALID_VIEW', `Invalid view. Valid options: ${validViews.join(', ')}`, 400)
  }

  try {
    // Cache
    const cacheKey = getCacheKey(request)
    const cached = await getCached<CachedData>(cacheKey)
    
    if (cached && 'data' in cached) {
      if (format === 'csv') {
        return new NextResponse(convertToCSV(cached.data, `employment-${view}`), {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="employment-${view}.csv"`,
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
      case 'current':
        data = await employmentService.getCurrent()
        break

      case 'historical': {
        const from = searchParams.get('from')
        const to = searchParams.get('to')
        const region = searchParams.get('region')
        const gender = searchParams.get('gender')
        const ageGroup = searchParams.get('ageGroup')

        if (!from || !to) {
          return apiError('MISSING_PARAMETERS', 'Parameters "from" and "to" are required for historical view', 400)
        }

        data = await employmentService.getHistorical({ 
          from, 
          to, 
          region, 
          gender, 
          ageGroup 
        })
        metadata.parameters = { from, to, region, gender, ageGroup }
        break
      }

      case 'by-region': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')

        data = await employmentService.getByRegion({ period, region })
        metadata.parameters = { period, region }
        break
      }

      case 'by-demographics': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')
        const demographicType = searchParams.get('type') // 'all' | 'gender' | 'age'

        data = await employmentService.getByDemographics({ 
          period, 
          region,
          demographicType 
        })
        metadata.parameters = { period, region, demographicType }
        break
      }

      case 'by-gender': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')

        data = await employmentService.getByGender({ period, region })
        metadata.parameters = { period, region }
        break
      }

      case 'by-age': {
        const period = searchParams.get('period')
        const region = searchParams.get('region')

        data = await employmentService.getByAge({ period, region })
        metadata.parameters = { period, region }
        break
      }

      default:
        return apiError('INVALID_VIEW', 'Invalid view parameter', 400)
    }

    // Guardar en cache (TTL: 5 minutos)
    await setCached(cacheKey, { data, metadata }, 300)

    // Responder según formato
    if (format === 'csv') {
      return new NextResponse(convertToCSV(data, `employment-${view}`), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="employment-${view}.csv"`,
          'X-Cache': 'MISS'
        }
      })
    }

    const response = apiResponse(data, { metadata })
    response.headers.set('X-Cache', 'MISS')
    return response

  } catch (error) {
    console.error('Employment API error:', error)
    
    if (error instanceof employmentService.ServiceError) {
      return apiError(error.code, error.message, 400, error.details)
    }
    
    return apiError('INTERNAL_ERROR', 'An error occurred while fetching employment data', 500)
  }
})

// OPTIONS endpoint
export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/v1/employment',
    description: 'Employment and labor market data from INDEC EPH (Encuesta Permanente de Hogares)',
    methods: ['GET', 'OPTIONS'],
    authentication: 'API Key required (header: x-api-key)',
    parameters: {
      view: {
        type: 'string',
        enum: ['current', 'historical', 'by-region', 'by-demographics', 'by-gender', 'by-age'],
        default: 'current',
        description: 'Type of data to retrieve'
      },
      format: {
        type: 'string',
        enum: ['json', 'csv'],
        default: 'json',
        description: 'Response format'
      },
      // Historical parameters
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
      period: {
        type: 'string',
        description: 'Period for filtering (e.g., "3er trimestre 2024")'
      },
      region: {
        type: 'string',
        description: 'Region name for filtering (e.g., "Total 31 aglomerados urbanos", "Gran Buenos Aires")'
      },
      gender: {
        type: 'string',
        enum: ['Varones', 'Mujeres', 'Total'],
        description: 'Filter by gender'
      },
      ageGroup: {
        type: 'string',
        description: 'Age group for filtering (e.g., "14 a 29 años", "30 a 64 años")'
      },
      type: {
        type: 'string',
        enum: ['all', 'gender', 'age'],
        description: 'Type of demographic breakdown for by-demographics view'
      }
    },
    examples: {
      current: '/api/v1/employment?view=current',
      historical: '/api/v1/employment?view=historical&from=2023-01-01&to=2024-12-31',
      byRegion: '/api/v1/employment?view=by-region&period=3er trimestre 2024',
      byDemographics: '/api/v1/employment?view=by-demographics&type=gender',
      csv: '/api/v1/employment?view=current&format=csv'
    },
    rateLimits: {
      free: '100 requests/hour',
      basic: '1000 requests/hour',
      pro: '10000 requests/hour'
    }
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'x-api-key'
    }
  })
}