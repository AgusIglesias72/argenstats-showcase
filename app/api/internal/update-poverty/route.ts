import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PovertyFetcher } from '@/lib/services/indec/poverty-fetcher'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.info('🚀 Iniciando actualización de pobreza e indigencia')
    
    const fetcher = new PovertyFetcher()
    const povertyData = await fetcher.fetchPovertyData()
    
    console.info(`📊 Obtenidos ${povertyData.length} registros de pobreza`)
    
    if (povertyData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se obtuvieron datos de pobreza'
      })
    }
    
    // Analizar los datos
    const regions = new Set(povertyData.map(item => item.region))
    const periods = new Set(povertyData.map(item => item.period))
    const breakdown = {
      national: povertyData.filter(item => item.dataType === 'national').length,
      regional: povertyData.filter(item => item.dataType === 'regional').length
    }
    
    console.info(`📈 Datos incluyen ${regions.size} regiones y ${periods.size} períodos`)
    console.info(`📊 Breakdown: Nacional=${breakdown.national}, Regional=${breakdown.regional}`)
    
    // Deduplicar datos
    const deduplicatedData = deduplicateRecords(povertyData)
    console.info(`🔍 Deduplicación: ${povertyData.length} → ${deduplicatedData.length} registros`)
    
    // Eliminar registros existentes de los períodos que vamos a actualizar
    const uniqueDates = [...new Set(deduplicatedData.map(d => d.date))]
    
    console.info(`🗑️ Eliminando registros existentes de ${uniqueDates.length} fechas...`)
    await prisma.povertyData.deleteMany({
      where: {
        date: { in: uniqueDates }
      }
    })
    
    // Insertar datos en batches
    console.info('💾 Guardando datos en la base de datos...')
    const batchSize = 1000
    let totalInserted = 0
    
    for (let i = 0; i < deduplicatedData.length; i += batchSize) {
      const batch = deduplicatedData.slice(i, i + batchSize)
      
      const result = await prisma.povertyData.createMany({
        data: batch,
        skipDuplicates: true
      })
      
      totalInserted += result.count
      console.info(`  Procesados ${totalInserted}/${deduplicatedData.length} registros`)
    }
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    // Registrar ejecución
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-poverty',
        executionTime: new Date(),
        status: 'success',
        recordsProcessed: totalInserted,
        results: {
          totalRegistros: totalInserted,
          regiones: regions.size,
          periodos: periods.size,
          breakdown,
          tiempo: `${executionTime}s`,
          fechas: {
            desde: uniqueDates[0],
            hasta: uniqueDates[uniqueDates.length - 1]
          }
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      recordsProcessed: totalInserted,
      regiones: regions.size,
      periodos: periods.size,
      breakdown,
      executionTime: `${executionTime}s`,
      message: `Se actualizaron ${totalInserted} registros de pobreza en ${executionTime} segundos`
    })
    
  } catch (error) {
    console.error('Error updating poverty data:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-poverty',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {}
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to update poverty data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Deduplica registros basado en la clave única
 */
function deduplicateRecords(records: any[]): any[] {
  const uniqueRecords = new Map<string, any>()
  
  records.forEach((record) => {
    const key = `${record.date.toISOString()}-${record.region}`
    
    if (!uniqueRecords.has(key)) {
      uniqueRecords.set(key, { ...record })
    } else {
      // Combinar manteniendo valores no nulos
      const existing = uniqueRecords.get(key)!
      const merged = { ...existing }
      
      // Priorizar valores no nulos del nuevo registro
      Object.keys(record).forEach(field => {
        if (record[field] !== null && record[field] !== undefined) {
          if (existing[field] === null || existing[field] === undefined) {
            merged[field] = record[field]
          }
        }
      })
      
      uniqueRecords.set(key, merged)
    }
  })
  
  return Array.from(uniqueRecords.values())
}