import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Por favor ingresá un email válido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe
    const existingSubscription = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (existingSubscription) {
      if (existingSubscription.isActive) {
        return NextResponse.json(
          { message: 'Ya estás suscripto a nuestro newsletter 🎉' },
          { status: 200 }
        )
      } else {
        // Reactivar suscripción
        await prisma.newsletter.update({
          where: { email },
          data: { 
            isActive: true,
            unsubscribedAt: null,
            subscribedAt: new Date()
          }
        })
        
        return NextResponse.json(
          { message: '¡Bienvenido de vuelta! Tu suscripción ha sido reactivada 🚀' },
          { status: 200 }
        )
      }
    }

    // Crear nueva suscripción
    await prisma.newsletter.create({
      data: {
        email,
        source: 'website',
        metadata: {
          userAgent: request.headers.get('user-agent'),
          timestamp: new Date().toISOString()
        }
      }
    })

    return NextResponse.json(
      { message: '¡Gracias por suscribirte! 🎊 Te mantendremos al tanto de las novedades económicas.' },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error en suscripción:', error)
    return NextResponse.json(
      { error: 'Hubo un error al procesar tu suscripción. Por favor intentá de nuevo.' },
      { status: 500 }
    )
  }
}

// Endpoint para desuscribirse (opcional)
export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    const subscription = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No encontramos tu suscripción' },
        { status: 404 }
      )
    }

    await prisma.newsletter.update({
      where: { email },
      data: { 
        isActive: false,
        unsubscribedAt: new Date()
      }
    })

    return NextResponse.json(
      { message: 'Te has desuscripto exitosamente' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error al desuscribir:', error)
    return NextResponse.json(
      { error: 'Error al procesar la desuscripción' },
      { status: 500 }
    )
  }
}