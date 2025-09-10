// components/events/EventResults.tsx

'use client';

import { useState } from 'react';
import { 
  Trophy, Medal, Crown, Target, CheckCircle, XCircle, 
  Clock, TrendingUp, Users, Award, ChevronLeft, ChevronRight,
  Hash, User, Star
} from 'lucide-react';
import Image from 'next/image';

interface EventResultsProps {
  event: any;
  currentUserId: string | null;
  userRank?: number;
}

export default function EventResults({ event, currentUserId, userRank }: EventResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  
  // Obtener predicciones ordenadas por rank
  const predictions = event.predictions || [];
  const sortedPredictions = [...predictions].sort((a: any, b: any) => 
    (a.rank || 999) - (b.rank || 999)
  );

  // Encontrar la predicción del usuario actual
  const userPrediction = currentUserId 
    ? sortedPredictions.find((p: any) => p.userId === currentUserId)
    : null;

  // Paginación
  const totalPages = Math.ceil(sortedPredictions.length / resultsPerPage);
  const paginatedPredictions = sortedPredictions.slice(
    (currentPage - 1) * resultsPerPage,
    currentPage * resultsPerPage
  );

  // Función para obtener el ícono de posición
  const getPositionIcon = (rank: number) => {
    switch(rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-orange-600" />;
      default:
        return <Hash className="w-4 h-4 text-gray-400" />;
    }
  };

  // Función para formatear el desvío
  const formatDeviation = (deviation: number | null | undefined) => {
    if (deviation === null || deviation === undefined) return '0.00';
    return deviation.toFixed(2);
  };

  // Función para formatear fecha y hora
  const formatDateTime = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString('es-AR', { 
      day: '2-digit', 
      month: '2-digit' 
    })} ${d.toLocaleTimeString('es-AR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  };

  return (
    <div className="space-y-8">
      {/* KPIs del usuario y evento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tu Posición */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">TU POSICIÓN</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {userPrediction ? `#${userPrediction.rank}` : '-'}
              </p>
              {userPrediction && userPrediction.rank === 1 && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-1 font-semibold">
                  ¡GANADOR! 🎉
                </p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${
              userPrediction?.rank === 1 
                ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              {userPrediction?.rank === 1 ? (
                <Trophy className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>
        </div>

        {/* Total Participantes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">PARTICIPANTES</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {event.participantsCount || sortedPredictions.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total de predicciones
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* Premio */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">PREMIO</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {event.prizeCurrency} {event.prizeAmount}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Para el 1er lugar
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Award className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Valores Oficiales */}
      {event.officialIpcGeneral !== null && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Valores Oficiales del INDEC
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">IPC General</p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {event.officialIpcGeneral}%
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Bienes</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {event.officialIpcBienes}%
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Servicios</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {event.officialIpcServicios}%
              </p>
            </div>
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">Alimentos</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {event.officialIpcAlimentos}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Posiciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tabla de Posiciones
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pos.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IPC General
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bienes
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Servicios
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Alimentos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  General
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Aciertos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Desvío
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Enviado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPredictions.map((prediction: any) => {
                const isCurrentUser = prediction.userId === currentUserId;
                const isWinner = prediction.rank === 1;
                
                return (
                  <tr 
                    key={prediction.id} 
                    className={`
                      ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      ${isWinner ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                      hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                    `}
                  >
                    {/* Posición */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getPositionIcon(prediction.rank)}
                        <span className={`font-semibold text-sm ${
                          prediction.rank <= 3 ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {prediction.rank}
                        </span>
                      </div>
                    </td>

                    {/* Usuario */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {isCurrentUser ? (
                          <>
                            {prediction.user?.imageUrl ? (
                              <Image
                                src={prediction.user.imageUrl}
                                alt={prediction.user.name || 'Usuario'}
                                width={32}
                                height={32}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
                                {prediction.user?.name || 'Tú'}
                                <Star className="w-3 h-3 text-blue-500" />
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {prediction.userEmail}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              Usuario Anónimo
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Predicciones */}
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`font-medium ${
                        prediction.ipcGeneral === event.officialIpcGeneral
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {prediction.ipcGeneral}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`font-medium ${
                        prediction.ipcBienes === event.officialIpcBienes
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {prediction.ipcBienes}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`font-medium ${
                        prediction.ipcServicios === event.officialIpcServicios
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {prediction.ipcServicios}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className={`font-medium ${
                        prediction.ipcAlimentos === event.officialIpcAlimentos
                          ? 'text-green-600 dark:text-green-400 font-bold'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {prediction.ipcAlimentos}%
                      </span>
                    </td>

                    {/* Acertó General */}
                    <td className="px-6 py-4 text-center">
                      {prediction.generalMatch ? (
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 mx-auto" />
                      )}
                    </td>

                    {/* Aciertos Exactos */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        prediction.exactMatchesCount === 4
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : prediction.exactMatchesCount >= 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {prediction.exactMatchesCount || 0}/4
                      </span>
                    </td>

                    {/* Desvío Total */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDeviation(prediction.totalDeviation)}
                      </span>
                    </td>

                    {/* Fecha y Hora */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(prediction.createdAt)}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {((currentPage - 1) * resultsPerPage) + 1} - {Math.min(currentPage * resultsPerPage, sortedPredictions.length)} de {sortedPredictions.length} resultados
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}