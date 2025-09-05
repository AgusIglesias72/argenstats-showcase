// scripts/set-admin.ts
// Ejecutar con: npx tsx scripts/set-admin.ts user@email.com

import { clerkClient } from '@clerk/nextjs/server'

async function setUserAsAdmin(email: string) {
  try {
    const client = await clerkClient()
    
    // Buscar usuario por email
    const users = await client.users.getUserList({
      emailAddress: [email]
    })
    
    if (users.data.length === 0) {
      console.error(`No se encontró usuario con email: ${email}`)
      return
    }
    
    const user = users.data[0]
    
    // Actualizar metadata
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        role: 'admin'
      }
    })
    
    console.log(`✅ Usuario ${email} configurado como admin`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

// Obtener email de los argumentos
const email = process.argv[2]

if (!email) {
  console.error('Por favor proporciona un email')
  console.log('Uso: npx tsx scripts/set-admin.ts user@email.com')
  process.exit(1)
}

// Necesitas configurar tu CLERK_SECRET_KEY
if (!process.env.CLERK_SECRET_KEY) {
  console.error('CLERK_SECRET_KEY no está configurado')
  process.exit(1)
}

setUserAsAdmin(email)