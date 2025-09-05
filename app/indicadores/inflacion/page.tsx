// app/indicadores/inflacion/page.tsx
import { Metadata } from 'next'
import { IPCClient } from '@/components/indicators/ipc/IPCClient'
import { ipcService } from '@/lib/services/ipc.service'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: 'IPC - Índice de Precios al Consumidor | ArgentinaDatos',
  description: 'Seguimiento de la evolución de precios por regiones y rubros del Índice de Precios al Consumidor (IPC) de Argentina',
}

async function getIPCData() {
  try {
    // Obtener datos actuales
    const current = await ipcService.getCurrentIPC('GENERAL', 'Nacional')
    
    // Obtener componentes para la tabla de rubros
    const components = await ipcService.getIPCComponents(null, 'Nacional')

    // Obtener datos históricos para el gráfico (último año)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const historical = await ipcService.getHistoricalIPC({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      componentCode: 'GENERAL',
      region: 'Nacional',
      interval: 'monthly'
    })

    return {
      current,
      components,
      historical
    }
  } catch (error) {
    console.error('Error fetching IPC data:', error)
    return {
      current: null,
      components: [],
      historical: []
    }
  }
}

export default async function IPCPage() {
  const data = await getIPCData()

  return (
    <>
      <Header />
      <IPCClient initialData={data} />
    </>
  )
}