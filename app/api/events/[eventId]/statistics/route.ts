
// app/api/events/[eventId]/statistics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { EventsService } from '@/lib/services/events.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const statistics = await EventsService.getEventStatistics(params.eventId);
    const distribution = await EventsService.getPredictionDistribution(params.eventId);

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