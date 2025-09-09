// app/indicadores/costo-construccion/page.tsx

import { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { ConstructionCostClient } from '@/components/indicators/construction-cost/ConstructionCostClient'

export const metadata: Metadata = {
  title: 'Índice del Costo de la Construcción - Próximamente | ArgenStats',
  description: 'El Índice del Costo de la Construcción (ICC) estará disponible próximamente. Análisis completo con datos del INDEC, evolución histórica y proyecciones del sector.',
  keywords: 'costo construccion argentina, icc, indice costo construccion, materiales construccion, mano obra construccion, indec construccion',
  openGraph: {
    title: 'ICC - Índice del Costo de la Construcción | Próximamente',
    description: 'Análisis completo del costo de construcción en Argentina. Disponible en Febrero 2025.',
    type: 'website',
    url: 'https://argenstats.com/indicadores/costo-construccion',
    siteName: 'ArgenStats',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ICC Argentina - Próximamente',
    description: 'El índice más completo del costo de construcción. Lanzamiento: Febrero 2025',
    site: '@argenstatsAR',
    creator: '@argenstatsAR',
  },
}

export default function ConstructionCostPage() {
  return (
    <>
      <Header />
      <ConstructionCostClient />
    </>
  )
}