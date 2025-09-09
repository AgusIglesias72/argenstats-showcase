import { Metadata } from 'next'
import { PovertyClient } from '@/components/indicators/poverty/PovertyClient'
import { povertyService } from '@/lib/services/poverty.service'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
} from '@/lib/schemas'

import { generatePovertyAnalysisSchema, generatePovertyFAQSchema, generatePovertySchema } from '@/lib/schemas/poverty.schemas'

// Función para obtener los datos de pobreza
async function getPovertyData() {
  try {
    // Obtener datos actuales
    const current = await povertyService.getCurrentPoverty()
    
    // Obtener comparación por regiones
    const regionalComparison = await povertyService.getRegionalComparison()

    // Obtener datos históricos para el gráfico (desde 2016)
    const historical = await povertyService.getHistoricalPoverty({
      from: '2016-01-01',
      to: new Date().toISOString().split('T')[0],
      metric: 'all', // pobreza e indigencia
      population: 'all' // personas y hogares
    })

    return {
      current,
      regionalComparison,
      historical
    }
  } catch (error) {
    console.error('Error fetching poverty data:', error)
    return {
      current: null,
      regionalComparison: [],
      historical: []
    }
  }
}

// Generar metadata dinámica
export async function generateMetadata(): Promise<Metadata> {
  const data = await getPovertyData()
  
  const povertyRate = data.current?.poverty?.persons 
    ? `${data.current.poverty.persons.toFixed(1)}%`
    : ''
  
  const indigenceRate = data.current?.indigence?.persons
    ? `${data.current.indigence.persons.toFixed(1)}%`
    : ''
  
  const lastUpdate = data.current?.period || '2do Semestre 2024'

  return {
    title: `Pobreza ${povertyRate} e Indigencia ${indigenceRate} en Argentina | Estadísticas INDEC`,
    description: `Pobreza en Argentina ${lastUpdate}: ${povertyRate} de personas en situación de pobreza, ${indigenceRate} en indigencia. Análisis por regiones y evolución histórica. Datos oficiales del INDEC actualizados.`,
    keywords: 'pobreza argentina, indigencia argentina, indec pobreza, estadisticas pobreza, canasta basica, pobreza por regiones, pobreza hogares, pobreza personas, indice pobreza, datos sociales argentina',
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
      title: `Pobreza ${povertyRate} - Indigencia ${indigenceRate} | Argentina ${lastUpdate}`,
      description: `Índices de Pobreza e Indigencia en Argentina. ${povertyRate} de personas en pobreza, ${indigenceRate} en indigencia. Análisis completo por regiones con datos del INDEC.`,
      type: 'website',
      url: 'https://argenstats.com/indicadores/pobreza',
      siteName: 'ArgenStats',
      locale: 'es_AR',
      images: [
        {
          url: 'https://argenstats.com/og-poverty.jpg',
          width: 1200,
          height: 630,
          alt: `Pobreza ${povertyRate} e Indigencia ${indigenceRate} en Argentina`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Pobreza en Argentina: ${povertyRate} | INDEC`,
      description: `${lastUpdate}: ${povertyRate} de pobreza, ${indigenceRate} de indigencia. Datos oficiales del INDEC con análisis por regiones.`,
      site: '@argenstatsAR',
      creator: '@argenstatsAR',
      images: ['https://argenstats.com/og-poverty.jpg'],
    },
    alternates: {
      canonical: 'https://argenstats.com/indicadores/pobreza',
    },
  }
}

export default async function PovertyPage() {
  const data = await getPovertyData()

  return (
    <>
      {/* Structured Data */}
      <StructuredData 
        data={generatePovertySchema(data as any) || {}} 
        id="poverty-dataset-schema" 
      />
      <StructuredData 
        data={generatePovertyAnalysisSchema(data as any) || {}} 
        id="poverty-analysis-schema" 
      />
      <StructuredData 
        data={generatePovertyFAQSchema()} 
        id="poverty-faq-schema" 
      />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argenstats.com" },
          { name: "Indicadores", url: "https://argenstats.com/indicadores" },
          { name: "Pobreza", url: "https://argenstats.com/indicadores/pobreza" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      <PovertyClient initialData={data} />
    </>
  )
}