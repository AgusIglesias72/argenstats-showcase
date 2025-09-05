// components/profile/tabs/ContactTab.tsx
'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Mail, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Code, 
  Send, 
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { XIcon } from '@/components/ui/social-icons'

const contactTypes = [
  {
    id: 'general',
    label: 'Consulta General',
    icon: MessageSquare,
    description: 'Preguntas generales sobre ArgenStats'
  },
  {
    id: 'api',
    label: 'API / Integración',
    icon: Code,
    description: 'Dudas técnicas sobre nuestra API'
  },
  {
    id: 'bug',
    label: 'Reportar Bug',
    icon: Bug,
    description: 'Encontraste un error o problema'
  },
  {
    id: 'feature',
    label: 'Solicitar Feature',
    icon: Lightbulb,
    description: 'Ideas para nuevas funcionalidades'
  }
]

export default function ContactTab() {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    contact_type: 'general'
  })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.message.trim()) {
      toast.error('Por favor escribí un mensaje')
      return
    }

    setSending(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.fullName || 'Usuario',
          email: user?.primaryEmailAddress?.emailAddress || '',
          subject: formData.subject,
          message: formData.message,
          contact_type: formData.contact_type
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Mensaje enviado correctamente')
        setFormData({
          subject: '',
          message: '',
          contact_type: 'general'
        })
      } else {
        toast.error(result.error || 'Error al enviar el mensaje')
      }
    } catch (error) {
      toast.error('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Enlaces rápidos */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Enlaces Rápidos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:info@argenstats.com"
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Email</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">info@argenstats.com</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>

          <a
            href="https://x.com/ArgenstatsAR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
          >
            <XIcon className="w-6 h-6 text-gray-900 dark:text-white mr-3" />
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">X (Twitter)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">@ArgenstatsAR</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
        </div>
      </div>

      {/* Formulario de contacto */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Envianos un Mensaje
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          ¿Tenés dudas, sugerencias o encontraste un bug? Estamos para ayudarte.
          Te responderemos dentro de las próximas 12 horas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de consulta
            </label>
            <div className="grid grid-cols-2 gap-3">
              {contactTypes.map((type) => {
                const Icon = type.icon
                const isSelected = formData.contact_type === type.id
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleChange('contact_type', type.id)}
                    className={`
                      flex items-center p-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mr-2 ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`} />
                    <div className="text-left">
                      <p className={`text-sm font-medium ${
                        isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                      }`}>
                        {type.label}
                      </p>
                      <p className={`text-xs ${
                        isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Asunto (opcional)
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="Resumen de tu consulta"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mensaje
            </label>
            <textarea
              rows={5}
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Describe tu consulta en detalle..."
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              <CheckCircle className="inline w-3 h-3 mr-1" />
              Respuesta garantizada en 12 horas
            </p>
            
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar mensaje
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          💡 ¿Sabías que...?
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Tu opinión es muy importante para nosotros. Muchas de las mejores características 
          de ArgenStats surgieron de sugerencias de usuarios como vos. No dudes en compartir 
          cualquier idea que tengas!
        </p>
      </div>
    </div>
  )
}