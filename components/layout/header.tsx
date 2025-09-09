'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/nextjs'
import { CustomUserDropdown } from '@/components/auth/custom-user-dropdown'
import { useTheme } from 'next-themes'
import { useIsAdmin } from '@/lib/hooks/useIsAdmin'
import { 
  Menu, 
  X, 
  ChevronDown,
  DollarSign,
  Calendar,
  Wrench,
  FileText,
  BarChart3,
  Activity,
  Briefcase,
  Building2,
  Sun,
  Moon,
  TrendingUp,
  PieChart,
  User,
  Calculator,
  ArrowRightLeft,
  LogIn,
  UserRound,
  KeyRound,
  Star,
  Mail,
  Shield,
  LogOut
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"

const indicadoresSubmenu = [
  { 
    name: 'EMAE',
    title: 'Estimador Mensual de Actividad Económica',
    href: '/indicadores/emae',
    icon: Activity,
  },
  { 
    name: 'IPC',
    title: 'Índice de Precios al Consumidor',
    href: '/indicadores/inflacion',
    icon: TrendingUp,
  },
  { 
    name: 'Pobreza e Indigencia',
    title: 'Indicadores de pobreza e indigencia por ingresos',
    href: '/indicadores/pobreza',
    icon: PieChart,
  },
  { 
    name: 'Riesgo País',
    title: 'Indicador de riesgo soberano argentino',
    href: '/indicadores/riesgo-pais',
    icon: BarChart3,
  },
  { 
    name: 'Mercado de Trabajo',
    title: 'Índice de Empleo y Mercado Laboral',
    href: '/indicadores/empleo',
    icon: Briefcase,
  },
  { 
    name: 'Construcción',
    title: 'ISAC y permisos de edificación',
    href: '/indicadores/construccion',
    icon: Building2,
  },
]

const herramientasSubmenu = [
  {
    name: 'Calculadora de Inflación',
    title: 'Calcula el poder adquisitivo en el tiempo',
    href: '/calculadora-inflacion',
    icon: Calculator,
  },
  {
    name: 'Conversor de Divisas',
    title: 'Convierte entre diferentes monedas',
    href: '/conversor-dolar-peso-argentino',
    icon: ArrowRightLeft,
  },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  )
}

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileIndicadoresOpen, setMobileIndicadoresOpen] = useState(false)
  const [mobileHerramientasOpen, setMobileHerramientasOpen] = useState(false)
  const pathname = usePathname()
  const { user } = useUser()
  const { signOut } = useClerk()
  const { isAdmin } = useIsAdmin()

  useEffect(() => {
    setMobileMenuOpen(false)
    setMobileIndicadoresOpen(false)
    setMobileHerramientasOpen(false)
  }, [pathname])

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <span className="font-righteous text-2xl text-blue-600 dark:text-blue-400">
                ArgenStats
              </span>
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav className="hidden lg:flex items-center absolute left-1/2 transform -translate-x-1/2">
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent data-[state=open]:bg-transparent hover:bg-transparent focus:bg-transparent">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Indicadores
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white dark:bg-gray-800">
                      <ul className="grid w-[500px] p-2 md:grid-cols-2">
                        {indicadoresSubmenu.map((item) => {
                          const Icon = item.icon
                          return (
                            <li key={item.href} className="w-full">
                              <NavigationMenuLink asChild>
                                <Link
                                  href={item.href}
                                  className="flex-row w-full select-none items-center space-x-3 rounded-md p-3 
                                  leading-none no-underline outline-none transition-colors h-full
                                  hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                                >
                                  <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  <div className="space-y-1 flex-1">
                                    <div className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                                      {item.name}
                                    </div>
                                    <p className="line-clamp-2 text-xs leading-snug text-gray-600 dark:text-gray-400">
                                      {item.title}
                                    </p>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          )
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/dolar" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 cursor-pointer">
                        Dólar
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/eventos" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 cursor-pointer">
                        Eventos
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent data-[state=open]:bg-transparent hover:bg-transparent focus:bg-transparent">
                      <Wrench className="h-4 w-4 mr-2" />
                      Herramientas
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-white dark:bg-gray-800">
                      <ul className="grid w-[500px] p-2 grid-cols-2">
                        {herramientasSubmenu.map((item) => {
                          const Icon = item.icon
                          return (
                            <li key={item.href} className="w-full">
                              <NavigationMenuLink asChild>
                                <Link
                                  href={item.href}
                                  className="flex-row w-full select-none items-center space-x-3 rounded-md p-3 
                                  leading-none no-underline outline-none transition-colors h-full
                                  hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
                                >
                                  <Icon className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                  <div className="space-y-1 flex-1">
                                    <div className="text-sm font-medium leading-none text-gray-900 dark:text-gray-100">
                                      {item.name}
                                    </div>
                                    <p className="line-clamp-2 text-xs leading-snug text-gray-600 dark:text-gray-400">
                                      {item.title}
                                    </p>
                                  </div>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          )
                        })}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  <NavigationMenuItem>
                    <NavigationMenuLink asChild>
                      <Link href="/documentacion" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50 cursor-pointer">
                        API Docs
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Right side - Auth + Theme */}
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              
              <SignedIn>
                <CustomUserDropdown />
              </SignedIn>

              <SignedOut>
                {/* Desktop login button */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                  className="hidden lg:block px-5 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-full hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors cursor-pointer"
                >
                  Iniciar sesión
                </button>

                {/* Mobile login icon */}
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                  className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
                  aria-label="Iniciar sesión"
                >
                  <UserRound className="h-5 w-5" />
                </button>
              </SignedOut>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 cursor-pointer"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm dark:bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="lg:hidden fixed right-0 top-0 z-50 h-full w-[280px] bg-white shadow-xl dark:bg-gray-900 overflow-y-auto"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between border-b dark:border-gray-800 px-4 py-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Menú</span>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <X className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                  {/* User section if signed in */}
                  <SignedIn>
                    <div className="mb-6 pb-4 border-b dark:border-gray-800">
                      {/* User Profile Info */}
                      <div className="flex items-center space-x-3 mb-4">
                        <img
                          src={user?.imageUrl}
                          alt={user?.fullName || 'Usuario'}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {user?.fullName || 'Usuario'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.primaryEmailAddress?.emailAddress}
                          </p>
                        </div>
                      </div>

                      {/* User Menu Items */}
                      <div className="space-y-1">
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <User className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <span className="block">Mi Perfil</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Gestionar información personal</span>
                          </div>
                        </Link>

                        <Link
                          href="/profile?tab=api-keys"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <KeyRound className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <span className="block">API Keys</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Gestionar claves de API</span>
                          </div>
                        </Link>

                        <Link
                          href="/profile?tab=favorites"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <Star className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <span className="block">Favoritos</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Indicadores guardados</span>
                          </div>
                        </Link>

                        <Link
                          href="/profile?tab=events"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <Calendar className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <span className="block">Eventos</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Historial de actividad</span>
                          </div>
                        </Link>

                        <Link
                          href="/profile?tab=contact"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                        >
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <div>
                            <span className="block">Contacto</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Enviar mensaje</span>
                          </div>
                        </Link>

                        {/* Admin Dashboard if admin */}
                        {isAdmin && (
                          <>
                            <div className="border-t dark:border-gray-700 my-2"></div>
                            <Link
                              href="/admin"
                              onClick={() => setMobileMenuOpen(false)}
                              className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 text-gray-700 dark:text-gray-300 cursor-pointer"
                            >
                              <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                              <div>
                                <span className="block text-purple-600 dark:text-purple-400">Dashboard Admin</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Panel de administración</span>
                              </div>
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </SignedIn>

                  {/* Main menu items */}
                  <div className="space-y-1">
                    {/* Indicadores con accordion */}
                    <div>
                      <button
                        onClick={() => setMobileIndicadoresOpen(!mobileIndicadoresOpen)}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4" />
                          <span>Indicadores</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${mobileIndicadoresOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {mobileIndicadoresOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-6 mt-1 space-y-1">
                              {indicadoresSubmenu.map((item) => {
                                const Icon = item.icon
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-pointer"
                                  >
                                    <Icon className="h-4 w-4 text-gray-400" />
                                    <span>{item.name}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link
                      href="/dolar"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <DollarSign className="h-4 w-4" />
                      <span>Dólar</span>
                    </Link>

                    <Link
                      href="/eventos"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Eventos</span>
                    </Link>

                    {/* Herramientas con accordion */}
                    <div>
                      <button
                        onClick={() => setMobileHerramientasOpen(!mobileHerramientasOpen)}
                        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4" />
                          <span>Herramientas</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${mobileHerramientasOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {mobileHerramientasOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-6 mt-1 space-y-1">
                              {herramientasSubmenu.map((item) => {
                                const Icon = item.icon
                                return (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-pointer"
                                  >
                                    <Icon className="h-4 w-4 text-gray-400" />
                                    <span>{item.name}</span>
                                  </Link>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <Link
                      href="/api-docs"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      <span>API Docs</span>
                    </Link>

                    <SignedIn>
                      <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
                      >
                        <User className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </SignedIn>
                  </div>

                  {/* Sign Out Button for signed in users */}
                  <SignedIn>
                    <div className="mt-6 pt-6 border-t dark:border-gray-800">
                      <button
                        onClick={() => {
                          signOut()
                          setMobileMenuOpen(false)
                        }}
                        className="flex w-full items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </SignedIn>

                  {/* Sign In Button for signed out users */}
                  <SignedOut>
                    <div className="mt-6 pt-6 border-t dark:border-gray-800">
                      <button
                        onClick={() => {
                          window.dispatchEvent(new CustomEvent('openLoginModal'))
                          setMobileMenuOpen(false)
                        }}
                        className="flex w-full items-center justify-center space-x-2 rounded-md px-3 py-3 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                      >
                        <LogIn className="h-4 w-4" />
                        <span>Iniciar sesión</span>
                      </button>
                    </div>
                  </SignedOut>

                  {/* Theme toggle in mobile */}
                  <div className="mt-6 pt-6 border-t dark:border-gray-800">
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tema
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}