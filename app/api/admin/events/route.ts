// app/api/admin/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { currentUser } from '@clerk/nextjs/server';

const CreateEventSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  eventDate: z.string().transform(str => new Date(str)),
  submissionDeadline: z.string().transform(str => new Date(str)),
  prizeAmount: z.string().transform(Number),
  prizeCurrency: z.string().default('USD'),
});

export async function GET() {
  try {
    const user = await currentUser();
    const userId = user?.id || null;
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId || '' },
    });

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const events = await prisma.event.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        winner: true,
        _count: {
          select: {
            predictions: true,
          },
        },
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Error al obtener eventos' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id || null;
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId || '' },
    });

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = CreateEventSchema.parse(body);

    // Verificar que el slug no exista
    const existingEvent = await prisma.event.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingEvent) {
      return NextResponse.json(
        { error: 'Ya existe un evento con ese slug' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        ...validatedData,
        status: 'ACTIVE', // Por defecto activo
      },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Error al crear el evento' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id || null;
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea admin
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: userId || '' },
    });

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { eventId, status } = body;

    // Actualizar estado del evento
    const event = await prisma.event.update({
      where: { id: eventId },
      data: { status },
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el evento' },
      { status: 500 }
    );
  }
}