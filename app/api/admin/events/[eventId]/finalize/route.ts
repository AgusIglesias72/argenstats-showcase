// app/api/admin/events/[eventId]/finalize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

interface FinalizeEventBody {
  officialIpcGeneral: number;
  officialIpcBienes: number;
  officialIpcServicios: number;
  officialIpcAlimentos: number;
}

interface PredictionWithScore {
  id: string;
  userId: string;
  userEmail: string;
  ipcGeneral: number;
  ipcBienes: number;
  ipcServicios: number;
  ipcAlimentos: number;
  createdAt: Date;
  // Campos calculados para ranking
  generalMatch: boolean;
  exactMatchesCount: number;
  totalDeviation: number;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verificar autenticación con Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar si es admin usando Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Await params antes de usarlo (Next.js 15)
    const { eventId } = await params;
    const body: FinalizeEventBody = await request.json();

    // Validar que todos los valores oficiales estén presentes
    if (
      body.officialIpcGeneral === undefined ||
      body.officialIpcBienes === undefined ||
      body.officialIpcServicios === undefined ||
      body.officialIpcAlimentos === undefined
    ) {
      return NextResponse.json(
        { error: 'Todos los valores oficiales son requeridos' },
        { status: 400 }
      );
    }

    // Obtener el evento para verificar su estado
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el evento esté en estado correcto para finalizar
    if (event.status !== 'SUBMISSION_CLOSED' && event.status !== 'AWAITING_RESULTS') {
      return NextResponse.json(
        { error: 'El evento no está en estado correcto para finalizar' },
        { status: 400 }
      );
    }

    // Si ya tiene resultados oficiales, no permitir cambios
    if (event.officialIpcGeneral !== null) {
      return NextResponse.json(
        { error: 'Este evento ya tiene resultados oficiales' },
        { status: 400 }
      );
    }

    // Obtener todas las predicciones del evento
    const predictions = await prisma.eventPrediction.findMany({
      where: { eventId: eventId },
    });

    // Comenzar transacción con timeout extendido
    const result = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el evento con los valores oficiales
      const updatedEvent = await tx.event.update({
        where: { id: eventId },
        data: {
          officialIpcGeneral: body.officialIpcGeneral,
          officialIpcBienes: body.officialIpcBienes,
          officialIpcServicios: body.officialIpcServicios,
          officialIpcAlimentos: body.officialIpcAlimentos,
          status: 'COMPLETED',
          resultsPublishedAt: new Date(),
        },
      });

      // 2. Calcular scores para cada predicción
      const predictionsWithScores: PredictionWithScore[] = predictions.map(prediction => {
        // Criterio 1: Verificar si acertó el IPC General EXACTO
        const generalMatch = prediction.ipcGeneral === body.officialIpcGeneral;
        
        // Criterio 2: Contar aciertos exactos
        let exactMatchesCount = 0;
        if (prediction.ipcGeneral === body.officialIpcGeneral) exactMatchesCount++;
        if (prediction.ipcBienes === body.officialIpcBienes) exactMatchesCount++;
        if (prediction.ipcServicios === body.officialIpcServicios) exactMatchesCount++;
        if (prediction.ipcAlimentos === body.officialIpcAlimentos) exactMatchesCount++;
        
        // Criterio 3: Calcular desviación total (suma de diferencias absolutas)
        const totalDeviation = 
          Math.abs(prediction.ipcGeneral - body.officialIpcGeneral) +
          Math.abs(prediction.ipcBienes - body.officialIpcBienes) +
          Math.abs(prediction.ipcServicios - body.officialIpcServicios) +
          Math.abs(prediction.ipcAlimentos - body.officialIpcAlimentos);
        
        return {
          ...prediction,
          generalMatch,
          exactMatchesCount,
          totalDeviation,
        };
      });

      // 3. Ordenar predicciones según los 4 criterios
      predictionsWithScores.sort((a, b) => {
        // Criterio 1: IPC General acertado EXACTO (los que acertaron van primero)
        if (a.generalMatch !== b.generalMatch) {
          return a.generalMatch ? -1 : 1;
        }
        
        // Criterio 2: Mayor número de aciertos exactos
        if (a.exactMatchesCount !== b.exactMatchesCount) {
          return b.exactMatchesCount - a.exactMatchesCount; // Mayor es mejor
        }
        
        // Criterio 3: Menor desviación total
        if (Math.abs(a.totalDeviation - b.totalDeviation) > 0.001) { // Tolerancia mínima para evitar problemas de precisión
          return a.totalDeviation - b.totalDeviation; // Menor es mejor
        }
        
        // Criterio 4: Fecha de carga más temprana
        return a.createdAt.getTime() - b.createdAt.getTime(); // Más antiguo es mejor
      });

      // 4. Actualizar cada predicción con su ranking y métricas
      // Procesar en lotes para evitar timeout
      const batchSize = 10;
      for (let i = 0; i < predictionsWithScores.length; i += batchSize) {
        const batch = predictionsWithScores.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map((prediction, batchIndex) => {
            const rank = i + batchIndex + 1; // El ranking empieza en 1
            const isWinner = rank === 1;
            
            return tx.eventPrediction.update({
              where: { id: prediction.id },
              data: {
                generalMatch: prediction.generalMatch,
                exactMatchesCount: prediction.exactMatchesCount,
                totalDeviation: prediction.totalDeviation,
                rank: rank,
                isWinner: isWinner,
              },
            });
          })
        );
      }

      // 5. Actualizar el evento con el ganador
      if (predictionsWithScores.length > 0) {
        const winner = predictionsWithScores[0];
        await tx.event.update({
          where: { id: eventId },
          data: {
            winnerId: winner.userId,
          },
        });
      }

      // 6. Opcionalmente, enviar notificaciones a los participantes
      // TODO: Implementar sistema de notificaciones

      return {
        event: updatedEvent,
        totalParticipants: predictionsWithScores.length,
        winnerId: predictionsWithScores[0]?.userId || null,
        topThree: predictionsWithScores.slice(0, 3).map(p => ({
          rank: predictionsWithScores.indexOf(p) + 1,
          userId: p.userId,
          userEmail: p.userEmail,
          generalMatch: p.generalMatch,
          exactMatchesCount: p.exactMatchesCount,
          totalDeviation: p.totalDeviation.toFixed(2),
        })),
      };
    }, {
      maxWait: 10000, // Espera máxima de 10 segundos para obtener una conexión
      timeout: 30000, // Timeout de 30 segundos para la transacción
    });

    return NextResponse.json({
      success: true,
      message: 'Evento finalizado exitosamente',
      data: {
        eventId: result.event.id,
        status: result.event.status,
        totalParticipants: result.totalParticipants,
        winnerId: result.winnerId,
        topThree: result.topThree,
        officialResults: {
          ipcGeneral: body.officialIpcGeneral,
          ipcBienes: body.officialIpcBienes,
          ipcServicios: body.officialIpcServicios,
          ipcAlimentos: body.officialIpcAlimentos,
        },
      },
    });

  } catch (error) {
    console.error('Error finalizando evento:', error);
    return NextResponse.json(
      { error: 'Error al finalizar el evento' },
      { status: 500 }
    );
  }
}

// Endpoint para obtener los resultados y ranking de un evento finalizado
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verificar autenticación con Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar si es admin usando Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const isAdmin = user.publicMetadata?.role === 'admin';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Await params antes de usarlo (Next.js 15)
    const { eventId } = await params;

    // Obtener el evento con sus predicciones ordenadas por ranking
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        predictions: {
          orderBy: {
            rank: 'asc',
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
        },
        winner: {
          select: {
            userId: true,
            email: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    if (event.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'El evento aún no ha sido finalizado' },
        { status: 400 }
      );
    }

    // Calcular estadísticas adicionales
    const stats = {
      totalParticipants: event.predictions.length,
      perfectPredictions: event.predictions.filter(p => p.exactMatchesCount === 4).length,
      generalMatches: event.predictions.filter(p => p.generalMatch).length,
      averageDeviation: event.predictions.reduce((sum, p) => sum + (p.totalDeviation || 0), 0) / event.predictions.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        event: {
          id: event.id,
          name: event.name,
          status: event.status,
          officialResults: {
            ipcGeneral: event.officialIpcGeneral,
            ipcBienes: event.officialIpcBienes,
            ipcServicios: event.officialIpcServicios,
            ipcAlimentos: event.officialIpcAlimentos,
          },
          resultsPublishedAt: event.resultsPublishedAt,
          prizeAmount: event.prizeAmount,
          prizeCurrency: event.prizeCurrency,
        },
        winner: event.winner,
        stats,
        rankings: event.predictions.map(p => ({
          rank: p.rank,
          userId: p.userId,
          userName: p.user.name,
          userEmail: p.user.email,
          userImage: p.user.imageUrl,
          predictions: {
            ipcGeneral: p.ipcGeneral,
            ipcBienes: p.ipcBienes,
            ipcServicios: p.ipcServicios,
            ipcAlimentos: p.ipcAlimentos,
          },
          results: {
            generalMatch: p.generalMatch,
            exactMatchesCount: p.exactMatchesCount,
            totalDeviation: p.totalDeviation,
            isWinner: p.isWinner,
          },
          deviations: {
            ipcGeneral: Math.abs(p.ipcGeneral - (event.officialIpcGeneral || 0)),
            ipcBienes: Math.abs(p.ipcBienes - (event.officialIpcBienes || 0)),
            ipcServicios: Math.abs(p.ipcServicios - (event.officialIpcServicios || 0)),
            ipcAlimentos: Math.abs(p.ipcAlimentos - (event.officialIpcAlimentos || 0)),
          },
          submittedAt: p.createdAt,
        })),
      },
    });

  } catch (error) {
    console.error('Error obteniendo resultados del evento:', error);
    return NextResponse.json(
      { error: 'Error al obtener los resultados' },
      { status: 500 }
    );
  }
}