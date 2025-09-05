// app/actions/ipc.actions.ts
'use server'

import { ipcService } from '@/lib/services/ipc.service'
import { IPC_COMPONENTS, IPC_REGIONS } from '@/lib/api/constants/inflation'

interface GetIPCDataParams {
  component?: keyof typeof IPC_COMPONENTS
  region?: keyof typeof IPC_REGIONS
  chartPeriod?: number
  onlyHistorical?: boolean
}

export async function getIPCDataAction(params: GetIPCDataParams) {
  const {
    component = 'GENERAL',
    region = 'Nacional',
    chartPeriod = 12,
    onlyHistorical = false
  } = params

  try {
    // Si solo necesitamos datos históricos
    if (onlyHistorical) {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - chartPeriod)
      
      const historical = await ipcService.getHistoricalIPC({
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        componentCode: component,
        region: region,
        interval: 'monthly'
      })

      return {
        current: null,
        components: [],
        historical
      }
    }

    // Obtener todos los datos
    const [current, components, historical] = await Promise.all([
      // Datos actuales para el componente y región seleccionados
      ipcService.getCurrentIPC(component, region),
      
      // Componentes para la región seleccionada
      ipcService.getIPCComponents(null, region),
      
      // Datos históricos
      (async () => {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - chartPeriod)
        
        return ipcService.getHistoricalIPC({
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          componentCode: component,
          region: region,
          interval: 'monthly'
        })
      })()
    ])

    return {
      current,
      components,
      historical
    }
  } catch (error) {
    console.error('Error in getIPCDataAction:', error)
    throw new Error('Failed to fetch IPC data')
  }
}