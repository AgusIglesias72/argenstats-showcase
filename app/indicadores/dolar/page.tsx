import { Metadata } from 'next'
import { DollarClient } from '@/components/indicators/dollar/DollarClient'
import { Header } from '@/components/layout/header'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
  generateDollarSchema,
  generateDollarAnalysisSchema,
  generateDollarFAQSchema
} from '@/lib/schemas'
import * as dollarService from '@/lib/api/services/dollar'

// Función para obtener los datos del dólar
async function getDollarData() {
  try {
    // Obtener cotizaciones actuales
    const current = await dollarService.getCurrentDollarRates()
    
    // Obtener datos históricos para el gráfico (último año)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const historical = await dollarService.getHistoricalDollarRates({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      interval: 'daily'
    })

    // Obtener comparación de tipos
    const comparison = await dollarService.compareDollarTypes({})

    return {
      current,
      historical,
      comparison
    }
  } catch (error) {
    console.error('Error fetching dollar data:', error)
    return {
      current: {},
      historical: { series: [], summary: {} },
      comparison: { types: [], analysis: {} }
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
    authors: [{ name: 'ArgentinaDatos' }],
    creator: 'ArgentinaDatos',
    publisher: 'ArgentinaDatos',
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
      url: 'https://argentinadatos.com/indicadores/dolar',
      siteName: 'ArgentinaDatos',
      locale: 'es_AR',
      images: [
        {
          url: 'https://argentinadatos.com/og-dolar.jpg',
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
      site: '@argentinadatos',
      creator: '@argentinadatos',
      images: ['https://argentinadatos.com/og-dolar.jpg'],
    },
    alternates: {
      canonical: 'https://argentinadatos.com/indicadores/dolar',
    },
  }
}

export default async function DollarPage() {
  const data = await getDollarData()

  return (
    <>
      <Header />
      
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
          { name: "Inicio", url: "https://argentinadatos.com" },
          { name: "Indicadores", url: "https://argentinadatos.com/indicadores" },
          { name: "Dólar", url: "https://argentinadatos.com/indicadores/dolar" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      <DollarClient initialData={data} />
    </>
  )
}
