// components/admin/tabs/EventsTab.tsx

'use client'

import { useState, useEffect, useCallback } from 'react'
import EventsAdminPanel from '@/components/admin/tabs/EventsAdminPanel'

export default function EventsTab() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (response.status === 403) {
        console.error('No tienes permisos para ver los eventos')
        setEvents([])
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      } else {
        console.error('Error fetching events:', response.status)
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleEventUpdate = () => {
    // Refrescar la lista de eventos después de cualquier cambio
    fetchEvents()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

    return <EventsAdminPanel events={events} onEventUpdate={handleEventUpdate} />
}