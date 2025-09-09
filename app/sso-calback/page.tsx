'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SSOCallbackPage() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      // Si no está logueado después del callback, redirigir a sign-up
      // Esto puede pasar si el usuario no existe en Clerk
      router.push('/sign-up?fromOAuth=true')
    } else if (isLoaded && isSignedIn) {
      // Si está logueado correctamente, redirigir al home
      router.push('/')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Procesando autenticación...</p>
        </div>
      </div>
    )
  }

  return <AuthenticateWithRedirectCallback />
}