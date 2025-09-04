'use client'

import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Activity, Target } from 'lucide-react'

const indicators = [
  {
    id: 'dolar',
    title: 'Dólar Oficial',
    icon: DollarSign,
    mainValue: '$1.375',
    subtitle: 'venta',
    data: [
      { label: 'Compra', value: '$1.335' },
      { label: 'Venta', value: '$1.375' },
      { label: 'Variación', value: '-0.0%', color: 'text-gray-600' }
    ],
    mobileData: [
      { label: 'Compra/Venta', value: '$1.335 / $1.375' }
    ],
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    iconColor: 'text-green-600',
    footer: 'Actualizado en tiempo real',
    footerColor: 'text-green-600'
  },
  {
    id: 'inflacion',
    title: 'Inflación (IPC)',
    icon: TrendingUp,
    mainValue: '1.9%',
    subtitle: 'mensual',
    data: [
      { label: 'Interanual', value: '36.6%', color: 'text-purple-600' },
      { label: 'Acumulada', value: '17.3%', color: 'text-purple-600' }
    ],
    mobileData: [
      { label: 'Interanual', value: '36.6%' }
    ],
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    iconColor: 'text-purple-600',
    footer: 'INDEC - Julio 2025',
    footerColor: 'text-purple-600'
  },
  {
    id: 'actividad',
    title: 'Actividad (EMAE)',
    icon: Activity,
    mainValue: '-0.7%',
    subtitle: 'mensual',
    data: [
      { label: 'Interanual', value: '6.4%', color: 'text-blue-600' },
      { label: 'Índice', value: '156.7' }
    ],
    mobileData: [
      { label: 'Interanual', value: '6.4%' }
    ],
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    iconColor: 'text-blue-600',
    footer: 'INDEC - Junio 2025',
    footerColor: 'text-blue-600'
  },
  {
    id: 'riesgo',
    title: 'Riesgo País',
    icon: Target,
    mainValue: '880',
    subtitle: 'puntos básicos',
    data: [
      { label: 'Var. Diaria', value: '5.90%', color: 'text-red-600' },
      { label: 'Var. Mensual', value: '-16.1%', color: 'text-green-600' },
      { label: 'Var. Interanual', value: '-39.0%', color: 'text-green-600' }
    ],
    mobileData: [
      { label: 'Var. Diaria', value: '+5.90%' }
    ],
    bgColor: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
    iconColor: 'text-red-600',
    footer: 'Mercados internacionales',
    footerColor: 'text-red-600'
  }
]

export function MainIndicators() {
  return (
    <section className="py-8 lg:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-8 text-gray-900 dark:text-white"
        >
          Indicadores Principales
        </motion.h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {indicators.map((indicator, index) => (
            <motion.div
              key={indicator.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${indicator.bgColor} rounded-xl p-4 lg:p-6 relative overflow-hidden border border-gray-200/50 dark:border-gray-700/50`}
            >
              {/* Mobile version - más compacto */}
              <div className="lg:hidden">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                    {indicator.title}
                  </h3>
                  <indicator.icon className={`w-4 h-4 ${indicator.iconColor}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {indicator.mainValue}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {indicator.subtitle}
                </div>
                <div className="space-y-1">
                  {indicator.mobileData?.map((item, i) => (
                    <div key={i} className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-gray-500">{item.label}:</span>{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-300">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop version - completo */}
              <div className="hidden lg:block">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {indicator.title}
                    </h3>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        {indicator.mainValue}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {indicator.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className={`p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 ${indicator.iconColor}`}>
                    <indicator.icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Data */}
                <div className="space-y-2 mb-4">
                  {indicator.data.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{item.label}:</span>
                      <span className={`font-medium ${item.color || 'text-gray-900 dark:text-white'}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className={`text-xs flex items-center space-x-1 ${indicator.footerColor}`}>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                  <span>{indicator.footer}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}