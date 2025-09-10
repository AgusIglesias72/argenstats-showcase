// components/navigation/AuthButton.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser, useClerk } from '@clerk/nextjs'

export function AuthButton() {
  const { isSignedIn, user } = useUser()
  const { signOut } = useClerk()
  const pathname = usePathname()
  
  if (isSignedIn) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm">Hola, {user?.firstName || 'Usuario'}</span>
        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Salir
        </button>
      </div>
    )
  }

  // Construir URL de auth con redirect
  const authUrl = `/auth?redirect_url=${encodeURIComponent(pathname)}`
  
  return (
    <Link 
      href={authUrl}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Acceder
    </Link>
  )
}

// Hook reutilizable para cualquier componente
export function useAuthRedirect() {
  const pathname = usePathname()
  
  const getAuthUrl = (customPath?: string) => {
    const redirectPath = customPath || pathname
    return `/auth?redirect_url=${encodeURIComponent(redirectPath)}`
  }
  
  return { getAuthUrl }
}

// Componente de protección genérico
interface ProtectedSectionProps {
  children: React.ReactNode
  message?: string
}

export function ProtectedSection({ 
  children, 
  message = "Inicia sesión para ver este contenido" 
}: ProtectedSectionProps) {
  const { isSignedIn } = useUser()
  const { getAuthUrl } = useAuthRedirect()
  
  if (!isSignedIn) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
        <svg 
          className="w-12 h-12 mx-auto mb-4 text-gray-400"
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
          {message}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Crea una cuenta gratis para acceder a todas las funciones
        </p>
        <Link 
          href={getAuthUrl()}
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Iniciar sesión
        </Link>
      </div>
    )
  }
  
  return <>{children}</>
}

// Botón flotante de CTA para páginas públicas
export function FloatingAuthCTA() {
  const { isSignedIn } = useUser()
  const { getAuthUrl } = useAuthRedirect()
  
  if (isSignedIn) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <Link
        href={getAuthUrl()}
        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
      >
        <span>🚀</span>
        <span className="font-medium">Accede gratis</span>
      </Link>
    </div>
  )
}