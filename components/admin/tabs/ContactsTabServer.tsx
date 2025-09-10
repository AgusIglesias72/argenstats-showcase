import { prisma } from '@/lib/db/prisma'
import { clerkClient } from '@clerk/nextjs/server'
import ContactsTabClient from './ContactTabsClient'

export default async function ContactsTabServer() {
  try {
    // Obtener todos los contactos de la base de datos
    const contacts = await prisma.contactSubmission.findMany({
      include: {
        user: true // Incluir datos del usuario si existe
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Obtener suscriptores del newsletter
    const newsletterSubscribers = await prisma.newsletter.findMany({
      orderBy: {
        subscribedAt: 'desc'
      }
    })

    // Obtener usuarios de Clerk para cruzar datos
    const client = await clerkClient()
    const clerkUsers = await client.users.getUserList({
      limit: 500
    })

    // Crear un mapa de emails de usuarios registrados
    const registeredEmails = new Set(
      clerkUsers.data.map(user => 
        user.emailAddresses[0]?.emailAddress?.toLowerCase()
      ).filter(Boolean)
    )

    // Procesar contactos con información adicional
    const processedContacts = contacts.map(contact => {
      const isRegisteredUser = registeredEmails.has(contact.email.toLowerCase())
      
      return {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject || 'Sin asunto',
        message: contact.message,
        contactType: contact.contactType,
        status: contact.status,
        priority: contact.priority,
        createdAt: contact.createdAt.toISOString(),
        repliedAt: contact.repliedAt?.toISOString() || null,
        resolvedAt: contact.resolvedAt?.toISOString() || null,
        isSpam: contact.isSpam,
        spamScore: contact.spamScore,
        adminNotes: contact.adminNotes,
        assignedTo: contact.assignedTo,
        // Datos adicionales
        isRegisteredUser,
        userId: contact.userId,
        userProfile: contact.user ? {
          name: contact.user.name,
          imageUrl: contact.user.imageUrl,
          role: contact.user.role,
          company: contact.user.company,
          position: contact.user.position
        } : null
      }
    })

    // Procesar suscriptores del newsletter con información adicional
    const processedSubscribers = newsletterSubscribers.map(subscriber => {
      const isRegisteredUser = registeredEmails.has(subscriber.email.toLowerCase())
      
      // Buscar si este email tiene contactos previos
      const contactCount = contacts.filter(
        c => c.email.toLowerCase() === subscriber.email.toLowerCase()
      ).length

      return {
        id: subscriber.id,
        email: subscriber.email,
        isActive: subscriber.isActive,
        subscribedAt: subscriber.subscribedAt.toISOString(),
        unsubscribedAt: subscriber.unsubscribedAt?.toISOString() || null,
        source: subscriber.source,
        metadata: subscriber.metadata,
        // Datos adicionales
        isRegisteredUser,
        contactCount,
        daysSinceSubscribed: Math.floor(
          (Date.now() - subscriber.subscribedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
      }
    })

    // Calcular estadísticas
    const stats = {
      contacts: {
        total: contacts.length,
        pending: contacts.filter(c => c.status === 'pending').length,
        inProgress: contacts.filter(c => c.status === 'in_progress').length,
        replied: contacts.filter(c => c.status === 'replied').length,
        resolved: contacts.filter(c => c.status === 'resolved').length,
        spam: contacts.filter(c => c.isSpam).length,
        fromRegisteredUsers: processedContacts.filter(c => c.isRegisteredUser).length
      },
      newsletter: {
        total: newsletterSubscribers.length,
        active: newsletterSubscribers.filter(s => s.isActive).length,
        inactive: newsletterSubscribers.filter(s => !s.isActive).length,
        registeredUsers: processedSubscribers.filter(s => s.isRegisteredUser).length,
        thisMonth: newsletterSubscribers.filter(s => {
          const thisMonth = new Date()
          thisMonth.setDate(1)
          thisMonth.setHours(0, 0, 0, 0)
          return s.subscribedAt >= thisMonth
        }).length
      },
      contactTypes: {
        general: contacts.filter(c => c.contactType === 'general').length,
        api: contacts.filter(c => c.contactType === 'api').length,
        bug: contacts.filter(c => c.contactType === 'bug').length,
        feature: contacts.filter(c => c.contactType === 'feature').length
      },
      priorities: {
        urgent: contacts.filter(c => c.priority === 'urgent').length,
        high: contacts.filter(c => c.priority === 'high').length,
        normal: contacts.filter(c => c.priority === 'normal').length,
        low: contacts.filter(c => c.priority === 'low').length
      }
    }

    return (
      <ContactsTabClient 
        initialContacts={processedContacts}
        initialSubscribers={processedSubscribers}
        initialStats={stats}
      />
    )
  } catch (error) {
    console.error('Error fetching contacts data:', error)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error al cargar contactos
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No se pudieron obtener los datos de contactos
          </p>
        </div>
      </div>
    )
  }
}