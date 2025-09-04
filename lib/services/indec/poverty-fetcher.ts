import * as XLSX from 'xlsx'
import axios from 'axios'

interface SemesterMapping {
  colIndex: number
  year: string
  semester: string
  period: string
  date: string
}

interface PovertyData {
  date: Date
  period: string
  semester: number
  year: number
  dataType: string
  region: string
  cuadroSource?: string | null
  povertyRatePersons?: number | null
  povertyRateHouseholds?: number | null
  indigenceRatePersons?: number | null
  indigenceRateHouseholds?: number | null
  indigenceGap?: number | null
  povertyGap?: number | null
  indigenceSeverity?: number | null
  povertySeverity?: number | null
  variableName?: string | null
  variableValue?: number | null
  sourceFile?: string | null
}

export class PovertyFetcher {
  
  async fetchPovertyData(): Promise<PovertyData[]> {
    try {
      console.info('🚀 Iniciando fetcher de datos de pobreza INDEC...')
      
      const allData: PovertyData[] = []
      
      // Generar URLs para descargar el archivo más reciente
      const urls = this.generatePovertyUrls()
      const workbook = await this.downloadWorkbook(urls)
      
      // Procesar cada cuadro
      console.info('📊 Procesando Cuadro 1 (tasas principales)...')
      const cuadro1Data = await this.processCuadro1(workbook)
      allData.push(...cuadro1Data)
      
      console.info('📊 Procesando Cuadro 2.1 (brecha de indigencia)...')
      const cuadro21Data = await this.processCuadro21(workbook)
      allData.push(...cuadro21Data)
      
      console.info('📊 Procesando Cuadro 2.2 (brecha de pobreza)...')
      const cuadro22Data = await this.processCuadro22(workbook)
      allData.push(...cuadro22Data)
      
      console.info('📊 Procesando Cuadro 4.3 (pobreza por regiones)...')
      const cuadro43Data = await this.processCuadro43(workbook)
      allData.push(...cuadro43Data)
      
      console.info('📊 Procesando Cuadro 4.4 (indigencia por regiones)...')
      const cuadro44Data = await this.processCuadro44(workbook)
      allData.push(...cuadro44Data)
      
      console.info(`✅ Total de registros procesados: ${allData.length}`)
      
      // Filtrar registros válidos
      const validData = allData.filter(record => 
        record.date && 
        record.period && 
        record.region &&
        record.dataType
      )
      
      console.info(`✅ Registros válidos: ${validData.length}`)
      
      return validData
      
    } catch (error) {
      console.error('❌ Error en fetchPovertyData:', error)
      throw error
    }
  }
  
  private generatePovertyUrls(): string[] {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    const urls: string[] = []
    const publications: Array<{month: number, year: number}> = []
    
    // Si estamos después de septiembre, S1 del año actual
    if (currentMonth >= 9) {
      publications.push({month: 9, year: currentYear})
    }
    
    // Si estamos después de marzo, S2 del año anterior
    if (currentMonth >= 3) {
      publications.push({month: 3, year: currentYear})
    }
    
    // Agregar publicaciones anteriores (últimos 4 años)
    for (let i = 0; i < 8; i++) {
      const pubYear = currentYear - Math.floor(i / 2)
      const isFirstHalf = i % 2 === 0
      const month = isFirstHalf ? 9 : 3
      
      if (pubYear < currentYear || (pubYear === currentYear && month < currentMonth)) {
        publications.push({month, year: pubYear})
      }
    }
    
    // Construir URLs
    publications.forEach(({month, year}) => {
      const monthStr = String(month).padStart(2, '0')
      const yearStr = String(year).slice(-2)
      urls.push(`http://www.indec.gob.ar/ftp/cuadros/sociedad/cuadros_informe_pobreza_${monthStr}_${yearStr}.xls`)
    })
    
    console.info(`🗓️ URLs generadas: ${urls.length} opciones`)
    return urls
  }
  
  private async downloadWorkbook(urls: string[]): Promise<XLSX.WorkBook> {
    console.info(`📥 Intentando descargar archivo de pobreza desde ${urls.length} URLs...`)
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i]
      try {
        console.info(`📥 Intento ${i + 1}/${urls.length}: ${url}`)
        
        const response = await axios.get(url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        })
        
        const workbook = XLSX.read(response.data, {
          cellStyles: false,
          cellDates: true,
          sheetStubs: false
        })
        
        console.info(`✅ Descarga exitosa desde: ${url}`)
        console.info(`📋 Hojas encontradas: ${workbook.SheetNames.join(', ')}`)
        
        return workbook
        
      } catch (error) {
        console.warn(`⚠️ Intento ${i + 1} falló: ${(error as Error).message}`)
        if (i < urls.length - 1) {
          console.info(`🔄 Intentando siguiente URL...`)
        }
      }
    }
    
    throw new Error(`❌ No se pudo descargar desde ninguna URL`)
  }
  
  private async processCuadro1(workbook: XLSX.WorkBook): Promise<PovertyData[]> {
    const sheetName = 'Cuadro 1'
    const sheet = workbook.Sheets[sheetName]
    
    if (!sheet) {
      console.warn(`❌ No se encontró ${sheetName}`)
      return []
    }
    
    const data: PovertyData[] = []
    
    // Extraer períodos
    const periods = this.extractSemesterPeriods(sheet)
    console.info(`📅 Períodos encontrados en Cuadro 1: ${periods.length}`)
    
    if (periods.length === 0) {
      console.warn('❌ No se encontraron períodos en Cuadro 1')
      return []
    }
    
    // Mapeo de indicadores
    const indicators = [
      { row: 5, field: 'povertyRateHouseholds' },
      { row: 6, field: 'povertyRatePersons' },
      { row: 9, field: 'indigenceRateHouseholds' },
      { row: 10, field: 'indigenceRatePersons' }
    ]
    
    // Extraer datos para cada período
    periods.forEach(period => {
      const record: PovertyData = {
        date: new Date(period.date),
        period: period.period,
        semester: parseInt(period.semester),
        year: parseInt(period.year),
        dataType: 'national',
        region: 'Total 31 aglomerados',
        cuadroSource: 'Cuadro 1',
        sourceFile: 'cuadros_informe_pobreza',
        povertyRatePersons: null,
        povertyRateHouseholds: null,
        indigenceRatePersons: null,
        indigenceRateHouseholds: null,
        indigenceGap: null,
        povertyGap: null,
        indigenceSeverity: null,
        povertySeverity: null,
        variableName: null,
        variableValue: null
      }
      
      // Extraer valores
      indicators.forEach(indicator => {
        const cell = sheet[XLSX.utils.encode_cell({r: indicator.row, c: period.colIndex})]
        const value = cell ? (cell.v || cell.w || '') : ''
        
        if (value && !isNaN(parseFloat(value.toString()))) {
          (record as any)[indicator.field] = parseFloat(value.toString())
        }
      })
      
      data.push(record)
    })
    
    console.info(`✅ Cuadro 1: ${data.length} registros procesados`)
    return data
  }
  
  private async processCuadro21(workbook: XLSX.WorkBook): Promise<PovertyData[]> {
    return this.processCuadro2x(workbook, 'Cuadro 2.1', 'indigence')
  }
  
  private async processCuadro22(workbook: XLSX.WorkBook): Promise<PovertyData[]> {
    return this.processCuadro2x(workbook, 'Cuadro 2.2', 'poverty')
  }
  
  private async processCuadro2x(workbook: XLSX.WorkBook, sheetName: string, type: 'indigence' | 'poverty'): Promise<PovertyData[]> {
    const sheet = workbook.Sheets[sheetName]
    
    if (!sheet) {
      console.warn(`❌ No se encontró ${sheetName}`)
      return []
    }
    
    const data: PovertyData[] = []
    const periods = this.extractSemesterPeriods(sheet)
    
    if (periods.length === 0) {
      return []
    }
    
    const mainIndicators = [
      { row: 4, field: type === 'indigence' ? 'indigenceGap' : 'povertyGap', label: 'Brecha' },
      { row: 5, field: type === 'indigence' ? 'indigenceSeverity' : 'povertySeverity', label: 'Severidad' }
    ]
    
    periods.forEach(period => {
      mainIndicators.forEach(indicator => {
        const record: PovertyData = {
          date: new Date(period.date),
          period: period.period,
          semester: parseInt(period.semester),
          year: parseInt(period.year),
          dataType: 'national',
          region: 'Total 31 aglomerados',
          cuadroSource: sheetName,
          sourceFile: 'cuadros_informe_pobreza',
          povertyRatePersons: null,
          povertyRateHouseholds: null,
          indigenceRatePersons: null,
          indigenceRateHouseholds: null,
          indigenceGap: null,
          povertyGap: null,
          indigenceSeverity: null,
          povertySeverity: null,
          variableName: indicator.label,
          variableValue: null
        }
        
        const cell = sheet[XLSX.utils.encode_cell({r: indicator.row, c: period.colIndex})]
        const value = cell ? (cell.v || cell.w || '') : ''
        
        if (value && !isNaN(parseFloat(value.toString()))) {
          (record as any)[indicator.field] = parseFloat(value.toString())
          record.variableValue = parseFloat(value.toString())
        }
        
        data.push(record)
      })
    })
    
    return data
  }
  
  private async processCuadro43(workbook: XLSX.WorkBook): Promise<PovertyData[]> {
    return this.processCuadro4x(workbook, 'Cuadro 4.3', 'poverty')
  }
  
  private async processCuadro44(workbook: XLSX.WorkBook): Promise<PovertyData[]> {
    return this.processCuadro4x(workbook, 'Cuadro 4.4', 'indigence')
  }
  
  private async processCuadro4x(workbook: XLSX.WorkBook, sheetName: string, type: 'poverty' | 'indigence'): Promise<PovertyData[]> {
    const sheet = workbook.Sheets[sheetName]
    
    if (!sheet) {
      console.warn(`❌ No se encontró ${sheetName}`)
      return []
    }
    
    const ref = sheet['!ref']
    if (!ref) {
      return []
    }
    
    const range = XLSX.utils.decode_range(ref)
    const data: PovertyData[] = []
    
    // Buscar regiones
    const targetRegions = ['Gran Buenos Aires', 'Cuyo', 'Noreste', 'Noroeste', 'Pampeana', 'Patagonia']
    const regions = this.findRegionalRows(sheet, targetRegions)
    
    // Extraer períodos con columnas
    const periodColumns: Array<{period: SemesterMapping, householdsCol: number, personsCol: number}> = []
    
    // Buscar períodos en fila 2
    for (let col = 1; col <= range.e.c; col++) {
      const periodCell = sheet[XLSX.utils.encode_cell({r: 2, c: col})]
      const periodValue = periodCell ? (periodCell.v || periodCell.w || '').toString() : ''
      
      const semesterMatch = periodValue.match(/([12])\s*semestre\s*(\d{4})/i)
      
      if (semesterMatch) {
        const semester = semesterMatch[1]
        const year = semesterMatch[2]
        
        // Buscar columnas de Hogares y Personas
        let householdsCol = col
        let personsCol = col + 2
        
        // Verificar en fila 3
        for (let offset = -1; offset <= 3; offset++) {
          const testCell = sheet[XLSX.utils.encode_cell({r: 3, c: col + offset})]
          const testValue = testCell ? (testCell.v || testCell.w || '').toString().toLowerCase() : ''
          if (testValue.includes('hogar')) {
            householdsCol = col + offset
          }
          if (testValue.includes('persona')) {
            personsCol = col + offset
          }
        }
        
        const monthEnd = semester === '1' ? 6 : 12
        const dayEnd = monthEnd === 6 ? 30 : 31
        const date = `${year}-${String(monthEnd).padStart(2, '0')}-${String(dayEnd).padStart(2, '0')}`
        
        periodColumns.push({
          period: {
            colIndex: col,
            year: year,
            semester: semester,
            period: `S${semester} ${year}`,
            date: date
          },
          householdsCol: householdsCol,
          personsCol: personsCol
        })
      }
    }
    
    // Extraer datos
    regions.forEach(region => {
      periodColumns.forEach(({period, householdsCol, personsCol}) => {
        const householdsCell = sheet[XLSX.utils.encode_cell({r: region.row, c: householdsCol})]
        const personsCell = sheet[XLSX.utils.encode_cell({r: region.row, c: personsCol})]
        
        let householdsValue = householdsCell ? (householdsCell.v || householdsCell.w || '').toString() : ''
        let personsValue = personsCell ? (personsCell.v || personsCell.w || '').toString() : ''
        
        householdsValue = householdsValue.replace(',', '.')
        personsValue = personsValue.replace(',', '.')
        
        const householdsNum = householdsValue ? parseFloat(householdsValue) : null
        const personsNum = personsValue ? parseFloat(personsValue) : null
        
        if ((householdsNum !== null && !isNaN(householdsNum)) || 
            (personsNum !== null && !isNaN(personsNum))) {
          const record: PovertyData = {
            date: new Date(period.date),
            period: period.period,
            semester: parseInt(period.semester),
            year: parseInt(period.year),
            dataType: 'regional',
            region: region.name,
            cuadroSource: sheetName,
            sourceFile: 'cuadros_informe_pobreza',
            povertyRatePersons: null,
            povertyRateHouseholds: null,
            indigenceRatePersons: null,
            indigenceRateHouseholds: null,
            indigenceGap: null,
            povertyGap: null,
            indigenceSeverity: null,
            povertySeverity: null,
            variableName: null,
            variableValue: null
          }
          
          if (type === 'poverty') {
            record.povertyRateHouseholds = householdsNum
            record.povertyRatePersons = personsNum
          } else {
            record.indigenceRateHouseholds = householdsNum
            record.indigenceRatePersons = personsNum
          }
          
          data.push(record)
        }
      })
    })
    
    return data
  }
  
  private extractSemesterPeriods(sheet: XLSX.WorkSheet): SemesterMapping[] {
    const ref = sheet['!ref']
    if (!ref) return []
    
    const range = XLSX.utils.decode_range(ref)
    const periods: SemesterMapping[] = []
    
    // Los períodos están en la fila 2
    for (let col = 1; col <= range.e.c; col++) {
      const cell = sheet[XLSX.utils.encode_cell({r: 2, c: col})]
      const value = cell ? (cell.v || cell.w || '').toString() : ''
      
      const semesterMatch = value.match(/([12])[°erdot]*\.?\s*semestre\s*(\d{4})/i)
      
      if (semesterMatch) {
        const semester = semesterMatch[1]
        const year = semesterMatch[2]
        
        const monthEnd = semester === '1' ? 6 : 12
        const dayEnd = monthEnd === 6 ? 30 : 31
        const date = `${year}-${String(monthEnd).padStart(2, '0')}-${String(dayEnd).padStart(2, '0')}`
        
        periods.push({
          colIndex: col,
          year: year,
          semester: semester,
          period: `S${semester} ${year}`,
          date: date
        })
      }
    }
    
    // Eliminar duplicados
    const uniquePeriods = periods.filter((period, index, self) =>
      index === self.findIndex(p => p.period === period.period)
    )
    
    return uniquePeriods.sort((a, b) => a.date.localeCompare(b.date))
  }
  
  private findRegionalRows(sheet: XLSX.WorkSheet, targetRegions: string[]): Array<{name: string, row: number}> {
    const ref = sheet['!ref']
    if (!ref) return []
    
    const range = XLSX.utils.decode_range(ref)
    const regions: Array<{name: string, row: number}> = []
    
    for (let row = 0; row <= range.e.r; row++) {
      const cell = sheet[XLSX.utils.encode_cell({r: row, c: 0})]
      const value = cell ? (cell.v || cell.w || '').toString().trim() : ''
      
      if (value) {
        const cleanValue = value.replace(/\(\d+\)/, '').trim()
        const matchingRegion = targetRegions.find(target => {
          return cleanValue.toLowerCase().includes(target.toLowerCase()) ||
                 target.toLowerCase().includes(cleanValue.toLowerCase())
        })
        
        if (matchingRegion) {
          regions.push({
            name: matchingRegion,
            row: row
          })
        }
      }
    }
    
    return regions
  }
}