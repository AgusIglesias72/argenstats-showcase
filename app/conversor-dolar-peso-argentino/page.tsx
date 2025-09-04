import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { LoginModal } from '@/components/auth/login-modal'
import { ConversorUsdArs } from '@/components/conversor/conversor'

export const metadata: Metadata = {
  title: 'Conversor de Dólar a Peso Argentino - USD a ARS en Tiempo Real | ArgenStats',
  description: 'Conversor de dólar a peso argentino actualizado minuto a minuto. Calcula USD a ARS con cotización Blue, Oficial, MEP y CCL. Datos históricos disponibles.',
  keywords: 'conversor dolar peso argentino, USD ARS, calculadora dolar, dolar blue, dolar oficial, MEP, CCL, cotización dolar',
  openGraph: {
    title: 'Conversor USD/ARS - Tiempo Real',
    description: 'La mejor herramienta para convertir dólares a pesos argentinos con datos oficiales actualizados.',
    type: 'website',
    url: 'https://argenstats.com/herramientas/conversor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conversor USD/ARS - Tiempo Real',
    description: 'Convierte dólares a pesos argentinos con datos oficiales actualizados.',
  },
  alternates: {
    canonical: 'https://argenstats.com/herramientas/conversor',
  }
}

export default function ConversorPage() {
  return (
    <>
      <Header />
      <LoginModal />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Conversor de Dólar a Peso Argentino{' '}
                <span className="text-green-600 dark:text-green-400">en Tiempo Real</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Calculadora de dólar a peso argentino hoy - Conversor USD ARS con cotización 
                dólar blue, oficial, MEP y CCL actualizado minuto a minuto.
              </p>
            </div>
          </div>
        </section>

        {/* Conversor Component */}
        <section className="py-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <ConversorUsdArs />
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tiempo Real</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Cotizaciones actualizadas al instante desde múltiples fuentes confiables
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Múltiples Tipos</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Oficial, Blue, MEP, CCL, Crypto, Mayorista y Tarjeta en una sola herramienta
                </p>
              </div>
              
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mb-4">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Datos Históricos</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Consulta cotizaciones de fechas anteriores para análisis y comparación
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
              Preguntas Frecuentes
            </h2>
            <div className="grid gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  ¿Con qué frecuencia se actualizan las cotizaciones?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Nuestras cotizaciones se actualizan cada 30 minutos durante el horario bancario y de forma continua 
                  para el dólar blue y crypto. Los datos provienen de fuentes oficiales como DolarAPI y el BCRA.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  ¿Qué diferencia hay entre cada tipo de dólar?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  <strong>Oficial:</strong> Cotización del BCRA. <strong>Blue:</strong> Mercado paralelo. 
                  <strong>MEP:</strong> Mercado Electrónico de Pagos. <strong>CCL:</strong> Contado con Liquidación. 
                  Cada uno tiene diferentes regulaciones y disponibilidad.
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  ¿Puedo ver cotizaciones históricas?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Sí, puedes seleccionar cualquier fecha anterior usando el selector de fecha y ver 
                  las cotizaciones que estuvieron vigentes en ese momento.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t dark:bg-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} ArgenStats. Conversor de dólar a peso argentino con datos en tiempo real.
          </div>
        </div>
      </footer>
    </>
  )
}