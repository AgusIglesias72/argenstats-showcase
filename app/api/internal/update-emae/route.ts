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
    
    // Obtener datos
    console.info('Obteniendo datos del EMAE...')
    const emaeGeneral = await fetcher.fetchEmaeData()
    const emaeActivity = await fetcher.fetchEmaeByActivityData()
    
    // Combinar todos los datos en un formato unificado
    const allData = [
      // EMAE General
      ...emaeGeneral.map(row => ({
        date: new Date(row.date),
        sectorCode: 'GENERAL',
        sectorName: 'Nivel general',
        originalValue: row.original_value,
        seasonallyAdjustedValue: row.seasonally_adjusted_value || null,
        cycleTrendValue: row.cycle_trend_value || null,
        monthlyVariation: null,
        yearlyVariation: null,
        cycleTrendVariation: null
      })),
      // EMAE por Actividad
      ...emaeActivity.map(row => ({
        date: new Date(row.date),
        sectorCode: row.economy_sector_code,
        sectorName: row.economy_sector,
        originalValue: row.original_value,
        seasonallyAdjustedValue: null,
        cycleTrendValue: null,
        monthlyVariation: null,
        yearlyVariation: null,
        cycleTrendVariation: null
      }))
    ]
    
    console.info(`Total de registros a procesar: ${allData.length}`)
    
    // Actualizar base de datos usando el mismo approach que IPC
    const totalProcessed = await bulkUpsertEmae(allData)
    
    // Calcular variaciones
    console.info('Calculando variaciones...')
    const variationsStartTime = Date.now()
    await calculateEmaeVariations()
    const variationsTime = ((Date.now() - variationsStartTime) / 1000).toFixed(2)
    console.info(`✓ Variaciones calculadas en ${variationsTime}s`)
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-emae',
        executionTime: new Date(),
        status: 'success',
        recordsProcessed: totalProcessed,
        results: { 
          totalRegistros: totalProcessed,
          tiempoTotal: `${totalTime}s`,
          tiempoVariaciones: `${variationsTime}s`,
          sectores: [...new Set(allData.map(d => d.sectorCode))].length
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      recordsProcessed: totalProcessed,
      executionTime: `${totalTime}s`,
      message: `Se actualizaron ${totalProcessed} registros del EMAE en ${totalTime} segundos`
    })

  } catch (error) {
    console.error('Error updating EMAE:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-emae',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {}
      }
    })

    return NextResponse.json(
      { error: 'Failed to update EMAE', details: (error as Error).message }, 
      { status: 500 }
    )
  }
}

/**
 * Bulk upsert para EMAE unificado (mismo approach que IPC)
 */
async function bulkUpsertEmae(data: any[]): Promise<number> {
  if (data.length === 0) return 0
  
  console.info('Preparando datos para inserción masiva...')
  
  // Eliminar registros existentes de las fechas que vamos a insertar
  const uniqueDates = [...new Set(data.map(d => d.date))]
  
  console.info(`Eliminando registros existentes de ${uniqueDates.length} fechas...`)
  await prisma.emae.deleteMany({
    where: {
      date: { in: uniqueDates }
    }
  })
  
  console.info('Insertando nuevos registros...')
  
  // Insertar en batches usando createMany
  const batchSize = 5000
  let totalProcessed = 0
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    
    try {
      const result = await prisma.emae.createMany({
        data: batch,
        skipDuplicates: true
      })
      
      totalProcessed += result.count
      console.info(`Insertados ${totalProcessed}/${data.length} registros`)
    } catch (error) {
      console.error(`Error en batch ${Math.floor(i/batchSize) + 1}:`, error)
      throw error
    }
  }
  
  return totalProcessed
}

/**
 * Calcula todas las variaciones del EMAE
 */
async function calculateEmaeVariations() {
  // Crear índices para optimización
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_emae_lookup 
    ON "emae"("sector_code", "date")
  `

  // Variación mensual para GENERAL (usa seasonally_adjusted_value)
  const monthlyGeneralResult = await prisma.$executeRaw`
    WITH monthly_calc AS (
      SELECT 
        current.id,
        ROUND(
          CAST(
            ((current."seasonally_adjusted_value" / LAG(current."seasonally_adjusted_value", 1) OVER (
              ORDER BY current."date"
            )) - 1) * 100 
          AS NUMERIC), 
          1
        ) as monthly_var
      FROM "emae" current
      WHERE current."sector_code" = 'GENERAL'
      AND current."seasonally_adjusted_value" IS NOT NULL
    )
    UPDATE "emae" 
    SET "monthly_variation" = monthly_calc.monthly_var
    FROM monthly_calc
    WHERE "emae".id = monthly_calc.id
    AND monthly_calc.monthly_var IS NOT NULL
  `
  console.info(`✓ Variaciones mensuales GENERAL: ${monthlyGeneralResult} registros`)

  // Variación mensual para actividades (usa original_value)
  const monthlyActivityResult = await prisma.$executeRaw`
    WITH monthly_calc AS (
      SELECT 
        current.id,
        ROUND(
          CAST(
            ((current."original_value" / LAG(current."original_value", 1) OVER (
              PARTITION BY current."sector_code"
              ORDER BY current."date"
            )) - 1) * 100 
          AS NUMERIC), 
          1
        ) as monthly_var
      FROM "emae" current
      WHERE current."sector_code" != 'GENERAL'
    )
    UPDATE "emae" 
    SET "monthly_variation" = monthly_calc.monthly_var
    FROM monthly_calc
    WHERE "emae".id = monthly_calc.id
    AND monthly_calc.monthly_var IS NOT NULL
  `
  console.info(`✓ Variaciones mensuales actividades: ${monthlyActivityResult} registros`)

  // Variación anual (todos usan original_value)
  const yearlyResult = await prisma.$executeRaw`
    WITH yearly_calc AS (
      SELECT 
        current.id,
        ROUND(
          CAST(
            ((current."original_value" / LAG(current."original_value", 12) OVER (
              PARTITION BY current."sector_code"
              ORDER BY current."date"
            )) - 1) * 100
          AS NUMERIC),
          1
        ) as yearly_var
      FROM "emae" current
    )
    UPDATE "emae" 
    SET "yearly_variation" = yearly_calc.yearly_var
    FROM yearly_calc
    WHERE "emae".id = yearly_calc.id
    AND yearly_calc.yearly_var IS NOT NULL
  `
  console.info(`✓ Variaciones anuales: ${yearlyResult} registros`)

  // Variación ciclo-tendencia (solo para GENERAL)
  const cycleTrendResult = await prisma.$executeRaw`
    WITH cycle_calc AS (
      SELECT 
        current.id,
        ROUND(
          CAST(
            ((current."cycle_trend_value" / LAG(current."cycle_trend_value", 1) OVER (
              ORDER BY current."date"
            )) - 1) * 100
          AS NUMERIC),
          1
        ) as cycle_var
      FROM "emae" current
      WHERE current."sector_code" = 'GENERAL'
      AND current."cycle_trend_value" IS NOT NULL
    )
    UPDATE "emae" 
    SET "cycle_trend_variation" = cycle_calc.cycle_var
    FROM cycle_calc
    WHERE "emae".id = cycle_calc.id
    AND cycle_calc.cycle_var IS NOT NULL
  `
  console.info(`✓ Variaciones ciclo-tendencia: ${cycleTrendResult} registros`)
}