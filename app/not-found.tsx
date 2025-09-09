// app/not-found.tsx
import Link from 'next/link'
import { 
  AlertCircle, 
  Home, 
  BarChart3, 
  Calculator,
  ArrowRight,
  TrendingUp,
  Activity,
  Briefcase,
  Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-400 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-400 rounded-full opacity-10 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Logo */}
        <Link href="/" className="inline-block mb-8">
          <span className="font-righteous text-4xl md:text-5xl text-blue-600 dark:text-blue-400">
            ArgenStats
          </span>
        </Link>

        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
            404
          </h1>
        </div>

        {/* Error Card */}
        <Card className="mb-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur border-red-200 dark:border-red-900/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-left">
                <h2 className="font-semibold text-gray-900 dark:text-white">Error 404</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Página no disponible</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              N/D
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span>Sistema en funcionamiento</span>
            </div>
            <span>{new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </Card>

        {/* Message */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            ¡Ups! Página no encontrada
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-md mx-auto">
            Parece que esta estadística no existe en nuestra base de datos. 
            Los números no cuadran por aquí.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href="/">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </Link>
          <Link href="/indicadores">
            <Button variant="outline" className="w-full sm:w-auto">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver indicadores
            </Button>
          </Link>
        </div>

        {/* Suggestions */}
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Tal vez te interese:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/indicadores/inflacion">
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                <TrendingUp className="w-3 h-3 mr-1" />
                IPC - Inflación
              </Badge>
            </Link>
            <Link href="/indicadores/emae">
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                <Activity className="w-3 h-3 mr-1" />
                EMAE - Actividad
              </Badge>
            </Link>
            <Link href="/indicadores/empleo">
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                <Briefcase className="w-3 h-3 mr-1" />
                Mercado Laboral
              </Badge>
            </Link>
            <Link href="/indicadores/construccion">
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                <Building2 className="w-3 h-3 mr-1" />
                Construcción
              </Badge>
            </Link>
            <Link href="/calculadora-inflacion">
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
                <Calculator className="w-3 h-3 mr-1" />
                Calculadora
              </Badge>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}