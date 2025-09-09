// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Función para enviar email de notificación
async function sendAdminNotification(
  type: 'user_created' | 'user_updated' | 'user_deleted',
  userData: {
    userId: string;
    email: string;
    name?: string | null;
    imageUrl?: string | null;
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

    let subject = '';
    let html = '';
    
    switch (type) {
      case 'user_created':
        subject = `🎉 Nuevo usuario en ArgenStats: ${userData.email}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
                .info-row { margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
                .label { font-weight: 600; color: #6b7280; }
                .value { color: #111827; margin-left: 10px; }
                .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎉 Nuevo Usuario Registrado</h1>
                </div>
                <div class="content">
                  <p style="color: #6b7280; margin-bottom: 20px;">
                    Un nuevo usuario se ha registrado en ArgenStats:
                  </p>
                  
                  <div class="info-row">
                    <span class="label">Email:</span>
                    <span class="value">${userData.email}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Nombre:</span>
                    <span class="value">${userData.name || 'No especificado'}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="label">ID de Usuario:</span>
                    <span class="value" style="font-family: monospace;">${userData.userId}</span>
                  </div>
                  
                  <div class="info-row">
                    <span class="label">Fecha:</span>
                    <span class="value">${new Date().toLocaleString('es-AR', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                      timeZone: 'America/Argentina/Buenos_Aires'
                    })}</span>
                  </div>
                  
                  <a href="${appUrl}/admin/users/${userData.userId}" class="button">
                    Ver en Panel Admin
                  </a>
                  
                  <div class="footer">
                    <p>Total de usuarios: Se calculará en el próximo reporte</p>
                    <p style="font-size: 12px; color: #9ca3af;">
                      Este es un email automático de ArgenStats
                    </p>
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
                .header { background: #3b82f6; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin: 0;">Usuario Actualizado</h2>
                </div>
                <div class="content">
                  <p><strong>Email:</strong> ${userData.email}</p>
                  <p><strong>Nombre:</strong> ${userData.name || 'No especificado'}</p>
                  <p><strong>ID:</strong> ${userData.userId}</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
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
                .header { background: #ef4444; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
                .content { background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2 style="margin: 0;">Usuario Eliminado</h2>
                </div>
                <div class="content">
                  <p><strong>Email:</strong> ${userData.email}</p>
                  <p><strong>ID:</strong> ${userData.userId}</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR')}</p>
                  <p style="color: #6b7280; margin-top: 20px;">
                    El usuario ha sido marcado como inactivo en la base de datos.
                  </p>
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
        metadata: userData,
      }
    });
    
    if (error) {
      console.error('❌ Error enviando email:', error);
    } else {
      console.log('✅ Email enviado:', data?.id);
    }
    
  } catch (error) {
    console.error('❌ Error en sendAdminNotification:', error);
    // No lanzar error para no fallar el webhook
  }
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET to .env.local');
  }
  console.log('WEBHOOK_SECRET', WEBHOOK_SECRET);
  console.log('req', req);
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
  
  let evt: WebhookEvent;
  
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', { status: 400 });
  }
  
  // Log del evento
  const eventType = evt.type;
  console.log(`📌 Webhook recibido: ${eventType}`);
  
  // Guardar log del webhook
  await prisma.webhookLog.create({
    data: {
      event: eventType,
      payload: evt.data as any,
      status: 'processing',
    }
  });
  
  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url, primary_email_address_id } = evt.data;
    
    const primaryEmail = email_addresses.find(
      (email: any) => email.id === primary_email_address_id
    );
    
    if (!primaryEmail) {
      return new Response('No primary email found', { status: 400 });
    }
    
    try {
      // Crear o actualizar el perfil del usuario
      const userProfile = await prisma.userProfile.upsert({
        where: { userId: id },
        create: {
          userId: id,
          email: primaryEmail.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          imageUrl: image_url || null,
          role: 'user',
        },
        update: {
          email: primaryEmail.email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
          imageUrl: image_url || null,
        },
      });
      
      console.log(`✅ Usuario ${eventType === 'user.created' ? 'creado' : 'actualizado'}: ${primaryEmail.email_address}`);
      
      // Enviar notificación por email
      await sendAdminNotification(
        eventType === 'user.created' ? 'user_created' : 'user_updated',
        {
          userId: id || '',
          email: primaryEmail.email_address,
          name: userProfile.name,
          imageUrl: userProfile.imageUrl,
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
            }
          }
        });
        
        // Actualizar estadísticas diarias
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await prisma.dailyStats.upsert({
          where: { date: today },
          create: {
            date: today,
            newUsers: 1,
            totalUsers: await prisma.userProfile.count(),
          },
          update: {
            newUsers: { increment: 1 },
            totalUsers: await prisma.userProfile.count(),
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
      console.error('Error syncing user:', error);
      
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
    const { id } = evt.data;
    
    try {
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
        
        // Enviar notificación al administrador sobre la eliminación del usuario
        try {
          await sendAdminNotification('user_deleted', {
            userId: id ?? '',
            email: user.email ?? '',
            name: user.name ?? '',
          });
        } catch (notifyError) {
          console.error('Error enviando notificación al administrador:', notifyError);
        }
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return new Response('Database error', { status: 500 });
    }
  }
  
  return new Response('Webhook processed successfully', { status: 200 });
}