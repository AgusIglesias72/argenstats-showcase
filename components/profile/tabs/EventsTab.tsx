// components/profile/tabs/EventsTab.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, TrendingUp, Trophy, Clock, Users, 
  ChevronRight, Award, BarChart3, Package, 
  Wrench, Utensils, AlertCircle, Loader2,
  Sparkles, ArrowRight
} from 'lucide-react'

// Tipos para los eventos
interface EventStatistics {
  totalParticipants: number
  medianPredictions: {
    ipcGeneral: number | null
    ipcBienes: number | null
    ipcServicios: number | null
    ipcAlimentos: number | null
  }
}

interface EventWithStats {
  id: string
  slug: string
  name: string
  description?: string
  status: 'ACTIVE' | 'SUBMISSION_CLOSED' | 'AWAITING_RESULTS' | 'COMPLETED' | 'DRAFT'
  eventDate: string
  submissionDeadline: string
  prizeAmount: number
  prizeCurrency: string
  participantsCount?: number
  _count?: {
    predictions: number
  }
  statistics?: EventStatistics
}

// Configuración de estados
const statusConfig = {
  ACTIVE: { 
    text: 'Activo', 
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dotColor: 'bg-green-500'
  },
  SUBMISSION_CLOSED: { 
    text: 'Cerrado', 
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    dotColor: 'bg-yellow-500'
  },
  AWAITING_RESULTS: { 
    text: 'Esperando Resultados', 
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    dotColor: 'bg-blue-500'
  },
  COMPLETED: { 
    text: 'Finalizado', 
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    dotColor: 'bg-gray-500'
  },
  DRAFT: { 
    text: 'Próximamente', 
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    dotColor: 'bg-purple-500'
  },
}

// Configuración de categorías
const categoryConfig = {
  general: { 
    icon: TrendingUp, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    label: 'IPC General'
  },
  bienes: { 
    icon: Package, 
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    label: 'Bienes'
  },
  servicios: { 
    icon: Wrench, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    label: 'Servicios'
  },
  alimentos: { 
    icon: Utensils, 
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    label: 'Alimentos'
  },
}

// Funciones helper
function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getTimeRemaining(deadline: string) {
  const now = new Date()
  const diff = new Date(deadline).getTime() - now.getTime()
  
  if (diff <= 0) return 'Finalizado'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h`
  return 'Último día'
}

export default function EventsTab() {
  const [eventsWithStats, setEventsWithStats] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      
      // Llamar a la API route en lugar de usar el servicio directamente
      const response = await fetch('/api/events/public')
      
      if (!response.ok) {
        throw new Error('Error al cargar los eventos')
      }
      
      const data = await response.json()
      setEventsWithStats(data.events || [])
      
    } catch (err) {
      setError('No se pudieron cargar los eventos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const activeEvents = eventsWithStats.filter(e => 
    e.status === 'ACTIVE' || e.status === 'SUBMISSION_CLOSED' || e.status === 'AWAITING_RESULTS'
  )
  const completedEvents = eventsWithStats.filter(e => e.status === 'COMPLETED')

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Eventos de Predicción
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Participá prediciendo indicadores económicos y ganá premios reales
            </p>
          </div>
          <Link
            href="/eventos"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
            <Trophy className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Premios Reales</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-300">100% Transparente</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Comunidad Activa</span>
          </div>
        </div>

        {/* Events List */}
        {eventsWithStats.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No hay eventos disponibles
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Los nuevos eventos se anunciarán pronto
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Eventos Activos */}
            {activeEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Eventos Activos
                </h3>
                <div className="space-y-3">
                  {activeEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {/* Separator */}
            {activeEvents.length > 0 && completedEvents.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700" />
            )}

            {/* Eventos Completados */}
            {completedEvents.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-500" />
                  Eventos Finalizados
                </h3>
                <div className="space-y-3">
                  {completedEvents.slice(0, 3).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {eventsWithStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Eventos activos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeEvents.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total participantes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {eventsWithStats.reduce((acc, e) => acc + (e._count?.predictions || 0), 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Premios totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${eventsWithStats.reduce((acc, e) => acc + (e.prizeAmount || 0), 0)}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente para cada tarjeta de evento
function EventCard({ event }: { event: EventWithStats }) {
  const status = statusConfig[event.status as keyof typeof statusConfig]

  return (
    <Link href={`/eventos/${event.slug}`}>
      <div className="group bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {event.name}
            </h3>
            {event.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                {event.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status.dotColor}`} />
            <span className={`text-xs font-medium ${status.className} px-2 py-1 rounded-full`}>
              {status.text}
            </span>
          </div>
        </div>

        {/* Stats minimalistas */}
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>{event.prizeCurrency} {event.prizeAmount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{event._count?.predictions || event.participantsCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{event.status === 'ACTIVE' ? getTimeRemaining(event.submissionDeadline) : formatDate(event.eventDate)}</span>
          </div>
        </div>

        {/* Mediana de predicciones (si existe) */}
        {event.statistics && event.statistics.totalParticipants > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Mediana ({event.statistics.totalParticipants} participantes)
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => {
                const Icon = config.icon
                const fieldName = `ipc${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof event.statistics.medianPredictions
                const value = event.statistics?.medianPredictions?.[fieldName]
                
                return (
                  <div key={key} className={`flex items-center gap-1 px-2 py-1 rounded ${config.bgColor}`}>
                    <Icon className={`w-3 h-3 ${config.color}`} />
                    <span className={`text-xs font-medium ${config.color}`}>
                      {value ? `${value.toFixed(1)}%` : '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="mt-3 flex justify-end">
          {event.status === 'ACTIVE' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              Participar
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          )}
          {event.status === 'COMPLETED' && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              Ver resultados
              <Award className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
