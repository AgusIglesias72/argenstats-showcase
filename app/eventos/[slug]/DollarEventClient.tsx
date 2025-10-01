// app/eventos/[slug]/DollarEventClient.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  DollarSign, TrendingUp, Users, Eye, EyeOff, Edit3, Trophy, 
  Calendar, AlertCircle, Lock, CheckCircle, Clock, BarChart3,
  Twitter, Linkedin, Copy, Share2, ChevronRight, Info,
  Sparkles, Target, Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface DollarEventClientProps {
  event: any;
  userPrediction: any;
  isSignedIn: boolean;
  user: any;
}

export default function DollarEventClient({ 
  event, 
  userPrediction: initialUserPrediction, 
  isSignedIn, 
  user 
}: DollarEventClientProps) {
  const router = useRouter();
  const [dollarValue, setDollarValue] = useState(
    initialUserPrediction?.dollarValue?.toFixed(2) || ''
  );
  const [isPublic, setIsPublic] = useState(initialUserPrediction?.isPublic || false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userPrediction, setUserPrediction] = useState(initialUserPrediction);
  const [publicPredictions, setPublicPredictions] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'date' | 'edits'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const hasUserPredicted = !!userPrediction;
  const isEventActive = event.status === 'ACTIVE';
  const canEdit = event.allowPredictionEdit && 
    event.editDeadline && 
    new Date(event.editDeadline) > new Date() &&
    hasUserPredicted;

  useEffect(() => {
    fetchPublicPredictions();
    // Actualizar cada 30 segundos para ver nuevas predicciones
    const interval = setInterval(fetchPublicPredictions, 30000);
    return () => clearInterval(interval);
  }, [event.id]);

  const fetchPublicPredictions = async () => {
    try {
      const response = await fetch(`/api/events/dollar-predict?eventId=${event.id}`);
      const data = await response.json();
      if (data.success) {
        setPublicPredictions(data.predictions || []);
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn || !user) {
      router.push('/sign-in');
      return;
    }

    const value = parseFloat(dollarValue);
    if (isNaN(value) || value <= 0 || value > 100000) {
      toast.error('Por favor ingresá un valor válido entre $1 y $100.000');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(
      hasUserPredicted ? 'Actualizando tu predicción...' : 'Enviando tu predicción...'
    );

    try {
      const userEmail = user.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) {
        toast.dismiss(loadingToast);
        toast.error('No se pudo obtener tu email. Por favor, verificá tu cuenta.');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/events/dollar-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          userId: user.id,
          userEmail: userEmail,
          dollarValue: value,
          isPublic,
        }),
      });

      const data = await response.json();
      toast.dismiss(loadingToast);
      
      if (response.ok) {
        setUserPrediction(data.prediction);
        toast.success(data.message || '¡Predicción enviada exitosamente! 🎉', {
          duration: 4000,
        });
        fetchPublicPredictions();
        setTimeout(() => router.refresh(), 1000);
      } else {
        toast.error(data.error || 'Error al enviar la predicción', {
          duration: 5000,
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Error de conexión. Por favor, intentá nuevamente.', {
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVisibility = async () => {
    if (!userPrediction) return;

    const loadingToast = toast.loading('Cambiando visibilidad...');

    try {
      const response = await fetch('/api/events/dollar-predict', {
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
        setIsPublic(data.prediction.isPublic);
        toast.success(data.message, {
          duration: 3000,
        });
        fetchPublicPredictions();
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
    }
  };

  const shareEvent = (platform: string) => {
    const url = window.location.href;
    const text = `Participo en la predicción del Dólar MEP post-elecciones en @ArgenStats. ¿Cuál será el valor el 27/10? Participá y ganá ${event.prizeCurrency} ${event.prizeAmount}! 💵`;

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    const deadline = event.allowPredictionEdit && event.editDeadline 
      ? new Date(event.editDeadline) 
      : new Date(event.submissionDeadline);
    
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return 'Finalizado';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Ordenar predicciones públicas
  const sortedPredictions = [...publicPredictions].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return sortOrder === 'asc' 
          ? a.dollarValue - b.dollarValue 
          : b.dollarValue - a.dollarValue;
      case 'date':
        return sortOrder === 'asc'
          ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case 'edits':
        return sortOrder === 'asc'
          ? a.editCount - b.editCount
          : b.editCount - a.editCount;
      default:
        return 0;
    }
  });

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Panel de Predicción - Columna Izquierda */}
      <div className="lg:col-span-1 space-y-6">
        {/* Formulario de Predicción */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            Tu Predicción
          </h2>

          {isEventActive ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="dollarValue" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor del Dólar MEP (ARS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
                  <input
                    id="dollarValue"
                    type="number"
                    step="0.01"
                    min="1"
                    max="100000"
                    value={dollarValue}
                    onChange={(e) => setDollarValue(e.target.value)}
                    className="w-full pl-8 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="1234.56"
                    disabled={!canEdit && hasUserPredicted}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ingresá el valor con hasta 2 decimales
                </p>
              </div>

              {/* Toggle de Visibilidad */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Eye className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Predicción {isPublic ? 'pública' : 'privada'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {isPublic ? 'Visible en el ranking con tu nombre' : 'Solo vos podés verla'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !hasUserPredicted && setIsPublic(!isPublic)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isPublic ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  } ${hasUserPredicted ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                  disabled={hasUserPredicted}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                    isPublic ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>

              {/* Info de Edición */}
              {canEdit && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <Edit3 className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Podés editar hasta: {formatDate(event.editDeadline)}
                      </p>
                      {userPrediction?.editCount > 0 && (
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                          Ediciones realizadas: {userPrediction.editCount}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tiempo Restante */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Tiempo restante:
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                  {getTimeRemaining()}
                </span>
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={isSubmitting || (!canEdit && hasUserPredicted) || !dollarValue}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {isSubmitting ? 'Procesando...' : 
                 hasUserPredicted ? (canEdit ? 'Actualizar Predicción' : 'Ya participaste') : 
                 'Enviar Predicción'}
              </button>
            </form>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">El evento no está activo</p>
              <p className="text-sm mt-1">Volvé pronto para participar</p>
            </div>
          )}

          {/* Confirmación de Predicción */}
          {hasUserPredicted && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Tu predicción: ${userPrediction.dollarValue.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    {userPrediction.isPublic ? '👁️ Visible públicamente' : '🔒 Solo visible para vos'}
                  </p>
                  {userPrediction.isPublic !== isPublic && (
                    <button
                      onClick={toggleVisibility}
                      className="text-sm text-green-600 dark:text-green-400 hover:underline mt-2"
                    >
                      Cambiar a {userPrediction.isPublic ? 'privada' : 'pública'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botones de Compartir */}
          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Compartir Evento
            </button>
            
            {showShareMenu && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  onClick={() => shareEvent('twitter')}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-xs">Twitter</span>
                </button>
                <button
                  onClick={() => shareEvent('linkedin')}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-xs">LinkedIn</span>
                </button>
                <button
                  onClick={() => shareEvent('copy')}
                  className="flex items-center justify-center gap-1 py-2 px-3 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-xs">{copiedLink ? '✓' : 'Copiar'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        {statistics && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Estadísticas del Evento
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Promedio
                </span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  ${statistics.averagePrediction.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Mediana
                </span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  ${statistics.medianPrediction.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Rango
                </span>
                <span className="font-mono font-medium text-sm text-gray-900 dark:text-white">
                  ${statistics.minPrediction.toFixed(2)} - ${statistics.maxPrediction.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Públicas
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {statistics.publicPredictions} de {statistics.totalParticipants}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Desv. Estándar
                </span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  ${statistics.standardDeviation.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabla de Predicciones Públicas - Columna Derecha */}
      <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Predicciones Públicas
            </h2>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-gray-600 dark:text-gray-400">
                Ordenar por:
              </label>
              <select
                id="sort-select"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy as any);
                  setSortOrder(newSortOrder as any);
                }}
                className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="value-asc">Valor (menor a mayor)</option>
                <option value="value-desc">Valor (mayor a menor)</option>
                <option value="date-desc">Más recientes</option>
                <option value="date-asc">Más antiguos</option>
                <option value="edits-desc">Más editados</option>
              </select>
            </div>
          </div>

          {sortedPredictions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      #
                    </th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Participante
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Predicción
                    </th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ediciones
                    </th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                      Última Actualización
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPredictions.map((prediction, index) => (
                    <tr 
                      key={prediction.id} 
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        prediction.userId === user?.id ? 'bg-green-50/50 dark:bg-green-900/10' : ''
                      }`}
                    >
                      <td className="py-3 px-2 text-sm text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          {prediction.user?.imageUrl ? (
                            <Image
                              src={prediction.user.imageUrl} 
                              alt={prediction.user.name || 'Usuario'}
                              width={36}
                              height={36}
                              className="rounded-full ring-2 ring-gray-100 dark:ring-gray-700"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {prediction.user?.name?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {prediction.user?.name || 'Usuario Anónimo'}
                            </p>
                            {prediction.userId === user?.id && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                (Tu predicción)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                          ${prediction.dollarValue.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {prediction.editCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                            <Edit3 className="w-3 h-3" />
                            {prediction.editCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">-</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>{new Date(prediction.updatedAt).toLocaleDateString('es-AR')}</p>
                          <p className="text-xs">
                            {new Date(prediction.updatedAt).toLocaleTimeString('es-AR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <EyeOff className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">No hay predicciones públicas aún</p>
              <p className="text-sm">Sé el primero en compartir tu predicción con la comunidad</p>
            </div>
          )}
        </div>

        {/* Información del Sistema de Ranking */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mt-6 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Sistema de Ranking del Evento
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Cercanía al valor oficial</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80">
                    Gana quien más se acerque al valor del Dólar MEP
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="inline-block w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Desempate por tiempo</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80">
                    En caso de empate, gana quien actualizó primero
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Edit3 className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Ediciones permitidas</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80">
                    Podés editar hasta el {event.editDeadline ? formatDate(event.editDeadline) : 'cierre'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-200">Resultados el 27/10</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 opacity-80">
                    Después del cierre del mercado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}