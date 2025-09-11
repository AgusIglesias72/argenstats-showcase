'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, Plus, Edit, Trash2, CheckCircle, Clock, Users, TrendingUp, 
  Package, Utensils, Wrench, Award, Calendar, DollarSign, Activity, 
  Flag, Download, Database
} from 'lucide-react';

interface Event {
  id: string;
  slug: string;
  name: string;
  description?: string;
  status: string;
  eventDate: string;
  submissionDeadline: string;
  prizeAmount: number;
  prizeCurrency: string;
  participantsCount: number;
  officialIpcGeneral?: number;
  officialIpcBienes?: number;
  officialIpcServicios?: number;
  officialIpcAlimentos?: number;
  winnerId?: string;
  resultsPublishedAt?: string;
}

interface EventsAdminPanelProps {
  events: Event[];
  onEventUpdate: () => void;
}

export default function EventsAdminPanel({ events, onEventUpdate }: EventsAdminPanelProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportingEventId, setExportingEventId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    eventDate: '',
    submissionDeadline: '',
    prizeAmount: '',
    prizeCurrency: 'USD',
  });

  const [officialResults, setOfficialResults] = useState({
    ipcGeneral: '',
    ipcBienes: '',
    ipcServicios: '',
    ipcAlimentos: '',
  });

  // Calcular KPIs
  const activeEvents = events.filter(e => e.status === 'ACTIVE').length;
  const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
  const totalParticipants = events.reduce((sum, e) => sum + (e.participantsCount || 0), 0);
  const totalPrizeAmount = events.reduce((sum, e) => sum + (e.prizeAmount || 0), 0);

  // Función para exportar datos de predicciones de un evento
  const handleExportPredictions = async (eventId: string, eventName: string) => {
    console.log('Exportando evento:', eventId, eventName); // Debug
    setExportingEventId(eventId);
    
    try {
      const response = await fetch(`/api/admin/events/${eventId}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      console.log('Response status:', response.status); // Debug

      if (response.ok) {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generar nombre del archivo con fecha
        const date = new Date().toISOString().split('T')[0];
        const fileName = `${eventName.replace(/\s+/g, '_')}_predicciones_${date}.csv`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error al exportar datos, status:', response.status);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        alert('Error al exportar los datos. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error exporting predictions:', error);
      alert('Error al exportar los datos. Por favor, intenta nuevamente.');
    } finally {
      setExportingEventId(null);
    }
  };

  // Función para exportar todos los eventos
  const handleExportAllEvents = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch('/api/admin/events/export-all', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const text = await response.text();
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const date = new Date().toISOString().split('T')[0];
        const fileName = `todas_predicciones_${date}.csv`;
        
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Error al exportar todos los datos');
        alert('Error al exportar los datos. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error exporting all predictions:', error);
      alert('Error al exportar los datos. Por favor, intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          slug: '',
          description: '',
          eventDate: '',
          submissionDeadline: '',
          prizeAmount: '',
          prizeCurrency: 'USD',
        });
        router.refresh();
        onEventUpdate();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalizeEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/events/${selectedEvent.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officialIpcGeneral: parseFloat(officialResults.ipcGeneral),
          officialIpcBienes: parseFloat(officialResults.ipcBienes),
          officialIpcServicios: parseFloat(officialResults.ipcServicios),
          officialIpcAlimentos: parseFloat(officialResults.ipcAlimentos),
        }),
      });

      if (response.ok) {
        setShowFinalizeModal(false);
        setOfficialResults({
          ipcGeneral: '',
          ipcBienes: '',
          ipcServicios: '',
          ipcAlimentos: '',
        });
        router.refresh();
        if (onEventUpdate) onEventUpdate();
        alert('Evento finalizado exitosamente. Se han calculado las posiciones de todos los participantes.');
      }
    } catch (error) {
      console.error('Error finalizing event:', error);
      alert('Error al finalizar el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canFinalizeEvent = (event: Event) => {
    return (
      (event.status === 'SUBMISSION_CLOSED' || event.status === 'AWAITING_RESULTS') && 
      !event.officialIpcGeneral
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { 
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', 
        icon: Clock,
        label: 'Borrador'
      },
      ACTIVE: { 
        color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', 
        icon: CheckCircle,
        label: 'Activo'
      },
      SUBMISSION_CLOSED: { 
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', 
        icon: Clock,
        label: 'Cerrado'
      },
      AWAITING_RESULTS: { 
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', 
        icon: Clock,
        label: 'Esperando Resultados'
      },
      COMPLETED: { 
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', 
        icon: Trophy,
        label: 'Completado'
      },
      CANCELLED: {
        color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        icon: Clock,
        label: 'Cancelado'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Eventos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{events.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Eventos Activos</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{activeEvents}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Participantes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalParticipants}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Premios Totales</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">${totalPrizeAmount}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Eventos</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Administra los eventos de predicción económica</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportAllEvents}
            disabled={isExporting || events.length === 0}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Exportar todos los datos"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Exportando...
              </>
            ) : (
              <>
                <Database className="w-5 h-5" />
                Exportar Todo
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Crear Evento
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Evento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Participantes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Premio
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No hay eventos creados</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Crea tu primer evento para comenzar</p>
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{event.slug}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(event.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.eventDate).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{event.participantsCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {event.prizeCurrency} {event.prizeAmount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {/* Botón de Exportar Datos */}
                      {event.participantsCount > 0 && (
                        <button
                          onClick={() => handleExportPredictions(event.id, event.name)}
                          disabled={exportingEventId === event.id}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 disabled:opacity-50 cursor-pointer"
                          title="Exportar predicciones CSV"
                        >
                          {exportingEventId === event.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {canFinalizeEvent(event) && (
                        <button
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowFinalizeModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium cursor-pointer"
                        >
                          <Flag className="w-4 h-4" />
                          Finalizar
                        </button>
                      )}
                      
                      {event.status === 'COMPLETED' && (
                        <button 
                          onClick={() => router.push(`/admin/events/${event.id}/results`)}
                          className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Award className="w-4 h-4" />
                          Ver Resultados
                        </button>
                      )}
                      
                      <button className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400 cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button className="text-red-400 dark:text-red-500 hover:text-red-500 dark:hover:text-red-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Crear Nuevo Evento</h3>
            
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Evento
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="IPC Septiembre 2025"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ipc-septiembre-2025"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Predice los valores del IPC de septiembre 2025 y gana US$ 100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha del Evento
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cierre de Predicciones
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.submissionDeadline}
                    onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Monto del Premio
                  </label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.prizeAmount}
                    onChange={(e) => setFormData({ ...formData, prizeAmount: e.target.value })}
                    placeholder="100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Moneda
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    value={formData.prizeCurrency}
                    onChange={(e) => setFormData({ ...formData, prizeCurrency: e.target.value })}
                  >
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finalize Event Modal */}
      {showFinalizeModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Finalizar Evento - {selectedEvent.name}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ingresa los valores oficiales del IPC para calcular las posiciones de los participantes.
            </p>
            
            <form onSubmit={handleFinalizeEvent} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  IPC General (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={officialResults.ipcGeneral}
                  onChange={(e) => setOfficialResults({ ...officialResults, ipcGeneral: e.target.value })}
                  placeholder="Ej: 4.2"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Package className="w-4 h-4" />
                  Bienes (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={officialResults.ipcBienes}
                  onChange={(e) => setOfficialResults({ ...officialResults, ipcBienes: e.target.value })}
                  placeholder="Ej: 3.8"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Wrench className="w-4 h-4" />
                  Servicios (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={officialResults.ipcServicios}
                  onChange={(e) => setOfficialResults({ ...officialResults, ipcServicios: e.target.value })}
                  placeholder="Ej: 4.5"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Utensils className="w-4 h-4" />
                  Alimentos y Bebidas (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  value={officialResults.ipcAlimentos}
                  onChange={(e) => setOfficialResults({ ...officialResults, ipcAlimentos: e.target.value })}
                  placeholder="Ej: 5.1"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>ℹ️ Proceso de Cálculo:</strong> Al confirmar, el sistema:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 ml-4 list-disc">
                  <li>Calculará las desviaciones de cada predicción</li>
                  <li>Asignará posiciones según el algoritmo de ranking</li>
                  <li>Determinará y registrará al ganador</li>
                  <li>Actualizará el estado del evento a COMPLETED</li>
                </ul>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>⚠️ Importante:</strong> Esta acción no se puede deshacer. Asegúrate de que los valores sean correctos antes de continuar.
                </p>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowFinalizeModal(false);
                    setOfficialResults({
                      ipcGeneral: '',
                      ipcBienes: '',
                      ipcServicios: '',
                      ipcAlimentos: '',
                    });
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Flag className="w-4 h-4" />
                      Finalizar Evento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}