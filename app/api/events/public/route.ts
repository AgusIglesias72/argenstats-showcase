import { NextResponse } from 'next/server'
import { EventsService } from '@/lib/services/events.service'

export async function GET() {
  try {
    // Obtener eventos públicos
    const events = await EventsService.getPublicEvents()
    
    // Calcular estadísticas para cada evento
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const statistics = await EventsService.getEventStatistics(event.id)
        return { ...event, statistics }
      })
    )
    
    return NextResponse.json({ 
      events: eventsWithStats,
      success: true 
    })
  } catch (error) {
    console.error('Error fetching public events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events', success: false },
      { status: 500 }
    )
  }
}