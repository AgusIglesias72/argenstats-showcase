import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

interface UpdateResult {
  service: string
  success: boolean
  executionTime: number
  recordsProcessed?: number
  error?: string
  details?: any
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.info('🚀 Iniciando actualización completa de todos los indicadores')
    
    // Lista de todos los servicios de actualización
    const updateServices = [
      { name: 'dollar', url: '/api/internal/update-dollar', priority: 'high' },
      { name: 'ipc', url: '/api/internal/update-ipc', priority: 'high' },
      { name: 'emae', url: '/api/internal/update-emae', priority: 'medium' },
      { name: 'labor-market', url: '/api/internal/update-labor-market', priority: 'medium' },
      { name: 'poverty', url: '/api/internal/update-poverty', priority: 'low' },
      { name: 'country-risk', url: '/api/internal/update-country-risk', priority: 'high' },
      { name: 'bcra', url: '/api/internal/update-bcra', priority: 'medium' }
    ]

    const results: UpdateResult[] = []
    const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : process.env.NEXTAUTH_URL || 'http://localhost:3000'

    // Ejecutar actualizaciones en paralelo por prioridad
    const highPriority = updateServices.filter(s => s.priority === 'high')
    const mediumPriority = updateServices.filter(s => s.priority === 'medium')
    const lowPriority = updateServices.filter(s => s.priority === 'low')

    console.info('🔥 Ejecutando actualizaciones de alta prioridad...')
    const highResults = await Promise.allSettled(
      highPriority.map(service => executeUpdate(service, baseUrl, apiKey))
    )

    console.info('⚡ Ejecutando actualizaciones de media prioridad...')
    const mediumResults = await Promise.allSettled(
      mediumPriority.map(service => executeUpdate(service, baseUrl, apiKey))
    )

    console.info('📊 Ejecutando actualizaciones de baja prioridad...')
    const lowResults = await Promise.allSettled(
      lowPriority.map(service => executeUpdate(service, baseUrl, apiKey))
    )

    // Procesar resultados
    const allResults = [...highResults, ...mediumResults, ...lowResults]
    
    allResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        const service = updateServices[index]
        results.push({
          service: service.name,
          success: false,
          executionTime: 0,
          error: result.reason?.message || 'Unknown error'
        })
      }
    })

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    const successCount = results.filter(r => r.success).length
    const totalRecords = results.reduce((sum, r) => sum + (r.recordsProcessed || 0), 0)

    // Registrar ejecución maestra
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-all',
        executionTime: new Date(),
        status: successCount === results.length ? 'success' : 'partial_success',
        recordsProcessed: totalRecords,
        results: {
          totalServices: results.length,
          successfulServices: successCount,
          failedServices: results.length - successCount,
          totalExecutionTime: `${totalTime}s`,
          totalRecordsProcessed: totalRecords,
          services: results as any
        }
      }
    })

    console.info(`✅ Actualización completa finalizada en ${totalTime}s`)
    console.info(`📊 Servicios: ${successCount}/${results.length} exitosos`)
    console.info(`📈 Registros procesados: ${totalRecords}`)

    return NextResponse.json({
      success: true,
      message: 'Actualización completa ejecutada',
      summary: {
        totalServices: results.length,
        successfulServices: successCount,
        failedServices: results.length - successCount,
        totalExecutionTime: `${totalTime}s`,
        totalRecordsProcessed: totalRecords
      },
      results
    })

  } catch (error) {
    console.error('❌ Error en actualización completa:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-all',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        results: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    return NextResponse.json({
      success: false,
      error: 'Error en actualización completa',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function executeUpdate(service: { name: string; url: string }, baseUrl: string, apiKey: string): Promise<UpdateResult> {
  const startTime = Date.now()
  
  try {
    console.info(`🔄 Ejecutando ${service.name}...`)
    
    const response = await fetch(`${baseUrl}${service.url}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      // Timeout de 5 minutos por servicio
      signal: AbortSignal.timeout(300000)
    })

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`)
    }

    const data = await response.json()
    
    console.info(`✅ ${service.name} completado en ${executionTime}s`)
    
    return {
      service: service.name,
      success: true,
      executionTime: parseFloat(executionTime),
      recordsProcessed: data.recordsProcessed || data.totalProcessed || 0,
      details: data
    }
    
  } catch (error) {
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    console.error(`❌ Error en ${service.name}:`, error)
    
    return {
      service: service.name,
      success: false,
      executionTime: parseFloat(executionTime),
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
