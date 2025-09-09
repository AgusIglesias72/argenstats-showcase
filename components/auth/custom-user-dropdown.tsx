'use client'

import { useState, useRef, useEffect } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  User, 
  KeyRound, 
  Star, 
  Calendar, 
  Mail, 
  Shield, 
  LogOut,
  ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsAdmin } from '@/lib/hooks/useIsAdmin'

export function CustomUserDropdown() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { isAdmin } = useIsAdmin()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  if (!isLoaded || !user) {
    return null
  }

  const handleSignOut = () => {
    signOut()
    setIsOpen(false)
  }


  const menuItems = [
    {
      label: 'Mi Perfil',
      icon: User,
      href: '/profile',
      description: 'Gestionar información personal'
    },
    {
      label: 'API Keys',
      icon: KeyRound,
      href: '/profile?tab=api-keys',
      description: 'Gestionar claves de API'
    },
    {
      label: 'Favoritos',
      icon: Star,
      href: '/profile?tab=favorites',
      description: 'Indicadores guardados'
    },
    {
      label: 'Eventos',
      icon: Calendar,
      href: '/profile?tab=events',
      description: 'Historial de actividad'
    },
    {
      label: 'Contacto',
      icon: Mail,
      href: '/profile?tab=contact',
      description: 'Enviar mensaje'
    }
  ]


  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón del avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Abrir menú de usuario"
      >
        <div className="relative">
          <Image
            src={user.imageUrl}
            alt={user.fullName || 'Usuario'}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
          />
          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
          >
            {/* Header del usuario */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || 'Usuario'}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {user.fullName || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </p>
                  {isAdmin && (
                    <div className="flex items-center mt-1">
                      <Shield className="h-3 w-3 text-blue-500 mr-1" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Administrador
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sección de perfil */}
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 py-1 mb-1">
                Perfil
              </div>
              {menuItems.map((item, index) => {
                const Icon = item.icon
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>


            {/* Panel de administración si es admin */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700"></div>
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-2 py-1 mb-1">
                    Administración
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <Shield className="h-4 w-4 text-blue-500" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Panel de Administración</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Gestionar usuarios y configuración
                      </div>
                    </div>
                  </Link>
                </div>
              </>
            )}

            {/* Separador final */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Cerrar sesión */}
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Cerrar Sesión</div>
                  <div className="text-xs text-red-500 dark:text-red-400">
                    Salir de tu cuenta
                  </div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>ArgenStats</span>
                <span>v2.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
