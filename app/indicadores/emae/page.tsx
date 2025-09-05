// app/indicadores/emae/page.tsx
import { Metadata } from 'next'
import { EmaeClient } from '@/components/indicators/emae/EmaeClient'
import { emaeService } from '@/lib/services/emae.service'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: 'EMAE - Estimador Mensual de Actividad Económica | ArgentinaDatos',
  description: 'Seguimiento de la evolución de la actividad económica a nivel nacional por sectores',
}

async function getEmaeData() {
  try {
    // Obtener datos actuales
    const current = await emaeService.getCurrentEmae('GENERAL')
    
    // Obtener sectores para la tabla
    const sectors = await emaeService.getEmaeSectors()

    // Obtener datos históricos para el gráfico (último año)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const historical = await emaeService.getHistoricalEmae({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      sectorCode: 'GENERAL',
      dataType: 'original'
    })

    // Obtener estadísticas
    const stats = await emaeService.getEmaeStats()

    return {
      current,
      sectors,
      historical,
      stats
    }
  } catch (error) {
    console.error('Error fetching EMAE data:', error)
    return {
      current: null,
      sectors: [],
      historical: [],
      stats: null
    }
  }
}

export default async function EmaePage() {
  const data = await getEmaeData()

  return (
    <>
      <Header />
      <EmaeClient initialData={data} />
    </>
  )
}