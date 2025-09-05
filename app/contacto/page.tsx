// app/contacto/page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Code, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { XIcon } from '@/components/ui/social-icons'
import { toast } from 'sonner'
import { Header } from '@/components/layout/header'

const contactTypes = [
  {
    id: 'general',
    label: 'Consulta General',
    icon: MessageSquare,
    description: 'Preguntas generales sobre ArgenStats',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20'
  },
  {
    id: 'api',
    label: 'API / Integración',
    icon: Code,
    description: 'Dudas técnicas sobre nuestra API',
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-900/20'
  },
  {
    id: 'bug',
    label: 'Reportar Bug',
    icon: Bug,
    description: 'Encontraste un error o problema',
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-900/20'
  },
  {
    id: 'feature',
    label: 'Solicitar Feature',
    icon: Lightbulb,
    description: 'Ideas para nuevas funcionalidades',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20'
  }
]

const faqs = [
  {
    question: "¿La API es gratuita?",
    answer: "Sí, nuestra API ofrece un plan gratuito con 100 requests por hora. También tenemos planes pagos para mayor volumen."
  },
  {
    question: "¿Con qué frecuencia se actualizan los datos?",
    answer: "Los datos se actualizan en tiempo real cuando están disponibles, siguiendo el calendario oficial del INDEC y otros organismos."
  },
  {
    question: "¿Puedo usar los datos en mi aplicación?",
    answer: "Absolutamente. Todos nuestros datos son públicos y pueden ser utilizados libremente en cualquier proyecto con tu API key."
  },
  {
    question: "¿Tienen documentación de la API?",
    answer: "Sí, tenemos documentación completa con ejemplos en múltiples lenguajes. Cada endpoint también incluye documentación via OPTIONS."
  }
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    contact_type: 'general'
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.message.trim()) {
      newErrors.message = 'El mensaje es requerido'
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'El mensaje debe tener al menos 10 caracteres'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setFormData({
          name: '',
          email: '',
          subject: '',
          message: '',
          contact_type: 'general'
        })
      } else {
        toast.error(result.error || 'Error al enviar el mensaje')
      }
    } catch (error) {
      toast.error('Error de conexión. Inténtalo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-full mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Contacto
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              ¿Tenés preguntas, sugerencias o necesitás ayuda? Estamos acá para ayudarte.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mensaje Personal */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl p-8 md:p-12 border border-blue-100 dark:border-gray-700">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Tu opinión nos importa muchísimo
              </h2>
              
              <div className="max-w-3xl mx-auto space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                <p className="text-lg">
                  ArgenStats está en constante evolución y <strong>tu feedback es fundamental</strong> para 
                  que podamos mejorar y crear exactamente lo que necesitás.
                </p>
                
                <p>
                  Ya sea que tengas una consulta técnica, hayas encontrado un bug, tengas una idea 
                  brillante para una nueva funcionalidad, o simplemente quieras saludarnos, 
                  <strong> ¡queremos escucharte!</strong>
                </p>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  <span>Respuesta en 12 horas</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
                  <Mail className="w-5 h-5" />
                  <span>Respuesta personalizada</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Formulario de Contacto */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-5 gap-12">
            
            {/* Información de Contacto */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="md:col-span-2"
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                ¿Cómo podemos ayudarte?
              </h2>
              
              <div className="space-y-4 mb-8">
                {contactTypes.map((type) => {
                  const IconComponent = type.icon
                  return (
                    <div key={type.id} className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                      <div className={`w-12 h-12 ${type.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`w-6 h-6 ${type.color}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {type.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {type.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Enlaces directos */}
              <div className="space-y-3">
                <a
                  href="mailto:info@argenstats.com"
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>info@argenstats.com</span>
                </a>
                <a
                  href="https://x.com/ArgenstatsAR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <XIcon className="w-5 h-5" />
                  <span>@ArgenstatsAR</span>
                </a>
              </div>
            </motion.div>

            {/* Formulario */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="md:col-span-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Tipo de Consulta */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Consulta *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {contactTypes.map((type) => {
                      const IconComponent = type.icon
                      const isSelected = formData.contact_type === type.id
                      
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => handleInputChange('contact_type', type.id)}
                          className={`
                            flex items-center gap-2 p-3 rounded-lg border-2 transition-all
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }
                          `}
                        >
                          <IconComponent className={`w-4 h-4 ${type.color}`} />
                          <span className={`text-sm font-medium ${
                            isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {type.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Nombre */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Tu nombre completo"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200`}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email *
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200`}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {/* Asunto */}
                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Asunto
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Resumen de tu consulta"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>

                {/* Mensaje */}
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    placeholder="Describe tu consulta en detalle..."
                    rows={5}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      errors.message ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 dark:bg-gray-700 dark:text-white transition-colors duration-200 resize-none`}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600">{errors.message}</p>
                  )}
                </div>

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensaje
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Al enviar este formulario, aceptás que procesemos tu información para responder a tu consulta.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Antes de contactarnos, revisá si tu pregunta ya tiene respuesta.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}