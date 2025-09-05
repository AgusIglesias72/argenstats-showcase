// scripts/debug-ipc.ts o app/api/debug-ipc/route.ts
import { prisma } from '@/lib/db/prisma'

async function debugIPCCodes() {
  try {
    console.log('=== VERIFICANDO CÓDIGOS IPC EN LA BASE DE DATOS ===\n')
    
    // 1. Obtener todos los códigos únicos de componentes
    const uniqueComponents = await prisma.ipc.findMany({
      select: {
        componentCode: true,
        component: true,
      },
      distinct: ['componentCode'],
      orderBy: {
        componentCode: 'asc'
      }
    })
    
    console.log('📊 COMPONENTES ÚNICOS ENCONTRADOS:')
    console.log('-----------------------------------')
    uniqueComponents.forEach(item => {
      console.log(`Código: "${item.componentCode}" -> Nombre: "${item.component}"`)
    })
    
    // 2. Verificar qué regiones tienen datos
    const uniqueRegions = await prisma.ipc.findMany({
      select: {
        region: true,
      },
      distinct: ['region'],
      orderBy: {
        region: 'asc'
      }
    })
    
    console.log('\n🗺️ REGIONES ÚNICAS ENCONTRADAS:')
    console.log('--------------------------------')
    uniqueRegions.forEach(item => {
      console.log(`- ${item.region}`)
    })
    
    // 3. Verificar combinaciones disponibles
    const combinations = await prisma.ipc.groupBy({
      by: ['componentCode', 'region'],
      _count: true,
      orderBy: [
        { componentCode: 'asc' },
        { region: 'asc' }
      ]
    })
    
    console.log('\n🔄 COMBINACIONES DISPONIBLES (Componente + Región):')
    console.log('----------------------------------------------------')
    combinations.forEach(combo => {
      console.log(`${combo.componentCode} + ${combo.region}: ${combo._count} registros`)
    })
    
    // 4. Verificar qué componentes NO están en las constantes actuales
    const IPC_COMPONENTS_KEYS = [
      'GENERAL', 'ALIMENTOS', 'BEBIDAS_ALCOHOLICAS', 'VESTIMENTA',
      'VIVIENDA', 'EQUIPAMIENTO', 'SALUD', 'TRANSPORTE',
      'COMUNICACION', 'RECREACION', 'EDUCACION', 'RESTAURANTES',
      'BYS_DIVERSOS', 'BYS_BIENES', 'BYS_SERVICIOS',
      'NUCLEO', 'ESTACIONAL', 'REGULADOS'
    ]
    
    console.log('\n⚠️ CÓDIGOS EN BD QUE NO ESTÁN EN CONSTANTES:')
    console.log('----------------------------------------------')
    const dbCodes = uniqueComponents.map(c => c.componentCode)
    const missingInConstants = dbCodes.filter(code => !IPC_COMPONENTS_KEYS.includes(code))
    
    if (missingInConstants.length > 0) {
      missingInConstants.forEach(code => {
        const item = uniqueComponents.find(c => c.componentCode === code)
        console.log(`❌ "${code}" -> "${item?.component}"`)
      })
    } else {
      console.log('✅ Todos los códigos de la BD están en las constantes')
    }
    
    console.log('\n⚠️ CÓDIGOS EN CONSTANTES QUE NO ESTÁN EN BD:')
    console.log('----------------------------------------------')
    const missingInDB = IPC_COMPONENTS_KEYS.filter(code => !dbCodes.includes(code))
    
    if (missingInDB.length > 0) {
      missingInDB.forEach(code => {
        console.log(`❌ "${code}"`)
      })
    } else {
      console.log('✅ Todos los códigos de las constantes están en la BD')
    }
    
    // 5. Última fecha disponible
    const lastDate = await prisma.ipc.findFirst({
      select: { date: true },
      orderBy: { date: 'desc' }
    })
    
    console.log('\n📅 ÚLTIMA FECHA CON DATOS:', lastDate?.date)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Si es un script independiente
debugIPCCodes()

// Si prefieres usarlo como API route:
export async function GET() {
  const results = await debugIPCCodes()
  return Response.json({ message: 'Check server console for results' })
}