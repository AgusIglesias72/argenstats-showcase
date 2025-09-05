// app/admin/page.tsx
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Shield } from 'lucide-react'
import UsersTabServer from '@/components/admin/tabs/UsersTabServer'
import ApiUsageTabServer from '@/components/admin/tabs/ApiUsageTabServer'
import AdminTabsClient from './AdminTabsClient'

export default async function AdminDashboard() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Verificar si es admin
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const isAdmin = user.publicMetadata?.role === 'admin'
    
    if (!isAdmin) {
      redirect('/')
    }
  } catch (error) {
    console.error('Error checking admin status:', error)
    redirect('/')
  }

  // Obtener datos del usuario para el header
  const client = await clerkClient()
  const user = await client.users.getUser(userId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header principal del sitio */}
      <Header />
      
      {/* Header con info del admin */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.fullName || 'Administrador'}
                  className="w-16 h-16 rounded-full border-2 border-purple-200 dark:border-purple-700"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Panel de Administración
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Bienvenido, {user.fullName || 'Administrador'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs y contenido */}
      <AdminTabsClient 
        usersTabContent={<UsersTabServer />} 
        apiUsageTabContent={<ApiUsageTabServer />} 
      />
    </div>
  )
}