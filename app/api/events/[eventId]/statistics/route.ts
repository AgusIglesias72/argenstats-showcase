
// app/api/events/[eventId]/statistics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { EventsService } from '@/lib/services/events.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const statistics = await EventsService.getEventStatistics(eventId);
    const distribution = await EventsService.getPredictionDistribution(eventId);

    return NextResponse.json({
      statistics,
      distribution,
    });
  } catch (error) {
    console.error('Error fetching event statistics:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}