import { prisma } from '@/lib/db/prisma'
import ApiUsageTabClient from './ApiUsageTabClient'

interface ApiUsageStats {
  totalRequests: number
  requestsToday: number
  activeKeys: number
  topEndpoint: string
  avgResponseTime: number
  successRate: number
}

interface EndpointStats {
  endpoint: string
  requests: number
  users: number
  avgResponseTime: number
  lastUsed: string
  successRate: number
}

interface RecentRequest {
  id: string
  endpoint: string
  method: string
  user: string
  timestamp: string
  responseTime: number
  status: number
}

export default async function ApiUsageTabServer() {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Obtener estadísticas generales
    const [
      totalRequests,
      requestsToday,
      activeKeys,
      avgResponseTime,
      successRequests,
      totalRequestsForSuccess
    ] = await Promise.all([
      prisma.apiUsage.count(),
      prisma.apiUsage.count({
        where: { timestamp: { gte: todayStart } }
      }),
      prisma.apiKey.count({
        where: { isActive: true }
      }),
      prisma.apiUsage.aggregate({
        _avg: { responseTime: true }
      }),
      prisma.apiUsage.count({
        where: { statusCode: { gte: 200, lt: 300 } }
      }),
      prisma.apiUsage.count()
    ])

    // Obtener endpoint más usado
    const topEndpointResult = await prisma.apiUsage.groupBy({
      by: ['endpoint'],
      _count: { endpoint: true },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 1
    })

    const topEndpoint = topEndpointResult[0]?.endpoint || '/api/v1/dollar'

    // Calcular tasa de éxito
    const successRate = totalRequestsForSuccess > 0 
      ? Math.round((successRequests / totalRequestsForSuccess) * 100 * 10) / 10 
      : 0

    const stats: ApiUsageStats = {
      totalRequests,
      requestsToday,
      activeKeys,
      topEndpoint,
      avgResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
      successRate
    }

    // Obtener estadísticas por endpoint
    const endpointStats = await prisma.apiUsage.groupBy({
      by: ['endpoint'],
      _count: { endpoint: true },
      _avg: { responseTime: true },
      _max: { timestamp: true },
      where: {
        timestamp: { gte: last24Hours }
      },
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10
    })

    // Obtener usuarios únicos por endpoint
    const endpointUsers = await Promise.all(
      endpointStats.map(async (stat) => {
        const uniqueUsers = await prisma.apiUsage.findMany({
          where: {
            endpoint: stat.endpoint,
            timestamp: { gte: last24Hours }
          },
          select: { apiKey: { select: { userId: true } } },
          distinct: ['apiKeyId']
        })
        return {
          endpoint: stat.endpoint,
          uniqueUsers: uniqueUsers.length
        }
      })
    )

    // Obtener tasa de éxito por endpoint
    const endpointSuccessRates = await Promise.all(
      endpointStats.map(async (stat) => {
        const [success, total] = await Promise.all([
          prisma.apiUsage.count({
            where: {
              endpoint: stat.endpoint,
              statusCode: { gte: 200, lt: 300 },
              timestamp: { gte: last24Hours }
            }
          }),
          prisma.apiUsage.count({
            where: {
              endpoint: stat.endpoint,
              timestamp: { gte: last24Hours }
            }
          })
        ])
        return {
          endpoint: stat.endpoint,
          successRate: total > 0 ? Math.round((success / total) * 100 * 10) / 10 : 0
        }
      })
    )

    const processedEndpoints: EndpointStats[] = endpointStats.map((stat) => {
      const userCount = endpointUsers.find(u => u.endpoint === stat.endpoint)?.uniqueUsers || 0
      const successRate = endpointSuccessRates.find(s => s.endpoint === stat.endpoint)?.successRate || 0
      
      return {
        endpoint: stat.endpoint,
        requests: stat._count.endpoint,
        users: userCount,
        avgResponseTime: Math.round(stat._avg.responseTime || 0),
        lastUsed: stat._max.timestamp?.toISOString() || new Date().toISOString(),
        successRate
      }
    })

    // Obtener requests recientes
    const recentRequests = await prisma.apiUsage.findMany({
      take: 20,
      orderBy: { timestamp: 'desc' },
      include: {
        apiKey: {
          select: {
            userEmail: true,
            name: true
          }
        }
      }
    })

    const processedRecentRequests: RecentRequest[] = recentRequests.map((request) => ({
      id: request.id,
      endpoint: request.endpoint,
      method: request.method,
      user: request.apiKey.userEmail || request.apiKey.name || 'Usuario desconocido',
      timestamp: request.timestamp.toISOString(),
      responseTime: request.responseTime,
      status: request.statusCode
    }))

    return (
      <ApiUsageTabClient 
        initialStats={stats}
        initialEndpoints={processedEndpoints}
        initialRecentRequests={processedRecentRequests}
      />
    )
  } catch (error) {
    console.error('Error fetching API usage data:', error)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar datos de uso de APIs
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No se pudieron obtener los datos de uso de APIs
          </p>
        </div>
      </div>
    )
  }
}
