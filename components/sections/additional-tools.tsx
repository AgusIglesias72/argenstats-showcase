// components/sections/additional-tools.tsx
'use client'

import { useState } from 'react'
import { 
  ChevronRight,
  Database,
  ArrowRight,
  Send,
  Sparkles,
  Clock,
  MessageSquare
} from 'lucide-react'
import { motion } from 'framer-motion'

interface AdditionalTool {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

export function AdditionalToolsSection() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTool, setSelectedTool] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<{email?: string, message?: string}>({})

  const upcomingTools: AdditionalTool[] = [
    {
      id: 'plazo-fijo',
      title: 'Calculadora de Plazo Fijo',
      description: 'Simulá tus inversiones',
      icon: '🏦',
      color: 'text-blue-500'
    },
    {
      id: 'acciones-bonos',
      title: 'Acciones y Bonos',
      description: 'Cotizaciones en tiempo real',
      icon: '📈',
      color: 'text-green-500'
    },
    {
      id: 'salarios',
      title: 'Índice de Salarios',
      description: 'Evolución y comparativas',
      icon: '💰',
      color: 'text-purple-500'
    },
    {
      id: 'cripto',
      title: 'Cotización Cripto',
      description: 'Bitcoin y USDT en pesos',
      icon: '₿',
      color: 'text-orange-500'
    },
    {
      id: 'prestamo-hipotecario',
      title: 'Calculadora de Préstamo Hipotecario',
      description: 'Simulá tu crédito UVA',
      icon: '🏠',
      color: 'text-indigo-500'
    },
    {
      id: 'inflacion-personal',
      title: 'Inflación Personalizada',
      description: 'Calculá tu inflación real',
      icon: '📊',
      color: 'text-red-500'
    }
  ]

  // Validador nativo con mensajes en español
  const validateForm = () => {
    const newErrors: {email?: string, message?: string} = {}

    // Validar email
    if (!email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Por favor ingresá un email válido'
    }

    // Validar mensaje
    if (!message.trim()) {
      newErrors.message = 'Completa este campo'
    } 
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Limpiar errores cuando el usuario empiece a escribir
  const handleInputChange = (field: 'email' | 'message', value: string) => {
    if (field === 'email') {
      setEmail(value)
    } else {
      setMessage(value)
    }
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulario antes de enviar
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      // Preparar el mensaje completo
      const selectedToolName = upcomingTools.find(t => t.id === selectedTool)?.title
      const fullMessage = selectedToolName 
        ? `${message}\n\nHerramienta de interés: ${selectedToolName}`
        : message

      // Subject dinámico basado en la herramienta seleccionada
      const subject = selectedToolName 
        ? `Sugerencia: ${selectedToolName} - ArgenStats`
        : 'Sugerencia de Herramientas - ArgenStats'

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: email.split('@')[0], // Usar parte del email como nombre
          email,
          subject,
          message: fullMessage,
          contact_type: 'feature_request'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitStatus('success')
        setEmail('')
        setMessage('')
        setSelectedTool(null)
        
        // Reset success message after 5 seconds
        setTimeout(() => setSubmitStatus('idle'), 5000)
      } else {
        console.error('Error response:', data)
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Submit error:', error)
      setSubmitStatus('error')
      setErrors({ 
        message: 'Hubo un error al enviar tu sugerencia. Por favor intentá de nuevo.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="relative pb-20 px-4 bg-gradient-to-b from-white to-gray-200
     dark:from-gray-800
     dark:to-gray-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Gradient circles for subtle background effect */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full blur-3xl opacity-60 dark:opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full blur-3xl opacity-30" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-full blur-3xl opacity-20" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-50 dark:opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='gray' stroke-width='0.5' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)' /%3E%3C/svg%3E")`
        }} />
      </div>

      {/* Content container with relative positioning to stay above background */}
      <div className="relative max-w-7xl mx-auto">
        {/* Section Header with Coming Soon Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 
                        dark:from-purple-900/30 dark:to-blue-900/30 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
              Próximamente
            </span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Más Herramientas Financieras
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Estamos trabajando en nuevas herramientas para brindarte la información más completa sobre la economía argentina
          </p>
        </motion.div>

        {/* Tools Grid with Coming Soon Overlay - Updated to 3 columns for 6 items */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {upcomingTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSelectedTool(tool.id)}
              className={`relative cursor-pointer transition-all duration-200 ${
                selectedTool === tool.id ? 'scale-105' : ''
              }`}
            >
              <div className={`group p-5 rounded-xl border-2 transition-all duration-200 backdrop-blur-sm
                            ${selectedTool === tool.id 
                              ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-900/30' 
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/80 dark:bg-gray-800/80'
                            }`}>
                
                {/* Coming Soon Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-blue-500 
                              text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-medium">Pronto</span>
                </div>

                <div className="flex items-start space-x-3">
                  <span className={`text-2xl ${tool.color}`}>{tool.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {tool.description}
                    </p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                                ${selectedTool === tool.id 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300 dark:border-gray-600'}`}>
                    {selectedTool === tool.id && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Form Section - Simplified */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <div className="bg-gradient-to-br from-blue-50/90 to-purple-50/90 dark:from-blue-900/30 dark:to-purple-900/30 
                        rounded-xl p-6 border border-blue-100 dark:border-blue-800 backdrop-blur-sm">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 text-white rounded-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  ¿Qué herramienta necesitás?
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Contanos qué te gustaría que agreguemos
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    className={`w-full px-3 py-2 text-sm border rounded-lg 
                             bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             placeholder-gray-400 dark:placeholder-gray-500
                             ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <textarea
                  value={message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  rows={2}
                  placeholder="Contanos tu sugerencia..."
                  className={`w-full px-3 py-2 text-sm border rounded-lg 
                           bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           placeholder-gray-400 dark:placeholder-gray-500 resize-none
                           ${errors.message ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                />
                {errors.message && (
                  <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                )}
              </div>

              {selectedTool && (
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg px-3 py-2">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Herramienta seleccionada: <span className="font-medium">{upcomingTools.find(t => t.id === selectedTool)?.title}</span>
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                         text-white text-sm font-medium rounded-lg transition-colors duration-200 
                         flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Sugerencia
                  </>
                )}
              </button>

              {/* Status Messages - Simplified */}
              {submitStatus === 'success' && (
                <div className="bg-green-100 dark:bg-green-900/30 rounded-lg px-3 py-2 text-xs text-green-800 dark:text-green-300">
                  {selectedTool 
                    ? `¡Gracias! Recibimos tu sugerencia sobre ${upcomingTools.find(t => t.id === selectedTool)?.title}. Te contactaremos pronto.`
                    : '¡Gracias! Recibimos tu sugerencia. Te contactaremos pronto.'
                  }
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="bg-red-100 dark:bg-red-900/30 rounded-lg px-3 py-2 text-xs text-red-800 dark:text-red-300">
                  Error al enviar. Intentá nuevamente.
                </div>
              )}
            </form>
          </div>
        </motion.div>

      </div>
    </section>
  )
}