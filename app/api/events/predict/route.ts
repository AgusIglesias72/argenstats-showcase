// app/api/events/predict/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { EventsService } from '@/lib/services/events.service';
import { z } from 'zod';

const PredictionSchema = z.object({
  eventId: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
  ipcGeneral: z.string().transform(Number),
  ipcBienes: z.string().transform(Number),
  ipcServicios: z.string().transform(Number),
  ipcAlimentos: z.string().transform(Number),
});

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación básica
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Validar los datos del body
    const body = await req.json();
    console.log('Body recibido:', body);
    
    const validatedData = PredictionSchema.parse(body);
    console.log('Datos validados:', validatedData);

    // Verificar que el userId del request coincida con el usuario autenticado
    if (validatedData.userId !== user.id) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 403 }
      );
    }

    // Crear la predicción
    const prediction = await EventsService.createPrediction(
      validatedData.eventId,
      validatedData.userId,
      validatedData.userEmail,
      {
        ipcGeneral: validatedData.ipcGeneral,
        ipcBienes: validatedData.ipcBienes,
        ipcServicios: validatedData.ipcServicios,
        ipcAlimentos: validatedData.ipcAlimentos,
      }
    );

    return NextResponse.json({ 
      success: true,
      prediction,
      message: 'Predicción creada exitosamente'
    });
    
  } catch (error: any) {
    console.error('Error creating prediction:', error);
    
    // Si es un error de validación de Zod
    if (error instanceof z.ZodError) {
      console.error('Error de validación:', error.issues);
      return NextResponse.json(
        { 
          error: 'Datos inválidos en el formulario',
          details: error.issues 
        },
        { status: 400 }
      );
    }
    
    // Errores específicos del servicio
    if (error.message?.includes('El evento no está activo')) {
      return NextResponse.json(
        { error: 'El evento no está activo' },
        { status: 400 }
      );
    }
    
    if (error.message?.includes('El período de predicciones ha finalizado')) {
      return NextResponse.json(
        { error: 'El período de predicciones ha finalizado' },
        { status: 400 }
      );
    }

    if (error.message?.includes('Ya has realizado una predicción')) {
      return NextResponse.json(
        { error: 'Ya has realizado una predicción para este evento' },
        { status: 400 }
      );
    }

    // Error genérico
    return NextResponse.json(
      { 
        error: 'Error al crear la predicción',
        message: error.message 
      },
      { status: 500 }
    );
  }
}