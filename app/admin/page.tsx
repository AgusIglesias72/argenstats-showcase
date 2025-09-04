'use client'

import { useState } from 'react'
import { Activity, TrendingUp, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

type UpdateResult = {
  success: boolean
  recordsProcessed?: number
  error?: string
  details?: any
}

export default function AdminPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, UpdateResult>>({})

  const updateData = async (type: 'ipc' | 'emae') => {
    setLoading(type)
    
    try {
      const response = await fetch(`/api/internal/update-${type}`, {
        method: 'POST',
        headers: {
          'x-api-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY || '',
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error en la actualización')
      }
      
      setResults(prev => ({
        ...prev,
        [type]: {
          success: true,
          recordsProcessed: data.recordsProcessed,
          details: data
        }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [type]: {
          success: false,
          error: (error as Error).message
        }
      }))
    } finally {
      setLoading(null)
    }
  }

  const dataUpdaters = [
    {
      id: 'ipc',
      title: 'IPC - Índice de Precios al Consumidor',
      description: 'Actualiza los datos del IPC desde el INDEC',
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      id: 'emae',
      title: 'EMAE - Estimador Mensual de Actividad',
      description: 'Actualiza los datos del EMAE desde el INDEC',
      icon: Activity,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Actualización de Datos
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Ejecuta las actualizaciones manuales de los indicadores económicos desde el INDEC.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          {dataUpdaters.map((updater) => {
            const Icon = updater.icon
            const result = results[updater.id]
            const isLoading = loading === updater.id
            
            return (
              <div
                key={updater.id}
                className={`rounded-lg p-6 ${updater.bgColor} border border-gray-200 dark:border-gray-700`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <Icon className={`h-8 w-8 text-${updater.color}-600`} />
                    <div className="ml-3">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {updater.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {updater.description}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => updateData(updater.id as 'ipc' | 'emae')}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 text-white rounded-lg ${updater.buttonColor} 
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                    flex items-center justify-center`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Actualizar Ahora
                    </>
                  )}
                </button>

                {result && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    result.success 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    <div className="flex items-start">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="text-sm">
                        {result.success ? (
                          <div>
                            <p className="font-medium">Actualización exitosa</p>
                            <p>{result.recordsProcessed} registros procesados</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">Error en la actualización</p>
                            <p>{result.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Historial de actualizaciones */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Últimas Actualizaciones
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Próximamente: historial de ejecuciones
        </p>
      </div>
    </div>
  )
}