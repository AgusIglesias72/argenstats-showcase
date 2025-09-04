// /lib/api/cache.ts
import { NextRequest } from 'next/server'
import { getCached as redisGetCached, setCached as redisSetCached, invalidateCache as redisInvalidateCache } from './redis'

export function getCacheKey(request: NextRequest): string {
  const url = new URL(request.url)
  const params = url.searchParams.toString()
  return `inflation:${params || 'default'}`
}

// Re-exportar las funciones de Redis
export const getCached = redisGetCached
export const setCached = redisSetCached
export const invalidateCache = redisInvalidateCache