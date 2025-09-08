'use client'

import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Activity, Target, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface IndicatorData {
  label: string
  value: string
  color?: string
}

interface Indicator {
  id: string
  title: string
  mainValue: string
  subtitle: string
  data: IndicatorData[]
  mobileData: IndicatorData[]
  variation: number | null
  footer: string
  type: 'dollar' | 'inflation' | 'activity' | 'risk'
}

interface MainIndicatorsClientProps {
  indicators: Indicator[]
}

const iconMap = {
  dollar: DollarSign,
  inflation: TrendingUp,
  activity: Activity,
  risk: Target
}

const styleMap = {
  dollar: {
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
    iconColor: 'text-green-600',
    footerColor: 'text-green-600'
  },
  inflation: {
    bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
    iconColor: 'text-purple-600',
    footerColor: 'text-purple-600'
  },
  activity: {
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
    iconColor: 'text-blue-600',
    footerColor: 'text-blue-600'
  },
  risk: {
    bgColor: 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20',
    iconColor: 'text-red-600',
    footerColor: 'text-red-600'
  }
}

export function MainIndicatorsClient({ indicators }: MainIndicatorsClientProps) {
  const router = useRouter()

  // Mapeo de indicadores a sus rutas
  const getIndicatorRoute = (indicatorId: string) => {
    const routeMap: Record<string, string> = {
      'dolar': '/dolar',
      'inflacion': '/indicadores/inflacion',
      'actividad': '/indicadores/emae',
      'riesgo': '/indicadores/riesgo-pais'
    }
    return routeMap[indicatorId] || '#'
  }

  const handleCardClick = (indicatorId: string) => {
    const route = getIndicatorRoute(indicatorId)
    if (route !== '#') {
      router.push(route)
    }
  }

  return (
    <section  id="main-indicators" className="py-8 lg:py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl lg:text-3xl font-bold text-center mb-6 lg:mb-8 text-gray-900 dark:text-white"
        >
          Indicadores Principales
        </motion.h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          {indicators.map((indicator, index) => {
            const Icon = iconMap[indicator.type]
            const styles = styleMap[indicator.type]
            
            return (
              <motion.div
                key={indicator.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCardClick(indicator.id)}
                className={`${styles.bgColor} rounded-xl p-4 lg:p-6 relative overflow-hidden border border-gray-200/50 dark:border-gray-700/50 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-gray-800/50 group`}
              >
                {/* Mobile version - más compacto */}
                <div className="lg:hidden">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white">
                      {indicator.title}
                    </h3>
                    <Icon className={`w-4 h-4 ${styles.iconColor}`} />
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
                  <div className="flex items-center justify-end mt-2">
                    <ArrowRight className={`w-3 h-3 ${styles.iconColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                  </div>
                </div>

                {/* Desktop version - completo */}
                <div className="hidden lg:flex flex-col justify-between h-full">
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
                    <div className={`p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 ${styles.iconColor}`}>
                      <Icon className="w-5 h-5" />
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
                  <div className={`text-xs flex items-center justify-between ${styles.footerColor}`}>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                      <span>{indicator.footer}</span>
                    </div>
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}