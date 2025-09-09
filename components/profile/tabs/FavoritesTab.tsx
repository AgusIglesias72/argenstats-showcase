// components/profile/tabs/FavoritesTab.tsx
'use client'

import { Star, Sparkles, Bell, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function FavoritesTab() {
  return (
    <div className="space-y-6">
      {/* Card principal de "Próximamente" */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {/* Ícono principal */}
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Próximamente
          </Badge>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 mx-auto">
            <Star className="w-8 h-8 text-white" />
          </div>

          {/* Badge de estado */}


          {/* Título y descripción */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Indicadores Favoritos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8">
            Muy pronto vas a poder guardar tus indicadores favoritos para acceder 
            rápidamente a la información que más te interesa.
          </p>

          {/* Features que van a estar disponibles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-blue-600 dark:text-blue-400 mb-2">
                <Star className="w-6 h-6 mx-auto" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Guardá favoritos</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Marcá los indicadores que más seguís
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-blue-600 dark:text-blue-400 mb-2">
                <Bell className="w-6 h-6 mx-auto" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Notificaciones</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Recibí alertas de cambios importantes
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="text-blue-600 dark:text-blue-400 mb-2">
                <ArrowRight className="w-6 h-6 mx-auto" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Acceso rápido</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Toda tu info importante en un lugar
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium">Lanzamiento estimado:</span>
            <span className="ml-2 font-bold text-blue-600 dark:text-blue-400">
              Octubre 2025
            </span>
          </div>
        </div>
      </Card>

      {/* Card secundaria con más info */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
            🚀 ¿Qué más viene?
          </h3>
          <p className="text-purple-800 dark:text-purple-200 text-sm mb-4">
            Además de los indicadores favoritos, estamos trabajando en:
          </p>
          <ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Seguimiento de cotizaciones de acciones argentinas</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Bonos soberanos y corporativos</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Índices bursátiles (MERVAL, S&P500, etc.)</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Commodities y metales preciosos</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Dashboards personalizados</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Footer informativo */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Mientras tanto, podés explorar todos nuestros{' '}
          <a href="/indicadores" className="text-blue-600 dark:text-blue-400 hover:underline">
            indicadores disponibles
          </a>
        </p>
      </div>
    </div>
  )
}