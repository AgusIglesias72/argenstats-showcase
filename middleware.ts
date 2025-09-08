// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-calback(.*)',
  '/documentacion(.*)',
  '/contacto(.*)',
  '/dolar(.*)',
  '/calculadora-inflacion(.*)',
  '/conversor-dolar-peso-argentino(.*)',
  '/indicadores(.*)',
  '/api/v1/(.*)',
  '/api/newsletter/(.*)',
  '/api/conversor/(.*)',
  '/api/webhooks/(.*)',
  '/api/debug',
  '/api/test-redis'
])

const isInternalApiRoute = createRouteMatcher([
  '/api/internal/(.*)',
])

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // Las rutas internas de API requieren API key, no auth de Clerk
  if (isInternalApiRoute(req)) {
    const apiKey = req.headers.get('x-api-key')
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return
  }

  // Manejo especial para /api/contact - POST es público, GET requiere admin
  if (req.nextUrl.pathname === '/api/contact') {
    if (req.method === 'POST') {
      return // Permitir POST sin autenticación
    }
    if (req.method === 'GET') {
      // GET requiere autenticación de admin
      const { userId } = await auth()
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Verificar si es admin (esto se maneja en el endpoint mismo)
      return
    }
  }

  // Proteger rutas admin
  if (isAdminRoute(req)) {
    const { userId } = await auth()
    
    if (!userId) {
      // Redirigir a sign-in si no está autenticado
      const signInUrl = new URL('/sign-in', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return NextResponse.redirect(signInUrl)
    }
    
    try {
      // Importar clerkClient dinámicamente para evitar problemas
      const { clerkClient } = await import('@clerk/nextjs/server')
      const client = await clerkClient()
      const user = await client.users.getUser(userId)
      const isAdmin = user.publicMetadata?.role === 'admin'
      
      if (!isAdmin) {
        // Redirigir a home si no es admin
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Proteger todas las rutas excepto las públicas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
}