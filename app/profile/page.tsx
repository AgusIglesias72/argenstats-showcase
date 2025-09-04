import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
// Corregido: importación del Header usando ruta relativa correcta
import { Header } from '@/components/layout/header'

export default async function ProfilePage() {
  const { userId } = await auth()
  const user = await currentUser()
  
  if (!userId || !user) {
    redirect('/sign-in')
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Mi Perfil</h1>
        
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
              <p className="font-mono text-sm bg-gray-100 p-2 rounded dark:bg-gray-700">{userId}</p>
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

        {/* Sección de API Key (preparado para después) */}
        <div className="mt-6 bg-white rounded-lg shadow p-6 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4">API Access</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Próximamente podrás generar tu API key para acceder a nuestros endpoints.
          </p>
        </div>
      </main>
    </>
  )
}