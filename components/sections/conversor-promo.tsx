'use client'

import Link from 'next/link'
import { ArrowRightLeft, TrendingUp, Calendar, BarChart3, ArrowRight, Calculator, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import DollarConverter from '../herramientas/conversor'

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

            <div className="pt-4 justify-center w-full flex flex-col lg:flex-row space-y-4 lg:space-y-0">
              <Link
                href="/conversor-dolar-peso-argentino "
                className="inline-flex items-center w-full lg:justify-center px-6 py-3 rounded-lg bg-green-600 dark:bg-green-800 text-white 
                font-medium transition-all hover:shadow-lg group"
              >
                Usar Conversor Ahora
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1transition-transform" />
              </Link>

              <Link
                href="/dolar"
                className="inline-flex items-center px-6 py-3 lg:ml-4 w-full  lg:justify-center rounded-lg border border-gray-300 
                dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Ver Todas las Cotizaciones
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20, rotateY: 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Container with tilt effect */}
            <div className="relative transform rotate-2 hover:rotate-1 transition-transform duration-500">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-400/20 to-green-400/20 rounded-2xl blur-xl"></div>

              {/* Screenshot container */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-emerald-100">
                {/* Browser mockup header */}
                <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg px-3 py-1 ml-4">
                    <span className="text-xs text-gray-500">argenstats.com/conversor-dolar-peso-argentino</span>
                  </div>
                </div>

                {/* Screenshot placeholder - will be replaced with actual screenshot */}
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 aspect-[4/3]">
                  <div className="space-y-4">
                    {/* Mock title */}
                    <div className="text-center">
                      <div className="h-8 bg-gray-300 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-6 bg-emerald-200 rounded w-1/2 mx-auto"></div>
                    </div>

                    {/* Mock live rates */}
                    <div className="flex justify-center gap-2">
                      <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                        <div className="h-4 bg-blue-200 rounded w-16"></div>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 shadow-sm border">
                        <div className="h-4 bg-green-200 rounded w-16"></div>
                      </div>
                    </div>

                    {/* Mock converter */}
                    <div className="bg-white rounded-xl p-4 shadow-lg border border-emerald-100 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                        <div className="h-8 bg-emerald-200 rounded"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-12 bg-gray-100 rounded-xl border"></div>
                        <div className="h-8 w-8 bg-emerald-200 rounded-lg"></div>
                        <div className="flex-1 h-12 bg-gray-50 rounded-xl border"></div>
                      </div>
                      <div className="h-8 bg-green-100 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              viewport={{ once: true }}
              className="absolute -top-2 -right-2 lg:-top-4 lg:-right-4 bg-emerald-500 text-white p-2 lg:p-3 rounded-full shadow-lg"
            >
              <Calculator className="h-4 w-4 lg:h-6 lg:w-6" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              viewport={{ once: true }}
              className="absolute -bottom-2 -left-2 lg:-bottom-4 lg:-left-4 bg-white text-emerald-600 p-2 lg:p-3 rounded-full shadow-lg border border-emerald-100"
            >
              <Sparkles className="h-4 w-4 lg:h-6 lg:w-6" />
            </motion.div>
          </motion.div>        </div>
      </div>
    </section>
  )
}