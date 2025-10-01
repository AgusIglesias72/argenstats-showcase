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
  { id: 'predicciones', label: 'Predicciones Públicas', icon: Table2 },
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
        toast.success(data.message || '¡Predicción enviada exitosamente! 🎉', {
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
    const text = `Participa en ${event.name} y gana ${event.prizeCurrency} ${event.prizeAmount}! 🏆`;

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

  // Filtrar solo predicciones públicas
  const publicPredictions = event.predictions?.filter((p: any) => p.isPublic) || [];

  // Sort predictions
  const sortedPredictions = [...publicPredictions].sort((a: any, b: any) => {
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
          {/* Tu predicción vs Resultados reales */}
          {hasUserPredicted && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                    Tu Predicción vs Resultado Real
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                    {userPrediction.isPublic ? (
                      <>
                        <Eye className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">Visible públicamente</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500">Solo visible para vos</span>
                      </>
                    )}
                  </p>
                </div>
                {/* Botón para cambiar visibilidad - SIEMPRE disponible */}
                <button
                  onClick={togglePredictionVisibility}
                  disabled={isTogglingVisibility}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  title={userPrediction.isPublic ? 'Hacer privada' : 'Hacer pública'}
                >
                  {userPrediction.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {userPrediction.isPublic ? 'Hacer Privada' : 'Hacer Pública'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tu Predicción */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Tu Predicción</h3>
                  <div className="space-y-3">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{config.label}</span>
                        </div>
                        <span className={`font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                          {userPrediction[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Enviada el {new Date(userPrediction.createdAt).toLocaleDateString('es-AR')} a las{' '}
                    {new Date(userPrediction.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Valores Reales */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">Valores Oficiales INDEC</h3>
                  <div className="space-y-3">
                    {Object.entries(categoryConfig).map(([key, config]) => {
                      const officialKey = `officialIpc${key.charAt(0).toUpperCase() + key.slice(1)}`;
                      const predictionKey = `ipc${key.charAt(0).toUpperCase() + key.slice(1)}`;
                      const isExactMatch = userPrediction[predictionKey] === event[officialKey];
                      
                      return (
                        <div key={key} className={`flex items-center justify-between p-3 bg-${config.color}-50 dark:bg-${config.color}-900/20 rounded-lg`}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{config.label}</span>
                          </div>
                          <span className={`font-bold ${
                            isExactMatch 
                              ? 'text-green-600 dark:text-green-400' 
                              : `text-${config.color}-600 dark:text-${config.color}-400`
                          }`}>
                            {event[officialKey]}%
                            {isExactMatch && ' ✅'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle className="w-7 h-7 text-green-500" />
                    Tu Predicción
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                    {userPrediction.isPublic ? (
                      <>
                        <Eye className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">Visible públicamente</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500">Solo visible para vos</span>
                      </>
                    )}
                    {userPrediction.editCount > 0 && (
                      <span className="text-sm text-orange-600 dark:text-orange-400">
                        • Editada {userPrediction.editCount} {userPrediction.editCount === 1 ? 'vez' : 'veces'}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {/* Botón para cambiar visibilidad */}
                  <button
                    onClick={togglePredictionVisibility}
                    disabled={isTogglingVisibility}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                    title={userPrediction.isPublic ? 'Hacer privada' : 'Hacer pública'}
                  >
                    {userPrediction.isPublic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {userPrediction.isPublic ? 'Hacer Privada' : 'Hacer Pública'}
                  </button>

                  {/* Botón para editar (si está permitido) */}
                  {canEdit && !isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Editar Predicción
                    </button>
                  )}
                </div>
              </div>

              {isEditMode ? (
                // Formulario de edición
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <div key={key}>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {config.icon}
                          {config.label} (%)
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

                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublic" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Eye className="w-4 h-4" />
                      Hacer mi predicción pública (visible con tu nombre en el ranking)
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Actualizando...' : 'Actualizar Predicción'}
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border bg-${config.color}-50 dark:bg-${config.color}-900/20 border-${config.color}-200 dark:border-${config.color}-800`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {config.icon}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
                      </div>
                      <p className={`text-2xl font-bold text-${config.color}-600 dark:text-${config.color}-400`}>
                        {userPrediction[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`]}%
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!isEditMode && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Realizar Predicción</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <div key={key}>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {config.icon}
                        {config.label} (%)
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

                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublic" className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Eye className="w-4 h-4" />
                    Hacer mi predicción pública (otros usuarios podrán ver tu nombre y predicción)
                  </label>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      {event.allowPredictionEdit && event.editDeadline
                        ? `Podrás editar tu predicción hasta el ${new Date(event.editDeadline).toLocaleDateString('es-AR')} a las ${new Date(event.editDeadline).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`
                        : 'Una vez enviada, no podrás modificar tu predicción.'}
                      {' '}Podrás cambiar la visibilidad (pública/privada) en cualquier momento.
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Predicción'}
                </button>
              </form>
            </div>
          ) : !isSignedIn ? (
            // No está logueado
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Inicia sesión para participar</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Necesitas una cuenta para participar en los eventos de predicción
              </p>
              <Link
                href={`/sign-in?redirect_url=/eventos/${event.slug}`}
                className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
              >
                Iniciar Sesión
              </Link>
            </div>
          ) : (
            // Evento cerrado
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
              <Clock className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Evento Cerrado</h2>
              <p className="text-gray-600 dark:text-gray-400">
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
                {statistics.publicPredictions !== undefined && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({statistics.publicPredictions} públicas)
                  </span>
                )}
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
            )}

            {activeTab === 'predicciones' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Predicciones Públicas ({publicPredictions.length})
                  </h3>
                </div>

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
                              {pred.user?.imageUrl ? (
                                <Image
                                  src={pred.user.imageUrl} 
                                  alt={pred.user.name || 'Usuario'}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {pred.user?.name?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {pred.user?.name || 'Usuario Anónimo'}
                                </p>
                                {pred.userId === userId && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400">(Tú)</span>
                                )}
                              </div>
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}