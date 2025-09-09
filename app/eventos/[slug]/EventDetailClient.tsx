// app/eventos/[slug]/EventDetailClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, Users, Calendar, Clock, TrendingUp, Package, Utensils, 
  Wrench, BarChart3, Info, CheckCircle, Share2, Eye, EyeOff,
  ChevronLeft, ChevronRight, Copy, Twitter, Linkedin, AlertCircle,
  Activity, Table2
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

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
  { id: 'predicciones', label: 'Predicciones', icon: Table2 },
];

export default function EventDetailClient({
  event,
  userPrediction,
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
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const predictionsPerPage = 20;
  
  const [formData, setFormData] = useState({
    ipcGeneral: '',
    ipcBienes: '',
    ipcServicios: '',
    ipcAlimentos: '',
  });

  // Countdown Timer
  const calculateTimeLeft = () => {
    const difference = +new Date(event.submissionDeadline) - +new Date();
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

  const isEventActive = event.status === 'ACTIVE' && new Date() < new Date(event.submissionDeadline);
  const hasUserPredicted = !!userPrediction;
  const canParticipate = isEventActive && !hasUserPredicted && isSignedIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    if (hasUserPredicted) {
      alert('Ya has realizado tu predicción para este evento');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/events/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          ...formData,
        }),
      });

      if (response.ok) {
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.message || 'Error al enviar la predicción');
      }
    } catch (error) {
      console.error('Error submitting prediction:', error);
      alert('Error al enviar la predicción. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shareEvent = (platform: string) => {
    const url = window.location.href;
    const text = `Participa en ${event.name} y gana ${event.prizeCurrency} ${event.prizeAmount}! 🏆`;
    
    switch(platform) {
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

  // Sort predictions
  const sortedPredictions = [...(event.predictions || [])].sort((a: any, b: any) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt') {
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
    <div className="space-y-8">
      {/* Countdown Timer */}
      {isEventActive && Object.keys(timeLeft).length > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 rounded-xl p-6 text-white">
          <h3 className="text-lg font-semibold mb-4 text-center">Tiempo restante para participar</h3>
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

      {/* Share Button */}
      <div className="flex justify-end">
        <div className="relative">
          <button
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Compartir
          </button>
          
          {showShareMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => shareEvent('twitter')}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Twitter className="w-4 h-4" />
                Twitter
              </button>
              <button
                onClick={() => shareEvent('linkedin')}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </button>
              <button
                onClick={() => shareEvent('copy')}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copiedLink ? 'Copiado!' : 'Copiar enlace'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Prediction or Form */}
      {hasUserPredicted ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-7 h-7 text-green-500" />
                Tu Predicción
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Registrada el {new Date(userPrediction.createdAt).toLocaleDateString('es-AR')} a las{' '}
                {new Date(userPrediction.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

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

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Nota:</strong> No puedes modificar tu predicción. Los resultados se publicarán el {new Date(event.eventDate).toLocaleDateString('es-AR')}.
            </p>
          </div>
        </div>
      ) : canParticipate ? (
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

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Una vez enviada, no podrás modificar tu predicción. Asegúrate de que los valores sean correctos.
                </p>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <Trophy className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Inicia sesión para participar</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Necesitas una cuenta para participar en los eventos de predicción
          </p>
          <Link
            href="/sign-in"
            className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            Iniciar Sesión
          </Link>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
          <Clock className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">Evento Cerrado</h2>
          <p className="text-gray-600 dark:text-gray-400">
            El período de predicciones ha finalizado. Los resultados se publicarán pronto.
          </p>
        </div>
      )}

      {/* Statistics Section with Tabs */}
      {statistics && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Header with participant count */}
          <div className="px-8 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                <Activity className="w-6 h-6" />
                Información del Evento
              </h2>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {statistics.totalParticipants} participantes
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex">
              {tabsConfig.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
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
                {/* Mediana */}
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
                          {statistics.medianPredictions[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`].toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Media */}
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
                          {statistics.averagePredictions[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`].toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'predicciones' && (
              <div className="space-y-4">
                {/* Sorting Options */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Todas las Predicciones ({sortedPredictions.length})
                  </h3>
            
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">#</th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => handleSort('ipcGeneral')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            IPC General
                            {sortBy === 'ipcGeneral' && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => handleSort('ipcBienes')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Bienes
                            {sortBy === 'ipcBienes' && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => handleSort('ipcServicios')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Servicios
                            {sortBy === 'ipcServicios' && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => handleSort('ipcAlimentos')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Alimentos
                            {sortBy === 'ipcAlimentos' && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Fecha
                            {sortBy === 'createdAt' && (
                              <span className="text-blue-600 dark:text-blue-400">
                                {sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPredictions?.map((pred: any, index: number) => (
                        <tr key={pred.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {(currentPage - 1) * predictionsPerPage + index + 1}
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
                          <td className="px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-400">
                            {new Date(pred.createdAt).toLocaleDateString('es-AR')}
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