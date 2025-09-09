// app/api/events/predict/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { EventsService } from '@/lib/services/events.service';
import { z } from 'zod';

const PredictionSchema = z.object({
  eventId: z.string(),
  ipcGeneral: z.string().transform(Number),
  ipcBienes: z.string().transform(Number),
  ipcServicios: z.string().transform(Number),
  ipcAlimentos: z.string().transform(Number),
});

export async function POST(req: NextRequest) {
  try {
    // Obtener el usuario actual de Clerk
    const user = await currentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Validar los datos del body
    const body = await req.json();
    console.log('Body recibido:', body); // Debug
    
    const validatedData = PredictionSchema.parse(body);
    console.log('Datos validados:', validatedData); // Debug

    // Obtener el email directamente del objeto user de Clerk
    // currentUser() ya incluye toda la información del usuario
    console.log(user)
    const userEmail = user.emailAddresses?.[0]?.emailAddress || 
                     user.primaryEmailAddress?.emailAddress || 
                     '';
    
    console.log('Usuario:', {
      id: user.id,
      email: userEmail,
      emailAddresses: user.emailAddresses
    }); // Debug

    // Si no hay email, usar un valor por defecto o lanzar error
    if (!userEmail) {
      console.warn('No se encontró email para el usuario:', user.id);
      // Podrías decidir si esto es crítico o no
      // return NextResponse.json(
      //   { error: 'No se pudo obtener el email del usuario' },
      //   { status: 400 }
      // );
    }

    // Crear la predicción
    const prediction = await EventsService.createPrediction(
      validatedData.eventId,
      user.id,
      userEmail || 'email_no_disponible', // Fallback si decides continuar sin email
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