// /lib/api/formatters/csv.ts

// Función principal que maneja múltiples indicadores
export function convertToCSV(data: any, view: string, indicator: string = 'inflation'): string {
    switch (indicator) {
      case 'inflation':
        return convertInflationToCSV(data, view)
      case 'emae':
        return convertEmaeToCSV(data, view)
      // Agregar más indicadores aquí en el futuro
      default:
        throw new Error(`Invalid indicator for CSV format: ${indicator}`)
    }
  }
  
  // ==================== INFLACIÓN ====================
  function convertInflationToCSV(data: any, view: string): string {
    switch (view) {
      case 'current':
        return formatCurrentInflationCSV(data)
      case 'historical':
        return formatHistoricalInflationCSV(data)
      case 'components':
        return formatComponentsCSV(data)
      case 'regions':
        return formatRegionsCSV(data)
      case 'calculator':
        return formatCalculatorCSV(data)
      default:
        throw new Error('Invalid view for CSV format')
    }
  }
  
  function formatCurrentInflationCSV(data: any): string {
    const headers = ['Fecha', 'Componente', 'Region', 'Mensual %', 'Anual %', 'Acumulada %', 'Indice']
    const row = [
      data.date,
      data.component.name,
      data.region,
      data.values.monthly || 'N/A',
      data.values.yearly || 'N/A',
      data.values.accumulated || 'N/A',
      data.index
    ]
    
    return [headers.join(','), row.map(escapeCSV).join(',')].join('\n')
  }
  
  function formatHistoricalInflationCSV(data: any[]): string {
    const headers = ['Fecha', 'Mensual %', 'Anual %', 'Acumulada %', 'Indice']
    const rows = data.map(item => [
      item.date,
      item.values.monthly || 'N/A',
      item.values.yearly || 'N/A',  
      item.values.accumulated || 'N/A',
      item.index
    ])
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')
  }
  
  function formatComponentsCSV(data: any): string {
    const headers = ['Componente', 'Tipo', 'Mensual %', 'Anual %']
    const rows: any[] = []
    
    Object.entries(data.components).forEach(([type, components]: [string, any]) => {
      components.forEach((comp: any) => {
        rows.push([
          comp.name,
          type,
          comp.monthly || 'N/A',
          comp.yearly || 'N/A'
        ])
      })
    })
    
    return [
      `Fecha: ${data.date}`,
      `Region: ${data.region}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')
  }
  
  function formatRegionsCSV(data: any): string {
    const headers = ['Region', 'Mensual %', 'Anual %', 'Acumulada %']
    const rows = data.regions.map((region: any) => [
      region.name,
      region.monthly || 'N/A',
      region.yearly || 'N/A',
      region.accumulated || 'N/A'
    ])
    
    return [
      `Fecha: ${data.date}`,
      `Componente: ${data.component.name}`,
      '',
      headers.join(','),
      ...rows.map((row: any[])  => row.map(escapeCSV).join(','))
    ].join('\n')
  }
  
  function formatCalculatorCSV(data: any): string {
    return [
      'Calculadora de Inflacion',
      `Monto Original,${data.calculation.originalAmount}`,
      `Monto Ajustado,${data.calculation.adjustedAmount}`,
      `Diferencia,${data.calculation.difference}`,
      `Tasa de Inflacion,${data.calculation.inflationRate}%`,
      `Perdida Poder Adquisitivo,${data.calculation.purchasingPowerLoss}%`,
      '',
      'Periodo',
      `Desde,${data.period.from.date}`,
      `Hasta,${data.period.to.date}`,
      `Meses,${data.period.months}`,
      `Tasa Anualizada,${data.annualizedRate}%`,
      `Interpretacion,${data.interpretation}`
    ].join('\n')
  }
  
  // ==================== EMAE ====================
  function convertEmaeToCSV(data: any, view: string): string {
    switch (view) {
      case 'current':
        return formatCurrentEmaeCSV(data)
      case 'historical':
        return formatHistoricalEmaeCSV(data)
      case 'sectors':
        return formatSectorsEmaeCSV(data)
      case 'comparison':
        return formatComparisonEmaeCSV(data)
      default:
        throw new Error('Invalid view for EMAE CSV format')
    }
  }
  
  function formatCurrentEmaeCSV(data: any): string {
    const headers = ['Fecha', 'Sector', 'Nombre', 'Valor', 'Valor Original', 'Var. Mensual %', 'Var. Anual %']
    const row = [
      data.date,
      data.sector.code,
      data.sector.name,
      data.value,
      data.originalValue,
      data.variations.monthly?.toFixed(2) || 'N/A',
      data.variations.yearly?.toFixed(2) || 'N/A'
    ]
    
    return [headers.join(','), row.map(escapeCSV).join(',')].join('\n')
  }
  
  function formatHistoricalEmaeCSV(data: any[]): string {
    const headers = ['Fecha', 'Valor', 'Valor Original', 'Var. Mensual %', 'Var. Anual %']
    
    const rows = data.map(item => [
      item.date || item.period,
      item.value,
      item.originalValue,
      item.variations?.monthly?.toFixed(2) || 'N/A',
      item.variations?.yearly?.toFixed(2) || 'N/A'
    ])
    
    return [
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')
  }
  
  function formatSectorsEmaeCSV(data: any): string {
    const headers = ['Código', 'Sector', 'Valor', 'Índice', 'Var. Mensual %', 'Var. Anual %']
    const rows: any[] = []
    
    // Sector general
    if (data.general) {
      rows.push([
        data.general.code,
        data.general.name,
        data.general.value,
        data.general.index,
        data.general.variations?.monthly?.toFixed(2) || 'N/A',
        data.general.variations?.yearly?.toFixed(2) || 'N/A'
      ])
    }
    
    // Sectores productivos
    data.sectors.productive.forEach((sector: any) => {
      rows.push([
        sector.code,
        sector.name,
        sector.value,
        sector.index,
        sector.variations?.monthly?.toFixed(2) || 'N/A',
        sector.variations?.yearly?.toFixed(2) || 'N/A'
      ])
    })
    
    // Impuestos
    if (data.sectors.taxes) {
      rows.push([
        data.sectors.taxes.code,
        data.sectors.taxes.name,
        data.sectors.taxes.value,
        data.sectors.taxes.index,
        data.sectors.taxes.variations?.monthly?.toFixed(2) || 'N/A',
        data.sectors.taxes.variations?.yearly?.toFixed(2) || 'N/A'
      ])
    }
    
    return [
      `Fecha: ${data.date}`,
      `Total Sectores: ${data.summary.totalSectors}`,
      `Sectores Positivos: ${data.summary.positiveSectors}`,
      `Sectores Negativos: ${data.summary.negativeSectors}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')
  }
  
  function formatComparisonEmaeCSV(data: any): string {
    // Crear headers dinámicos basados en los sectores
    const headers = ['Fecha']
    const sectorCodes = data.series.map((s: any) => s.sector.code)
    
    if (data.metric === 'variations') {
      sectorCodes.forEach((code: string) => {
        headers.push(`${code} - Var. Mensual %`, `${code} - Var. Anual %`)
      })
    } else {
      headers.push(...sectorCodes)
    }
    
    // Obtener todas las fechas únicas
    const allDates = new Set<string>()
    data.series.forEach((s: any) => {
      s.data.forEach((d: any) => {
        allDates.add(d.date)
      })
    })
    
    // Crear filas
    const rows: any[] = []
    const sortedDates = Array.from(allDates).sort()
    
    sortedDates.forEach(date => {
      const row = [date]
      
      data.series.forEach((series: any) => {
        const dataPoint = series.data.find((d: any) => d.date === date)
        
        if (data.metric === 'variations') {
          row.push(
            dataPoint?.monthly?.toFixed(2) || 'N/A',
            dataPoint?.yearly?.toFixed(2) || 'N/A'
          )
        } else {
          row.push(dataPoint?.value || 'N/A')
        }
      })
      
      rows.push(row)
    })
    
    // Agregar estadísticas al final
    const statsSection = [
      '',
      'Estadísticas',
      'Sector,Mínimo,Máximo,Promedio,Último Valor'
    ]
    
    data.statistics.forEach((stat: any) => {
      statsSection.push(
        [
          stat.sector.name,
          stat.min.toFixed(2),
          stat.max.toFixed(2),
          stat.average.toFixed(2),
          stat.lastValue.toFixed(2)
        ].map(escapeCSV).join(',')
      )
    })
    
    return [
      `Período: ${data.period.from} a ${data.period.to}`,
      `Métrica: ${data.metric}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
      ...statsSection
    ].join('\n')
  }
  
  // ==================== HELPERS ====================
  // Helper para escapar valores CSV
  export function escapeCSV(value: any): string {
    if (value === null || value === undefined) return ''
    
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }