// route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { CountryRiskFetcher } from '@/lib/services/country-risk/country-risk-fetcher'

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.info('🎯 Iniciando actualización de Riesgo País')

    await prisma.countryRisk.deleteMany({})
    const fetcher = new CountryRiskFetcher()
    
    // Obtener parámetros
    const { searchParams } = new URL(request.url)
    const fullUpdate = searchParams.get('full') === 'true'
    const todayOnly = searchParams.get('today') === 'true'
    
    // Si solo queremos actualizar hoy (para tiempo real)
    if (todayOnly) {
      return await updateTodayOnly(fetcher, startTime)
    }
    
    console.info('📊 Cargando todos los datos históricos')
    const riskData = await fetcher.fetchAllData()
    
    if (riskData.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No se obtuvieron datos de Riesgo País'
      })
    }
    
    // Separar datos de hoy del resto
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todayData = riskData.filter(d => {
      const recordDate = new Date(d.date)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() === today.getTime()
    })
    
    const historicalData = riskData.filter(d => {
      const recordDate = new Date(d.date)
      recordDate.setHours(0, 0, 0, 0)
      return recordDate.getTime() < today.getTime()
    })
    
    // Estadísticas
    const stats = {
      total: riskData.length,
      historical: historicalData.length,
      today: todayData.length,
      withOfficial: riskData.filter(d => d.embiOfficial !== null).length,
      withEstimated: riskData.filter(d => d.embiEstimated !== null).length,
      dateRange: {
        from: riskData[0]?.date.toISOString().split('T')[0],
        to: riskData[riskData.length - 1]?.date.toISOString().split('T')[0]
      }
    }
    
    console.info('📊 Estadísticas:', stats)
    
    let created = 0
    let updated = 0
    let errors = 0
    
    // 1. Procesar datos históricos con createMany (mucho más rápido)
    if (historicalData.length > 0) {
      try {
        console.info(`⏳ Insertando ${historicalData.length} registros históricos...`)
        
        const result = await prisma.countryRisk.createMany({
          data: historicalData.map(record => ({
            date: record.date,
            embiOfficial: record.embiOfficial,
            embiEstimated: record.embiEstimated,
            lastUpdate: record.lastUpdate,
            sourceOfficial: record.sourceOfficial,
            sourceEstimated: record.sourceEstimated
          })),
          skipDuplicates: true // Ignora registros que ya existen
        })
        
        created = result.count
        console.info(`✅ Insertados ${created} registros nuevos`)
        
      } catch (error) {
        console.error('Error en createMany:', error)
        errors++
      }
    }
    
    // 2. Procesar datos de hoy con upsert (para permitir actualizaciones)
    if (todayData.length > 0) {
      console.info(`⏳ Actualizando datos de hoy...`)
      
      for (const record of todayData) {
        try {
          await prisma.countryRisk.upsert({
            where: { date: record.date },
            update: {
              embiOfficial: record.embiOfficial,
              embiEstimated: record.embiEstimated,
              lastUpdate: record.lastUpdate,
              sourceOfficial: record.sourceOfficial,
              sourceEstimated: record.sourceEstimated,
              updatedAt: new Date()
            },
            create: {
              date: record.date,
              embiOfficial: record.embiOfficial,
              embiEstimated: record.embiEstimated,
              lastUpdate: record.lastUpdate,
              sourceOfficial: record.sourceOfficial,
              sourceEstimated: record.sourceEstimated
            }
          })
          updated++
        } catch (error) {
          console.error(`Error actualizando registro de hoy:`, error)
          errors++
        }
      }
      
      console.info(`✅ Actualizados ${updated} registros de hoy`)
    }
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    // Registrar ejecución
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-country-risk',
        executionTime: new Date(),
        status: errors === 0 ? 'success' : 'partial',
        recordsProcessed: created + updated,
        errorDetails: errors > 0 ? `${errors} errores` : null,
        results: {
          mode: fullUpdate ? 'completo' : todayOnly ? 'solo-hoy' : 'incremental',
          created,
          updated,
          errors,
          stats,
          tiempo: `${executionTime}s`
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      mode: fullUpdate ? 'full' : 'incremental',
      recordsCreated: created,
      recordsUpdated: updated,
      errors,
      stats,
      executionTime: `${executionTime}s`,
      message: `Actualización completada: ${created} creados, ${updated} actualizados en ${executionTime} segundos`
    })
    
  } catch (error) {
    console.error('Error updating country risk:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-country-risk',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {}
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to update country risk', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// Función auxiliar para actualizar solo el día actual (para tiempo real)
async function updateTodayOnly(fetcher: any, startTime: number) {
  console.info('📈 Actualizando solo datos de hoy (tiempo real)')
  
  try {
    const todayData = await fetcher.fetchTodayData()
    
    if (!todayData) {
      return NextResponse.json({
        success: false,
        message: 'No hay datos disponibles para hoy'
      })
    }
    
    // Upsert del día actual
    const result = await prisma.countryRisk.upsert({
      where: { date: todayData.date },
      update: {
        embiOfficial: todayData.embiOfficial,
        embiEstimated: todayData.embiEstimated,
        lastUpdate: todayData.lastUpdate,
        sourceOfficial: todayData.sourceOfficial,
        sourceEstimated: todayData.sourceEstimated,
        updatedAt: new Date()
      },
      create: {
        date: todayData.date,
        embiOfficial: todayData.embiOfficial,
        embiEstimated: todayData.embiEstimated,
        lastUpdate: todayData.lastUpdate,
        sourceOfficial: todayData.sourceOfficial,
        sourceEstimated: todayData.sourceEstimated
      }
    })
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    return NextResponse.json({
      success: true,
      mode: 'today-only',
      data: result,
      executionTime: `${executionTime}s`,
      message: `Datos de hoy actualizados en ${executionTime} segundos`
    })
    
  } catch (error) {
    console.error('Error actualizando datos de hoy:', error)
    return NextResponse.json(
      { error: 'Failed to update today data', details: (error as Error).message },
      { status: 500 }
    )
  }
}
