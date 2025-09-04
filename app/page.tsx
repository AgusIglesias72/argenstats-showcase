import { Header } from '@/components/layout/header'
import { LoginModal } from '@/components/auth/login-modal'
import { HeroSection } from '@/components/sections/hero'
import { MainIndicators } from '@/components/sections/main-indicators'
import { ConversorPromoSection } from '@/components/sections/conversor-promo'

export default function HomePage() {
  return (
    <>
      <Header />
      <LoginModal />
      
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <HeroSection />
        <MainIndicators />
        <ConversorPromoSection  />
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