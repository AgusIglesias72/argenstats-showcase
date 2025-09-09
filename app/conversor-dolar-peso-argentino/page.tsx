import { Metadata } from 'next'
import Link from 'next/link'
import { LoginModal } from '@/components/auth/login-modal'
import DollarConverter from '@/components/herramientas/conversor'
import StructuredData from '@/components/StructuredData'
import { 
  DollarConverterWebAppSchema,
  DollarConverterFAQSchema,
  BreadcrumbSchema,
  OrganizationSchema
} from '@/lib/schemas'
import { 
  Clock, 
  ChevronRight,
  BarChart,
  Zap,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// Metadata mejorada con más campos
export const metadata: Metadata = {
  title: 'Conversor de Dólar a Peso Argentino - USD a ARS en Tiempo Real | ArgenStats',
  description: 'Conversor de dólar a peso argentino actualizado minuto a minuto. Calcula USD a ARS con cotización Blue, Oficial, MEP y CCL. Datos históricos disponibles.',
  keywords: 'conversor dolar peso argentino, USD ARS, calculadora dolar, dolar blue, dolar oficial, MEP, CCL, cotización dolar',
  authors: [{ name: 'ArgenStats' }],
  creator: 'ArgenStats',
  publisher: 'ArgenStats',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Conversor USD/ARS - Tiempo Real | ArgenStats',
    description: 'La mejor herramienta para convertir dólares a pesos argentinos con datos oficiales actualizados.',
    type: 'website',
    url: 'https://argenstats.com/conversor-dolar-peso-argentino',
    siteName: 'ArgenStats',
    locale: 'es_AR',
    images: [
      {
        url: 'https://argenstats.com/og-conversor.jpg',
        width: 1200,
        height: 630,
        alt: 'Conversor de Dólar a Peso Argentino - ArgenStats',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conversor USD/ARS - Tiempo Real',
    description: 'Convierte dólares a pesos argentinos con datos oficiales actualizados.',
    site: '@argenstats',
    creator: '@argenstats',
    images: ['https://argenstats.com/og-conversor.jpg'],
  },
  alternates: {
    canonical: 'https://argenstats.com/conversor-dolar-peso-argentino',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function ConversorPage() {
  return (
    <>
      <LoginModal />
      
      {/* Structured Data - CRÍTICO */}
      <StructuredData 
        data={DollarConverterWebAppSchema} 
        id="dollar-converter-webapp"
      />
      <StructuredData 
        data={DollarConverterFAQSchema} 
        id="dollar-converter-faq"
      />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argenstats.com" },
          { name: "Conversor USD/ARS", url: "https://argenstats.com/conversor-dolar-peso-argentino" }
        ])} 
        id="breadcrumb"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization"
      />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section con mejoras semánticas */}
        <section className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 pt-12 pb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Conversor de Dólar a Peso Argentino{' '}
                <span className="text-green-600 dark:text-green-400">en Tiempo Real</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Calculadora de dólar a peso argentino hoy - Conversor USD ARS con cotización 
                dólar blue, oficial, MEP y CCL actualizado minuto a minuto.
              </p>
              {/* Breadcrumb visible para usuarios */}
              <nav aria-label="Breadcrumb" className="mt-4">
                <ol className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <li>
                    <Link href="/" className="hover:text-gray-700">Inicio</Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="text-gray-700 font-medium" aria-current="page">Conversor USD/ARS</li>
                </ol>
              </nav>
            </header>
          </div>
        </section>

        {/* Conversor Component */}
        <section className="pb-12 -mt-4" aria-label="Conversor de divisas">
          <div className="container mx-auto px-4 max-w-4xl">
            <DollarConverter />
          </div>
        </section>

        {/* Features Grid con article tags */}
        <section className="py-16 bg-white dark:bg-gray-800" aria-labelledby="features-title">
          <div className="container mx-auto px-4 max-w-6xl">
            <header className="text-center mb-12">
              <h2 id="features-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                La Herramienta de Conversión Más Completa
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Convertí USD a ARS con todas las cotizaciones del mercado argentino actualizadas en tiempo real
              </p>
            </header>

            <div className="grid md:grid-cols-3 gap-6">
              <article className="group hover:scale-105 transition-transform duration-200">
                <div className="h-full bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Actualización Instantánea
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Cotizaciones actualizadas de manera constante cada 30 segundos
                  </p>
                </div>
              </article>

              <article className="group hover:scale-105 transition-transform duration-200">
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4">
                    <BarChart className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    7 Tipos de Cambio
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Oficial, Blue, MEP, CCL, Crypto, Mayorista y Tarjeta en un solo lugar
                  </p>
                </div>
              </article>

              <article className="group hover:scale-105 transition-transform duration-200">
                <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Datos Históricos
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Consultá cotizaciones de cualquier fecha pasada para análisis y comparación
                  </p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* How to Use Section con pasos semánticos */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900" aria-labelledby="how-to-title">
          <div className="container mx-auto px-4 max-w-6xl">
            <header className="max-w-3xl mx-auto text-center mb-12">
              <h2 id="how-to-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Cómo Usar el Conversor?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Convertí dólares a pesos argentinos en 3 simples pasos
              </p>
            </header>

            <ol className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <li className="relative">
                <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold mb-4" aria-label="Paso 1">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ingresá el Monto
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Escribí la cantidad de dólares o pesos que querés convertir
                  </p>
                </article>
                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              </li>

              <li className="relative">
                <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold mb-4" aria-label="Paso 2">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Elegí el Tipo
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Seleccioná entre Blue, Oficial, MEP, CCL y más tipos de cambio
                  </p>
                </article>
                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" aria-hidden="true" />
              </li>

              <li>
                <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold mb-4" aria-label="Paso 3">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Obtené el Resultado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Mirá instantáneamente el valor convertido con la cotización actual
                  </p>
                </article>
              </li>
            </ol>
          </div>
        </section>

        {/* Dollar Types Explanation con mejor estructura */}
        <section className="py-16 bg-white dark:bg-gray-800" aria-labelledby="dollar-types-title">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto">
              <h2 id="dollar-types-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Tipos de Dólar en Argentina
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6" role="list">
                <article className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6" role="listitem">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" aria-hidden="true"></span>
                    Dólar Oficial
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Cotización establecida por el Banco Central de la República Argentina (BCRA). 
                    Es el tipo de cambio utilizado para operaciones oficiales y tiene restricciones de acceso.
                  </p>
                </article>

                <article className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6" role="listitem">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full" aria-hidden="true"></span>
                    Dólar Blue
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Cotización del mercado informal o paralelo. Es el valor del dólar en casas de cambio 
                    no oficiales, generalmente más alto que el oficial.
                  </p>
                </article>

                <article className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6" role="listitem">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" aria-hidden="true"></span>
                    Dólar MEP
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Dólar Mercado Electrónico de Pagos. Se obtiene mediante la compra y venta de bonos 
                    en el mercado de valores local.
                  </p>
                </article>

                <article className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-6" role="listitem">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full" aria-hidden="true"></span>
                    Dólar CCL
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Contado con Liquidación. Similar al MEP pero permite transferir divisas al exterior 
                    mediante operaciones con bonos.
                  </p>
                </article>

                <article className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6" role="listitem">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full" aria-hidden="true"></span>
                    Dólar Crypto
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Valor del dólar en el mercado de criptomonedas, calculado a través de stablecoins 
                    como USDT o USDC.
                  </p>
                </article>

                <article className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6" role="listitem">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" aria-hidden="true"></span>
                    Dólar Tarjeta
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Cotización aplicada a compras con tarjeta en el exterior. Incluye el dólar oficial 
                    más impuestos (PAIS, Ganancias).
                  </p>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section con schema */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900" aria-labelledby="faq-title">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 id="faq-title" className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Preguntas Frecuentes
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Con qué frecuencia se actualizan las cotizaciones?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Nuestras cotizaciones se actualizan automáticamente cada 30 segundos durante el horario bancario. 
                  Para el dólar blue y crypto, la actualización es continua las 24 horas. Los datos provienen de 
                  fuentes oficiales como el BCRA y APIs especializadas en el mercado cambiario argentino.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Puedo ver cotizaciones históricas?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Sí, podés consultar cotizaciones de cualquier fecha pasada usando el selector de fecha en la parte 
                  superior derecha del conversor. Simplemente hacé clic en el ícono del calendario, elegí la fecha 
                  deseada y el conversor mostrará las cotizaciones de ese día específico.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿De dónde obtienen los datos de las cotizaciones?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Nuestros datos provienen de múltiples fuentes confiables: el Banco Central de la República Argentina 
                  (BCRA) para el dólar oficial, APIs especializadas en el mercado cambiario para el blue, y datos en 
                  tiempo real de los principales exchanges y brokers para MEP, CCL y crypto. Esto garantiza la máxima 
                  precisión y actualización de las cotizaciones.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿El conversor es gratuito?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Sí, nuestro conversor de dólar a peso argentino es completamente gratuito y sin límites de uso. 
                  Podés realizar todas las conversiones que necesites, consultar datos históricos y cambiar entre 
                  todos los tipos de dólar sin ningún costo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Qué tipos de dólar puedo convertir?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Podés convertir con los siguientes tipos de cambio: Dólar Blue, Oficial, MEP (Mercado Electrónico 
                  de Pagos), CCL (Contado con Liquidación), Crypto, Mayorista y Tarjeta. Cada uno tiene su propia 
                  cotización actualizada en tiempo real.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-emerald-600 to-green-700" aria-labelledby="cta-title">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 id="cta-title" className="text-3xl md:text-4xl font-bold text-white mb-6">
                Explorá Todas las Cotizaciones del Dólar
              </h2>
              <p className="text-xl text-emerald-100 mb-8">
                Accedé a gráficos detallados, análisis de tendencias y herramientas 
                profesionales para el mercado cambiario argentino
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dolar">
                  <Button 
                    size="lg" 
                    className="bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Ver Todas las Cotizaciones
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
            
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer con mejor estructura semántica */}
      <footer className="bg-white border-t dark:bg-gray-800" role="contentinfo">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} ArgenStats. Conversor de dólar a peso argentino con datos en tiempo real.</p>
            <address className="not-italic mt-2">
              <Link href="/contacto" className="hover:text-gray-900 dark:hover:text-gray-200">Contacto</Link>
              {' | '}
              <Link href="/privacidad" className="hover:text-gray-900 dark:hover:text-gray-200">Privacidad</Link>
              {' | '}
              <Link href="/terminos" className="hover:text-gray-900 dark:hover:text-gray-200">Términos</Link>
            </address>
          </div>
        </div>
      </footer>
    </>
  )
}