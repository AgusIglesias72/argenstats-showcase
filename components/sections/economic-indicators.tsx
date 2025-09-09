// components/sections/economic-indicators.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  TrendingUp, 
  BarChart3, 
  Activity,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  Database
} from 'lucide-react'
import { motion } from 'framer-motion'

interface IndicatorCard {
  id: string
  title: string
  subtitle: string
  description: string
  features: string[]
  badge?: string
  badgeColor?: string
  icon: React.ReactNode
  href: string
  color: string
}

interface AdditionalTool {
  id: string
  title: string
  description: string
  icon: string
  color: string
  href: string
}

export function EconomicIndicatorsSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  const indicators: IndicatorCard[] = [
    {
      id: 'riesgo-pais',
      title: 'Riesgo País',
      subtitle: 'Índice con cálculo proxy inteligente',
      description: 'Cálculo proxy automático cuando JP Morgan presenta demoras. Basado en spreads de bonos soberanos argentinos.',
      features: [
        'Proxy automático en demoras',
        'API para desarrolladores',
        'Datos en tiempo real'
      ],
      badge: 'API Exclusiva',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
      icon: <TrendingUp className="w-6 h-6" />,
      href: '/indicadores/riesgo-pais',
      color: 'from-red-500 to-amber-500'
    },
    {
      id: 'inflacion',
      title: 'Índice de Inflación (IPC)',
      subtitle: 'Análisis completo de precios',
      description: 'Seguimiento detallado del IPC argentino con datos oficiales del INDEC. Análisis por rubros y categorías específicas.',
      features: [
        'Variaciones mensuales',
        'Análisis por rubros',
        'Gráficos interactivos'
      ],
      badge: 'INDEC Oficial',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      icon: <BarChart3 className="w-6 h-6" />,
      href: '/indicadores/inflacion',
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'emae',
      title: 'Actividad Económica (EMAE)',
      subtitle: 'Estimador mensual de actividad',
      description: 'Seguimiento de la actividad económica argentina. Indicador mensual del INDEC que anticipa el comportamiento del PBI.',
      features: [
        'Variación mensual e interanual',
        'Series desestacionalizadas',
        'Índice base 2004=100'
      ],
      badge: 'Actualización Mensual',
      badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      icon: <Activity className="w-6 h-6" />,
      href: '/indicadores/emae',
      color: 'from-blue-500 to-indigo-500'
    }
  ]

  return (
    <>
      {/* Main Economic Indicators Section */}
      <section id="economic-indicators" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Indicadores Económicos de Argentina
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Accedé a datos actualizados de inflación, riesgo país y actividad económica con análisis detallados y visualizaciones interactivas
            </p>
          </motion.div>

          {/* Indicator Cards Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {indicators.map((indicator, index) => (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link href={indicator.href}>
                  <div
                    className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 
                              hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 cursor-pointer
                              hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
                    onMouseEnter={() => setHoveredCard(indicator.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Gradient background on hover */}
                    <div 
                      className={`absolute inset-0 bg-gradient-to-br ${indicator.color} opacity-0 group-hover:opacity-5 
                                  rounded-2xl transition-opacity duration-300`}
                    />
                    
                    {/* Card Content */}
                    <div className="relative flex flex-col h-full">
                      {/* Header with Icon and Badge */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${indicator.color} text-white`}>
                          {indicator.icon}
                        </div>
                        {indicator.badge && (
                          <span className={`text-xs px-2 py-1 rounded-md font-medium ${indicator.badgeColor}`}>
                            {indicator.badge}
                          </span>
                        )}
                      </div>

                      {/* Title and Description */}
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {indicator.title}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        {indicator.subtitle}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 flex-grow">
                        {indicator.description}
                      </p>

                      {/* Features List */}
                      <div className="space-y-2 mb-6">
                        {indicator.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <svg className="w-4 h-4 mr-2 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Action Button - pushed to bottom */}
                      <button className="w-full py-2.5 px-4 bg-gray-900 dark:bg-gray-700 text-white rounded-lg font-medium 
                                       hover:bg-blue-600 dark:hover:bg-blue-600 transition-colors duration-200 
                                       flex items-center justify-center group mt-auto cursor-pointer">
                        <span>Ver {indicator.title.split(' ')[0]}</span>
                        <ArrowRight className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                          hoveredCard === indicator.id ? 'translate-x-1' : ''
                        }`} />
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ¿Necesitás datos específicos o integraciones personalizadas?
            </p>
            <Link href="/contacto">
              <button className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 
                               rounded-lg text-gray-700 dark:text-gray-300 font-medium 
                               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                <AlertCircle className="w-5 h-5 mr-2" />
                Contactar Soporte
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

  
    </>
  )
}