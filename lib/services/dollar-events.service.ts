// lib/services/dollar-events.service.ts

import { prisma } from '@/lib/db/prisma';
import { DollarPrediction, DollarPredictionInput, DollarEventStatistics } from '@/lib/types/events';

export class DollarEventsService {
  
  // Crear o actualizar una predicción del dólar
  static async upsertPrediction(
    eventId: string,
    userId: string,
    userEmail: string,
    prediction: DollarPredictionInput
  ): Promise<DollarPrediction> {
    // Verificar que el evento existe y es del tipo correcto
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new Error('Evento no encontrado');
    }

    if (event.eventType !== 'DOLLAR_PREDICTION') {
      throw new Error('Este evento no es de tipo predicción del dólar');
    }

    if (event.status !== 'ACTIVE') {
      throw new Error('El evento no está activo');
    }

    // Verificar si se puede editar (si ya existe)
    const now = new Date();
    if (event.submissionDeadline < now) {
      throw new Error('El período de predicciones ha finalizado');
    }

    // Verificar si existe una predicción previa
    const existingPrediction = await prisma.dollarPrediction.findUnique({
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
      return await prisma.dollarPrediction.update({
        where: { id: existingPrediction.id },
        data: {
          dollarValue: prediction.dollarValue,
          isPublic: prediction.isPublic ?? existingPrediction.isPublic,
          editCount: { increment: 1 },
          lastEditedAt: now,
        },
      });
    } else {
      // Crear nueva predicción
      const newPrediction = await prisma.dollarPrediction.create({
        data: {
          eventId,
          userId,
          userEmail,
          dollarValue: prediction.dollarValue,
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

  // Cambiar visibilidad de una predicción
  static async togglePredictionVisibility(
    predictionId: string,
    userId: string
  ): Promise<DollarPrediction> {
    const prediction = await prisma.dollarPrediction.findUnique({
      where: { id: predictionId },
    });

    if (!prediction) {
      throw new Error('Predicción no encontrada');
    }

    if (prediction.userId !== userId) {
      throw new Error('No tienes permisos para modificar esta predicción');
    }

    return await prisma.dollarPrediction.update({
      where: { id: predictionId },
      data: {
        isPublic: !prediction.isPublic,
      },
    });
  }

  // Obtener predicciones públicas de un evento
  static async getPublicPredictions(eventId: string) {
    return await prisma.dollarPrediction.findMany({
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
        { dollarValue: 'asc' },
        { updatedAt: 'asc' }, // Para desempate
      ],
    });
  }

  // Obtener todas las predicciones (para admin)
  static async getAllPredictions(eventId: string) {
    return await prisma.dollarPrediction.findMany({
      where: { eventId },
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
        { dollarValue: 'asc' },
        { updatedAt: 'asc' },
      ],
    });
  }

  // Calcular estadísticas del evento
  static async getEventStatistics(eventId: string): Promise<DollarEventStatistics> {
    const predictions = await prisma.dollarPrediction.findMany({
      where: { eventId },
      select: {
        dollarValue: true,
        isPublic: true,
      },
    });

    if (predictions.length === 0) {
      return {
        totalParticipants: 0,
        publicPredictions: 0,
        averagePrediction: 0,
        medianPrediction: 0,
        minPrediction: 0,
        maxPrediction: 0,
        standardDeviation: 0,
      };
    }

    const values = predictions.map(p => p.dollarValue);
    const publicCount = predictions.filter(p => p.isPublic).length;
    
    // Ordenar para calcular mediana
    values.sort((a, b) => a - b);
    
    // Calcular estadísticas
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];
    
    // Calcular desviación estándar
    const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      totalParticipants: predictions.length,
      publicPredictions: publicCount,
      averagePrediction: Math.round(average * 100) / 100,
      medianPrediction: Math.round(median * 100) / 100,
      minPrediction: Math.min(...values),
      maxPrediction: Math.max(...values),
      standardDeviation: Math.round(stdDev * 100) / 100,
    };
  }

  // Calcular rankings cuando se publican los resultados oficiales
  static async calculateRankings(eventId: string, officialValue: number) {
    const predictions = await prisma.dollarPrediction.findMany({
      where: { eventId },
      orderBy: { updatedAt: 'asc' }, // Para desempate por tiempo de última actualización
    });

    // Calcular desviación y ordenar por cercanía al valor oficial
    const rankedPredictions = predictions.map(pred => ({
      ...pred,
      deviation: Math.abs(pred.dollarValue - officialValue),
    }));

    // Ordenar por:
    // 1. Menor desviación (más cercano al valor oficial)
    // 2. Tiempo de última actualización (más antiguo gana)
    rankedPredictions.sort((a, b) => {
      if (a.deviation !== b.deviation) {
        return a.deviation - b.deviation;
      }
      // Si tienen la misma desviación, gana quien actualizó antes
      return a.updatedAt.getTime() - b.updatedAt.getTime();
    });

    // Actualizar rankings en la base de datos
    const updatePromises = rankedPredictions.map((pred, index) => {
      const rank = index + 1;
      const isWinner = rank === 1;

      return prisma.dollarPrediction.update({
        where: { id: pred.id },
        data: {
          deviation: pred.deviation,
          rank,
          isWinner,
        },
      });
    });

    await Promise.all(updatePromises);

    // Actualizar el evento con el ganador y valor oficial
    const winner = rankedPredictions[0];
    await prisma.event.update({
      where: { id: eventId },
      data: {
        officialDollarValue: officialValue,
        winnerId: winner.userId,
        status: 'COMPLETED',
        resultsPublishedAt: new Date(),
      },
    });

    return rankedPredictions;
  }

  // Obtener distribución de predicciones para histograma
  static async getPredictionDistribution(eventId: string, binSize = 10) {
    const predictions = await prisma.dollarPrediction.findMany({
      where: { eventId },
      select: { dollarValue: true },
    });

    if (predictions.length === 0) {
      return [];
    }

    const values = predictions.map(p => p.dollarValue);
    const min = Math.floor(Math.min(...values) / binSize) * binSize;
    const max = Math.ceil(Math.max(...values) / binSize) * binSize;
    
    const bins: { range: string; count: number; min: number; max: number }[] = [];

    for (let i = min; i <= max; i += binSize) {
      const binMin = i;
      const binMax = i + binSize;
      const count = values.filter(v => v >= binMin && v < binMax).length;
      
      if (count > 0) {
        bins.push({
          range: `$${binMin}-$${binMax}`,
          count,
          min: binMin,
          max: binMax,
        });
      }
    }

    return bins;
  }
}