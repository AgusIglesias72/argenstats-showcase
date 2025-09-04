// /app/api/test-redis/route.ts
import { NextResponse } from 'next/server'
import { redis } from '@/lib/api/redis'

export async function GET() {
  try {
    // Test de conexión
    const ping = await redis.ping()
    
    // Test set/get
    await redis.set('test:key', JSON.stringify({ message: 'Hello Redis!', time: new Date() }), 'EX', 60)
    const data = await redis.get('test:key')
    
    // Info de Redis
    const info = await redis.info('server')
    const dbSize = await redis.dbsize()
    
    return NextResponse.json({ 
      success: true,
      ping,
      testData: data ? JSON.parse(data) : null,
      stats: {
        totalKeys: dbSize,
        server: info.split('\n')[0]
      }
    })
  } catch (error: any) {
    return NextResponse.json({ 
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
}