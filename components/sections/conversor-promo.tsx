'use client'

import Link from 'next/link'
import { ArrowRightLeft, TrendingUp, Calendar, BarChart3, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const ARGENSTATS_BLUE = '#005288'

export function ConversorPromoSection() {
  return (
    <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm font-medium">
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Herramienta Destacada
            </div>
            
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Conversor de Dólar a Peso Argentino{' '}
              <span className="text-green-600 dark:text-green-400">en Tiempo Real</span>
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Calculadora de dólar a peso argentino hoy - Conversor USD ARS con cotización 
              dólar blue, oficial, MEP y CCL actualizado minuto a minuto. La mejor herramienta 
              para convertir dólares a pesos.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Tiempo Real</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Cotizaciones actualizadas</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Múltiples Tipos</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Blue, MEP, CCL, Oficial</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-4 rounded-lg bg-white/60 dark:bg-gray-800/60">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Datos Históricos</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Fechas anteriores</div>
                </div>
              </div>
            </div>

            <div className="pt-4 ">
              <Link 
                href="/conversor-dolar-peso-argentino"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-green-600 dark:bg-green-800 text-white 
                font-medium transition-all hover:shadow-lg group"
              >
                Usar Conversor Ahora
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link 
                href="/dolar"
                className="inline-flex items-center px-6 py-3 ml-4 rounded-lg border border-gray-300 
                dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Ver Todas las Cotizaciones
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}