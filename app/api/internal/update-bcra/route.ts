import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { BcraFetcher } from '@/lib/services/bcra/bcra-fetcher'

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.info('🏦 Iniciando actualización de datos BCRA')
    
    const fetcher = new BcraFetcher()
    
    // Obtener parámetro opcional para actualización completa o incremental
    const { searchParams } = new URL(request.url)
    const fullUpdate = searchParams.get('full') === 'true'
    
    let results
    
    if (fullUpdate) {
      console.info('🔄 Actualización completa solicitada')
      results = await performFullUpdate(fetcher)
    } else {
      console.info('📈 Actualización incremental')
      results = await performIncrementalUpdate(fetcher)
    }
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    // Registrar ejecución
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-bcra',
        executionTime: new Date(),
        status: 'success',
        recordsProcessed: results.dataPointsAdded,
        results: {
          variablesUpdated: results.variablesUpdated,
          dataPointsAdded: results.dataPointsAdded,
          modo: fullUpdate ? 'completo' : 'incremental',
          tiempo: `${executionTime}s`,
          detalles: results.details
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      mode: fullUpdate ? 'full' : 'incremental',
      variablesUpdated: results.variablesUpdated,
      dataPointsAdded: results.dataPointsAdded,
      executionTime: `${executionTime}s`,
      details: results.details,
      message: `Actualización completada: ${results.dataPointsAdded} puntos de datos en ${executionTime} segundos`
    })
    
  } catch (error) {
    console.error('Error updating BCRA data:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-bcra',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {}
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to update BCRA data', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function performFullUpdate(fetcher: BcraFetcher) {
  console.info('🗑️ Eliminando datos anteriores para actualización completa...')
  
  // Obtener todos los datos
  const bcraData = await fetcher.fetchAllVariables()
  
  // Actualizar o crear variables
  for (const variable of bcraData.variables) {
    await prisma.bcraVariable.upsert({
      where: { variableId: variable.variableId },
      update: {
        ...variable,
        updatedAt: new Date()
      },
      create: variable
    })
  }
  
  // Eliminar datos existentes
  const variableIds = bcraData.variables.map(v => v.variableId)
  await prisma.bcraData.deleteMany({
    where: {
      variableId: { in: variableIds }
    }
  })
  
  // Insertar nuevos datos en batches
  const batchSize = 1000
  let totalInserted = 0
  
  for (let i = 0; i < bcraData.data.length; i += batchSize) {
    const batch = bcraData.data.slice(i, i + batchSize)
    
    const result = await prisma.bcraData.createMany({
      data: batch,
      skipDuplicates: true
    })
    
    totalInserted += result.count
    console.info(`  Procesados ${totalInserted}/${bcraData.data.length} puntos de datos`)
  }
  
  return {
    variablesUpdated: bcraData.variables.length,
    dataPointsAdded: totalInserted,
    details: bcraData.variables.map(v => ({
      id: v.variableId,
      name: v.variableName,
      lastValue: v.lastValueInformed,
      lastDate: v.lastDateInformed
    }))
  }
}

async function performIncrementalUpdate(fetcher: BcraFetcher) {
  // Obtener variables existentes
  const existingVariables = await prisma.bcraVariable.findMany({
    where: { isActive: true }
  })
  
  if (existingVariables.length === 0) {
    console.info('📥 No hay variables existentes, ejecutando actualización completa')
    return performFullUpdate(fetcher)
  }
  
  let totalDataPoints = 0
  const details = []
  
  for (const variable of existingVariables) {
    // Obtener la última fecha de datos para esta variable
    const lastData = await prisma.bcraData.findFirst({
      where: { variableId: variable.variableId },
      orderBy: { date: 'desc' }
    })
    
    const fromDate = lastData ? new Date(lastData.date) : undefined
    
    // Obtener solo datos nuevos
    const newData = await fetcher.fetchLatestData(variable.variableId, fromDate)
    
    if (newData.length > 0) {
      // Preparar datos para inserción
      const dataPoints = newData.map(point => ({
        variableId: variable.variableId,
        date: new Date(point.fecha),
        value: point.valor
      }))
      
      // Insertar nuevos datos
      const result = await prisma.bcraData.createMany({
        data: dataPoints,
        skipDuplicates: true
      })
      
      totalDataPoints += result.count
      
      // Actualizar metadata de la variable
      const lastPoint = newData[newData.length - 1]
      await prisma.bcraVariable.update({
        where: { variableId: variable.variableId },
        data: {
          lastDateInformed: new Date(lastPoint.fecha),
          lastValueInformed: lastPoint.valor,
          updatedAt: new Date()
        }
      })
      
      details.push({
        id: variable.variableId,
        name: variable.variableName,
        newDataPoints: result.count,
        lastValue: lastPoint.valor,
        lastDate: lastPoint.fecha
      })
    }
  }
  
  return {
    variablesUpdated: existingVariables.length,
    dataPointsAdded: totalDataPoints,
    details
  }
}

// Endpoint GET para consultar datos
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const variableId = searchParams.get('variableId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    
    const where: any = {}
    
    if (variableId) {
      where.variableId = parseInt(variableId)
    }
    
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }
    
    const data = await prisma.bcraData.findMany({
      where,
      include: {
        variable: true
      },
      orderBy: { date: 'desc' },
      take: 1000
    })
    
    return NextResponse.json({
      success: true,
      count: data.length,
      data
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch BCRA data', details: (error as Error).message },
      { status: 500 }
    )
  }
}