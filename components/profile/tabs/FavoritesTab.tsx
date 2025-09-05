// components/profile/tabs/FavoritesTab.tsx
'use client'

import { Star, TrendingUp, DollarSign, Activity, BarChart3, Plus } from 'lucide-react'

export default function FavoritesTab() {
  // Mock de favoritos para mostrar cómo se vería
  const mockFavorites = [
    { id: 1, type: 'ipc', name: 'Inflación Nacional', icon: TrendingUp, value: '4.2%', change: '+0.8%' },
    { id: 2, type: 'dollar', name: 'Dólar Blue', icon: DollarSign, value: '$1,150', change: '+2.5%' },
    { id: 3, type: 'cer', name: 'CER', icon: Activity, value: '48.52', change: '+0.15%' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Indicadores Favoritos
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Accedé rápidamente a los indicadores que más te interesan
            </p>
          </div>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockFavorites.map((favorite) => {
            const Icon = favorite.icon
            return (
              <div
                key={favorite.id}
                className="relative bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <button className="absolute top-2 right-2 text-yellow-400 hover:text-yellow-500">
                  <Star className="w-5 h-5 fill-current" />
                </button>
                
                <div className="flex items-center mb-3">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {favorite.name}
                  </h3>
                </div>
                
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {favorite.value}
                  </span>
                  <span className={`text-sm font-medium ${
                    favorite.change.startsWith('+') 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {favorite.change}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Placeholder para agregar más */}
          <button className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors flex flex-col items-center justify-center min-h-[120px]">
            <Plus className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Agregar indicador
            </span>
          </button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Próximamente
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Pronto vas a poder seguir cotizaciones de acciones, bonos y más instrumentos financieros.
        </p>
      </div>
    </div>
  )
}