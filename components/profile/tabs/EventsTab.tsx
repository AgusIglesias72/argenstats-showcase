// components/profile/tabs/EventsTab.tsx
'use client'

import { Calendar, TrendingUp, Trophy } from 'lucide-react'

export default function EventsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Mis Eventos
        </h2>
        
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Próximamente
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Los eventos de predicción y competencias estarán disponibles pronto.
          </p>
        </div>
      </div>

      {/* Preview de cómo se verían los eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Predecí la Inflación de Enero
            </h3>
            <Trophy className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Hacé tu predicción sobre el IPC de enero 2025
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Cierra en 5 días</span>
            <span className="text-green-600 dark:text-green-400">Activo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Pronóstico Dólar Blue
            </h3>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            ¿A cuánto cerrará el dólar blue el viernes?
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Cierra en 2 días</span>
            <span className="text-green-600 dark:text-green-400">Participando</span>
          </div>
        </div>
      </div>
    </div>
  )
}