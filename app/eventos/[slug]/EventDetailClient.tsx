// app/eventos/[slug]/EventDetailClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Trophy, Users, Calendar, Clock, TrendingUp, Package, Utensils,
  Wrench, BarChart3, Info, CheckCircle, Share2, Eye, EyeOff,
  ChevronLeft, ChevronRight, Copy, Twitter, Linkedin, AlertCircle,
  Activity, Table2, Edit3, Lock, Unlock
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { toast } from 'sonner';
import EventResults from '@/components/events/EventResults';

interface EventDetailClientProps {
  event: any;
  userPrediction: any;
  statistics: any;
  distribution: any;
  userId: string | null;
}

// Configuración de tabs
const tabsConfig = [
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { id: 'predicciones', label: 'Todas las Predicciones', icon: Table2 },
];

export default function EventDetailClient({
  event,
  userPrediction: initialUserPrediction,
  statistics,
  distribution,
  userId,
}: EventDetailClientProps) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('estadisticas');
  const [currentPage, setCurrentPage] = useState(1);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [userPrediction, setUserPrediction] = useState(initialUserPrediction);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const predictionsPerPage = 20;

  const [formData, setFormData] = useState({
    ipcGeneral: userPrediction?.ipcGeneral?.toString() || '',
    ipcBienes: userPrediction?.ipcBienes?.toString() || '',
    ipcServicios: userPrediction?.ipcServicios?.toString() || '',
    ipcAlimentos: userPrediction?.ipcAlimentos?.toString() || '',
    isPublic: userPrediction?.isPublic || false,
  });

  // Variables de estado del evento
  const isEventActive = event.status === 'ACTIVE' && new Date() < new Date(event.submissionDeadline);
  const hasUserPredicted = !!userPrediction;
  const canEdit = event.allowPredictionEdit && 
    event.editDeadline && 
    new Date(event.editDeadline) > new Date() &&
    hasUserPredicted &&
    isEventActive;
  const canParticipate = isEventActive && !hasUserPredicted && isSignedIn;

  // Countdown Timer
  const calculateTimeLeft = () => {
    const deadline = canEdit && hasUserPredicted ? event.editDeadline : event.submissionDeadline;
    const difference = +new Date(deadline) - +new Date();
    let timeLeft: any = {};

    if (difference > 0) {
      timeLeft = {
        dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60)
      };
    }

    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  // Manejar envío/actualización de predicción
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !user) {
      router.push('/sign-in');
      return;
    }

    // Validar que todos los campos estén completos
    if (!formData.ipcGeneral || !formData.ipcBienes || !formData.ipcServicios || !formData.ipcAlimentos) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setIsSubmitting(true);

    try {
      const userEmail = user.emailAddresses?.[0]?.emailAddress;

      if (!userEmail) {
        toast.error('No se pudo obtener tu email. Por favor, verifica tu cuenta.');
        setIsSubmitting(false);
        return;
      }

      const loadingToast = toast.loading(
        hasUserPredicted ? 'Actualizando tu predicción...' : 'Enviando tu predicción...'
      );

      const response = await fetch('/api/events/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userId: user.id,
          userEmail: userEmail,
          ...formData,
        }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok) {
        setUserPrediction(data.prediction);
        setIsEditMode(false);
        toast.success(data.message || '¡Predicción enviada exitosamente!', {
          duration: 4000,
        });
        setTimeout(() => router.refresh(), 1000);
      } else {
        toast.error(data.error || 'Error al enviar la predicción', {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast.error('Error de conexión', {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle visibilidad de la predicción
  const togglePredictionVisibility = async () => {
    if (!userPrediction || isTogglingVisibility) return;

    setIsTogglingVisibility(true);
    const loadingToast = toast.loading('Cambiando visibilidad...');

    try {
      const response = await fetch('/api/events/predict', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionId: userPrediction.id,
        }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);
      
      if (response.ok) {
        setUserPrediction(data.prediction);
        setFormData(prev => ({ ...prev, isPublic: data.prediction.isPublic }));
        toast.success(data.message, {
          duration: 3000,
        });
        router.refresh();
      } else {
        toast.error('Error al cambiar la visibilidad', {
          duration: 3000,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error de conexión', {
        duration: 3000,
      });
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  // Compartir evento
  const shareEvent = (platform: string) => {
    const url = window.location.href;
    const text = `Participa en ${event.name} y gana ${event.prizeCurrency} ${event.prizeAmount}!`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        toast.success('Link copiado!', { duration: 2000 });
        break;
    }
    setShowShareMenu(false);
  };

  // Sorting function
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Obtener TODAS las predicciones (no filtrar por isPublic)
  const allPredictions = event.predictions || [];

  // Sort predictions
  const sortedPredictions = [...allPredictions].sort((a: any, b: any) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedPredictions.length / predictionsPerPage);
  const paginatedPredictions = sortedPredictions.slice(
    (currentPage - 1) * predictionsPerPage,
    currentPage * predictionsPerPage
  );

  const categoryConfig = {
    general: {
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'purple',
      label: 'IPC General'
    },
    bienes: {
      icon: <Package className="w-5 h-5" />,
      color: 'orange',
      label: 'Bienes'
    },
    servicios: {
      icon: <Wrench className="w-5 h-5" />,
      color: 'green',
      label: 'Servicios'
    },
    alimentos: {
      icon: <Utensils className="w-5 h-5" />,
      color: 'pink',
      label: 'Alimentos y Bebidas'
    },
  };

  return (
    <div className="space-y-6">
      {/* Countdown Timer con info de edición si corresponde */}
      {isEventActive && Object.keys(timeLeft).length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 text-center">
            {canEdit && hasUserPredicted 
              ? 'Tiempo restante para editar tu predicción' 
              : 'Tiempo restante para participar'}
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {Object.keys(timeLeft).map((interval) => (
              <div key={interval} className="text-center">
                <div className="text-3xl font-bold">{timeLeft[interval as keyof typeof timeLeft]}</div>
                <div className="text-sm opacity-75 capitalize">{interval}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar resultados si el evento está completado */}
      {event.status === 'COMPLETED' ? (
        <>
          {/* Tu predicción vs Resultados reales - Versión compacta */}
          {hasUserPredicted && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    Tu Predicción vs Resultado Real
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Enviada el {new Date(userPrediction.createdAt).toLocaleDateString('es-AR')} a las{' '}
                    {new Date(userPrediction.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {/* Botón para cambiar visibilidad - SIEMPRE disponible */}
                <div className="flex flex-col items-end gap-1">
                  <button
                    onClick={togglePredictionVisibility}
                    disabled={isTogglingVisibility}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 text-sm"
                    title={userPrediction.isPublic ? 'Ocultar mi nombre del ranking' : 'Hacer pública mi predicción'}
                  >
                    {userPrediction.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {userPrediction.isPublic ? 'Ocultar mi nombre' : 'Hacer pública mi predicción'}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    {userPrediction.isPublic ? (
                      <>
                        <Eye className="w-3 h-3 text-green-600" />
                        Nombre visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Nombre oculto
                      </>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Tabla comparativa compacta */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Categoría</th>
                      <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Tu Predicción</th>
                      <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Valor Oficial</th>
                      <th className="text-center py-2 px-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(categoryConfig).map(([key, config]) => {
                      const officialKey = `officialIpc${key.charAt(0).toUpperCase() + key.slice(1)}`;
                      const predictionKey = `ipc${key.charAt(0).toUpperCase() + key.slice(1)}`;
                      const isExactMatch = userPrediction[predictionKey] === event[officialKey];
                      
                      return (
                        <tr key={key} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              {config.icon}
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{config.label}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className={`font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                              {userPrediction[predictionKey]}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-3">
                            <span className="font-bold text-gray-900 dark:text-white">
                              {event[officialKey]}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-3">
                            {isExactMatch ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                                Exacto
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {(Math.abs(userPrediction[predictionKey] - event[officialKey])).toFixed(1)}% diff
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <EventResults 
            event={event}
            currentUserId={userId}
            userRank={userPrediction?.rank}
          />
        </>
      ) : (
        /* Lógica para cuando el evento NO está completado */
<>
          {hasUserPredicted ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
                    Tu predicción
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {userPrediction.isPublic ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4 text-green-600" />
                          <span className="text-green-600 font-medium">Nombre visible</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <EyeOff className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-500">Nombre oculto</span>
                        </div>
                      </>
                    )}
                    {userPrediction.editCount > 0 && (
                      <span className="text-sm text-orange-600 dark:text-orange-400">
                        • Editada {userPrediction.editCount} {userPrediction.editCount === 1 ? 'vez' : 'veces'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  {/* Botón para cambiar visibilidad */}
                  <button
                    onClick={togglePredictionVisibility}
                    disabled={isTogglingVisibility}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
                    title={userPrediction.isPublic ? 'Ocultar mi nombre' : 'Hacer pública mi predicción'}
                  >
                    {userPrediction.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="whitespace-nowrap">
                      {userPrediction.isPublic ? 'Ocultar nombre' : 'Hacer pública'}
                    </span>
                  </button>

                  {/* Botón para editar (si está permitido) */}
                  {canEdit && !isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span className="whitespace-nowrap">Editar</span>
                    </button>
                  )}
                </div>
              </div>

              {isEditMode ? (
                // Formulario de edición
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <div key={key}>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {config.icon}
                          <span className="truncate">{config.label}</span> (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                          placeholder="Ej: 2.4"
                          value={formData[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof formData]}
                          onChange={(e) => setFormData({ ...formData, [`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <label htmlFor="isPublic" className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>Mostrar mi nombre y foto en el ranking (otros usuarios podrán ver tu identidad)</span>
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Actualizando...' : 'Actualizar predicción'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(false);
                        setFormData({
                          ipcGeneral: userPrediction?.ipcGeneral?.toString() || '',
                          ipcBienes: userPrediction?.ipcBienes?.toString() || '',
                          ipcServicios: userPrediction?.ipcServicios?.toString() || '',
                          ipcAlimentos: userPrediction?.ipcAlimentos?.toString() || '',
                          isPublic: userPrediction?.isPublic || false,
                        });
                      }}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                // Vista de predicción (no editable)
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border bg-${config.color}-50 dark:bg-${config.color}-900/20 border-${config.color}-200 dark:border-${config.color}-800`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {config.icon}
                        <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
                      </div>
                      <p className={`text-xl sm:text-2xl font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                        {userPrediction[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]}%
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!isEditMode && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                    <strong>Nota:</strong> 
                    {canEdit 
                      ? ` Podés editar tu predicción hasta el ${new Date(event.editDeadline).toLocaleDateString('es-AR')} a las ${new Date(event.editDeadline).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`
                      : ' No podés modificar tu predicción.'}
                    {' '}Los resultados se publicarán el {new Date(event.eventDate).toLocaleDateString('es-AR')}.
                  </p>
                </div>
              )}
            </div>
          ) : canParticipate ? (
            // Formulario para nueva predicción
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">Realizar predicción</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <div key={key}>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {config.icon}
                        <span className="truncate">{config.label}</span> (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                        placeholder="Ej: 2.4"
                        value={formData[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}` as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                  />
                  <label htmlFor="isPublic" className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Eye className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>Mostrar mi nombre y foto en el ranking (otros usuarios podrán ver tu identidad)</span>
                  </label>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200">
                      {event.allowPredictionEdit && event.editDeadline
                        ? `Podrás editar tu predicción hasta el ${new Date(event.editDeadline).toLocaleDateString('es-AR')} a las ${new Date(event.editDeadline).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`
                        : 'Una vez enviada, no podrás modificar tu predicción.'}
                      {' '}Podrás cambiar la visibilidad de tu identidad en cualquier momento.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-base sm:text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar predicción'}
                </button>
              </form>
            </div>
          ) : !isSignedIn ? (
            // No está logueado
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 text-center">
              <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">Inicia sesión para participar</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
                Necesitas una cuenta para participar en los eventos de predicción.
              </p>
              <Link
                href={`/sign-in?redirect_url=/eventos/${event.slug}`}
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base"
              >
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            // Evento cerrado
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 sm:p-8 text-center border border-gray-200 dark:border-gray-700">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">Evento Cerrado</h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                El período de predicciones ha finalizado. Los resultados se publicarán pronto.
              </p>
            </div>
          )}
        </>
      )}

      {/* Statistics Section with Tabs */}
      {statistics && event.status !== 'COMPLETED' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-8 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Activity className="w-6 h-6" />
                Información del Evento
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {statistics.totalParticipants} participantes
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {tabsConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium cursor-pointer transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'estadisticas' && (
              <>
                {statistics.totalParticipants >= 10 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estadísticas existentes */}
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Mediana de Predicciones
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(categoryConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {config.icon}
                              <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
                            </div>
                            <span className={`font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                              {statistics.medianPredictions[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]?.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        Media de Predicciones
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(categoryConfig).map(([key, config]) => (
                          <div key={key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {config.icon}
                              <span className="text-sm text-gray-600 dark:text-gray-400">{config.label}</span>
                            </div>
                            <span className={`font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                              {statistics.averagePredictions[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]?.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Estadísticas disponibles pronto
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Las estadísticas agregadas se mostrarán cuando haya al menos 10 participantes
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        {statistics.totalParticipants} de 10 participantes
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'predicciones' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Todas las Predicciones ({allPredictions.length})
                  </h3>
                </div>

                {allPredictions.length > 0 ? (
                  <>
                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Participante</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              onClick={() => handleSort('ipcGeneral')}>
                              IPC General {sortBy === 'ipcGeneral' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Bienes</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Servicios</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Alimentos</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Ediciones</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                              onClick={() => handleSort('updatedAt')}>
                              Última Actualización {sortBy === 'updatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedPredictions?.map((pred: any, index: number) => (
                            <tr key={pred.id} className={`border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                              pred.userId === userId ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}>
                              <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                {(currentPage - 1) * predictionsPerPage + index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {/* Para el usuario actual, usar información de Clerk si pred.user está vacío */}
                                  {(() => {
                                    const isCurrentUser = pred.userId === userId;
                                    const shouldShowInfo = pred.isPublic || isCurrentUser;
                                    
                                    // Si es el usuario actual y pred.user está vacío, usar información de Clerk
                                    const userInfo = isCurrentUser && (!pred.user?.name && !pred.user?.imageUrl) 
                                      ? { 
                                          name: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Usuario',
                                          imageUrl: user?.imageUrl || null
                                        }
                                      : pred.user;
                                    
                                    if (!shouldShowInfo) {
                                      return (
                                        <>
                                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                              ?
                                            </span>
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                              Usuario Anónimo
                                            </p>
                                          </div>
                                        </>
                                      );
                                    }
                                    
                                    return (
                                      <>
                                        {userInfo?.imageUrl ? (
                                          <Image
                                            src={userInfo.imageUrl} 
                                            alt={userInfo.name || 'Usuario'}
                                            width={32}
                                            height={32}
                                            className="rounded-full"
                                          />
                                        ) : userInfo?.name ? (
                                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                              {userInfo.name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                              ?
                                            </span>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {userInfo?.name || 'Usuario Anónimo'}
                                          </p>
                                          {isCurrentUser && (
                                            <span className="text-xs text-blue-600 dark:text-blue-400">(Tú)</span>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
                                {pred.ipcGeneral}%
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
                                {pred.ipcBienes}%
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
                                {pred.ipcServicios}%
                              </td>
                              <td className="px-4 py-3 text-sm text-center font-medium text-gray-900 dark:text-white">
                                {pred.ipcAlimentos}%
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {pred.editCount > 0 ? (
                                  <span className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
                                    <Edit3 className="w-3 h-3 mr-1" />
                                    {pred.editCount}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                                {new Date(pred.updatedAt).toLocaleDateString('es-AR')} {' '}
                                {new Date(pred.updatedAt).toLocaleTimeString('es-AR', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>

                        <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                          Página {currentPage} de {totalPages}
                        </span>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <EyeOff className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No hay predicciones aún</p>
                    <p className="text-sm mt-2">Sé el primero en participar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}