// /app/profile/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { ApiKeysSection } from '@/components/profile/api-keys-section'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Key, Settings } from 'lucide-react'

export default async function ProfilePage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId || !user) {
    redirect('/sign-in')
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Información</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuración</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Nombre</label>
                  <p className="font-medium">{user.firstName} {user.lastName}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                  <p className="font-medium">{user.emailAddresses[0]?.emailAddress}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">ID de Usuario</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded dark:bg-gray-700">
                    {userId}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500 dark:text-gray-400">Miembro desde</label>
                  <p className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api-keys">
            <ApiKeysSection 
              userId={userId} 
              userEmail={user.emailAddresses[0]?.emailAddress || null}
            />
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800">
              <p className="text-gray-600 dark:text-gray-400">
                Próximamente: notificaciones, preferencias de datos, y más.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  )
}