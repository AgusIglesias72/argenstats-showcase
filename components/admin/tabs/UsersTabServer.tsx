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
    // Obtener usuarios de Clerk
    const users = await clerkClient()
    const clerkUsers = users.users.getUserList({
      limit: 100, // Clerk tiene un límite por defecto
      orderBy: '-created_at'
    })

    // Obtener estadísticas de API keys desde nuestra DB
    const [totalApiKeys, activeApiKeys] = await Promise.all([
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { isActive: true } })
    ])

    // Calcular estadísticas
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const totalUsers = (await clerkUsers).data.length
    const newThisMonth = (await clerkUsers).data.filter(user => 
      new Date(user.createdAt) >= thisMonthStart
    ).length
    const activeUsers = (await clerkUsers).data.filter(user => 
      user.lastSignInAt && new Date(user.lastSignInAt) >= thirtyDaysAgo
    ).length

    // Calcular crecimiento
    const thisMonthUsers = (await clerkUsers).data.filter(user => 
      new Date(user.createdAt) >= thisMonthStart
    ).length
    const lastMonthUsers = (await clerkUsers).data.filter(user => {
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
      activeApiKeys,
      growth: Math.round(growth * 10) / 10
    }

    // Procesar usuarios para el formato esperado
    const processedUsers = await Promise.all(
      (await clerkUsers).data.map(async (user: ClerkUser) => {
        // Obtener datos adicionales de nuestra DB si existen
        const userProfile = await prisma.userProfile.findUnique({
          where: { userId: user.id },
          include: {
            apiKeys: {
              select: {
                isActive: true,
                lastUsedAt: true,
                _count: {
                  select: { usage: true }
                }
              }
            },
            _count: {
              select: {
                apiKeys: true,
                favorites: true,
                contactSubmissions: true
              }
            }
          }
        })

        const totalRequests = userProfile?.apiKeys.reduce((sum, key) => sum + key._count.usage, 0) || 0
        const activeApiKeys = userProfile?.apiKeys.filter(key => key.isActive).length || 0
        const lastApiUsage = userProfile?.apiKeys
          .filter(key => key.lastUsedAt)
          .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())[0]?.lastUsedAt

        return {
          id: user.id,
          userId: user.id,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Sin nombre',
          email: user.emailAddresses[0]?.emailAddress || 'Sin email',
          role: user.publicMetadata?.role || 'user',
          imageUrl: user.imageUrl,
          createdAt: new Date(user.createdAt).toISOString(),
          updatedAt: userProfile?.updatedAt?.toISOString() || new Date(user.createdAt).toISOString(),
          lastActive: lastApiUsage?.toISOString() || new Date(user.lastSignInAt || user.createdAt).toISOString(),
          apiKeys: activeApiKeys,
          totalApiKeys: userProfile?._count.apiKeys || 0,
          requests: totalRequests,
          favorites: userProfile?._count.favorites || 0,
          contactSubmissions: userProfile?._count.contactSubmissions || 0
        }
      })
    )

    return (
      <UsersTabClient 
        initialUsers={processedUsers}
        initialStats={stats}
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
