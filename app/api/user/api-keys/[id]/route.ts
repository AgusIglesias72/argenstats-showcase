// app/api/user/api-keys/[id]/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// DELETE - Eliminar una API key específica
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verificar que la key pertenece al usuario
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: params.id,
        userId
      }
    })

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Eliminar la key y sus registros de uso (cascade)
    await prisma.apiKey.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Failed to delete API key' }, 
      { status: 500 }
    )
  }
}