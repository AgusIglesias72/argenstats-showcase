import * as XLSX from 'xlsx'
import axios from 'axios'

interface PeriodMapping {
  colIndex: number
  year: string
  quarter: string
  period: string
  date: string
}

interface LaborMarketData {
  date: Date
  period: string
  dataType: string
  region: string
  gender: string | null
  ageGroup: string | null
  demographicSegment: string | null
  activityRate: number | null
  employmentRate: number | null
  unemploymentRate: number | null
  totalPopulation: number | null
  economicallyActivePopulation: number | null
  employedPopulation: number | null
  unemployedPopulation: number | null
  inactivePopulation: number | null
  sourceFile: string | null
}

export class LaborMarketFetcher {
  
  async fetchLaborMarketData(): Promise<LaborMarketData[]> {
    try {
      console.info('🚀 Iniciando fetcher híbrido de mercado laboral...')
      
      const allData: LaborMarketData[] = []
      
      // 1. Datos nacionales y demográficos
      console.info('📊 Obteniendo datos nacionales y demográficos...')
      const nationalAndDemoData = await this.fetchNationalAndDemographicData()
      allData.push(...nationalAndDemoData)
      
      // 2. Datos regionales
      console.info('🗺️ Obteniendo datos regionales...')
      const regionalData = await this.fetchRegionalData()
      allData.push(...regionalData)
      
      // 3. Combinar y deduplicar
      console.info('🔄 Combinando y deduplicando datos...')
      const combinedData = this.combineAndDeduplicateTotals(allData)
      
      // Filtrar registros válidos
      const validData = combinedData.filter(record => 
        record.date && 
        record.period && 
        record.region &&
        record.dataType &&
        (record.unemploymentRate !== null || 
         record.activityRate !== null || 
         record.employmentRate !== null)
      )
      
      console.info(`✅ Registros válidos: ${validData.length}`)
      return validData
      
    } catch (error) {
      console.error('❌ Error en fetchLaborMarketData:', error)
      throw error
    }
  }
  
  private generateNationalDataUrls(): string[] {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const publicationMonths = [3, 6, 9, 12]
    const urls: string[] = []
    
    // Determinar qué trimestre estaría disponible
    let latestAvailableIndex = -1
    for (let i = publicationMonths.length - 1; i >= 0; i--) {
      if (publicationMonths[i] <= currentMonth) {
        latestAvailableIndex = i
        break
      }
    }
    
    const availableMonths: Array<{month: number, year: number}> = []
    
    if (latestAvailableIndex === -1) {
      latestAvailableIndex = publicationMonths.length - 1
      availableMonths.push({
        month: publicationMonths[latestAvailableIndex],
        year: currentYear - 1
      })
    } else {
      availableMonths.push({
        month: publicationMonths[latestAvailableIndex],
        year: currentYear
      })
    }
    
    // Generar los siguientes 5 meses hacia atrás
    let workingYear = availableMonths[0].year
    let workingIndex = latestAvailableIndex === -1 ? publicationMonths.length - 1 : latestAvailableIndex
    
    for (let i = 1; i < 6; i++) {
      workingIndex--
      if (workingIndex < 0) {
        workingIndex = publicationMonths.length - 1
        workingYear--
      }
      
      availableMonths.push({
        month: publicationMonths[workingIndex],
        year: workingYear
      })
    }
    
    // Construir URLs
    availableMonths.forEach(({month, year}) => {
      const monthStr = String(month).padStart(2, '0')
      const yearStr = String(year).slice(-2)
      const url = `https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_tasas_indicadores_eph_${monthStr}_${yearStr}.xls`
      urls.push(url)
    })
    
    console.info(`🗓️ URLs generadas para datos nacionales: ${urls.length} opciones`)
    return urls
  }
  
  private generateRegionalDataUrls(): string[] {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const publicationMonths = [3, 6, 9, 12]
    const urls: string[] = []
    
    let latestAvailableIndex = -1
    for (let i = publicationMonths.length - 1; i >= 0; i--) {
      if (publicationMonths[i] <= currentMonth) {
        latestAvailableIndex = i
        break
      }
    }
    
    const availableMonths: Array<{month: number, year: number}> = []
    
    if (latestAvailableIndex === -1) {
      latestAvailableIndex = publicationMonths.length - 1
      availableMonths.push({
        month: publicationMonths[latestAvailableIndex],
        year: currentYear - 1
      })
    } else {
      availableMonths.push({
        month: publicationMonths[latestAvailableIndex],
        year: currentYear
      })
    }
    
    let workingYear = availableMonths[0].year
    let workingIndex = latestAvailableIndex === -1 ? publicationMonths.length - 1 : latestAvailableIndex
    
    for (let i = 1; i < 6; i++) {
      workingIndex--
      if (workingIndex < 0) {
        workingIndex = publicationMonths.length - 1
        workingYear--
      }
      
      availableMonths.push({
        month: publicationMonths[workingIndex],
        year: workingYear
      })
    }
    
    availableMonths.forEach(({month, year}) => {
      const monthStr = String(month).padStart(2, '0')
      const yearStr = String(year).slice(-2)
      const url = `https://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_eph_informe_${monthStr}_${yearStr}.xls`
      urls.push(url)
    })
    
    console.info(`🗓️ URLs generadas para datos regionales: ${urls.length} opciones`)
    return urls
  }
  
  private async downloadWorkbook(urls: string[], description: string): Promise<XLSX.WorkBook> {
    console.info(`📥 Intentando descargar ${description} desde ${urls.length} URLs posibles...`)
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        console.info(`📥 Intento ${i + 1}/${urls.length} - Descargando desde: ${url}`)
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000
        })
        
        const workbook = XLSX.read(response.data, {
          cellStyles: false,
          cellDates: true,
          sheetStubs: false
        })
        
        console.info(`✅ Descarga exitosa desde: ${url}`)
        return workbook
        
      } catch (error) {
        console.warn(`⚠️ Intento ${i + 1} falló: ${(error as Error).message}`)
        if (i < urls.length - 1) {
          console.info(`🔄 Intentando con la siguiente URL...`)
        }
        continue
      }
    }
    
    throw new Error(`❌ No se pudo descargar ${description} desde ninguna de las ${urls.length} URLs generadas`)
  }
  
  private async fetchNationalAndDemographicData(): Promise<LaborMarketData[]> {
    const nationalUrls = this.generateNationalDataUrls()
    const workbook = await this.downloadWorkbook(nationalUrls, 'tasas/indicadores')
    
    const data: LaborMarketData[] = []
    
    // Extraer períodos del Cuadro 1.1
    const nationalPeriods = this.extractNationalPeriods(workbook)
    console.info(`📅 Períodos totales encontrados: ${nationalPeriods.length}`)
    
    // 1. Datos totales (Cuadro 1.1)
    const nationalData = this.extractNationalData(workbook, nationalPeriods)
    data.push(...nationalData)
    console.info(`📊 Datos totales: ${nationalData.length} registros`)
    
    // 2. Datos demográficos (Cuadro 1.3)
    const demographicData = this.extractDemographicData(workbook)
    data.push(...demographicData)
    console.info(`👥 Datos demográficos: ${demographicData.length} registros`)
    
    return data
  }
  
  private async fetchRegionalData(): Promise<LaborMarketData[]> {
    const regionalUrls = this.generateRegionalDataUrls()
    const workbook = await this.downloadWorkbook(regionalUrls, 'informe regional')
    
    // Verificar cuadros necesarios
    const requiredSheets = ['Cuadro 1.6', 'Cuadro 1.7', 'Cuadro 1.8']
    const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet))
    if (missingSheets.length > 0) {
      throw new Error(`Cuadros faltantes: ${missingSheets.join(', ')}`)
    }
    
    // Extraer períodos y regiones
    const periods = this.extractRegionalPeriods(workbook)
    const regions = this.extractTargetRegions(workbook)
    console.info(`📅 Períodos regionales: ${periods.length}, 🗺️ Regiones: ${regions.length}`)
    
    const data: LaborMarketData[] = []
    
    // Extraer datos de cada cuadro
    const activityData = this.extractRegionalIndicatorData(workbook, 'Cuadro 1.6', periods, regions, 'activityRate')
    const employmentData = this.extractRegionalIndicatorData(workbook, 'Cuadro 1.7', periods, regions, 'employmentRate')
    const unemploymentData = this.extractRegionalIndicatorData(workbook, 'Cuadro 1.8', periods, regions, 'unemploymentRate')
    
    // Combinar los 3 indicadores
    const combinedData = this.combineRegionalIndicators(activityData, employmentData, unemploymentData)
    data.push(...combinedData)
    
    console.info(`🗺️ Datos regionales: ${data.length} registros`)
    return data
  }
  
  private extractNationalPeriods(workbook: XLSX.WorkBook): PeriodMapping[] {
    const sheet = workbook.Sheets['Cuadro 1.1']
    if (!sheet) throw new Error('No se encontró Cuadro 1.1')
    
    const ref = sheet['!ref']
    if (!ref) throw new Error('No se encontró el rango de la hoja en Cuadro 1.1')
    const range = XLSX.utils.decode_range(ref)
    const periods: PeriodMapping[] = []
    
    for (let col = 3; col <= range.e.c; col++) {
      const yearCell = sheet[XLSX.utils.encode_cell({r: 3, c: col})]
      const quarterCell = sheet[XLSX.utils.encode_cell({r: 4, c: col})]
      
      const yearValue = yearCell ? (yearCell.v || yearCell.w || '') : ''
      const quarterValue = quarterCell ? (quarterCell.v || quarterCell.w || '') : ''
      
      if (quarterValue && quarterValue.toString().includes('trimestre')) {
        let year = ''
        
        if (yearValue && yearValue.toString().includes('Año')) {
          year = yearValue.toString().replace('Año ', '')
        } else {
          // Buscar año hacia atrás
          for (let prevCol = col - 1; prevCol >= 3; prevCol--) {
            const prevYearCell = sheet[XLSX.utils.encode_cell({r: 3, c: prevCol})]
            const prevYearValue = prevYearCell ? (prevYearCell.v || prevYearCell.w || '') : ''
            if (prevYearValue && prevYearValue.toString().includes('Año')) {
              year = prevYearValue.toString().replace('Año ', '')
              break
            }
          }
        }
        
        const quarterMatch = quarterValue.toString().match(/(\d+)[°º]/)
        const quarter = quarterMatch ? quarterMatch[1] : ''
        
        if (year && quarter) {
          const monthEnd = parseInt(quarter) * 3
          const dayEnd = monthEnd === 3 ? 31 : monthEnd === 6 ? 30 : monthEnd === 9 ? 30 : 31
          const date = `${year}-${String(monthEnd).padStart(2, '0')}-${String(dayEnd).padStart(2, '0')}`
          
          periods.push({
            colIndex: col,
            year,
            quarter,
            period: `T${quarter} ${year}`,
            date
          })
        }
      }
    }
    
    return periods
  }
  
  private extractNationalData(workbook: XLSX.WorkBook, periods: PeriodMapping[]): LaborMarketData[] {
    const sheet = workbook.Sheets['Cuadro 1.1']
    if (!sheet) {
      console.warn('No se encontró Cuadro 1.1')
      return []
    }
    
    const data: LaborMarketData[] = []
    
    const indicators = [
      { name: 'Actividad', row: 6, field: 'activityRate' as const },
      { name: 'Empleo', row: 7, field: 'employmentRate' as const },
      { name: 'Desocupación abierta', row: 8, field: 'unemploymentRate' as const }
    ]
    
    periods.forEach(period => {
      const record: LaborMarketData = {
        date: new Date(period.date),
        period: period.period,
        dataType: 'national',
        region: 'Total 31 aglomerados',
        gender: 'Total',
        ageGroup: 'Total',
        demographicSegment: 'Total',
        sourceFile: 'cuadros_tasas_indicadores_eph',
        activityRate: null,
        employmentRate: null,
        unemploymentRate: null,
        totalPopulation: null,
        economicallyActivePopulation: null,
        employedPopulation: null,
        unemployedPopulation: null,
        inactivePopulation: null
      }
      
      indicators.forEach(indicator => {
        const cell = sheet[XLSX.utils.encode_cell({r: indicator.row, c: period.colIndex})]
        const value = cell ? (cell.v || cell.w || '') : ''
        
        if (value && !isNaN(parseFloat(value.toString()))) {
          (record as any)[indicator.field] = parseFloat(value.toString())
        }
      })
      
      data.push(record)
    })
    
    return data
  }
  
  private extractDemographicPeriods(workbook: XLSX.WorkBook): PeriodMapping[] {
    const sheet = workbook.Sheets['Cuadro 1.3']
    if (!sheet) throw new Error('No se encontró Cuadro 1.3')
    
    const ref = sheet['!ref']
    if (!ref) throw new Error('No se encontró el rango de la hoja en Cuadro 1.3')
    const range = XLSX.utils.decode_range(ref)
    const periods: PeriodMapping[] = []
    
    // Buscar marcadores de año (formato "Año XXXX")
    const yearMarkers: Array<{col: number, year: number, originalText: string}> = []
    
    for (let col = 0; col <= range.e.c; col++) {
      const yearCell = sheet[XLSX.utils.encode_cell({r: 3, c: col})]
      const yearValue = yearCell ? (yearCell.v || yearCell.w || '') : ''
      
      if (yearValue && yearValue.toString().includes('Año')) {
        const yearMatch = yearValue.toString().match(/Año\s*(\d{4})/)
        if (yearMatch) {
          yearMarkers.push({
            col: col,
            year: parseInt(yearMatch[1]),
            originalText: yearValue.toString()
          })
        }
      }
    }
    
    // Extraer trimestres
    const quarterData: Array<{col: number, quarter: number, originalText: string}> = []
    
    for (let col = 0; col <= range.e.c; col++) {
      const quarterCell = sheet[XLSX.utils.encode_cell({r: 4, c: col})]
      const quarterValue = quarterCell ? (quarterCell.v || quarterCell.w || '') : ''
      
      if (quarterValue && quarterValue.toString().includes('trimestre')) {
        const quarterStr = quarterValue.toString()
        const quarterMatch = quarterStr.match(/(\d+)[°º]/)
        
        if (quarterMatch) {
          quarterData.push({
            col: col,
            quarter: parseInt(quarterMatch[1]),
            originalText: quarterStr
          })
        }
      }
    }
    
    // Mapear cada trimestre al año correcto
    quarterData.forEach((qData) => {
      const colIndex = qData.col
      const quarter = qData.quarter
      
      let assignedYear: number | null = null
      
      for (let i = yearMarkers.length - 1; i >= 0; i--) {
        if (yearMarkers[i].col <= colIndex) {
          assignedYear = yearMarkers[i].year
          
          const quartersBetween = quarterData.filter(q => 
            q.col >= yearMarkers[i].col && q.col <= colIndex
          ).length
          
          if (quartersBetween > 4) {
            const additionalYears = Math.floor((quartersBetween - 1) / 4)
            assignedYear += additionalYears
          }
          
          break
        }
      }
      
      if (assignedYear === null && yearMarkers.length > 0) {
        assignedYear = yearMarkers[0].year
      }
      
      if (assignedYear !== null) {
        const monthEnd = quarter * 3
        const dayEnd = monthEnd === 3 ? 31 : monthEnd === 6 ? 30 : monthEnd === 9 ? 30 : 31
        const date = `${assignedYear}-${String(monthEnd).padStart(2, '0')}-${String(dayEnd).padStart(2, '0')}`
        
        periods.push({
          colIndex: colIndex,
          year: assignedYear.toString(),
          quarter: quarter.toString(),
          period: `T${quarter} ${assignedYear}`,
          date: date
        })
      }
    })
    
    return periods
  }
  
  private extractDemographicData(workbook: XLSX.WorkBook): LaborMarketData[] {
    const sheet = workbook.Sheets['Cuadro 1.3']
    if (!sheet) {
      console.warn('No se encontró Cuadro 1.3')
      return []
    }
    
    const periods = this.extractDemographicPeriods(workbook)
    
    if (periods.length === 0) {
      console.warn('No se encontraron períodos válidos en Cuadro 1.3')
      return []
    }
    
    const data: LaborMarketData[] = []
    
    const demographicSegments = [
      // Actividad
      { row: 27, gender: 'Mujeres', ageGroup: 'Total', segment: 'Total', indicator: 'activityRate' },
      { row: 28, gender: 'Varones', ageGroup: 'Total', segment: 'Total', indicator: 'activityRate' },
      { row: 29, gender: 'Total', ageGroup: 'Total', segment: 'Jefes de hogar', indicator: 'activityRate' },
      { row: 30, gender: 'Mujeres', ageGroup: '14-29 años', segment: 'Total', indicator: 'activityRate' },
      { row: 31, gender: 'Mujeres', ageGroup: '30-64 años', segment: 'Total', indicator: 'activityRate' },
      { row: 32, gender: 'Varones', ageGroup: '14-29 años', segment: 'Total', indicator: 'activityRate' },
      { row: 33, gender: 'Varones', ageGroup: '30-64 años', segment: 'Total', indicator: 'activityRate' },
      
      // Empleo
      { row: 39, gender: 'Mujeres', ageGroup: 'Total', segment: 'Total', indicator: 'employmentRate' },
      { row: 40, gender: 'Varones', ageGroup: 'Total', segment: 'Total', indicator: 'employmentRate' },
      { row: 41, gender: 'Total', ageGroup: 'Total', segment: 'Jefes de hogar', indicator: 'employmentRate' },
      { row: 42, gender: 'Mujeres', ageGroup: '14-29 años', segment: 'Total', indicator: 'employmentRate' },
      { row: 43, gender: 'Mujeres', ageGroup: '30-64 años', segment: 'Total', indicator: 'employmentRate' },
      { row: 44, gender: 'Varones', ageGroup: '14-29 años', segment: 'Total', indicator: 'employmentRate' },
      { row: 45, gender: 'Varones', ageGroup: '30-64 años', segment: 'Total', indicator: 'employmentRate' },
      
      // Desocupación
      { row: 51, gender: 'Mujeres', ageGroup: 'Total', segment: 'Total', indicator: 'unemploymentRate' },
      { row: 52, gender: 'Varones', ageGroup: 'Total', segment: 'Total', indicator: 'unemploymentRate' },
      { row: 53, gender: 'Total', ageGroup: 'Total', segment: 'Jefes de hogar', indicator: 'unemploymentRate' },
      { row: 54, gender: 'Mujeres', ageGroup: '14-29 años', segment: 'Total', indicator: 'unemploymentRate' },
      { row: 55, gender: 'Mujeres', ageGroup: '30-64 años', segment: 'Total', indicator: 'unemploymentRate' },
      { row: 56, gender: 'Varones', ageGroup: '14-29 años', segment: 'Total', indicator: 'unemploymentRate' },
      { row: 57, gender: 'Varones', ageGroup: '30-64 años', segment: 'Total', indicator: 'unemploymentRate' }
    ]
    
    // Agrupar por combinación única
    const uniqueSegments = new Map<string, any>()
    
    demographicSegments.forEach(seg => {
      const key = `${seg.gender}-${seg.ageGroup}-${seg.segment}`
      if (!uniqueSegments.has(key)) {
        uniqueSegments.set(key, {
          gender: seg.gender,
          ageGroup: seg.ageGroup,
          segment: seg.segment,
          rows: {}
        })
      }
      uniqueSegments.get(key)!.rows[seg.indicator] = seg.row
    })
    
    // Crear registros
    periods.forEach(period => {
      uniqueSegments.forEach(segmentInfo => {
        const record: LaborMarketData = {
          date: new Date(period.date),
          period: period.period,
          dataType: 'demographic',
          region: 'Total 31 aglomerados',
          gender: segmentInfo.gender,
          ageGroup: segmentInfo.ageGroup,
          demographicSegment: segmentInfo.segment,
          sourceFile: 'cuadros_tasas_indicadores_eph',
          activityRate: null,
          employmentRate: null,
          unemploymentRate: null,
          totalPopulation: null,
          economicallyActivePopulation: null,
          employedPopulation: null,
          unemployedPopulation: null,
          inactivePopulation: null
        }
        
        Object.entries(segmentInfo.rows).forEach(([indicator, row]) => {
          const cell = sheet[XLSX.utils.encode_cell({r: row as number, c: period.colIndex})]
          const value = cell ? (cell.v || cell.w || '') : ''
          
          if (value && !isNaN(parseFloat(value.toString()))) {
            (record as any)[indicator] = parseFloat(value.toString())
          }
        })
        
        data.push(record)
      })
    })
    
    return data
  }
  
  private extractRegionalPeriods(workbook: XLSX.WorkBook): PeriodMapping[] {
    const sheet = workbook.Sheets['Cuadro 1.8']
    if (!sheet) throw new Error('No se encontró Cuadro 1.8')
    
    const ref = sheet['!ref']
    if (!ref) throw new Error('No se encontró el rango de la hoja en Cuadro 1.8')
    const range = XLSX.utils.decode_range(ref)
    const periods: PeriodMapping[] = []
    let currentYear = ''
    
    for (let col = 1; col <= range.e.c; col++) {
      const yearCell = sheet[XLSX.utils.encode_cell({r: 2, c: col})]
      const quarterCell = sheet[XLSX.utils.encode_cell({r: 4, c: col})]
      
      const yearValue = yearCell ? (yearCell.v || yearCell.w || '') : ''
      const quarterValue = quarterCell ? (quarterCell.v || quarterCell.w || '') : ''
      
      if (yearValue && yearValue.toString().includes('Año')) {
        currentYear = yearValue.toString().replace('Año ', '')
      }
      
      if (quarterValue && quarterValue.toString().includes('°') && currentYear) {
        const quarterMatch = quarterValue.toString().match(/(\d+)°/)
        const quarter = quarterMatch ? quarterMatch[1] : ''
        
        if (quarter && parseInt(quarter) >= 1 && parseInt(quarter) <= 4) {
          const monthEnd = parseInt(quarter) * 3
          const dayEnd = monthEnd === 3 ? 31 : monthEnd === 6 ? 30 : monthEnd === 9 ? 30 : 31
          const date = `${currentYear}-${String(monthEnd).padStart(2, '0')}-${String(dayEnd).padStart(2, '0')}`
          
          periods.push({
            colIndex: col,
            year: currentYear,
            quarter,
            period: `T${quarter} ${currentYear}`,
            date
          })
        }
      }
    }
    
    return periods
  }
  
  private extractTargetRegions(workbook: XLSX.WorkBook): Array<{name: string, row: number}> {
    const sheet = workbook.Sheets['Cuadro 1.8']
    if (!sheet) throw new Error('No se encontró Cuadro 1.8')
    
    const targetRegionNames = [
      'Total 31 aglomerados urbanos',
      'Gran Buenos Aires',
      'Cuyo',
      'Noreste', 
      'Noroeste',
      'Pampeana',
      'Patagonia'
    ]
    
    const regions: Array<{name: string, row: number}> = []
    const ref = sheet['!ref']
    if (!ref) throw new Error('No se encontró el rango de la hoja en Cuadro 1.8')
    const range = XLSX.utils.decode_range(ref)
    
    for (let row = 6; row <= Math.min(50, range.e.r); row++) {
      const cellA = sheet[XLSX.utils.encode_cell({r: row, c: 0})]
      const valueA = cellA ? (cellA.v || cellA.w || '').toString().trim() : ''
      
      if (valueA) {
        const matchingRegion = targetRegionNames.find(target => 
          valueA.toLowerCase().includes(target.toLowerCase()) ||
          target.toLowerCase().includes(valueA.toLowerCase())
        )
        
        if (matchingRegion) {
          regions.push({
            name: this.normalizeRegionName(valueA),
            row: row
          })
        }
      }
    }
    
    return regions
  }
  
  private extractRegionalIndicatorData(
    workbook: XLSX.WorkBook, 
    sheetName: string, 
    periods: PeriodMapping[], 
    regions: any[], 
    fieldName: 'activityRate' | 'employmentRate' | 'unemploymentRate'
  ): LaborMarketData[] {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) {
      console.warn(`No se encontró la hoja ${sheetName}`)
      return []
    }
    
    const data: LaborMarketData[] = []
    
    regions.forEach(region => {
      periods.forEach(period => {
        const cell = sheet[XLSX.utils.encode_cell({r: region.row, c: period.colIndex})]
        const value = cell ? (cell.v || cell.w || '') : ''
        
        if (value && !isNaN(parseFloat(value.toString()))) {
          const dataType = region.name === 'Total 31 aglomerados' ? 'national' : 'regional'
          
          const record: LaborMarketData = {
            date: new Date(period.date),
            period: period.period,
            dataType: dataType,
            region: region.name,
            gender: 'Total',
            ageGroup: 'Total',
            demographicSegment: 'Total',
            sourceFile: 'cuadros_eph_informe',
            activityRate: null,
            employmentRate: null,
            unemploymentRate: null,
            totalPopulation: null,
            economicallyActivePopulation: null,
            employedPopulation: null,
            unemployedPopulation: null,
            inactivePopulation: null,
            [fieldName]: parseFloat(value.toString())
          }
          
          data.push(record)
        }
      })
    })
    
    return data
  }
  
  private combineRegionalIndicators(
    activityData: LaborMarketData[],
    employmentData: LaborMarketData[],
    unemploymentData: LaborMarketData[]
  ): LaborMarketData[] {
    const combinedMap = new Map<string, LaborMarketData>()
    
    activityData.forEach(record => {
      const key = `${record.date.toISOString()}-${record.region}`
      combinedMap.set(key, { ...record })
    })
    
    employmentData.forEach(record => {
      const key = `${record.date.toISOString()}-${record.region}`
      const existing = combinedMap.get(key)
      if (existing) {
        existing.employmentRate = record.employmentRate
      } else {
        combinedMap.set(key, { ...record })
      }
    })
    
    unemploymentData.forEach(record => {
      const key = `${record.date.toISOString()}-${record.region}`
      const existing = combinedMap.get(key)
      if (existing) {
        existing.unemploymentRate = record.unemploymentRate
      } else {
        combinedMap.set(key, { ...record })
      }
    })
    
    return Array.from(combinedMap.values())
  }
  
  private combineAndDeduplicateTotals(allData: LaborMarketData[]): LaborMarketData[] {
    const totalRecords = new Map<string, LaborMarketData>()
    const otherRecords: LaborMarketData[] = []
    
    allData.forEach(record => {
      if (record.dataType === 'national' && 
          record.region === 'Total 31 aglomerados' && 
          record.gender === 'Total' && 
          record.ageGroup === 'Total' && 
          record.demographicSegment === 'Total') {
        
        const key = `${record.date.toISOString()}-${record.period}`
        const existing = totalRecords.get(key)
        
        if (!existing) {
          totalRecords.set(key, { ...record })
        } else {
          // Combinar datos
          const combined = { ...existing }
          
          if (record.activityRate !== null && record.activityRate !== undefined) {
            combined.activityRate = record.activityRate
          }
          if (record.employmentRate !== null && record.employmentRate !== undefined) {
            combined.employmentRate = record.employmentRate
          }
          if (record.unemploymentRate !== null && record.unemploymentRate !== undefined) {
            combined.unemploymentRate = record.unemploymentRate
          }
          
          // Poblaciones
          if (record.totalPopulation !== null && record.totalPopulation !== undefined) {
            combined.totalPopulation = record.totalPopulation
          }
          if (record.economicallyActivePopulation !== null && record.economicallyActivePopulation !== undefined) {
            combined.economicallyActivePopulation = record.economicallyActivePopulation
          }
          if (record.employedPopulation !== null && record.employedPopulation !== undefined) {
            combined.employedPopulation = record.employedPopulation
          }
          if (record.unemployedPopulation !== null && record.unemployedPopulation !== undefined) {
            combined.unemployedPopulation = record.unemployedPopulation
          }
          if (record.inactivePopulation !== null && record.inactivePopulation !== undefined) {
            combined.inactivePopulation = record.inactivePopulation
          }
          
          if (record.sourceFile && record.sourceFile !== 'unknown') {
            combined.sourceFile = record.sourceFile
          }
          
          totalRecords.set(key, combined)
        }
      } else {
        otherRecords.push(record)
      }
    })
    
    console.info(`🔍 Deduplicación: ${totalRecords.size} registros totales consolidados`)
    
    return [
      ...Array.from(totalRecords.values()),
      ...otherRecords
    ]
  }
  
  private normalizeRegionName(regionName: string): string {
    const normalizations: Record<string, string> = {
      'Total 31 aglomerados urbanos': 'Total 31 aglomerados',
      'Gran Buenos Aires': 'GBA',
      'Cuyo': 'Región Cuyo',
      'Noreste': 'Región NEA',
      'Noroeste': 'Región NOA', 
      'Pampeana': 'Región Pampeana',
      'Patagonia': 'Región Patagónica'
    }
    
    return normalizations[regionName] || regionName
  }
}