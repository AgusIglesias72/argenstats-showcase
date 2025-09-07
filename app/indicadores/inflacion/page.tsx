import { Metadata } from 'next'
import { IPCClient } from '@/components/indicators/ipc/IPCClient'
import { ipcService } from '@/lib/services/ipc.service'
import { Header } from '@/components/layout/header'
import StructuredData from '@/components/StructuredData'
import { 
  BreadcrumbSchema,
  OrganizationSchema,
  generateIPCSchema,
  generateIPCAnalysisSchema,
  generateIPCFAQSchema
} from '@/lib/schemas'

// Función para obtener los datos del IPC
async function getIPCData() {
  try {
    // Obtener datos actuales
    const current = await ipcService.getCurrentIPC('GENERAL', 'Nacional')
    
    // Obtener componentes para la tabla de rubros
    const components = await ipcService.getIPCComponents(null, 'Nacional')

    // Obtener datos históricos para el gráfico (último año)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1)
    
    const historical = await ipcService.getHistoricalIPC({
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0],
      componentCode: 'GENERAL',
      region: 'Nacional',
      interval: 'monthly'
    })

    return {
      current,
      components,
      historical
    }
  } catch (error) {
    console.error('Error fetching IPC data:', error)
    return {
      current: null,
      components: [],
      historical: []
    }
  }
}

// Generar metadata dinámica
export async function generateMetadata(): Promise<Metadata> {
  const data = await getIPCData()
  
  const monthlyInflation = data.current?.values?.monthly 
    ? `${data.current.values.monthly.toFixed(1)}%`
    : ''
  
  const yearlyInflation = data.current?.values?.yearly
    ? `${data.current.values.yearly.toFixed(1)}%`
    : ''
  
  const lastUpdate = data.current?.date 
    ? new Date(data.current.date).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
    : ''

  return {
    title: `IPC - Inflación ${yearlyInflation} interanual | Índice de Precios al Consumidor Argentina`,
    description: `Inflación Argentina ${lastUpdate}: ${monthlyInflation} mensual, ${yearlyInflation} interanual. Análisis del IPC por rubros y regiones. Datos oficiales del INDEC actualizados.`,
    keywords: 'IPC, inflacion argentina, indice precios consumidor, indec, inflacion mensual, inflacion interanual, canasta basica, precios argentina, estadisticas inflacion, ipc nucleo',
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
      title: `Inflación Argentina ${yearlyInflation} - IPC ${lastUpdate}`,
      description: `Índice de Precios al Consumidor: inflación mensual ${monthlyInflation}, interanual ${yearlyInflation}. Análisis completo por rubros y regiones.`,
      type: 'website',
      url: 'https://argentinadatos.com/indicadores/inflacion',
      siteName: 'ArgentinaDatos',
      locale: 'es_AR',
      images: [
        {
          url: 'https://argentinadatos.com/og-ipc.jpg',
          width: 1200,
          height: 630,
          alt: `Inflación Argentina ${yearlyInflation} - IPC`,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Inflación Argentina: ${yearlyInflation} interanual`,
      description: `IPC ${lastUpdate}: ${monthlyInflation} mensual, ${yearlyInflation} interanual. Datos oficiales del INDEC.`,
      site: '@argentinadatos',
      creator: '@argentinadatos',
      images: ['https://argentinadatos.com/og-ipc.jpg'],
    },
    alternates: {
      canonical: 'https://argentinadatos.com/indicadores/inflacion',
    },
  }
}

export default async function IPCPage() {
  const data = await getIPCData()

  return (
    <>
      <Header />
      
      {/* Structured Data */}
      <StructuredData 
        data={generateIPCSchema(data as any)} 
        id="ipc-dataset-schema" 
      />
      <StructuredData 
        data={generateIPCAnalysisSchema(data as any)} 
        id="ipc-analysis-schema" 
      />
      <StructuredData 
        data={generateIPCFAQSchema()} 
        id="ipc-faq-schema" 
      />
      <StructuredData 
        data={BreadcrumbSchema([
          { name: "Inicio", url: "https://argentinadatos.com" },
          { name: "Indicadores", url: "https://argentinadatos.com/indicadores" },
          { name: "Inflación", url: "https://argentinadatos.com/indicadores/inflacion" }
        ])} 
        id="breadcrumb-schema"
      />
      <StructuredData 
        data={OrganizationSchema} 
        id="organization-schema" 
      />
      
      <IPCClient initialData={data} />
    </>
  )
}