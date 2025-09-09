// components/sections/api-promotion.tsx
'use client'

import { useState, useEffect } from 'react'
import { 
  Code, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  Database, 
  Share2,
  Terminal,
  FileJson,
  Clock
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export function APIPromotionSection() {
  const [typedText, setTypedText] = useState('')
  const fullText = '$ curl https://argenstats.com/api/v1/inflation'
  
  // Typing animation effect
  useEffect(() => {
    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, 40)
    
    return () => clearInterval(typingInterval)
  }, [])

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Background gradient circles - subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/10 dark:to-cyan-900/10 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-cyan-100 to-indigo-100 dark:from-cyan-900/10 dark:to-indigo-900/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Full width gradient background */}
      <div className="w-full bg-gradient-to-br from-blue-50 via-cyan-50/50 to-indigo-50 dark:from-blue-900/20 dark:via-cyan-900/10 dark:to-indigo-900/20 
                      py-12 md:py-16 border-y border-blue-100 dark:border-blue-800/50 backdrop-blur-sm">
        
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 
                         px-4 py-2 rounded-full text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                API RESTful
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
              >
                Integración Simple y Poderosa
                <span className="block text-blue-600 dark:text-blue-400">API para Desarrolladores</span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                Accedé programáticamente a todos los datos económicos argentinos. 
                Integrá fácilmente en tus aplicaciones, dashboards o análisis con nuestra API intuitiva y bien documentada.
              </motion.p>

              {/* Features */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Endpoints RESTful intuitivos y bien estructurados
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center">
                    <Database className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Datos históricos completos y actualizaciones automáticas
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Respuestas en JSON y CSV según tus necesidades
                  </span>
                </div>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="pt-4"
              >
                <Link href="/documentacion">
                  <button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                                   text-white px-8 py-3 text-lg font-medium rounded-xl shadow-lg hover:shadow-xl 
                                   transition-all duration-300 flex items-center gap-2 cursor-pointer">
                    Ver Documentación API
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
                
                {/* Secondary info */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Documentación completa • Ejemplos de código • Sin autenticación requerida
                </p>
              </motion.div>
            </motion.div>

            {/* Right Side - Terminal */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Terminal Window */}
              <div className="bg-gray-900 dark:bg-gray-950 rounded-xl shadow-2xl overflow-hidden border border-gray-800 dark:border-gray-700">
                {/* Terminal Header */}
                <div className="bg-gray-800 dark:bg-gray-900 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    argenstats.com/api
                  </div>
                </div>
                
                {/* Terminal Content */}
                <div className="p-6 space-y-4 font-mono text-sm">
                  {/* Typing animation for first command */}
                  <div className="text-gray-400">
                    <span className="text-green-400">$</span> {typedText}
                    {typedText.length < fullText.length && (
                      <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
                    )}
                  </div>
                  
                  {/* API Response - Real inflation data structure */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    viewport={{ once: true }}
                    className="text-gray-300 bg-gray-800/50 dark:bg-gray-900/50 p-3 rounded text-xs"
                  >
                    <div className="text-yellow-400">{"{"}</div>
                    <div className="pl-4">
                      <span className="text-blue-400">"success"</span>: <span className="text-green-400">true</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-blue-400">"data"</span>: {"{"}
                    </div>
                    <div className="pl-8">
                      <span className="text-blue-400">"date"</span>: <span className="text-green-400">"2025-07-31T00:00:00.000Z"</span>,
                    </div>
                    <div className="pl-8">
                      <span className="text-blue-400">"component"</span>: {"{"}
                    </div>
                    <div className="pl-12">
                      <span className="text-blue-400">"code"</span>: <span className="text-green-400">"GENERAL"</span>,
                    </div>
                    <div className="pl-12">
                      <span className="text-blue-400">"name"</span>: <span className="text-green-400">"Nivel general"</span>,
                    </div>
                    <div className="pl-12">
                      <span className="text-blue-400">"type"</span>: <span className="text-green-400">"GENERAL"</span>
                    </div>
                    <div className="pl-8">{"},"}</div>
                    <div className="pl-8">
                      <span className="text-blue-400">"region"</span>: <span className="text-green-400">"Nacional"</span>,
                    </div>
                    <div className="pl-8">
                      <span className="text-blue-400">"values"</span>: {"{"}
                    </div>
                    <div className="pl-12">
                      <span className="text-blue-400">"monthly"</span>: <span className="text-orange-400">1.9</span>,
                    </div>
                    <div className="pl-12">
                      <span className="text-blue-400">"yearly"</span>: <span className="text-orange-400">36.6</span>,
                    </div>
                    <div className="pl-12">
                      <span className="text-blue-400">"accumulated"</span>: <span className="text-orange-400">17.3</span>
                    </div>
                    <div className="pl-8">{"},"}</div>
                    <div className="pl-8">
                      <span className="text-blue-400">"index"</span>: <span className="text-orange-400">9023.973</span>,
                    </div>
                    <div className="pl-8">
                      <span className="text-blue-400">"lastUpdate"</span>: <span className="text-green-400">"2025-09-09T01:33:14.424Z"</span>
                    </div>
                    <div className="pl-4">{"}"}</div>
                    <div className="text-yellow-400">{"}"}</div>
                  </motion.div>

                  {/* Second command - Dollar */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                    viewport={{ once: true }}
                    className="text-gray-400"
                  >
                    <span className="text-green-400">$</span> curl https://argenstats.com/api/v1/dollar
                  </motion.div>
                  
                  {/* Success response with data */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                    viewport={{ once: true }}
                    className="text-gray-300 bg-gray-800/50 dark:bg-gray-900/50 p-3 rounded"
                  >
                    <div className="text-green-400 flex items-center gap-2">
                      <span>✓</span> 200 OK
                    </div>
                    <div className="text-gray-400 flex items-center gap-2 mt-1">
                      <Clock className="h-3 w-3" />
                      Response time: {'<'} 50ms
                    </div>
                    <div className="text-gray-500 text-xs mt-2">
                      Content-Type: application/json
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                viewport={{ once: true }}
                className="absolute -top-6 -right-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white 
                         px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
              >
                <Zap className="h-4 w-4" />
                Ultra rápida
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.7 }}
                viewport={{ once: true }}
                className="absolute -bottom-4 -left-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white 
                         px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg"
              >
                <Database className="h-4 w-4" />
                Datos actualizados
              </motion.div>
            </motion.div>
          </div>
        </div>
        
      {/* Bottom CTA - Optional additional call to action */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-6 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              <span>JSON & CSV</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>Latencia {'<'} 100ms</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full" />
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <span>99.9% Uptime</span>
            </div>
          </div>
        </motion.div>
      </div>
      </div>

    </section>
  )
}