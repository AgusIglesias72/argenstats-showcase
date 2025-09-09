// app/eventos/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { EventsService } from '@/lib/services/events.service';
import { currentUser } from '@clerk/nextjs/server';
import { Header } from '@/components/layout/header';
import EventDetailClient from './EventDetailClient';
import { Metadata } from 'next';
import { Trophy, Calendar, Clock, Users, TrendingUp, Package, Utensils, Wrench, Info, BarChart3 } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await EventsService.getEventBySlug(slug)
    
  if (!event) {
    return {
      title: 'Evento no encontrado | ArgenStats',
    };
  }

  return {
    title: `${event.name} - Evento de Predicción | ArgenStats`,
    description: event.description || `Participa en ${event.name} y gana ${event.prizeCurrency} ${event.prizeAmount}`,
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = await EventsService.getEventBySlug(slug);
  
  if (!event) {
    notFound();
  }

  const user = await currentUser();
  const userId = user?.id || null;
  
  // Obtener predicción del usuario si está autenticado
  let userPrediction = null;
  if (userId) {
    userPrediction = await EventsService.getUserPrediction(event.id, userId);
  }

  // Obtener estadísticas del evento
  const statistics = await EventsService.getEventStatistics(event.id);
  
  // Obtener distribución para histogramas
  const distribution = await EventsService.getPredictionDistribution(event.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-60 dark:opacity-40" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-200 to-pink-200 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            {/* Event Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                  {event.name}
                </h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${
                  event.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-800'
                    : event.status === 'COMPLETED'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800'
                }`}>
                  {event.status === 'ACTIVE' ? 'Activo' : event.status === 'COMPLETED' ? 'Finalizado' : 'Cerrado'}
                </span>
              </div>
              {event.description && (
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                  {event.description}
                </p>
              )}
            </div>

            {/* Event Stats Cards - Mejorado con colores y diseño */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-5 border border-yellow-200 dark:border-yellow-800 hover:scale-105 transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">PREMIO</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {event.prizeCurrency} {event.prizeAmount}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800 hover:scale-105 transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">FECHA</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(event.eventDate)}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800 hover:scale-105 transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-red-700 dark:text-red-400">CIERRE</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatDate(event.submissionDeadline)}
                    </p>
                  </div>
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-5 border border-purple-200 dark:border-purple-800 hover:scale-105 transition-transform">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-400">PARTICIPANTES</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {event.participantsCount || 0}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <EventDetailClient
              event={event}
              userPrediction={userPrediction}
              statistics={statistics}
              distribution={distribution}
              userId={userId}
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Sistema de Ranking
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Así determinamos al ganador del evento
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">IPC General</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Solo quienes acierten el IPC General pasarán a competir por el premio
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Aciertos Exactos</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Entre quienes acertaron el General, gana quien tenga más aciertos exactos
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Menor Desviación</h4>
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
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Orden de Envío</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Como último criterio, gana quien haya enviado primero su predicción
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Transparencia Total:</strong> Todas las predicciones son públicas (anónimas) y los resultados 
                    se calculan automáticamente al publicarse los datos oficiales del INDEC.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}