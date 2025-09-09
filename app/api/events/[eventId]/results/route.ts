
// app/api/admin/events/[eventId]/results/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { EventsService } from '@/lib/services/events.service';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const ResultsSchema = z.object({
  ipcGeneral: z.number(),
  ipcBienes: z.number(),
  ipcServicios: z.number(),
  ipcAlimentos: z.number(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const user = await currentUser();
    const userId = user?.id || null;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = ResultsSchema.parse(body);

    // Calcular rankings y actualizar evento
    const rankings = await EventsService.calculateRankings(
      eventId,
      validatedData
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Resultados publicados exitosamente',
      rankings: rankings.slice(0, 10), // Retornar top 10
    });
  } catch (error) {
    console.error('Error publishing results:', error);
    return NextResponse.json(
      { error: 'Error al publicar resultados' },
      { status: 500 }
    );
  }
}