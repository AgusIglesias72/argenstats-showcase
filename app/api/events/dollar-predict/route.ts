// app/api/events/dollar-predict/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { DollarEventsService } from '@/lib/services/dollar-events.service';
import { z } from 'zod';

const DollarPredictionSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
  dollarValue: z.number().min(1).max(10000), // Limites razonables
  isPublic: z.boolean().optional(),
});

const ToggleVisibilitySchema = z.object({
  predictionId: z.string(),
});

// POST - Crear o actualizar predicción
export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = DollarPredictionSchema.parse(body);

    // Verificar que el userId del request coincida con el usuario autenticado
    if (validatedData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 403 }
      );
    }

    // Crear o actualizar la predicción
    const prediction = await DollarEventsService.upsertPrediction(
      validatedData.eventId,
      validatedData.userId,
      validatedData.userEmail,
      {
        dollarValue: validatedData.dollarValue,
        isPublic: validatedData.isPublic,
      }
    );

    return NextResponse.json({ 
      success: true,
      prediction,
      message: prediction.editCount > 0 
        ? 'Predicción actualizada exitosamente' 
        : 'Predicción creada exitosamente'
    });
    
  } catch (error: any) {
    console.error('Error handling dollar prediction:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    // Errores específicos del servicio
    const errorMessages: Record<string, number> = {
      'Evento no encontrado': 404,
      'Este evento no es de tipo predicción del dólar': 400,
      'El evento no está activo': 400,
      'El período de predicciones ha finalizado': 400,
      'Este evento no permite editar predicciones': 400,
      'El período de edición ha finalizado': 400,
    };

    const statusCode = errorMessages[error.message] || 500;
    
    return NextResponse.json(
      { error: error.message || 'Error al procesar la predicción' },
      { status: statusCode }
    );
  }
}

// PATCH - Cambiar visibilidad de predicción
export async function PATCH(req: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { predictionId } = ToggleVisibilitySchema.parse(body);

    const prediction = await DollarEventsService.togglePredictionVisibility(
      predictionId,
      user.id
    );

    return NextResponse.json({
      success: true,
      prediction,
      message: prediction.isPublic 
        ? 'Tu predicción ahora es pública' 
        : 'Tu predicción ahora es privada'
    });
    
  } catch (error: any) {
    console.error('Error toggling prediction visibility:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      );
    }
    
    if (error.message === 'Predicción no encontrada') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    if (error.message === 'No tienes permisos para modificar esta predicción') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al cambiar la visibilidad' },
      { status: 500 }
    );
  }
}

// GET - Obtener predicciones públicas de un evento
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'EventId es requerido' },
        { status: 400 }
      );
    }

    const predictions = await DollarEventsService.getPublicPredictions(eventId);
    const statistics = await DollarEventsService.getEventStatistics(eventId);

    return NextResponse.json({
      success: true,
      predictions,
      statistics,
    });
    
  } catch (error) {
    console.error('Error fetching predictions:', error);
    
    return NextResponse.json(
      { error: 'Error al obtener las predicciones' },
      { status: 500 }
    );
  }
}