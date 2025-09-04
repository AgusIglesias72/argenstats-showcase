import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/v1/(.*)',
  '/api/webhooks/(.*)',
  '/indicadores(.*)',
  '/dolar(.*)',
  '/eventos(.*)',
  '/herramientas(.*)',
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

  // Proteger todas las rutas excepto las públicas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }

  // Protección adicional para rutas admin
  if (isAdminRoute(req)) {
    const { userId } = await auth()
    
    // Lista de IDs de usuarios admin (temporalmente hardcodeado)
    const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',')
    
    if (!userId || !adminUserIds.includes(userId)) {
      return Response.json({ error: 'Admin access required' }, { status: 403 })
    }
  }
})

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
}