import { Header } from '@/components/layout/header'
import { LoginModal } from '@/components/auth/login-modal'
import { HeroSection } from '@/components/sections/hero'
import Link from 'next/link'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import { MainIndicators } from '@/components/sections/main-indicators'
// Mock data - después lo traeremos de la DB
const mainIndicators = [
  {
    id: 1,
    name: 'Inflación Mensual',
    value: '4.2',
    unit: '%',
    variation: 0.3,
    trend: 'up',
    lastUpdate: 'Noviembre 2024',
    href: '/indicadores/inflacion'
  },
  {
    id: 2,
    name: 'Inflación Interanual', 
    value: '166',
    unit: '%',
    variation: -2.1,
    trend: 'down',
    lastUpdate: 'Noviembre 2024',
    href: '/indicadores/inflacion'
  },
  {
    id: 3,
    name: 'Dólar Oficial',
    value: '1,050',
    unit: 'ARS',
    variation: 2.3,
    trend: 'up',
    lastUpdate: 'Hoy 15:30',
    href: '/dolar'
  },
  {
    id: 4,
    name: 'Dólar Blue',
    value: '1,120',
    unit: 'ARS',
    variation: 1.8,
    trend: 'up', 
    lastUpdate: 'Hoy 15:30',
    href: '/dolar'
  },
  {
    id: 5,
    name: 'Actividad Económica',
    value: '1.3',
    unit: '%',
    variation: 0,
    trend: 'neutral',
    lastUpdate: 'Octubre 2024',
    href: '/indicadores/actividad'
  },
  {
    id: 6,
    name: 'Desempleo',
    value: '6.9',
    unit: '%',
    variation: -0.2,
    trend: 'down',
    lastUpdate: '3er Trim 2024',
    href: '/indicadores/empleo'
  }
]

function IndicatorCard({ indicator }: { indicator: typeof mainIndicators[0] }) {
  return (
    <Link 
      href={indicator.href}
      className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {indicator.name}
        </h3>
        {indicator.trend === 'up' && (
          <span className="flex items-center text-xs font-medium text-red-600 dark:text-red-400">
            <ArrowUpRight className="h-4 w-4" />
            {Math.abs(indicator.variation)}%
          </span>
        )}
        {indicator.trend === 'down' && (
          <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400">
            <ArrowDownRight className="h-4 w-4" />
            {Math.abs(indicator.variation)}%
          </span>
        )}
        {indicator.trend === 'neutral' && (
          <span className="flex items-center text-xs font-medium text-gray-500">
            <Minus className="h-4 w-4" />
            {indicator.variation}%
          </span>
        )}
      </div>
      
      <div className="flex items-baseline space-x-1">
        <span className="text-3xl font-bold text-gray-900 dark:text-white">
          {indicator.value}
        </span>
        <span className="text-lg text-gray-500 dark:text-gray-400">
          {indicator.unit}
        </span>
      </div>
      
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {indicator.lastUpdate}
      </p>
    </Link>
  )
}

export default function HomePage() {
  return (
    <>
      <Header />
      <LoginModal />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <HeroSection />
      <MainIndicators />        


      </main>

      {/* Footer simple */}
      <footer className="bg-white border-t dark:bg-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} ArgenStats. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  )
}