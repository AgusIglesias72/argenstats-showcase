import { Metadata } from 'next'
import { DollarClient } from '@/components/indicators/dollar/DollarClient'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
  generateDollarSchema,
  generateDollarAnalysisSchema,
  generateDollarFAQSchema
} from '@/lib/schemas'
// IMPORTAR DESDE TU SERVICIO
import { dollarService } from '@/lib/services/dollar.service'

// Función para obtener los datos del dólar usando tu servicio
async function getDollarData() {
  try {
    // Obtener cotizaciones actuales desde tu servicio
    const current = await dollarService.getCurrentRates()
    
    // Obtener datos históricos para el gráfico (últimos 3 meses por defecto)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - 3)
    
    const historical = await dollarService.getHistoricalRates({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      interval: 'daily'
    })

    // Obtener comparación de tipos
    const comparison = await dollarService.compareTypes({})

    return {
      current: current || {},
      historical: historical || { series: [], summary: {} },
      comparison: comparison || { 
        date: new Date().toISOString(),
        types: [], 
        analysis: {
          cheapest: '',
          mostExpensive: '',
          averageSpread: 0,
          maxDifference: 0
        }
      }
    }
  } catch (error) {
    console.error('Error fetching dollar data:', error)
    // Retornar estructura vacía en caso de error
    return {
      current: {},
      historical: { series: [], summary: {} },
      comparison: { 
        date: new Date().toISOString(),
        types: [], 
        analysis: {
          cheapest: '',
          mostExpensive: '',
          averageSpread: 0,
          maxDifference: 0
        }
      }
    }
  }
}

// Generar metadata dinámica
export async function generateMetadata(): Promise<Metadata> {
  const data = await getDollarData()
  
  // Obtener el dólar blue como referencia principal
  const blueDollar = data.current?.BLUE
  const bluePrice = blueDollar?.averagePrice || blueDollar?.sellPrice || 0
  
  const lastUpdate = blueDollar?.date 
    ? new Date(blueDollar.date).toLocaleDateString('es-AR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    : ''

  return {
    title: `Cotizaciones del Dólar - ${bluePrice ? `$${bluePrice.toLocaleString('es-AR')}` : 'Argentina'} | Tipos de Cambio`,
    description: `Cotizaciones actualizadas del dólar en Argentina: Blue, Oficial, MEP, CCL, Crypto, Mayorista y Tarjeta. Seguimiento en tiempo real de todos los tipos de cambio.`,
    keywords: 'dolar argentina, cotizacion dolar, dolar blue, dolar oficial, dolar mep, dolar ccl, dolar crypto, tipos cambio argentina, cotizaciones tiempo real, dolar mayorista, dolar tarjeta',
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
      title: `Cotizaciones del Dólar Argentina - ${lastUpdate}`,
      description: `Seguimiento en tiempo real de las cotizaciones del dólar: Blue, Oficial, MEP, CCL y más. Datos actualizados diariamente.`,
      type: 'website',
      url: 'https://argenstats.com/indicadores/dolar',
      siteName: 'ArgenStats',
      locale: 'es_AR',
      images: [
        {
          url: 'https://argenstats.com/og-dolar.jpg',
          width: 1200,
          height: 630,
          alt: `Cotizaciones del Dólar Argentina - ${lastUpdate}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Cotizaciones del Dólar Argentina`,
      description: `Seguimiento en tiempo real de todos los tipos de cambio del dólar. Blue, Oficial, MEP, CCL y más.`,
      site: '@argenstatsAR',
      creator: '@argenstatsAR',
      images: ['https://argenstats.com/og-dolar.jpg'],
    },
    alternates: {
      canonical: 'https://argenstats.com/indicadores/dolar',
    },
  }
}

// Componente de la página - SE EJECUTA EN EL SERVIDOR
export default async function DollarPage() {
  // Obtener datos usando tu servicio
  const data = await getDollarData()

  return (
    <>
      {/* Structured Data */}
      <StructuredData 
        data={generateDollarSchema(data as any)} 
        id="dollar-dataset-schema" 
      />
      <StructuredData 
        data={generateDollarAnalysisSchema(data as any)} 
        id="dollar-analysis-schema" 
      />
      <StructuredData 
        data={generateDollarFAQSchema()} 
        id="dollar-faq-schema" 
      />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argenstats.com" },
          { name: "Indicadores", url: "https://argenstats.com/indicadores" },
          { name: "Dólar", url: "https://argenstats.com/indicadores/dolar" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      {/* DollarClient es un Client Component que recibe los datos ya procesados */}
      <DollarClient initialData={data} />
    </>
  )
}