// lib/services/events.service.ts

import { prisma } from '@/lib/db/prisma';
import { EventPrediction, PredictionInput, EventStatistics } from '@/lib/types/events';

export class EventsService {
  // Obtener evento activo por slug
  static async getEventBySlug(slug: string) {
    return await prisma.event.findUnique({
      where: { slug },
      include: {
        predictions: {
          select: {
            id: true,
            userId: true,
            userEmail: true,
            ipcGeneral: true,
            ipcBienes: true,
            ipcServicios: true,
            ipcAlimentos: true,
            isPublic: true, // NUEVO
            editCount: true, // NUEVO
            lastEditedAt: true, // NUEVO
            createdAt: true,
            updatedAt: true, // NUEVO
            // Campos calculados del ranking
            rank: true,
            generalMatch: true,
            exactMatchesCount: true,
            totalDeviation: true,
            isWinner: true,
            // Incluir datos del usuario
            user: {
              select: {
                userId: true,
                email: true,
                name: true,
                imageUrl: true,
              }
            }
          },
          orderBy: {
            rank: 'asc'
          }
        },
        winner: true,
      },
    });
  }

  // Obtener todos los eventos activos
  static async getActiveEvents() {
    return await prisma.event.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        eventDate: 'asc',
      },
    });
  }

  // Obtener todos los eventos públicos (activos y completados)
  static async getPublicEvents() {
    return await prisma.event.findMany({
      where: {
        OR: [
          { status: 'ACTIVE' },
          { status: 'SUBMISSION_CLOSED' },
          { status: 'AWAITING_RESULTS' },
          { status: 'COMPLETED' },
        ],
      },
      orderBy: {
        eventDate: 'desc',
      },
      include: {
        _count: {
          select: {
            predictions: true,
          },
        },
      },
    });
  }

  // Crear o actualizar predicción (ACTUALIZADO para soportar ediciones)
  static async upsertPrediction(
    eventId: string,
    userId: string,
    userEmail: string,
    prediction: PredictionInput & { isPublic?: boolean }
  ): Promise<EventPrediction> {
    // Verificar que el evento existe y está activo
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.eventType !== 'IPC_PREDICTION') {
      throw new Error('Este evento no es de tipo predicción IPC');
    }

    if (event.status !== 'ACTIVE') {
      throw new Error('El evento no está activo');
    }

    const now = new Date();
    if (event.submissionDeadline < now) {
      throw new Error('El período de predicciones ha finalizado');
    }

    // Verificar si existe una predicción previa
    const existingPrediction = await prisma.eventPrediction.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (existingPrediction) {
      // Verificar si se permite edición
      if (!event.allowPredictionEdit) {
        throw new Error('Este evento no permite editar predicciones');
      }

      if (event.editDeadline && event.editDeadline < now) {
        throw new Error('El período de edición ha finalizado');
      }

      // Actualizar predicción existente
      return await prisma.eventPrediction.update({
        where: { id: existingPrediction.id },
        data: {
          ipcGeneral: prediction.ipcGeneral,
          ipcBienes: prediction.ipcBienes,
          ipcServicios: prediction.ipcServicios,
          ipcAlimentos: prediction.ipcAlimentos,
          isPublic: prediction.isPublic ?? existingPrediction.isPublic,
          editCount: { increment: 1 },
          lastEditedAt: now,
        },
      });
    } else {
      // Crear nueva predicción
      const newPrediction = await prisma.eventPrediction.create({
        data: {
          eventId,
          userId,
          userEmail,
          ipcGeneral: prediction.ipcGeneral,
          ipcBienes: prediction.ipcBienes,
          ipcServicios: prediction.ipcServicios,
          ipcAlimentos: prediction.ipcAlimentos,
          isPublic: prediction.isPublic ?? false,
        },
      });

      // Actualizar contador de participantes
      await prisma.event.update({
        where: { id: eventId },
        data: {
          participantsCount: { increment: 1 },
        },
      });

      return newPrediction;
    }
  }

  // Método antiguo para compatibilidad (redirige al nuevo)
  static async createPrediction(
    eventId: string,
    userId: string,
    userEmail: string,
    prediction: PredictionInput
  ) {
    return await this.upsertPrediction(eventId, userId, userEmail, prediction);
  }

  // Cambiar visibilidad de una predicción IPC (NUEVO)
  static async togglePredictionVisibility(
    predictionId: string,
    userId: string
  ): Promise<EventPrediction> {
    const prediction = await prisma.eventPrediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new Error('Predicción no encontrada');
    }

    if (prediction.userId !== userId) {
      throw new Error('No tienes permisos para modificar esta predicción');
    }

    return await prisma.eventPrediction.update({
      where: { id: predictionId },
      data: {
        isPublic: !prediction.isPublic,
      },
    });
  }

  // Obtener predicciones públicas de un evento IPC (NUEVO)
  static async getPublicPredictions(eventId: string) {
    return await prisma.eventPrediction.findMany({
      where: {
        eventId,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [
        { rank: 'asc' },
        { updatedAt: 'asc' },
      ],
    });
  }

  // Obtener todas las predicciones (ACTUALIZADO para incluir solo públicas)
  static async getEventPredictions(eventId: string) {
    return await prisma.eventPrediction.findMany({
      where: { 
        eventId,
        isPublic: true, // Solo mostrar públicas
      },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: [
        { rank: 'asc' },
        { updatedAt: 'asc' },
      ],
    });
  }

  // Obtener predicción del usuario para un evento
  static async getUserPrediction(eventId: string, userId: string) {
    return await prisma.eventPrediction.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }

  // Calcular estadísticas del evento (ACTUALIZADO para incluir info de visibilidad)
  static async getEventStatistics(eventId: string) {
    const predictions = await prisma.eventPrediction.findMany({
      where: { eventId },
      select: {
        ipcGeneral: true,
        ipcBienes: true,
        ipcServicios: true,
        ipcAlimentos: true,
        isPublic: true, // NUEVO
      },
    });

    if (predictions.length === 0) {
      return null;
    }

    // Calcular medianas
    const getMedian = (values: number[]) => {
      const sorted = values.sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    };

    // Calcular promedios
    const getAverage = (values: number[]) => {
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    };

    const generalValues = predictions.map(p => p.ipcGeneral);
    const bienesValues = predictions.map(p => p.ipcBienes);
    const serviciosValues = predictions.map(p => p.ipcServicios);
    const alimentosValues = predictions.map(p => p.ipcAlimentos);

    // Contar predicciones públicas (NUEVO)
    const publicPredictions = predictions.filter(p => p.isPublic).length;

    return {
      totalParticipants: predictions.length,
      publicPredictions, // NUEVO
      medianPredictions: {
        ipcGeneral: getMedian([...generalValues]),
        ipcBienes: getMedian([...bienesValues]),
        ipcServicios: getMedian([...serviciosValues]),
        ipcAlimentos: getMedian([...alimentosValues]),
      },
      averagePredictions: {
        ipcGeneral: getAverage(generalValues),
        ipcBienes: getAverage(bienesValues),
        ipcServicios: getAverage(serviciosValues),
        ipcAlimentos: getAverage(alimentosValues),
      },
    };
  }

  // Calcular rankings cuando se publican los resultados oficiales (ACTUALIZADO para considerar ediciones)
  static async calculateRankings(
    eventId: string,
    officialValues: {
      ipcGeneral: number;
      ipcBienes: number;
      ipcServicios: number;
      ipcAlimentos: number;
    }
  ) {
    const predictions = await prisma.eventPrediction.findMany({
      where: { eventId },
      orderBy: { updatedAt: 'asc' }, // CAMBIO: usar updatedAt para considerar ediciones
    });

    // Calcular métricas para cada predicción
    const rankedPredictions = predictions.map(pred => {
      const generalMatch = pred.ipcGeneral === officialValues.ipcGeneral;
      
      let exactMatchesCount = 0;
      let totalDeviation = 0;

      // Contar aciertos exactos y calcular desviación total
      if (pred.ipcGeneral === officialValues.ipcGeneral) exactMatchesCount++;
      else totalDeviation += Math.abs(pred.ipcGeneral - officialValues.ipcGeneral);

      if (pred.ipcBienes === officialValues.ipcBienes) exactMatchesCount++;
      else totalDeviation += Math.abs(pred.ipcBienes - officialValues.ipcBienes);

      if (pred.ipcServicios === officialValues.ipcServicios) exactMatchesCount++;
      else totalDeviation += Math.abs(pred.ipcServicios - officialValues.ipcServicios);

      if (pred.ipcAlimentos === officialValues.ipcAlimentos) exactMatchesCount++;
      else totalDeviation += Math.abs(pred.ipcAlimentos - officialValues.ipcAlimentos);

      return {
        ...pred,
        generalMatch,
        exactMatchesCount,
        totalDeviation,
      };
    });

    // Ordenar según las reglas de ranking
    rankedPredictions.sort((a, b) => {
      // 1. Primero, quien acertó el IPC General
      if (a.generalMatch !== b.generalMatch) {
        return a.generalMatch ? -1 : 1;
      }

      // 2. Si ambos acertaron o fallaron el general, cantidad de aciertos exactos
      if (a.exactMatchesCount !== b.exactMatchesCount) {
        return b.exactMatchesCount - a.exactMatchesCount;
      }

      // 3. Si tienen la misma cantidad de aciertos, menor desviación total
      if (a.totalDeviation !== b.totalDeviation) {
        return a.totalDeviation - b.totalDeviation;
      }

      // 4. Si todo es igual, gana quien actualizó primero (updatedAt)
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    });

    // Actualizar rankings en la base de datos
    const updatePromises = rankedPredictions.map((pred, index) => {
      const rank = index + 1;
      const isWinner = rank === 1;

      return prisma.eventPrediction.update({
        where: { id: pred.id },
        data: {
          generalMatch: pred.generalMatch,
          exactMatchesCount: pred.exactMatchesCount,
          totalDeviation: pred.totalDeviation,
          rank,
          isWinner,
        },
      });
    });

    await Promise.all(updatePromises);

    // Actualizar el evento con el ganador y valores oficiales
    const winner = rankedPredictions[0];
    await prisma.event.update({
      where: { id: eventId },
      data: {
        officialIpcGeneral: officialValues.ipcGeneral,
        officialIpcBienes: officialValues.ipcBienes,
        officialIpcServicios: officialValues.ipcServicios,
        officialIpcAlimentos: officialValues.ipcAlimentos,
        winnerId: winner.userId,
        status: 'COMPLETED',
        resultsPublishedAt: new Date(),
      },
    });

    return rankedPredictions;
  }

  // Obtener distribución de predicciones para histogramas
  static async getPredictionDistribution(eventId: string) {
    const predictions = await prisma.eventPrediction.findMany({
      where: { eventId },
      select: {
        ipcGeneral: true,
        ipcBienes: true,
        ipcServicios: true,
        ipcAlimentos: true,
      },
    });

    // Crear bins para cada categoría
    const createHistogram = (values: number[], binSize = 0.2) => {
      const min = Math.floor(Math.min(...values) / binSize) * binSize;
      const max = Math.ceil(Math.max(...values) / binSize) * binSize;
      const bins: { range: string; count: number; min: number; max: number }[] = [];

      for (let i = min; i < max; i += binSize) {
        const binMin = i;
        const binMax = i + binSize;
        const count = values.filter(v => v >= binMin && v < binMax).length;
        bins.push({
          range: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
          count,
          min: binMin,
          max: binMax,
        });
      }

      return bins;
    };

    return {
      ipcGeneral: createHistogram(predictions.map(p => p.ipcGeneral)),
      ipcBienes: createHistogram(predictions.map(p => p.ipcBienes)),
      ipcServicios: createHistogram(predictions.map(p => p.ipcServicios)),
      ipcAlimentos: createHistogram(predictions.map(p => p.ipcAlimentos)),
    };
  }
}