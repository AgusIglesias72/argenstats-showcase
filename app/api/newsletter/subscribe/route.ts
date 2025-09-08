import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('Newsletter POST request received:', {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    })
    
    const { email } = await request.json()
    
    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Por favor ingresá un email válido' },
        { status: 400, headers: corsHeaders }
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
          { status: 200, headers: corsHeaders }
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
          { status: 200, headers: corsHeaders }
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
      { status: 201, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error en suscripción:', error)
    return NextResponse.json(
      { error: 'Hubo un error al procesar tu suscripción. Por favor intentá de nuevo.' },
      { status: 500, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      )
    }

    const subscription = await prisma.newsletter.findUnique({
      where: { email }
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No encontramos tu suscripción' },
        { status: 404, headers: corsHeaders }
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
      { status: 200, headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error al desuscribir:', error)
    return NextResponse.json(
      { error: 'Error al procesar la desuscripción' },
      { status: 500, headers: corsHeaders }
    )
  }
}