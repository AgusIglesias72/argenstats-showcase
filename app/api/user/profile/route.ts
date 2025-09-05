// app/api/user/profile/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET - Obtener perfil del usuario
export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let profile = await prisma.userProfile.findUnique({
      where: { userId }
    })

    // Si no existe el perfil, crearlo con datos básicos
    if (!profile) {
      const user = await auth()
      
      profile = await prisma.userProfile.create({
        data: {
          userId,
          email: user.sessionClaims?.email as string || '',
          name: user.sessionClaims?.fullName as string || '',
          role: 'user'
        }
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' }, 
      { status: 500 }
    )
  }
}

// PUT - Actualizar perfil del usuario
export async function PUT(request: Request) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()
    
    // Limpiar datos - solo permitir campos específicos
    const allowedFields = [
      'name', 'bio', 'location', 'company', 'position',
      'linkedinUrl', 'xUsername', 'githubUrl', 'websiteUrl'
    ]
    
    const updateData: any = {}
    for (const field of allowedFields) {
      if (field in data) {
        updateData[field] = data[field]
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        email: '', // Se actualizará en el próximo GET
        ...updateData
      }
    })

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' }, 
      { status: 500 }
    )
  }
}