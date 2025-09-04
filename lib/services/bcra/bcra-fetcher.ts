import axios from 'axios'
import https from 'https'

// Variables que queremos trackear
const TRACKED_VARIABLES = [
  { id: 1, name: 'Reservas Internacionales' },
  { id: 29, name: 'Expectativas de Inflación REM 12m' },
  { id: 30, name: 'CER' },
  { id: 31, name: 'UVA' }
]

interface BcraApiResponse<T> {
  status: number
  metadata: {
    resultset: {
      count: number
      offset: number
      limit: number
    }
  }
  results: T[]
}

interface BcraVariableMetadata {
  idVariable: number
  descripcion: string
  categoria: string
  tipoSerie: string
  periodicidad: string
  unidadExpresion: string
  moneda: string
  primerFechaInformada: string
  ultFechaInformada: string
  ultValorInformado: number
}

interface BcraDataPoint {
  fecha: string
  valor: number
}

interface BcraHistoricalData {
  idVariable: number
  detalle: BcraDataPoint[]
}

export class BcraFetcher {
  private baseUrl = 'https://api.bcra.gob.ar/estadisticas/v4.0'
  private httpsAgent: https.Agent
  private pageSize = 1000 // Límite por página de la API

  constructor() {
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    })
  }

  async fetchAllVariables() {
    console.info('🏦 Iniciando actualización de variables BCRA...')
    
    const results = {
      variables: [] as any[],
      data: [] as any[]
    }
    
    // Primero obtener todas las metadata con paginación
    const allMetadata = await this.fetchAllVariableMetadata()
    console.info(`📊 Obtenidas ${allMetadata.length} variables totales del BCRA`)
    
    for (const trackedVar of TRACKED_VARIABLES) {
      try {
        console.info(`📊 Procesando variable ${trackedVar.id}: ${trackedVar.name}`)
        
        // 1. Buscar metadata de la variable específica
        const metadata = allMetadata.find(v => v.idVariable === trackedVar.id)
        
        if (!metadata) {
          console.warn(`⚠️ No se encontró metadata para variable ${trackedVar.id}`)
          continue
        }
        
        // 2. Obtener datos históricos con paginación
        const historicalData = await this.fetchHistoricalDataWithPagination(trackedVar.id)
        
        if (!historicalData || historicalData.length === 0) {
          console.warn(`⚠️ No se encontraron datos históricos para variable ${trackedVar.id}`)
          continue
        }
        
        // 3. Preparar variable para la base de datos
        const variable = {
          variableId: trackedVar.id,
          variableName: trackedVar.name,
          description: metadata.descripcion,
          category: metadata.categoria,
          seriesType: metadata.tipoSerie,
          periodicity: metadata.periodicidad,
          unitExpression: metadata.unidadExpresion,
          currency: metadata.moneda,
          firstDateInformed: metadata.primerFechaInformada ? new Date(metadata.primerFechaInformada) : null,
          lastDateInformed: metadata.ultFechaInformada ? new Date(metadata.ultFechaInformada) : null,
          lastValueInformed: metadata.ultValorInformado
        }
        
        results.variables.push(variable)
        
        // 4. Preparar datos históricos para la base de datos
        const dataPoints = historicalData.map(point => ({
          variableId: trackedVar.id,
          date: new Date(point.fecha),
          value: point.valor
        }))
        
        results.data.push(...dataPoints)
        
        console.info(`✅ Variable ${trackedVar.id}: ${dataPoints.length} puntos de datos`)
        
      } catch (error) {
        console.error(`❌ Error procesando variable ${trackedVar.id}:`, error)
      }
    }
    
    console.info(`📈 Total: ${results.variables.length} variables, ${results.data.length} puntos de datos`)
    return results
  }
  
  private async fetchAllVariableMetadata(): Promise<BcraVariableMetadata[]> {
    const allResults: BcraVariableMetadata[] = []
    let offset = 0
    let hasMore = true
    
    console.info('📥 Obteniendo metadata de todas las variables BCRA...')
    
    while (hasMore) {
      try {
        const response = await axios.get<BcraApiResponse<BcraVariableMetadata>>(
          `${this.baseUrl}/Monetarias`,
          {
            params: {
              limit: this.pageSize,
              offset: offset
            },
            timeout: 30000,
            headers: {
              'Accept': 'application/json',
            },
            httpsAgent: this.httpsAgent
          }
        )
        
        if (response.data && response.data.results) {
          allResults.push(...response.data.results)
          
          const metadata = response.data.metadata.resultset
          const totalReceived = offset + response.data.results.length
          
          console.info(`  Página ${Math.floor(offset / this.pageSize) + 1}: ${response.data.results.length} variables (${totalReceived}/${metadata.count})`)
          
          // Verificar si hay más páginas
          hasMore = totalReceived < metadata.count
          offset += this.pageSize
        } else {
          hasMore = false
        }
        
      } catch (error) {
        console.error(`Error obteniendo metadata en offset ${offset}:`, error)
        hasMore = false
      }
    }
    
    return allResults
  }
  
  private async fetchHistoricalDataWithPagination(variableId: number): Promise<BcraDataPoint[]> {
    const allDataPoints: BcraDataPoint[] = []
    let offset = 0
    let hasMore = true
    let totalExpected = 0
    
    console.info(`📥 Obteniendo datos históricos para variable ${variableId}...`)
    
    while (hasMore) {
      try {
        const response = await axios.get<BcraApiResponse<BcraHistoricalData>>(
          `${this.baseUrl}/Monetarias/${variableId}`,
          {
            params: {
              limit: this.pageSize,
              offset: offset
            },
            timeout: 60000,
            headers: {
              'Accept': 'application/json',
            },
            httpsAgent: this.httpsAgent
          }
        )
        
        if (response.data && response.data.results && response.data.results.length > 0) {
          // En la primera página, obtener el total esperado
          if (offset === 0) {
            totalExpected = response.data.metadata.resultset.count
            console.info(`  Total de registros esperados: ${totalExpected}`)
          }
          
          // Los datos históricos vienen en results[0].detalle
          const result = response.data.results[0]
          if (result.detalle && Array.isArray(result.detalle)) {
            allDataPoints.push(...result.detalle)
            
            const totalReceived = allDataPoints.length
            console.info(`  Página ${Math.floor(offset / this.pageSize) + 1}: ${result.detalle.length} datos (${totalReceived} acumulados)`)
            
            // Para datos históricos, el formato puede ser diferente
            // Si detalle contiene todos los datos, no necesitamos paginar más
            if (result.detalle.length < this.pageSize || totalReceived >= totalExpected) {
              hasMore = false
            } else {
              offset += this.pageSize
            }
          } else {
            hasMore = false
          }
        } else {
          hasMore = false
        }
        
      } catch (error) {
        console.error(`Error obteniendo datos históricos en offset ${offset}:`, error)
        hasMore = false
      }
    }
    
    return allDataPoints
  }
  
  async fetchLatestData(variableId: number, fromDate?: Date): Promise<BcraDataPoint[]> {
    try {
      console.info(`📊 Obteniendo últimos datos para variable ${variableId}`)
      
      // Obtener todos los datos con paginación
      const allData = await this.fetchHistoricalDataWithPagination(variableId)
      
      if (!fromDate) {
        // Si no hay fecha, devolver últimos 30 días
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        fromDate = thirtyDaysAgo
      }
      
      // Filtrar datos desde la fecha especificada
      const filteredData = allData.filter(point => {
        const pointDate = new Date(point.fecha)
        return fromDate ? pointDate >= fromDate : true
      })
      
      if (fromDate) {
        console.info(`✅ Variable ${variableId}: ${filteredData.length} datos nuevos desde ${fromDate.toISOString().split('T')[0]}`)
      } else {
        console.info(`✅ Variable ${variableId}: ${filteredData.length} datos totales`)
      }
      
      return filteredData
      
    } catch (error) {
      console.error(`Error obteniendo últimos datos para variable ${variableId}:`, error)
      return []
    }
  }
}