// app/indicadores/empleo/page.tsx
import { Metadata } from 'next'
import { LaborMarketClient } from '@/components/indicators/labor-market/LaborMarketClient'
import { laborMarketService } from '@/lib/services/labor-market.service'
import { Header } from '@/components/layout/header'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
} from '@/lib/schemas'
import { generateLaborMarketSchema, generateLaborMarketAnalysisSchema, generateLaborMarketFAQSchema } from '@/lib/schemas/labor-market.schemas'

// Función para obtener los datos del mercado laboral
async function getLaborMarketData() {
  try {
    const [current, regional, stats] = await Promise.all([
      laborMarketService.getCurrentNationalData(),
      laborMarketService.getRegionalData(),
      laborMarketService.getStats()
    ])

    // Obtener datos históricos (últimos 5 años por defecto)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 5)
    
    const historical = await laborMarketService.getHistoricalData({
      indicators: ['unemployment', 'employment', 'activity'],
      regions: ['Total 31 aglomerados'],
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0]
    })

    // Obtener datos demográficos
    const demographic = await laborMarketService.getDemographicData()

    return {
      current,
      regional,
      historical,
      stats,
      demographic
    }
  } catch (error) {
    console.error('Error fetching labor market data:', error)
    return {
      current: null,
      regional: [],
      historical: [],
      stats: null,
      demographic: null
    }
  }
}

// Generar metadata dinámica
export async function generateMetadata(): Promise<Metadata> {
  const data = await getLaborMarketData()
  
  const unemploymentRate = data.current?.unemploymentRate 
    ? `${data.current.unemploymentRate.toFixed(1)}%`
    : ''
  
  const employmentRate = data.current?.employmentRate
    ? `${data.current.employmentRate.toFixed(1)}%`
    : ''
  
  const lastUpdate = data.current?.date 
    ? new Date(data.current.date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : ''

  return {
    title: `Indicadores de Empleo Argentina - Desempleo ${unemploymentRate} | ArgentinaDatos`,
    description: `Mercado laboral argentino: Tasa de desempleo ${unemploymentRate}, empleo ${employmentRate}. Análisis por regiones y segmentos demográficos. Datos oficiales del INDEC actualizados a ${lastUpdate}.`,
    keywords: 'empleo argentina, desempleo, mercado laboral, tasa de empleo, tasa de actividad, EPH, INDEC, trabajo argentina, estadisticas laborales, desempleo juvenil',
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
      title: `Empleo Argentina: Desempleo ${unemploymentRate} - Mercado Laboral`,
      description: `Indicadores del mercado laboral argentino. Tasa de desempleo: ${unemploymentRate}, empleo: ${employmentRate}. Análisis regional y demográfico.`,
      type: 'website',
      url: 'https://argentinadatos.com/indicadores/empleo',
      siteName: 'ArgentinaDatos',
      locale: 'es_AR',
      images: [
        {
          url: 'https://argentinadatos.com/og-empleo.jpg',
          width: 1200,
          height: 630,
          alt: `Mercado Laboral Argentina - Desempleo ${unemploymentRate}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Empleo Argentina: Desempleo ${unemploymentRate}`,
      description: `Tasa de desempleo: ${unemploymentRate}, empleo: ${employmentRate}. Datos oficiales del INDEC.`,
      site: '@argentinadatos',
      creator: '@argentinadatos',
      images: ['https://argentinadatos.com/og-empleo.jpg'],
    },
    alternates: {
      canonical: 'https://argentinadatos.com/indicadores/empleo',
    },
  }
}

export default async function LaborMarketPage() {
  const data = await getLaborMarketData()

  return (
    <>
      <Header />
      
      {/* Structured Data */}
      <StructuredData 
        data={generateLaborMarketSchema(data as any)} 
        id="labor-market-dataset-schema" 
      />
      <StructuredData 
        data={generateLaborMarketAnalysisSchema(data as any)} 
        id="labor-market-analysis-schema" 
      />
      <StructuredData 
        data={generateLaborMarketFAQSchema()} 
        id="labor-market-faq-schema" 
      />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argentinadatos.com" },
          { name: "Indicadores", url: "https://argentinadatos.com/indicadores" },
          { name: "Empleo", url: "https://argentinadatos.com/indicadores/empleo" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      <LaborMarketClient initialData={data} />
    </>
  )
}