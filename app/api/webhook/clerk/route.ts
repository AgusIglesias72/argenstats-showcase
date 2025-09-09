// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Tipo personalizado para el evento de Clerk
interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
      verification: {
        status: string;
        strategy: string;
      };
    }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    profile_image_url: string | null;
    username: string | null;
    created_at: number;
    updated_at: number;
    external_accounts?: Array<{
      provider: string;
      email_address: string;
      first_name: string | null;
      last_name: string | null;
      image_url: string | null;
      avatar_url: string | null;
    }>;
  };
  event_attributes?: {
    http_request?: {
      client_ip: string;
      user_agent: string;
    };
  };
  type: string;
  object: string;
  timestamp: number;
}

// Función mejorada para enviar email de notificación
async function sendAdminNotification(
  type: 'user_created' | 'user_updated' | 'user_deleted',
  userData: {
    userId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
    createdAt?: Date;
    ipAddress?: string;
    userAgent?: string;
    provider?: string;
  }
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://argenstats.com';
    const adminEmail = process.env.ADMIN_EMAIL;
    const fromEmail = process.env.FROM_EMAIL || 'info@argenstats.com';
    
    if (!adminEmail || !process.env.RESEND_API_KEY) {
      console.log('⚠️ Email no configurado, saltando notificación');
      return;
    }

    // Obtener total de usuarios activos
    const totalUsers = await prisma.userProfile.count({ where: { isActive: true } });
    
    let subject = '';
    let html = '';
    
    switch (type) {
      case 'user_created':
        subject = `🎉 Nuevo usuario #${totalUsers}: ${userData.email}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; }
                .card { background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .header h1 { margin: 0; font-size: 24px; }
                .header .subtitle { opacity: 0.9; margin-top: 5px; font-size: 14px; }
                .content { padding: 30px; }
                .info-grid { display: grid; gap: 15px; margin: 20px 0; }
                .info-item { display: flex; align-items: flex-start; padding: 12px; background: #f9fafb; border-radius: 8px; }
                .info-icon { width: 40px; height: 40px; background: #e0e7ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0; }
                .info-content { flex: 1; }
                .info-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
                .info-value { color: #111827; font-size: 15px; word-break: break-all; }
                .stats-row { display: flex; gap: 15px; margin: 25px 0; padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; }
                .stat-item { flex: 1; text-align: center; }
                .stat-number { font-size: 28px; font-weight: bold; color: #1e40af; }
                .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
                .button:hover { background: #5a67d8; }
                .meta-info { margin-top: 30px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
                .meta-info .title { font-weight: 600; color: #92400e; margin-bottom: 8px; }
                .meta-info .detail { font-size: 13px; color: #78350f; margin: 4px 0; font-family: monospace; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
                .avatar { width: 60px; height: 60px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="header">
                    <h1>🎉 Nuevo Usuario Registrado</h1>
                    <div class="subtitle">Usuario #${totalUsers} en ArgenStats</div>
                  </div>
                  <div class="content">
                    ${userData.imageUrl ? `
                      <div style="text-align: center; margin: -50px 0 20px 0;">
                        <img src="${userData.imageUrl}" alt="Avatar" class="avatar">
                      </div>
                    ` : ''}
                    
                    <div class="info-grid">
                      <div class="info-item">
                        <div class="info-icon">📧</div>
                        <div class="info-content">
                          <div class="info-label">Email</div>
                          <div class="info-value">${userData.email}</div>
                        </div>
                      </div>
                      
                      <div class="info-item">
                        <div class="info-icon">👤</div>
                        <div class="info-content">
                          <div class="info-label">Nombre</div>
                          <div class="info-value">${userData.name || 'No especificado'}</div>
                        </div>
                      </div>
                      
                      ${userData.provider ? `
                        <div class="info-item">
                          <div class="info-icon">🔐</div>
                          <div class="info-content">
                            <div class="info-label">Método de registro</div>
                            <div class="info-value">${userData.provider === 'oauth_google' ? 'Google OAuth' : userData.provider}</div>
                          </div>
                        </div>
                      ` : ''}
                      
                      <div class="info-item">
                        <div class="info-icon">🕐</div>
                        <div class="info-content">
                          <div class="info-label">Fecha de registro</div>
                          <div class="info-value">${new Date().toLocaleString('es-AR', {
                            dateStyle: 'full',
                            timeStyle: 'short',
                            timeZone: 'America/Argentina/Buenos_Aires'
                          })}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div class="stats-row">
                      <div class="stat-item">
                        <div class="stat-number">${totalUsers}</div>
                        <div class="stat-label">Total Usuarios</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number">${new Date().getHours()}</div>
                        <div class="stat-label">Hora del día</div>
                      </div>
                    </div>
                    
                    ${(userData.ipAddress || userData.userAgent) ? `
                      <div class="meta-info">
                        <div class="title">📍 Información de conexión</div>
                        ${userData.ipAddress ? `<div class="detail">IP: ${userData.ipAddress}</div>` : ''}
                        ${userData.userAgent ? `<div class="detail">Dispositivo: ${userData.userAgent.includes('iPhone') ? '📱 iPhone' : userData.userAgent.includes('Android') ? '📱 Android' : '💻 Desktop'}</div>` : ''}
                      </div>
                    ` : ''}
                    
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${appUrl}/admin/users/${userData.userId}" class="button">
                        Ver en Panel Admin →
                      </a>
                    </div>
                    
                    <div class="footer">
                      <p style="margin: 5px 0;">ID: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${userData.userId}</code></p>
                      <p style="font-size: 12px; color: #9ca3af;">
                        Este es un email automático de ArgenStats
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'user_updated':
        subject = `📝 Usuario actualizado: ${userData.email}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: white; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
                .info-row { margin: 12px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
                .label { font-weight: 600; color: #6b7280; }
                .value { color: #111827; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin: 0;">📝 Usuario Actualizado</h2>
                </div>
                <div class="content">
                  <div class="info-row">
                    <span class="label">Email:</span> <span class="value">${userData.email}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Nombre:</span> <span class="value">${userData.name || 'No especificado'}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">ID:</span> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${userData.userId}</code>
                  </div>
                  <div class="info-row">
                    <span class="label">Fecha:</span> <span class="value">${new Date().toLocaleString('es-AR')}</span>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
        
      case 'user_deleted':
        subject = `🗑️ Usuario eliminado: ${userData.email}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #ef4444; color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: white; padding: 25px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
                .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin: 0;">🗑️ Usuario Eliminado</h2>
                </div>
                <div class="content">
                  <p><strong>Email:</strong> ${userData.email}</p>
                  <p><strong>ID:</strong> <code>${userData.userId}</code></p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
                  <div class="warning">
                    <strong>⚠️ Nota:</strong> El usuario ha sido marcado como inactivo en la base de datos.
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;
    }
    
    // Enviar email
    const { data, error } = await resend.emails.send({
      from: `ArgenStats <${fromEmail}>`,
      to: [adminEmail],
      subject,
      html,
      // Opcional: agregar reply-to
      replyTo: userData.email,
    });
    
    // Guardar en base de datos
    await prisma.emailNotification.create({
      data: {
        to: adminEmail,
        subject,
        type,
        userId: userData.userId,
        resendId: data?.id,
        status: error ? 'failed' : 'sent',
        error: error?.message,
        metadata: userData as any,
      }
    });
    
    if (error) {
      console.error('❌ Error enviando email:', error);
    } else {
      console.log('✅ Email enviado exitosamente:', data?.id);
    }
    
  } catch (error) {
    console.error('❌ Error en sendAdminNotification:', error);
    // No lanzar error para no fallar el webhook
  }
}

export async function POST(req: Request) {
  console.log('Webhook recibido')
  console.log(req)

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
  }
  
  // Obtener headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', { status: 400 });
  }
  
  // Obtener el body
  const payload = await req.json();
  const body = JSON.stringify(payload);
  
  // Crear instancia de Svix con el secret
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt: ClerkUserEvent;
  
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 });
  }
  
  // Log del evento
  const eventType = evt.type;
  console.log(`📌 Webhook recibido: ${eventType}`);
  console.log('📦 Datos recibidos:', JSON.stringify(evt.data, null, 2));
  
  // Guardar log del webhook
  await prisma.webhookLog.create({
    data: {
      event: eventType,
      payload: evt as any,
      status: 'processing',
    }
  });
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    try {
      // Extraer datos correctamente de la estructura del evento
      const userData = evt.data;
      const { 
        id, 
        email_addresses, 
        first_name, 
        last_name, 
        image_url, 
        profile_image_url,
        primary_email_address_id,
        external_accounts 
      } = userData;
      
      // Buscar el email primario
      const primaryEmail = email_addresses?.find(
        (email) => email.id === primary_email_address_id
      );
      
      if (!primaryEmail) {
        console.error('❌ No se encontró email primario');
        return new Response('No primary email found', { status: 400 });
      }
      
      // Obtener el proveedor de autenticación
      const authProvider = external_accounts?.[0]?.provider || 'email';
      
      // Construir el nombre completo
      const fullName = `${first_name || ''} ${last_name || ''}`.trim() || null;
      
      // Usar la mejor imagen disponible
      const userImage = image_url || profile_image_url || external_accounts?.[0]?.avatar_url || null;
      
      // Crear o actualizar el perfil del usuario
      const userProfile = await prisma.userProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          email: primaryEmail.email_address,
          name: fullName,
          imageUrl: userImage,
          role: 'user',
          isActive: true,
        },
        update: {
          email: primaryEmail.email_address,
          name: fullName,
          imageUrl: userImage,
          isActive: true,
          deletedAt: null, // Limpiar si el usuario se reactiva
        },
      });
      
      console.log(`✅ Usuario ${eventType === 'user.created' ? 'creado' : 'actualizado'}: ${primaryEmail.email_address}`);
      
      // Extraer información adicional del evento
      const eventAttributes = evt.event_attributes;
      const ipAddress = eventAttributes?.http_request?.client_ip;
      const userAgent = eventAttributes?.http_request?.user_agent;
      
      // Enviar notificación por email con datos enriquecidos
      await sendAdminNotification(
        eventType === 'user.created' ? 'user_created' : 'user_updated',
        {
          userId: id,
          email: primaryEmail.email_address,
          name: fullName,
          imageUrl: userImage,
          createdAt: new Date(userData.created_at),
          ipAddress,
          userAgent,
          provider: authProvider,
        }
      );
      
      // Si es un nuevo usuario, crear evento de bienvenida
      if (eventType === 'user.created') {
        await prisma.userEvent.create({
          data: {
            userId: id,
            type: 'WELCOME',
            metadata: {
              source: 'clerk_webhook',
              provider: authProvider,
              ip: ipAddress,
              userAgent,
            }
          }
        });
        
        // Actualizar estadísticas diarias
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalUsers = await prisma.userProfile.count({ where: { isActive: true } });
        
        await prisma.dailyStats.upsert({
          where: { date: today },
          create: {
            date: today,
            newUsers: 1,
            totalUsers,
          },
          update: {
            newUsers: { increment: 1 },
            totalUsers,
          }
        });
      }
      
      // Actualizar log como exitoso
      await prisma.webhookLog.updateMany({
        where: {
          event: eventType,
          status: 'processing',
        },
        data: {
          status: 'success',
        }
      });
      
    } catch (error) {
      console.error('❌ Error sincronizando usuario:', error);
      
      // Actualizar log como error
      await prisma.webhookLog.updateMany({
        where: {
          event: eventType,
          status: 'processing',
        },
        data: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      });
      
      return new Response('Database error', { status: 500 });
    }
  }
  
  if (eventType === 'user.deleted') {
    try {
      const userData = evt.data;
      const { id } = userData;
      
      if (!id) {
        console.error('❌ No se encontró ID de usuario');
        return new Response('No user ID found', { status: 400 });
      }
      
      // Obtener datos del usuario antes de eliminarlo
      const user = await prisma.userProfile.findUnique({
        where: { userId: id }
      });
      
      if (user) {
        // Soft delete: marcar como inactivo
        await prisma.userProfile.update({
          where: { userId: id },
          data: { 
            isActive: false,
            deletedAt: new Date(),
          }
        });
        
        console.log(`✅ Usuario desactivado: ${id}`);
        
        // Enviar notificación al administrador
        await sendAdminNotification('user_deleted', {
          userId: id,
          email: user.email,
          name: user.name,
          imageUrl: user.imageUrl,
        });
        
        // Actualizar estadísticas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const totalUsers = await prisma.userProfile.count({ where: { isActive: true } });
        
        await prisma.dailyStats.upsert({
          where: { date: today },
          update: {
            totalUsers,
          },
          create: {
            date: today,
            totalUsers,
            newUsers: 0,
          }
        });
      }
      
      // Actualizar log como exitoso
      await prisma.webhookLog.updateMany({
        where: {
          event: eventType,
          status: 'processing',
        },
        data: {
          status: 'success',
        }
      });
      
    } catch (error) {
      console.error('❌ Error eliminando usuario:', error);
      
      // Actualizar log como error
      await prisma.webhookLog.updateMany({
        where: {
          event: eventType,
          status: 'processing',
        },
        data: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      });
      
      return new Response('Database error', { status: 500 });
    }
  }
  
  return new Response('Webhook processed successfully', { status: 200 });
}