'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

export default function SSOCallbackPage() {
  const [loadingMessage, setLoadingMessage] = useState('Verificando credenciales')
  const [dots, setDots] = useState('')

  useEffect(() => {
    // Cambiar mensajes progresivamente
    const messages = [
      'Verificando credenciales',
      'Autenticando usuario',
      'Preparando...',
      'Casi listo'
    ]
    
    let messageIndex = 0
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length
      setLoadingMessage(messages[messageIndex])
    }, 2000)

    // Animar los puntos
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => {
      clearInterval(messageInterval)
      clearInterval(dotsInterval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Componente de Clerk (invisible pero necesario) */}
      <div className="hidden">
        <AuthenticateWithRedirectCallback />
      </div>

      {/* UI de carga personalizada */}
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="font-righteous text-5xl text-blue-600 dark:text-blue-400 animate-pulse">
              ArgenStats
            </h1>
          </div>

          {/* Spinner animado */}
          <div className="mb-8">
            <div className="relative w-20 h-20 mx-auto">
              {/* Círculo exterior */}
              <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              {/* Círculo animado */}
              <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
              {/* Círculo interior */}
              <div className="absolute inset-2 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              {/* Círculo interior animado */}
              <div className="absolute inset-2 border-4 border-purple-600 dark:border-purple-400 rounded-full border-t-transparent animate-spin animation-delay-150" style={{ animationDirection: 'reverse' }}></div>
            </div>
          </div>

          {/* Mensaje dinámico */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {loadingMessage}{dots}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esto solo tomará un momento
            </p>
          </div>

          {/* Barra de progreso */}
          <div className="mt-8 w-64 mx-auto">
            <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-loading-bar"></div>
            </div>
          </div>

          {/* Mensaje de seguridad */}
          <div className="mt-8 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Conexión segura
          </div>
        </div>
      </div>

      {/* Estilos para las animaciones */}
      <style jsx>{`
        @keyframes loading-bar {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 50%;
            margin-left: 25%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }

        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }

        .animation-delay-150 {
          animation-delay: 150ms;
        }
      `}</style>
    </div>
  )
}