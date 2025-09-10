import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import UsersTabClient from './UsersTabClient'

interface ClerkUser {
  id: string
  firstName: string | null
  lastName: string | null
  emailAddresses: Array<{
    emailAddress: string
  }>
  imageUrl: string
  createdAt: number
  lastSignInAt: number | null
  publicMetadata: {
    role?: string
  }
}

interface UserStats {
  total: number
  active: number
  newThisMonth: number
  activeApiKeys: number
  growth: number
}

export default async function UsersTabServer() {
  try {
    // Obtener TODOS los usuarios de Clerk sin límite
    const getAllUsers = async () => {
      const users = []
      let hasMore = true
      let offset = 0
      const limit = 500 // Máximo permitido por Clerk
      
      while (hasMore) {
        const client = await clerkClient()
        const response = await client.users.getUserList({
          limit,
          offset,
          orderBy: '-created_at'
        })
        
        users.push(...response.data)
        hasMore = response.data.length === limit
        offset += limit
      }
      
      return users
    }

    const allClerkUsers = await getAllUsers()

    // Obtener estadísticas de API keys desde nuestra DB
    const [totalApiKeys, activeApiKeysCount] = await Promise.all([
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { isActive: true } })
    ])

    // Calcular estadísticas
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const totalUsers = allClerkUsers.length
    const newThisMonth = allClerkUsers.filter(user => 
      new Date(user.createdAt) >= thisMonthStart
    ).length
    const activeUsers = allClerkUsers.filter(user => 
      user.lastSignInAt && new Date(user.lastSignInAt) >= thirtyDaysAgo
    ).length

    // Calcular crecimiento
    const thisMonthUsers = allClerkUsers.filter(user => 
      new Date(user.createdAt) >= thisMonthStart
    ).length
    const lastMonthUsers = allClerkUsers.filter(user => {
      const createdAt = new Date(user.createdAt)
      return createdAt >= lastMonthStart && createdAt < thisMonthStart
    }).length

    const growth = lastMonthUsers > 0 
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100 
      : 0

    const stats: UserStats = {
      total: totalUsers,
      active: activeUsers,
      newThisMonth,
      activeApiKeys: activeApiKeysCount,
      growth: Math.round(growth * 10) / 10
    }

    // Obtener todos los perfiles de usuario
    const userProfiles = await prisma.userProfile.findMany({
      where: {
        userId: { in: allClerkUsers.map(u => u.id) }
      }
    })

    // Obtener conteos de favoritos
    const favoritesCounts = await prisma.userFavorite.groupBy({
      by: ['userId'],
      _count: {
        _all: true
      },
      where: {
        userId: { in: allClerkUsers.map(u => u.id) }
      }
    })

    // Obtener conteos de contactSubmissions
    const contactCounts = await prisma.contactSubmission.groupBy({
      by: ['userId'],
      _count: {
        _all: true
      },
      where: {
        userId: { in: allClerkUsers.map(u => u.id) }
      }
    })

    // Obtener conteos de predicciones de eventos (participaciones)
    const eventPredictionCounts = await prisma.eventPrediction.groupBy({
      by: ['userId'],
      _count: {
        _all: true
      },
      where: {
        userId: { in: allClerkUsers.map(u => u.id) }
      }
    })

    // Obtener API keys por usuario
    const apiKeysByUser = await prisma.apiKey.groupBy({
      by: ['userId'],
      where: {
        userId: { in: allClerkUsers.map(u => u.id) }
      },
      _count: {
        _all: true
      }
    })

    // Obtener API keys activas por usuario
    const activeApiKeysByUser = await prisma.apiKey.groupBy({
      by: ['userId'],
      where: {
        userId: { in: allClerkUsers.map(u => u.id) },
        isActive: true
      },
      _count: {
        _all: true
      }
    })

    // Obtener uso total de API keys y última fecha de uso
    const apiKeysWithUsage = await prisma.apiKey.findMany({
      where: {
        userId: { in: allClerkUsers.map(u => u.id) }
      },
      select: {
        userId: true,
        lastUsedAt: true,
        _count: {
          select: { usage: true }
        }
      }
    })

    // Crear mapas para búsqueda rápida
    const profileMap = new Map(userProfiles.map(p => [p.userId, p]))
    const favoritesMap = new Map(favoritesCounts.map((f: any) => [f.userId, f._count._all]))
    const contactsMap = new Map(contactCounts.map((c: any) => [c.userId, c._count._all]))
    const eventsMap = new Map(eventPredictionCounts.map((e: any) => [e.userId, e._count._all]))
    const apiKeysMap = new Map(apiKeysByUser.map((a: any) => [a.userId, a._count._all]))
    const activeApiKeysMap = new Map(activeApiKeysByUser.map((a: any) => [a.userId, a._count._all]))
    
    // Agrupar uso de API por usuario
    const usageMap = new Map<string, { total: number, lastUsed: Date | null }>()
    apiKeysWithUsage.forEach(apiKey => {
      const current = usageMap.get(apiKey.userId) || { total: 0, lastUsed: null }
      usageMap.set(apiKey.userId, {
        total: current.total + apiKey._count.usage,
        lastUsed: !current.lastUsed || (apiKey.lastUsedAt && apiKey.lastUsedAt > current.lastUsed) 
          ? apiKey.lastUsedAt 
          : current.lastUsed
      })
    })

    // Procesar usuarios para el formato esperado
    const processedUsers = allClerkUsers.map((user: ClerkUser) => {
      const userProfile = profileMap.get(user.id)
      const apiKeysCount = apiKeysMap.get(user.id) || 0
      const activeApiKeysNum = activeApiKeysMap.get(user.id) || 0
      const usage = usageMap.get(user.id)
      const favoritesCount = favoritesMap.get(user.id) || 0
      const contactsCount = contactsMap.get(user.id) || 0
      const eventsCount = eventsMap.get(user.id) || 0

      return {
        id: user.id,
        userId: user.id,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre',
        email: user.emailAddresses[0]?.emailAddress || 'Sin email',
        role: user.publicMetadata?.role || 'user',
        imageUrl: user.imageUrl,
        createdAt: new Date(user.createdAt).toISOString(),
        updatedAt: userProfile?.updatedAt?.toISOString() || new Date(user.createdAt).toISOString(),
        lastActive: usage?.lastUsed?.toISOString() || new Date(user.lastSignInAt || user.createdAt).toISOString(),
        apiKeys: activeApiKeysNum,
        totalApiKeys: apiKeysCount,
        requests: usage?.total || 0,
        favorites: favoritesCount,
        contactSubmissions: contactsCount,
        events: eventsCount
      }
    })

    return (
      <UsersTabClient 
        initialUsers={processedUsers}
        initialStats={stats}
        totalUsers={totalUsers}
      />
    )
  } catch (error) {
    console.error('Error fetching users from Clerk:', error)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar usuarios
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No se pudieron obtener los datos de usuarios
          </p>
        </div>
      </div>
    )
  }
}