import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// Mapeo de tipos de dólar para dolarapi.com
const DOLLAR_TYPE_MAP: Record<string, string> = {
  'oficial': 'OFICIAL',
  'blue': 'BLUE',  
  'bolsa': 'MEP',
  'contadoconliqui': 'CCL',
  'mayorista': 'MAYORISTA',
  'cripto': 'CRYPTO',
  'tarjeta': 'TARJETA'
}

// Mapeo para api.argentinadatos.com
const ARGENTINA_DATOS_MAP: Record<string, string> = {
  'Oficial': 'OFICIAL',
  'Blue': 'BLUE',
  'Bolsa': 'MEP',
  'Contado con liquidación': 'CCL',
  'CCL': 'CCL',
  'MEP': 'MEP',
  'Mayorista': 'MAYORISTA',
  'Cripto': 'CRYPTO',
  'Tarjeta': 'TARJETA',
  'Solidario': 'TARJETA'
}

interface DollarApiResponse {
  moneda: string
  casa: string
  nombre: string
  compra: number
  venta: number
  fechaActualizacion: string
}

interface ArgentinaDatosResponse {
    fecha: string
    casa: string  // Cambio: era 'tipo', ahora es 'casa'
    compra: number
    venta: number
  }

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const startTime = Date.now()
    console.info('🚀 Iniciando actualización del dólar')
    
    // Verificar si necesitamos cargar datos históricos
    const recordCount = await prisma.dollarRates.count()
    let historicalLoaded = 0
    
    if (recordCount < 100) { // Si hay menos de 100 registros, cargar histórico
      console.info('📊 Cargando datos históricos desde ArgenStats')
      historicalLoaded = await loadHistoricalData()
    }
    
    // Obtener datos actuales de dolarapi.com
    const response = await fetch('https://dolarapi.com/v1/dolares', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Argentina-Stats-API/2.0'
      },
      next: { revalidate: 0 }
    })
    
    if (!response.ok) {
      throw new Error(`Error API dolarapi.com: ${response.status}`)
    }
    
    const dollarData: DollarApiResponse[] = await response.json()
    console.info(`📥 Obtenidos ${dollarData.length} tipos de dólar actuales`)
    
    // Fecha actual en timezone Argentina
    const nowArgentina = new Date().toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires"
    })
    const today = new Date(nowArgentina)
    today.setHours(0, 0, 0, 0)
    
    // Actualizar valores del día actual
    const result = await updateTodayRates(dollarData, today)
    
    // Llenar huecos de los últimos 7 días si existen
    const gapsFilled = await fillRecentGaps(dollarData, today)
    
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-dollar',
        executionTime: new Date(),
        status: 'success',
        recordsProcessed: result.updated + result.created + historicalLoaded + gapsFilled,
        results: {
          historicoCargado: historicalLoaded,
          nuevos: result.created,
          actualizados: result.updated,
          sinCambios: result.unchanged,
          huecosLlenados: gapsFilled,
          tipos: result.processedTypes,
          tiempo: `${executionTime}s`,
          ultimaActualizacion: new Date().toISOString()
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      historicoCargado: historicalLoaded,
      nuevos: result.created,
      actualizados: result.updated,
      sinCambios: result.unchanged,
      huecosLlenados: gapsFilled,
      tipos: result.processedTypes,
      ultimaActualizacion: new Date().toISOString(),
      executionTime: `${executionTime}s`
    })
    
  } catch (error) {
    console.error('Error updating dollar rates:', error)
    
    await prisma.cronExecution.create({
      data: {
        taskName: 'update-dollar',
        executionTime: new Date(),
        status: 'error',
        recordsProcessed: 0,
        errorDetails: (error as Error).message,
        results: {}
      }
    })
    
    return NextResponse.json(
      { error: 'Failed to update dollar rates', details: (error as Error).message },
      { status: 500 }
    )
  }
}

/**
 * Carga datos históricos reales desde Argentina Datos API
 */
async function loadHistoricalData() {
    console.info('📈 Obteniendo datos históricos desde api.argentinadatos.com')
    
    try {
      const response = await fetch('https://api.argentinadatos.com/v1/cotizaciones/dolares', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Argentina-Stats-API/2.0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Error obteniendo datos históricos: ${response.status}`)
      }
      
      const historicalData: ArgentinaDatosResponse[] = await response.json()
      console.info(`📊 Recibidos ${historicalData.length} registros históricos`)
      
      // Agrupar por fecha y tipo para obtener un registro por día
      const groupedData = new Map<string, ArgentinaDatosResponse>()
      
      for (const record of historicalData) {
        const date = record.fecha.split('T')[0]
        const casa = record.casa  // Usar 'casa' directamente
        const key = `${date}_${casa}`
        
        // Mantener el último registro del día
        groupedData.set(key, record)
      }
      
      // Preparar datos para inserción
      const dataToInsert = []
      
      for (const [key, record] of groupedData) {
        const [dateStr, casa] = key.split('_')
        
        // Mapear usando el mismo mapa que dolarapi
        const dollarType = DOLLAR_TYPE_MAP[casa]
        
        if (!dollarType) {
          console.warn(`Tipo no mapeado: ${casa}`)
          continue
        }
        
        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)
        
        dataToInsert.push({
          date: date,
          dollarType: dollarType,
          buyPrice: record.compra || 0,
          sellPrice: record.venta || 0
        })
      }
      
      console.info(`💾 Insertando ${dataToInsert.length} registros históricos únicos`)
      
      // Insertar en batches
      const batchSize = 1000
      let totalInserted = 0
      
      for (let i = 0; i < dataToInsert.length; i += batchSize) {
        const batch = dataToInsert.slice(i, i + batchSize)
        
        const result = await prisma.dollarRates.createMany({
          data: batch,
          skipDuplicates: true
        })
        
        totalInserted += result.count
        
        if (totalInserted % 5000 === 0) {
          console.info(`  Progreso: ${totalInserted}/${dataToInsert.length} registros`)
        }
      }
      
      console.info(`✅ Datos históricos cargados: ${totalInserted} registros`)
      return totalInserted
      
    } catch (error) {
      console.error('Error cargando datos históricos:', error)
      return 0
    }
  }

/**
 * Actualiza los rates del día actual
 */
async function updateTodayRates(dollarData: DollarApiResponse[], today: Date) {
  let updated = 0
  let created = 0
  let unchanged = 0
  const processedTypes: string[] = []
  
  for (const dollar of dollarData) {
    try {
      const dollarType = DOLLAR_TYPE_MAP[dollar.casa]
      
      if (!dollarType) {
        console.warn(`Tipo no reconocido: ${dollar.casa}`)
        continue
      }
      
      const existing = await prisma.dollarRates.findUnique({
        where: {
          date_dollarType: {
            date: today,
            dollarType: dollarType
          }
        }
      })
      
      if (existing) {
        const priceChanged = existing.buyPrice !== dollar.compra || 
                           existing.sellPrice !== dollar.venta
        
        await prisma.dollarRates.update({
          where: { id: existing.id },
          data: {
            buyPrice: dollar.compra,
            sellPrice: dollar.venta,
            updatedAt: new Date() // Siempre actualizar timestamp
          }
        })
        
        if (priceChanged) {
          updated++
          console.info(`📊 Actualizado ${dollarType}: ${existing.buyPrice}/${existing.sellPrice} → ${dollar.compra}/${dollar.venta}`)
        } else {
          unchanged++
          console.info(`✅ Timestamp actualizado ${dollarType}: ${dollar.compra}/${dollar.venta}`)
        }
      } else {
        await prisma.dollarRates.create({
          data: {
            date: today,
            dollarType: dollarType,
            buyPrice: dollar.compra,
            sellPrice: dollar.venta
          }
        })
        created++
        console.info(`✨ Nuevo ${dollarType}: ${dollar.compra}/${dollar.venta}`)
      }
      
      processedTypes.push(dollarType)
      
    } catch (error) {
      console.error(`Error procesando ${dollar.casa}:`, error)
    }
  }
  
  return { updated, created, unchanged, processedTypes }
}

/**
 * Llena huecos de los últimos 7 días
 */
async function fillRecentGaps(dollarData: DollarApiResponse[], today: Date) {
  let totalFilled = 0
  
  // Solo verificar últimos 7 días
  const checkDate = new Date(today)
  checkDate.setDate(checkDate.getDate() - 7)
  
  for (const dollar of dollarData) {
    const dollarType = DOLLAR_TYPE_MAP[dollar.casa]
    if (!dollarType) continue
    
    // Verificar cada día
    const currentDate = new Date(checkDate)
    while (currentDate < today) {
      const existing = await prisma.dollarRates.findUnique({
        where: {
          date_dollarType: {
            date: currentDate,
            dollarType: dollarType
          }
        }
      })
      
      if (!existing) {
        // Buscar el valor más reciente anterior
        const previousRecord = await prisma.dollarRates.findFirst({
          where: {
            dollarType: dollarType,
            date: { lt: currentDate }
          },
          orderBy: { date: 'desc' }
        })
        
        if (previousRecord) {
          await prisma.dollarRates.create({
            data: {
              date: new Date(currentDate),
              dollarType: dollarType,
              buyPrice: previousRecord.buyPrice,
              sellPrice: previousRecord.sellPrice
            }
          })
          totalFilled++
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  if (totalFilled > 0) {
    console.info(`🔧 ${totalFilled} huecos llenados en los últimos 7 días`)
  }
  
  return totalFilled
}