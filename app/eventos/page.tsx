// app/eventos/page.tsx

import { Metadata } from 'next';
import Link from 'next/link';
import { EventsService } from '@/lib/services/events.service';
import { type EventWithCount } from '@/lib/types/events';
;
import { 
  Trophy, TrendingUp, Target, DollarSign, Calendar, Users, Clock, 
  CheckCircle, Sparkles, ArrowRight, Award, ChevronRight, BarChart3,
  Package, Wrench, Utensils
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Eventos de Predicción | ArgenStats',
  description: 'Participa en nuestros eventos de predicción económica y gana premios increíbles',
};

function getEventStatusBadge(status: string) {
  const statusConfig = {
    ACTIVE: { 
      text: 'Activo', 
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800' 
    },
    SUBMISSION_CLOSED: { 
      text: 'Cerrado', 
      className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800' 
    },
    AWAITING_RESULTS: { 
      text: 'Esperando Resultados', 
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-800' 
    },
    COMPLETED: { 
      text: 'Finalizado', 
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-700' 
    },
    DRAFT: { 
      text: 'Próximamente', 
      className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800' 
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${config.className}`}>
      {config.text}
    </span>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function getTimeRemaining(deadline: Date) {
  const now = new Date();
  const diff = new Date(deadline).getTime() - now.getTime();
  
  if (diff <= 0) return 'Finalizado';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Configuración de iconos para categorías
const categoryConfig = {
  general: { 
    icon: TrendingUp, 
    color: 'purple',
    label: 'IPC General'
  },
  bienes: { 
    icon: Package, 
    color: 'orange',
    label: 'Bienes'
  },
  servicios: { 
    icon: Wrench, 
    color: 'green',
    label: 'Servicios'
  },
  alimentos: { 
    icon: Utensils, 
    color: 'pink',
    label: 'Alimentos'
  },
};

export default async function EventosPage() {
  const events = await EventsService.getPublicEvents();
  
  // Calcular estadísticas para cada evento
  const eventsWithStats = await Promise.all(
    events.map(async (event: EventWithCount) => {
      const statistics = await EventsService.getEventStatistics(event.id);
      return { ...event, statistics };
    })
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Estilo ArgenStats */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-60 dark:opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200 to-pink-200 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl opacity-50" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200 to-blue-200 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Competencias de Predicción Económica
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Eventos de Predicción
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Demostrá tu expertise económico prediciendo indicadores oficiales y ganá premios reales compitiendo con la comunidad
            </p>
            
            {/* Feature pills */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Premios Reales</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">100% Transparente</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Comunidad Activa</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="#eventos-activos"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Ver Eventos Activos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200"
              >
                ¿Cómo funciona?
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Events List Section */}
      <section id="eventos-activos" className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Eventos Disponibles
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Participá en nuestros eventos y competí por premios increíbles
              </p>
            </div>

            {/* Events Grid */}
            {eventsWithStats.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                <Trophy className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  No hay eventos activos en este momento
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Volvé pronto para participar en nuevos eventos de predicción
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {eventsWithStats.map((event: any) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.slug}`}
                    className="group"
                  >
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700">
                      <div className="p-6 lg:p-8">
                        {/* Event Header */}
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                          <div className="mb-4 lg:mb-0">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {event.name}
                              </h3>
                              {getEventStatusBadge(event.status)}
                            </div>
                            {event.description && (
                              <p className="text-gray-600 dark:text-gray-400">
                                {event.description}
                              </p>
                            )}
                          </div>
                          
                          {/* Prize Badge */}
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-center gap-3">
                              <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                              <div>
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Premio</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                  {event.prizeCurrency} {event.prizeAmount}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Statistics Section - NEW */}
                        {event.statistics && event.statistics.totalParticipants > 0 && (
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                Mediana de Predicciones ({event.statistics.totalParticipants} participantes)
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                              {Object.entries(categoryConfig).map(([key, config]) => {
                                const Icon = config.icon;
                                const value = event.statistics.medianPredictions[`ipc${key.charAt(0).toUpperCase() + key.slice(1)}`];
                                return (
                                  <div key={key} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">{config.label}</span>
                                    </div>
                                    <span className={`font-bold text-sm text-${config.color}-600 dark:text-${config.color}-400`}>
                                      {value ? `${value.toFixed(2)}%` : '-'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Event Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-xs font-medium">Fecha</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(event.eventDate)}
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">Cierre</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(event.submissionDeadline)}
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                              <Users className="w-4 h-4" />
                              <span className="text-xs font-medium">Participantes</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {event._count?.predictions || event.participantsCount || 0}
                            </p>
                          </div>

                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                              <Clock className="w-4 h-4" />
                              <span className="text-xs font-medium">Tiempo</span>
                            </div>
                            <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                              {getTimeRemaining(event.submissionDeadline)}
                            </p>
                          </div>
                        </div>

                        {/* Event Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>Una predicción por usuario • Resultados transparentes</span>
                          </div>
                          
                          {event.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg group-hover:bg-blue-700 transition-colors">
                              Participar
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          )}
                          
                          {event.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg">
                              Ver Resultados
                              <Award className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="como-funciona" className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Cómo funciona?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Participar es simple y transparente
              </p>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Predice</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Ingresá tus predicciones para los valores del IPC en sus 4 categorías principales
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Espera</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  El INDEC publicará los datos oficiales en la fecha del evento
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Gana</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Quien más se acerque a los valores reales ganará el premio
                </p>
              </div>
            </div>

            {/* Ranking System Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
                Sistema de Ranking
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">IPC General</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Prioridad máxima: Solo quienes acierten el IPC General competirán por el premio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Aciertos Exactos</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Entre quienes acertaron el General, gana quien tenga más aciertos exactos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Menor Desviación</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      En caso de empate, gana quien tenga menor diferencia total
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Orden de Envío</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Como último criterio, gana quien haya enviado primero su predicción
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Transparencia Total:</strong> Todas las predicciones son públicas (anónimas) y los resultados 
                  se calculan automáticamente al publicarse los datos oficiales del INDEC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para demostrar tu expertise económico?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Participá en nuestros eventos y competí por premios reales
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Crear Cuenta
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/documentacion"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors"
            >
              Ver Documentación
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}