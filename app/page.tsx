import { HeroSection } from '@/components/sections/hero'
import { MainIndicators } from '@/components/sections/main-indicators'
import { ConversorPromoSection } from '@/components/sections/conversor-promo'
import { EconomicIndicatorsSection } from '@/components/sections/economic-indicators'
import { AdditionalToolsSection } from '@/components/sections/additional-tools'
import { APIPromotionSection } from '@/components/sections/api-promotion'

export const dynamic = 'force-dynamic'
export const revalidate = 60  // Actualiza cada minuto


export default function HomePage() {
  return (
    <>
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HeroSection />
        <MainIndicators />
        <ConversorPromoSection  />
        <EconomicIndicatorsSection />
        <AdditionalToolsSection />
        <APIPromotionSection />
      </main>

      {/* Footer simple */}
      <footer className="bg-white border-t dark:bg-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} ArgenStats. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </>
  )
}