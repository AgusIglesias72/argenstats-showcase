'use client'

import { useState } from 'react'
import { 
  Calendar, 
  Plus, 
  Clock, 
  Users,
  MapPin,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

// Datos de ejemplo - en el futuro vendrán de la API
const mockEvents = [
  {
    id: '1',
    title: 'Webinar: API de Inflación',
    description: 'Aprende a usar nuestra API de inflación para tus proyectos',
    date: '2024-02-15T18:00:00Z',
    location: 'Online',
    attendees: 45,
    maxAttendees: 100,
    status: 'upcoming',
    type: 'webinar'
  },
  {
    id: '2',
    title: 'Meetup: Datos Económicos',
    description: 'Encuentro presencial para discutir el uso de datos económicos',
    date: '2024-02-20T19:00:00Z',
    location: 'Buenos Aires, Argentina',
    attendees: 23,
    maxAttendees: 50,
    status: 'upcoming',
    type: 'meetup'
  },
  {
    id: '3',
    title: 'Workshop: Integración API',
    description: 'Taller práctico sobre integración de APIs',
    date: '2024-01-25T16:00:00Z',
    location: 'Online',
    attendees: 67,
    maxAttendees: 67,
    status: 'completed',
    type: 'workshop'
  }
]

const eventStats = {
  total: 12,
  upcoming: 5,
  completed: 7,
  totalAttendees: 234
}

export default function EventsTab() {
  const [filterStatus, setFilterStatus] = useState('all')

  const filteredEvents = mockEvents.filter(event => 
    filterStatus === 'all' || event.status === filterStatus
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'webinar':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      case 'meetup':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      case 'workshop':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      {/* Coming Soon Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Gestión de Eventos</h2>
            <p className="text-blue-100">
              Próximamente podrás crear y gestionar eventos, webinars y meetups desde aquí.
            </p>
          </div>
          <Calendar className="w-16 h-16 text-blue-200" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Eventos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{eventStats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Próximos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{eventStats.upcoming}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{eventStats.completed}</p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Asistentes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{eventStats.totalAttendees}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filter and Create Button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="all">Todos los eventos</option>
              <option value="upcoming">Próximos</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
          <button 
            disabled
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 opacity-50 cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Evento (Próximamente)
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Eventos</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredEvents.map((event) => (
            <div key={event.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(event.status)}`}>
                      {event.status === 'upcoming' ? 'Próximo' : event.status === 'completed' ? 'Completado' : 'Cancelado'}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(event.type)}`}>
                      {event.type === 'webinar' ? 'Webinar' : event.type === 'meetup' ? 'Meetup' : 'Workshop'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.date).toLocaleDateString('es-AR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.attendees}/{event.maxAttendees} asistentes
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </button>
                  <button 
                    disabled
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </button>
                  <button 
                    disabled
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-md text-xs font-medium text-red-700 dark:text-red-200 bg-white dark:bg-gray-700 opacity-50 cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Features Preview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Funcionalidades Futuras
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Creación de Eventos</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crea webinars, meetups y workshops directamente desde el panel de admin.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Gestión de Asistentes</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Administra registros, confirmaciones y comunicación con asistentes.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Analytics de Eventos</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Métricas detalladas sobre participación y engagement.
            </p>
          </div>
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Integración con Calendario</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sincronización automática con Google Calendar y otros servicios.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
