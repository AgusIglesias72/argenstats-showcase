import { Metadata } from 'next';
import Link from 'next/link';
import { LoginModal } from '@/components/auth/login-modal';
import InflationCalculator from '@/components/herramientas/inflationCalculator';
import StructuredData from '@/components/StructuredData';
import {
  InflationCalculatorWebAppSchema,
  InflationCalculatorFAQSchema,
  BreadcrumbSchema,
  OrganizationSchema
} from '@/lib/schemas';
import { 
  Clock, 
  ChevronRight,
  BarChart3,
  TrendingUp,
  Percent,
  Shield,
  Calendar,
  RefreshCw,
  Info,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cerService } from '@/lib/services/cerService';

// Metadata
export const metadata: Metadata = {
  title: 'Calculadora de Inflación Argentina - Índice CER BCRA | ArgenStats',
  description: 'Calculadora de inflación argentina con índice CER del BCRA. Calculá cuánto valen hoy tus pesos del pasado y el poder adquisitivo desde 2002.',
  keywords: 'calculadora inflacion argentina, indice cer, bcra, poder adquisitivo, inflacion acumulada, cer historico, coeficiente estabilizacion referencia',
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
    title: 'Calculadora de Inflación Argentina - CER BCRA | ArgenStats',
    description: 'Calculá el poder adquisitivo de tus pesos usando el índice CER oficial del BCRA. Datos desde 2002.',
    type: 'website',
    url: 'https://argenstats.com/calculadora-inflacion',
    siteName: 'ArgenStats',
    locale: 'es_AR',
    images: [
      {
        url: 'https://argenstats.com/og-inflacion.jpg',
        width: 1200,
        height: 630,
        alt: 'Calculadora de Inflación Argentina - ArgenStats',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calculadora de Inflación - CER BCRA',
    description: 'Calculá el poder adquisitivo de tus pesos con el índice CER oficial.',
    site: '@argenstats',
    creator: '@argenstats',
    images: ['https://argenstats.com/og-inflacion.jpg'],
  },
  alternates: {
    canonical: 'https://argenstats.com/calculadora-inflacion',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

// Function to get current CER data from service
async function getCERData() {
  try {
    const data = await cerService.getCurrentCER();
    
    if (data) {
      return {
        date: data.date,
        value: data.value,
        daily_change: data.daily_change,
        monthly_change: data.monthly_change,
        yearly_change: data.yearly_change
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching CER data:', error);
    return null;
  }
}


export default async function CalculadoraInflacionPage() {
  const cerData = await getCERData();

  return (
    <>
      <LoginModal />
      
      {/* Structured Data */}
      <StructuredData data={InflationCalculatorWebAppSchema} id="webapp-schema" />
      <StructuredData data={InflationCalculatorFAQSchema} id="faq-schema" />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argenstats.com" },
          { name: "Calculadora de Inflación", url: "https://argenstats.com/calculadora-inflacion" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData data={OrganizationSchema} id="organization-schema" />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 pt-12 pb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                Calculadora de Inflación Argentina{' '}
                <span className="text-orange-600 dark:text-orange-400">con Índice CER</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Calculá el poder adquisitivo de tus pesos usando el índice CER oficial del BCRA. 
                Descubrí cuánto valen hoy tus ahorros del pasado.
              </p>
            </header>
          </div>
        </section>

        {/* Calculator Component */}
        <section className="pb-12 -mt-4">
          <div className="container mx-auto px-4 max-w-5xl">
            <InflationCalculator initialCERData={cerData} />
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                La Herramienta de Inflación Más Completa
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                Analizá el impacto de la inflación en tus finanzas con datos oficiales actualizados diariamente
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="h-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl p-6 border border-orange-200 dark:border-orange-800">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mb-4">
                    <Percent className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Índice CER Oficial
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Datos directos del BCRA actualizados diariamente desde febrero 2002
                  </p>
                </div>
              </div>

              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="h-full bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-yellow-200 dark:border-yellow-800">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-xl flex items-center justify-center mb-4">
                    <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Análisis Histórico
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Más de 20 años de datos para analizar la evolución del poder adquisitivo
                  </p>
                </div>
              </div>

              <div className="group hover:scale-105 transition-transform duration-200">
                <div className="h-full bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Cálculo Bidireccional
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Calculá valores futuros o descubrí cuánto necesitabas en el pasado
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Use Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                ¿Cómo Usar la Calculadora?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Calculá el impacto de la inflación en 3 simples pasos
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold mb-4">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ingresá el Monto
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Escribí la cantidad de pesos que querés analizar
                  </p>
                </div>
                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              </div>

              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold mb-4">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Seleccioná el Período
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Elegí un período rápido o fechas específicas
                  </p>
                </div>
                <ArrowRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-gray-300 dark:text-gray-600" />
              </div>

              <div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold mb-4">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Obtené el Resultado
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Mirá el valor ajustado por inflación al instante
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Educational Content */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
                Entendiendo la Inflación en Argentina
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    ¿Qué es el índice CER?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    El Coeficiente de Estabilización de Referencia (CER) es un índice que refleja 
                    la evolución de la inflación, publicado diariamente por el BCRA desde febrero 2002.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    Base del CER
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    El CER tiene como base 1.00 el día 2 de febrero de 2002. Se actualiza 
                    diariamente según la variación del Índice de Precios al Consumidor (IPC).
                  </p>
                </div>

                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Usos del CER
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Se utiliza para ajustar contratos, alquileres, préstamos y cualquier 
                    obligación que requiera mantener el poder adquisitivo en el tiempo.
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    Cálculo de Inflación
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    La inflación se calcula como: (CER Final / CER Inicial - 1) × 100. 
                    Nuestra calculadora hace este cálculo automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
              Preguntas Frecuentes
            </h2>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Cuánto valen hoy $10.000 del año 2010?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Con nuestra calculadora podés determinar exactamente cuánto poder adquisitivo tienen hoy $10.000 del 2010. 
                  El resultado varía según la fecha específica y la evolución del índice CER. Simplemente ingresá el monto 
                  y seleccioná el año 2010 para obtener el cálculo actualizado.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Cómo se calcula la inflación acumulada?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  La inflación acumulada se calcula comparando el índice CER entre dos fechas. La fórmula es: 
                  (CER Final / CER Inicial - 1) × 100. Por ejemplo, si el CER inicial es 100 y el final es 150, 
                  la inflación acumulada es del 50%. Nuestra calculadora realiza este cálculo automáticamente.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Desde cuándo están disponibles los datos del CER?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  El índice CER fue implementado el 2 de febrero de 2002 por el Banco Central de la República Argentina. 
                  Nuestra calculadora tiene datos completos desde esa fecha hasta el día de hoy, actualizados diariamente 
                  con la información oficial del BCRA.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿Qué diferencia hay entre el CER y el IPC?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  El IPC (Índice de Precios al Consumidor) mide la variación de precios mensual. El CER es un coeficiente 
                  diario que acumula estas variaciones desde 2002, facilitando el ajuste de valores por inflación. 
                  Mientras el IPC te dice cuánto subieron los precios en un mes, el CER te permite calcular el ajuste 
                  acumulado entre cualquier fecha desde 2002.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-white dark:bg-gray-800 rounded-lg mb-4 px-6">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    ¿La calculadora es gratuita?
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 dark:text-gray-300">
                  Sí, nuestra calculadora de inflación es completamente gratuita y sin límites de uso. 
                  Podés realizar todos los cálculos que necesites, consultar cualquier período histórico 
                  desde 2002 y cambiar entre modos de cálculo sin ningún costo.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-orange-600 to-amber-700">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Explorá Más Indicadores Económicos
              </h2>
              <p className="text-xl text-orange-100 mb-8">
                Accedé a cotizaciones del dólar, riesgo país, y más herramientas 
                para analizar la economía argentina
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/conversor-dolar-peso-argentino">
                  <Button 
                    size="lg" 
                    className="bg-white text-orange-700 hover:bg-orange-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Conversor de Dólar
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
               
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t dark:bg-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} ArgenStats. Calculadora de inflación con datos oficiales del BCRA.
          </div>
        </div>
      </footer>
    </>
  );
}