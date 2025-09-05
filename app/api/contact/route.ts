// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { headers } from 'next/headers'

// Validación básica anti-spam
function calculateSpamScore(data: any): number {
  let score = 0
  
  // Check for common spam patterns
  const message = data.message.toLowerCase()
  const spamWords = ['viagra', 'casino', 'lottery', 'winner', 'click here', 'buy now']
  
  spamWords.forEach(word => {
    if (message.includes(word)) score += 20
  })
  
  // Too many links
  const urlCount = (message.match(/https?:\/\//g) || []).length
  if (urlCount > 3) score += urlCount * 10
  
  // All caps
  if (message === message.toUpperCase() && message.length > 10) score += 30
  
  // Very short message
  if (message.length < 10) score += 20
  
  return Math.min(score, 100)
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { userId } = await auth()
    
    // Validación básica
    if (!data.name || !data.email || !data.message || !data.contact_type) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      )
    }
    
    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }
    
    // Obtener metadata
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || undefined
    const referrer = headersList.get('referer') || undefined
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] || 
                      headersList.get('x-real-ip') || 
                      undefined
    
    // Calcular spam score
    const spamScore = calculateSpamScore(data)
    const isSpam = spamScore > 50
    
    // Crear submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        subject: data.subject?.trim() || null,
        message: data.message.trim(),
        contactType: data.contact_type,
        userId: userId || null,
        userAgent,
        ipAddress,
        referrer,
        spamScore,
        isSpam,
        status: isSpam ? 'spam' : 'pending',
        priority: data.contact_type === 'bug' ? 'high' : 'normal'
      }
    })
    
    // TODO: Aquí podrías enviar un email de notificación
    // await sendNotificationEmail(submission)
    
    return NextResponse.json({
      success: true,
      message: 'Tu mensaje ha sido enviado correctamente. Te responderemos dentro de las próximas 12 horas.',
      id: submission.id
    })
    
  } catch (error) {
    console.error('Error al procesar contact submission:', error)
    return NextResponse.json(
      { success: false, error: 'Error al procesar tu mensaje. Por favor, intentá nuevamente.' },
      { status: 500 }
    )
  }
}

// GET - Para admins ver todos los submissions
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Verificar si es admin
  const userProfile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { role: true }
  })
  
  if (userProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined
    const contactType = searchParams.get('type') || undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    
    const where = {
      ...(status && { status }),
      ...(contactType && { contactType }),
      isSpam: false // No mostrar spam por defecto
    }
    
    const [submissions, total] = await Promise.all([
      prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.contactSubmission.count({ where })
    ])
    
    return NextResponse.json({
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { error: 'Error al obtener los mensajes' },
      { status: 500 }
    )
  }
}