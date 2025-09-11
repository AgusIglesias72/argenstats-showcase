// app/api/admin/events/[eventId]/export/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Resolver los parámetros
    const { eventId } = await params;
    
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Verificar que el usuario es admin
    const user = await prisma.userProfile.findUnique({
      where: { userId: userId },
    });

    if (!user || user.role !== 'admin') {
      return new NextResponse('Acceso denegado', { status: 403 });
    }

    // Obtener las predicciones del evento
    const predictions = await prisma.eventPrediction.findMany({
      where: { eventId: eventId },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            name: true,
          },
        },
        event: {
          select: {
            name: true,
            slug: true,
            eventDate: true,
            status: true,
            officialIpcGeneral: true,
            officialIpcBienes: true,
            officialIpcServicios: true,
            officialIpcAlimentos: true,
          },
        },
      },
      orderBy: [
        { rank: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Convertir a CSV
    const csvHeaders = [
      'Ranking',
      'Usuario ID',
      'Email',
      'Nombre',
      'Evento',
      'Estado Evento',
      'IPC General Predicho',
      'IPC Bienes Predicho',
      'IPC Servicios Predicho',
      'IPC Alimentos Predicho',
      'IPC General Oficial',
      'IPC Bienes Oficial',
      'IPC Servicios Oficial',
      'IPC Alimentos Oficial',
      'Desviación General',
      'Desviación Bienes',
      'Desviación Servicios',
      'Desviación Alimentos',
      'Desviación Total',
      'Aciertos Exactos',
      'Fecha Predicción',
      'Es Ganador',
    ];

    const csvRows = predictions.map((pred) => {
      const event = pred.event;
      const deviationGeneral = event.officialIpcGeneral 
        ? Math.abs(pred.ipcGeneral - event.officialIpcGeneral) 
        : null;
      const deviationBienes = event.officialIpcBienes 
        ? Math.abs(pred.ipcBienes - event.officialIpcBienes) 
        : null;
      const deviationServicios = event.officialIpcServicios 
        ? Math.abs(pred.ipcServicios - event.officialIpcServicios) 
        : null;
      const deviationAlimentos = event.officialIpcAlimentos 
        ? Math.abs(pred.ipcAlimentos - event.officialIpcAlimentos) 
        : null;

      return [
        pred.rank || '',
        pred.user.userId,
        pred.userEmail,
        pred.user.name || '',
        event.name,
        event.status,
        pred.ipcGeneral,
        pred.ipcBienes,
        pred.ipcServicios,
        pred.ipcAlimentos,
        event.officialIpcGeneral || '',
        event.officialIpcBienes || '',
        event.officialIpcServicios || '',
        event.officialIpcAlimentos || '',
        deviationGeneral?.toFixed(2) || '',
        deviationBienes?.toFixed(2) || '',
        deviationServicios?.toFixed(2) || '',
        deviationAlimentos?.toFixed(2) || '',
        pred.totalDeviation?.toFixed(2) || '',
        pred.exactMatchesCount || '',
        new Date(pred.createdAt).toISOString(),
        pred.isWinner ? 'Sí' : 'No',
      ];
    });

    // Construir el CSV
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(cell => {
          // Escapar comas y comillas en los valores
          const value = String(cell);
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      ),
    ].join('\n');

    // Agregar BOM para que Excel reconozca UTF-8
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Devolver el CSV
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="predicciones_${eventId}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error exportando predicciones:', error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}