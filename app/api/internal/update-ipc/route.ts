import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { IndecFetcher } from '@/lib/services/indec/indec-fetcher'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    const fetcher = new IndecFetcher()
    const ipcData = await fetcher.fetchIpcData()
    
    console.info(`Procesando ${ipcData.length} registros de IPC...`)
    
    // Mapear los campos correctamente
    const mappedData = ipcData.map(data => ({
      date: new Date(data.date).toISOString(),
      component: data.component,
      componentCode: data.component_code,
      componentType: data.component_type,
      indexValue: data.index_value,
      region: data.region
    }))

    // Usar UPSERT masivo con SQL nativo (MUCHO más rápido)
    const totalProcessed = await bulkUpsertIPC(mappedData)
    
    const upsertTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.info(`✓ Upsert completado en ${upsertTime}s`)

    // Calcular variaciones
    console.info('Calculando variaciones porcentuales...')
    const variationsStartTime = Date.now()
    await calculateIPCVariations()
    const variationsTime = ((Date.now() - variationsStartTime) / 1000).toFixed(2)
    console.info(`✓ Variaciones calculadas en ${variationsTime}s`)

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)

    await prisma.cronExecution.create({
      data: {
        taskName: 'update-ipc',
        executionTime: new Date(),
        status: 'success',
        recordsProcessed: totalProcessed,
        results: { 
          updated: totalProcessed,
          regiones: [...new Set(mappedData.map(d => d.region))],
          tiempos: {
            upsert: `${upsertTime}s`,
            variaciones: `${variationsTime}s`,
            total: `${totalTime}s`
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      recordsProcessed: totalProcessed,
      executionTime: `${totalTime}s`,
      message: `Se actualizaron ${totalProcessed} registros del IPC en ${totalTime} segundos`
    })

  } catch (error) {
    console.error('Error updating IPC:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-ipc',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {}
      }
    })

    return NextResponse.json(
      { error: 'Failed to update IPC', details: (error as Error).message }, 
      { status: 500 }
    )
  }
}

/**
 * Bulk upsert usando deleteMany + createMany
 */
async function bulkUpsertIPC(data: any[]): Promise<number> {
  if (data.length === 0) return 0
  
  console.info('Preparando datos para inserción masiva...')
  
  // Preparar datos con el mapeo correcto
  const preparedData = data.map(row => ({
    date: new Date(row.date),
    component: row.component,
    componentCode: row.componentCode,
    componentType: row.componentType,
    indexValue: row.indexValue,
    monthlyPctChange: null,
    yearlyPctChange: null,
    accumulatedPctChange: null,
    region: row.region
  }))

  // Obtener combinaciones únicas para eliminar solo lo necesario
  const uniqueKeys = [...new Set(data.map(d => 
    `${d.date}|${d.componentCode}|${d.region}`
  ))]
  
  console.info(`Eliminando ${uniqueKeys.length} combinaciones existentes...`)
  
  // Eliminar en batches para no sobrecargar la query
  const deleteBatchSize = 500
  for (let i = 0; i < uniqueKeys.length; i += deleteBatchSize) {
    const batch = uniqueKeys.slice(i, i + deleteBatchSize)
    const conditions = batch.map(key => {
      const [date, componentCode, region] = key.split('|')
      return {
        date: new Date(date),
        componentCode,
        region
      }
    })
    
    await prisma.ipc.deleteMany({
      where: {
        OR: conditions
      }
    })
  }
  
  console.info('Insertando nuevos registros...')
  
  // Insertar en batches usando createMany
  const insertBatchSize = 5000
  let totalProcessed = 0
  
  for (let i = 0; i < preparedData.length; i += insertBatchSize) {
    const batch = preparedData.slice(i, i + insertBatchSize)
    
    const result = await prisma.ipc.createMany({
      data: batch,
      skipDuplicates: true
    })
    
    totalProcessed += result.count
    console.info(`Insertados ${totalProcessed}/${preparedData.length} registros`)
  }
  
  return totalProcessed
}

/**
 * Calcula las variaciones del IPC de forma optimizada
 */
async function calculateIPCVariations() {
  // Crear índices temporales si no existen para mejorar performance
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_ipc_lookup 
    ON "ipc"("component_code", "component_type", "region", "date")
  `

  // Variación mensual
  const monthlyResult = await prisma.$executeRaw`
    WITH monthly_calc AS (
      SELECT 
        current.id,
        ROUND(
          CAST(
            ((current."index_value" / LAG(current."index_value", 1) OVER (
              PARTITION BY current."component_code", current."component_type", current."region" 
              ORDER BY current."date"
            )) - 1) * 100 
          AS NUMERIC), 
          1
        ) as monthly_var
      FROM "ipc" current
    )
    UPDATE "ipc" 
    SET "monthly_pct_change" = monthly_calc.monthly_var
    FROM monthly_calc
    WHERE "ipc".id = monthly_calc.id
    AND monthly_calc.monthly_var IS NOT NULL
  `
  console.info(`✓ Variaciones mensuales: ${monthlyResult} registros`)

  // Variación anual  
  const yearlyResult = await prisma.$executeRaw`
    WITH yearly_calc AS (
      SELECT 
        current.id,
        ROUND(
          CAST(
            ((current."index_value" / LAG(current."index_value", 12) OVER (
              PARTITION BY current."component_code", current."component_type", current."region" 
              ORDER BY current."date"
            )) - 1) * 100
          AS NUMERIC),
          1
        ) as yearly_var
      FROM "ipc" current
    )
    UPDATE "ipc" 
    SET "yearly_pct_change" = yearly_calc.yearly_var
    FROM yearly_calc
    WHERE "ipc".id = yearly_calc.id
    AND yearly_calc.yearly_var IS NOT NULL
  `
  console.info(`✓ Variaciones anuales: ${yearlyResult} registros`)

  // Variación acumulada (vs diciembre del año anterior)
  const accumulatedResult = await prisma.$executeRaw`
    UPDATE "ipc" AS current
    SET "accumulated_pct_change" = ROUND(
      CAST(
        ((current."index_value" / prev."index_value") - 1) * 100
      AS NUMERIC),
      1
    )
    FROM "ipc" AS prev
    WHERE 
      current."component_code" = prev."component_code"
      AND current."component_type" = prev."component_type"
      AND current."region" = prev."region"
      AND DATE_PART('month', prev."date") = 12
      AND DATE_PART('year', prev."date") = DATE_PART('year', current."date") - 1
  `
  console.info(`✓ Variaciones acumuladas: ${accumulatedResult} registros`)

  // Para enero, la variación acumulada es igual a la mensual
  const januaryResult = await prisma.$executeRaw`
    UPDATE "ipc"
    SET "accumulated_pct_change" = "monthly_pct_change"
    WHERE 
      DATE_PART('month', "date") = 1
      AND "accumulated_pct_change" IS NULL
  `
  console.info(`✓ Ajuste para enero: ${januaryResult} registros`)
}