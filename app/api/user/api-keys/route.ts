// /app/api/user/api-keys/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSecureApiKey } from '@/lib/utils/crypto'

// GET - Obtener todas las API keys del usuario
export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      key: true,
      tier: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      _count: {
        select: { usage: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(keys)
}

// POST - Crear nueva API key
export async function POST(request: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()
  
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  // Verificar límite de keys por usuario (ej: 5 para free tier)
  const keyCount = await prisma.apiKey.count({
    where: { userId, isActive: true }
  })

  if (keyCount >= 5) {
    return NextResponse.json(
      { error: 'API key limit reached' }, 
      { status: 403 }
    )
  }

  const newKey = await prisma.apiKey.create({
    data: {
      key: createSecureApiKey(),
      name,
      userId,
      tier: 'free' // Por defecto free, luego se puede upgradear
    },
    select: {
      id: true,
      name: true,
      key: true,
      tier: true,
      isActive: true,
      createdAt: true,
      lastUsedAt: true,
      _count: {
        select: { usage: true }
      }
    }
  })

  return NextResponse.json(newKey, { status: 201 })
}