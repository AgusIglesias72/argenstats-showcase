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
    const user = await currentUser();   
    const userId = user?.id || null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = PredictionSchema.parse(body);

    // Obtener email del usuario desde Clerk
    const userData = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }).then(res => res.json());

        const userEmail = userData.emailAddresses[0]?.emailAddress || '';

    const prediction = await EventsService.createPrediction(
      validatedData.eventId,
      userId,
      userEmail,
      {
        ipcGeneral: validatedData.ipcGeneral,
        ipcBienes: validatedData.ipcBienes,
        ipcServicios: validatedData.ipcServicios,
        ipcAlimentos: validatedData.ipcAlimentos,
      }
    );

    return NextResponse.json({ success: true, prediction });
  } catch (error: any) {
    console.error('Error creating prediction:', error);
    
    if (error.message.includes('El evento no está activo')) {
      return NextResponse.json(
        { error: 'El evento no está activo' },
        { status: 400 }
      );
    }
    
    if (error.message.includes('El período de predicciones ha finalizado')) {
      return NextResponse.json(
        { error: 'El período de predicciones ha finalizado' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error al crear la predicción' },
      { status: 500 }
    );
  }
}

