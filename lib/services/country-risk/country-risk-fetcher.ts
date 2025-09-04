// country-risk-fetcher.ts
import { getRowsInRange } from "../google-sheets";

const { SHEET_NAME, SPREADSHEET_ID } = process.env;

interface CountryRiskData {
  date: Date
  embiOfficial?: number | null
  embiEstimated?: number | null
  lastUpdate: Date
  sourceOfficial?: string | null
  sourceEstimated?: string | null
}

interface EstimatedDataPoint {
  timestamp: Date
  value: number
}

export class CountryRiskFetcher {
  
  async fetchAllData(): Promise<CountryRiskData[]> {
    console.info('📊 Iniciando fetcher de Riesgo País (EMBI)...')
    
    try {
      // Obtener ambos conjuntos de datos en paralelo
      const [estimatedData, officialData] = await Promise.all([
        this.fetchEstimatedIndexWithTimestamps(),
        this.fetchOfficialEmbi()
      ])
      
      // Combinar datos por fecha manteniendo el último valor de cada día
      const combinedData = this.combineDataByDateWithLastValue(estimatedData, officialData)
      
      console.info(`✅ Procesados ${combinedData.length} registros de Riesgo País`)
      
      return combinedData
      
    } catch (error) {
      console.error('❌ Error en fetchAllData:', error)
      throw error
    }
  }
  
  private async fetchEstimatedIndexWithTimestamps(): Promise<Map<string, EstimatedDataPoint[]>> {
    console.info('📈 Obteniendo índice estimado con timestamps (columnas A:B)...')
    
    try {
      if (!SHEET_NAME || !SPREADSHEET_ID) {
        throw new Error('SHEET_NAME o SPREADSHEET_ID no están definidos');
      }
      
      const range = `${SHEET_NAME}!A2:B`
      const rows = await getRowsInRange(SPREADSHEET_ID, range)
      
      // Agrupar por fecha, manteniendo todos los valores del día
      const dataByDate = new Map<string, EstimatedDataPoint[]>()
      
      for (const row of rows) {
        if (!row || row.length < 2) continue
        
        const [timestamp, value] = row
        if (!timestamp || !value) continue
        
        const date = this.parseEstimatedDate(timestamp)
        if (!date) continue
        
        const dateKey = this.getDateKey(date)
        const numericValue = parseFloat(value)
        
        if (!isNaN(numericValue)) {
          if (!dataByDate.has(dateKey)) {
            dataByDate.set(dateKey, [])
          }
          dataByDate.get(dateKey)!.push({
            timestamp: date,
            value: numericValue
          })
        }
      }
      
      // Ordenar cada día por timestamp para obtener el último valor
      for (const [dateKey, values] of dataByDate) {
        values.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      }
      
      console.info(`  ✅ ${dataByDate.size} fechas con índice estimado`)
      return dataByDate
      
    } catch (error) {
      console.error('Error obteniendo índice estimado:', error)
      return new Map()
    }
  }
  
  private async fetchOfficialEmbi(): Promise<Map<string, number>> {
    console.info('🏦 Obteniendo EMBI oficial (columnas R:S)...')
    
    try {
      if (!SHEET_NAME || !SPREADSHEET_ID) {
        throw new Error('SHEET_NAME o SPREADSHEET_ID no están definidos');
      }
      
      const range = `${SHEET_NAME}!R2:S`
      const rows = await getRowsInRange(SPREADSHEET_ID, range)
      
      const dataMap = new Map<string, number>()
      
      for (const row of rows) {
        if (!row || row.length < 2) continue
        
        const [fecha, indice] = row
        if (!fecha || !indice) continue
        
        const date = this.parseOfficialDate(fecha)
        if (!date) continue
        
        const dateKey = this.getDateKey(date)
        const numericValue = parseFloat(indice)
        
        if (!isNaN(numericValue)) {
          dataMap.set(dateKey, numericValue)
        }
      }
      
      console.info(`  ✅ ${dataMap.size} fechas con EMBI oficial`)
      return dataMap
      
    } catch (error) {
      console.error('Error obteniendo EMBI oficial:', error)
      return new Map()
    }
  }
  
  private combineDataByDateWithLastValue(
    estimatedMap: Map<string, EstimatedDataPoint[]>, 
    officialMap: Map<string, number>
  ): CountryRiskData[] {
    // Obtener todas las fechas únicas
    const allDates = new Set([...estimatedMap.keys(), ...officialMap.keys()])
    
    const combinedData: CountryRiskData[] = []
    const today = this.getDateKey(new Date())
    
    for (const dateKey of allDates) {
      const estimatedPoints = estimatedMap.get(dateKey)
      const official = officialMap.get(dateKey)
      
      // Para el día actual, usar el último valor disponible
      // Para días pasados, usar el último valor del día
      let estimatedValue: number | null = null
      let lastUpdateTime = new Date(dateKey)
      
      if (estimatedPoints && estimatedPoints.length > 0) {
        // Obtener el último punto del día
        const lastPoint = estimatedPoints[estimatedPoints.length - 1]
        estimatedValue = lastPoint.value
        
        // Si es hoy, usar el timestamp real del último valor
        if (dateKey === today) {
          lastUpdateTime = lastPoint.timestamp
        }
      }
      
      combinedData.push({
        date: new Date(dateKey),
        embiEstimated: estimatedValue,
        embiOfficial: official ?? null,
        lastUpdate: lastUpdateTime,
        sourceEstimated: estimatedValue ? 'ArgentStats Estimator' : null,
        sourceOfficial: official ? 'JP Morgan' : null
      })
    }
    
    // Ordenar por fecha
    combinedData.sort((a, b) => a.date.getTime() - b.date.getTime())
    
    return combinedData
  }
  
  // Método optimizado para obtener solo datos recientes
  async fetchTodayData(): Promise<CountryRiskData | null> {
    console.info('📊 Obteniendo datos de hoy...')
    
    const today = new Date()
    const todayKey = this.getDateKey(today)
    
    try {
      // Solo leer las últimas filas de cada columna para optimizar
      const [estimatedData, officialData] = await Promise.all([
        this.fetchLatestEstimatedValue(),
        this.fetchLatestOfficialValue()
      ])
      
      if (!estimatedData && !officialData) {
        return null
      }
      
      return {
        date: new Date(todayKey),
        embiEstimated: estimatedData?.value ?? null,
        embiOfficial: officialData ?? null,
        lastUpdate: estimatedData?.timestamp || new Date(),
        sourceEstimated: estimatedData ? 'ArgentStats Estimator' : null,
        sourceOfficial: officialData ? 'JP Morgan' : null
      }
      
    } catch (error) {
      console.error('Error obteniendo datos de hoy:', error)
      return null
    }
  }
  
  private async fetchLatestEstimatedValue(): Promise<{ timestamp: Date, value: number } | null> {
    try {
      // Leer solo las últimas 100 filas para optimizar
      const range = `${SHEET_NAME}!A2:B101`
      const rows = await getRowsInRange(SPREADSHEET_ID!, range)
      
      let latestData: { timestamp: Date, value: number } | null = null
      
      for (const row of rows) {
        if (!row || row.length < 2) continue
        
        const [timestamp, value] = row
        if (!timestamp || !value) continue
        
        const date = this.parseEstimatedDate(timestamp)
        if (!date) continue
        
        const numericValue = parseFloat(value)
        if (!isNaN(numericValue)) {
          if (!latestData || date > latestData.timestamp) {
            latestData = { timestamp: date, value: numericValue }
          }
        }
      }
      
      return latestData
    } catch (error) {
      console.error('Error obteniendo último valor estimado:', error)
      return null
    }
  }
  
  private async fetchLatestOfficialValue(): Promise<number | null> {
    try {
      const range = `${SHEET_NAME}!R2:S20`
      const rows = await getRowsInRange(SPREADSHEET_ID!, range)
      
      const today = this.getDateKey(new Date())
      
      for (const row of rows) {
        if (!row || row.length < 2) continue
        
        const [fecha, indice] = row
        if (!fecha || !indice) continue
        
        const date = this.parseOfficialDate(fecha)
        if (!date) continue
        
        if (this.getDateKey(date) === today) {
          const numericValue = parseFloat(indice)
          return !isNaN(numericValue) ? numericValue : null
        }
      }
      
      return null
    } catch (error) {
      console.error('Error obteniendo último valor oficial:', error)
      return null
    }
  }
  
  private parseEstimatedDate(timestamp: string): Date | null {
    try {
      // Formato: "12/7/2025 18:10:47" (día/mes/año hora:min:seg)
      const [datePart, timePart] = timestamp.split(' ')
      const [day, month, year] = datePart.split('/').map(Number)
      
      if (!day || !month || !year) return null
      
      if (timePart) {
        const [hour, minute, second] = timePart.split(':').map(Number)
        return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0)
      }
      
      return new Date(year, month - 1, day)
    } catch {
      return null
    }
  }
  
  private parseOfficialDate(dateStr: string): Date | null {
    try {
      const [day, month, year] = dateStr.split('/').map(Number)
      if (!day || !month || !year) return null
      return new Date(year, month - 1, day)
    } catch {
      return null
    }
  }
  
  private getDateKey(date: Date): string {
    // Formato YYYY-MM-DD local (no UTC para mantener consistencia con los datos)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  async fetchLatestData(fromDate?: Date): Promise<CountryRiskData[]> {
    console.info('📊 Obteniendo últimos datos de Riesgo País...')
    
    const allData = await this.fetchAllData()
    
    if (!fromDate) {
      fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - 30)
    }
    
    const filteredData = allData.filter(d => d.date >= fromDate)
    
    console.info(`✅ ${filteredData.length} registros desde ${fromDate.toISOString().split('T')[0]}`)
    
    return filteredData
  }
}