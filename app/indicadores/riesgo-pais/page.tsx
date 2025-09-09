// app/indicadores/riesgo-pais/page.tsx
import { Metadata } from 'next'
import { RiesgoPaisClient } from '@/components/indicators/riesgo-pais/RiesgoPaisClient'
import { riesgoPaisService } from '@/lib/services/riesgo-pais.service'
import { Header } from '@/components/layout/header'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
  generateRiesgoPaisSchema,
  generateRiesgoPaisAnalysisSchema,
  generateRiesgoPaisFAQSchema
} from '@/lib/schemas'

// Función para obtener los datos del Riesgo País
async function getRiesgoPaisData() {
  try {
    const current = await riesgoPaisService.getCurrentRiesgoPais()
    const jpMorganData = await riesgoPaisService.getJPMorganComparison()
    const variations = await riesgoPaisService.getVariations()
    const periodsData = await riesgoPaisService.getPeriodsData()
    
    // Obtener datos históricos para el gráfico (3 meses por defecto)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 90)
    
    const historical = await riesgoPaisService.getHistoricalRiesgoPais({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      interval: 'daily',
      source: 'both'
    })

    const stats = await riesgoPaisService.getPeriodStats(90)

    return {
      current,
      jpMorganData,
      historical,
      variations,
      periodsData,
      stats
    }
  } catch (error) {
    console.error('Error fetching Riesgo País data:', error)
    return {
      current: null,
      jpMorganData: null,
      historical: [],
      variations: null,
      periodsData: [],
      stats: null
    }
  }
}

// Generar metadata dinámica
export async function generateMetadata(): Promise<Metadata> {
  const data = await getRiesgoPaisData()
  console.log("data", data)
  
  const currentValue = data.current?.value || 0
  const dailyChange = data.current?.dailyChangePercent 
    ? `${data.current.dailyChangePercent > 0 ? '+' : ''}${data.current.dailyChangePercent.toFixed(2)}%`
    : ''
  
  const lastUpdate = data.current?.date 
    ? new Date(data.current.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return {
    title: `Riesgo País Argentina: ${currentValue} puntos básicos | ArgenStats`,
    description: `Riesgo País Argentina hoy: ${currentValue} pb ${dailyChange}. Seguimiento en tiempo real del indicador de riesgo soberano argentino. Datos del JP Morgan EMBI+ y análisis histórico.`,
    keywords: 'riesgo pais argentina, embi argentina, jp morgan, riesgo soberano, bonos argentinos, riesgo argentina, indicador riesgo pais, puntos basicos, argentina default, embi+',
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
      title: `Riesgo País Argentina: ${currentValue} puntos básicos`,
      description: `Indicador de riesgo soberano argentino actualizado. ${currentValue} pb ${dailyChange}. Análisis y datos históricos del EMBI+.`,
      type: 'website',
      url: 'https://ArgenStats.com/indicadores/riesgo-pais',
      siteName: 'ArgenStats',
      locale: 'es_AR',
      images: [
        {
          url: 'https://ArgenStats.com/og-riesgo-pais.jpg',
          width: 1200,
          height: 630,
          alt: `Riesgo País Argentina: ${currentValue} pb`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Riesgo País Argentina: ${currentValue} pb`,
      description: `Indicador actualizado: ${currentValue} puntos básicos ${dailyChange}. Datos del JP Morgan EMBI+.`,
      site: '@ArgenStats',
      creator: '@ArgenStats',
      images: ['https://ArgenStats.com/og-riesgo-pais.jpg'],
    },
    alternates: {
      canonical: 'https://ArgenStats.com/indicadores/riesgo-pais',
    },
  }
}

export default async function RiesgoPaisPage() {
  const data = await getRiesgoPaisData()

  return (
    <>
      <Header />
      
      {/* Structured Data */}
      <StructuredData 
        data={generateRiesgoPaisSchema(data as any)} 
        id="riesgo-pais-dataset-schema" 
      />
      <StructuredData 
        data={generateRiesgoPaisAnalysisSchema(data as any)} 
        id="riesgo-pais-analysis-schema" 
      />
      <StructuredData 
        data={generateRiesgoPaisFAQSchema()} 
        id="riesgo-pais-faq-schema" 
      />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://ArgenStats.com" },
          { name: "Indicadores", url: "https://ArgenStats.com/indicadores" },
          { name: "Riesgo País", url: "https://ArgenStats.com/indicadores/riesgo-pais" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      <RiesgoPaisClient initialData={data} />
    </>
  )
}