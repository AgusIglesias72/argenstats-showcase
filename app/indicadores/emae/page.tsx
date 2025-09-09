import { Metadata } from 'next'
import { EmaeClient } from '@/components/indicators/emae/EmaeClient'
import { emaeService } from '@/lib/services/emae.service'
import { Header } from '@/components/layout/header'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
  generateEmaeSchema,
  generateEmaeAnalysisSchema,
  generateEmaeFAQSchema
} from '@/lib/schemas'

// Función para obtener los datos del EMAE
async function getEmaeData() {  // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const current = await emaeService.getCurrentEmae('GENERAL')
    const sectors = await emaeService.getEmaeSectors()
    
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const historical = await emaeService.getHistoricalEmae({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      sectorCode: 'GENERAL',
      dataType: 'original'
    })

    const stats = await emaeService.getEmaeStats()

    return {
      current,
      sectors,
      historical,
      stats
    }
  } catch (error) {
    console.error('Error fetching EMAE data:', error)
    return {
      current: null,
      sectors: [],
      historical: [],
      stats: null
    }
  }
}

// Generar metadata dinámica
export async function generateMetadata(): Promise<Metadata> {
  const data = await getEmaeData()
  
  const currentValue = data.current?.values?.yearly 
    ? `${data.current.values.yearly > 0 ? '+' : ''}${data.current.values.yearly.toFixed(1)}%`
    : ''
  
  const monthValue = data.current?.values?.monthly
    ? `${data.current.values.monthly > 0 ? '+' : ''}${data.current.values.monthly.toFixed(1)}%`
    : ''
  
  const lastUpdate = data.current?.date 
    ? new Date(data.current.date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : ''

  return {
    title: `EMAE - Estimador Mensual de Actividad Económica ${currentValue} | ArgenStats`,
    description: `Seguimiento del EMAE Argentina. Variación interanual: ${currentValue}, mensual: ${monthValue}. Análisis por sectores económicos. Datos INDEC actualizados a ${lastUpdate}.`,
    keywords: 'EMAE, estimador mensual actividad economica, indec, pbi mensual, actividad economica argentina, sectores economicos, industria, comercio, construccion, servicios, estadisticas economicas',
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
      title: `EMAE Argentina ${currentValue} - Actividad Económica Mensual`,
      description: `Análisis completo del Estimador Mensual de Actividad Económica. Variación interanual: ${currentValue}. Datos oficiales del INDEC por sectores.`,
      type: 'website',
      url: 'https://argenstats.com/indicadores/emae',
      siteName: 'ArgenStats',
      locale: 'es_AR',
      images: [
        {
          url: 'https://argenstats.com/og-emae.jpg',
          width: 1200,
          height: 630,
          alt: `EMAE Argentina - Actividad Económica ${currentValue}`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `EMAE Argentina ${currentValue}`,
      description: `Actividad económica mensual por sectores. Var. interanual: ${currentValue}, mensual: ${monthValue}`,
      site: '@argenstatsAR',
      creator: '@argenstatsAR',
      images: ['https://argenstats.com/og-emae.jpg'],
    },
    alternates: {
      canonical: 'https://argenstats.com/indicadores/emae',
    },
  }
}

export default async function EmaePage() {
  const data = await getEmaeData()

  return (
    <>
      <Header />
      
      {/* Structured Data */}
      <StructuredData 
        data={generateEmaeSchema(data as any)} 
        id="emae-dataset-schema" 
      />
      <StructuredData 
        data={generateEmaeAnalysisSchema(data as any)} 
        id="emae-analysis-schema" 
      />
      <StructuredData 
        data={generateEmaeFAQSchema()} 
        id="emae-faq-schema" 
      />  
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argenstats.com" },
          { name: "Indicadores", url: "https://argenstats.com/indicadores" },
          { name: "EMAE", url: "https://argenstats.com/indicadores/emae" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      <EmaeClient initialData={data} />
    </>
  )
}