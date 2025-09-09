'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useSignIn } from '@clerk/nextjs'
import { GoogleIcon, XIcon } from '@/components/ui/social-icons'
import Link from 'next/link'

export function LoginModal() {
  const [isOpen, setIsOpen] = useState(false)
  const { signIn } = useSignIn()
  
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('openLoginModal', handleOpen)
    return () => window.removeEventListener('openLoginModal', handleOpen)
  }, [])

  const signInWithGoogle = () => {
    signIn?.authenticateWithRedirect({
      strategy: 'oauth_google',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/profile',
    })
  }

  const signInWithX = () => {
    signIn?.authenticateWithRedirect({
      strategy: 'oauth_x',
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/profile',
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-50 cursor-pointer"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl"
          >
            <div className="p-6 max-w-md mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold dark:text-white">Bienvenido de nuevo</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ingresa a tu cuenta para continuar
              </p>

              <div className="space-y-3">
                <button
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <GoogleIcon className="w-5 h-5 mr-3" />
                  Continuar con Google
                </button>

                <button
                  onClick={signInWithX}
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <XIcon className="w-5 h-5 mr-3" />
                  Continuar con X
                </button>
              </div>

              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  ¿No tienes cuenta?{' '}
                  <Link 
                    href="/sign-up" 
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    Regístrate gratis
                  </Link>
                </span>
              </div>

              <div className="mt-4 text-center">
                <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 cursor-pointer">
                  Usar email y contraseña →
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}