'use client'

import { useState } from 'react'
import { 
  HardHat,
  TrendingUp,
  Bell,
  Mail,
  CheckCircle,
  Loader2,
  Info,
  Building,
  Hammer,
  Wrench,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useHydrationFix } from '@/lib/hooks/useHydrationFix'
import { Badge } from '@/components/ui/badge'

export function ConstructionCostClient() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  // Handle hydration mismatch caused by browser extensions
  useHydrationFix()

  const handleSubmit = async (e: any) => {
    e.preventDefault?.()
    setError('')
    
    // Validación básica
    if (!email || !email.includes('@')) {
      setError('Por favor ingresá un email válido')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Aquí iría la llamada a tu API para guardar el contacto
      // Por ahora simularemos un delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // En producción esto sería algo como:
      // await fetch('/api/notify-construction', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, name })
      // })
      
      setIsSubmitted(true)
      setEmail('')
      setName('')
    } catch (err) {
      setError('Hubo un error al enviar tu solicitud. Por favor intentá de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl mb-6 shadow-lg">
            <HardHat className="w-10 h-10 text-white" />
          </div>
            <Badge className="mb-4" variant="secondary">
              Próximamente
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Índice del Costo de la Construcción
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Estamos trabajando para traerte el análisis más completo del ICC con datos actualizados del INDEC, 
            evolución histórica y proyecciones del sector.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-3">
                <Building className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-lg">Índice General</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seguimiento del ICC nivel general con actualizaciones mensuales y análisis de tendencias.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center mb-3">
                <Hammer className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-lg">Materiales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Desglose por tipo de material: cemento, hierro, ladrillos y más de 20 categorías.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardHeader>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-3">
                <Wrench className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-lg">Mano de Obra</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Evolución del costo laboral en la construcción por categoría y región.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Notification Form */}
        <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-900 shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full mb-4 mx-auto">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl">¿Querés que te avisemos cuando esté disponible?</CardTitle>
            <CardDescription>
              Dejanos tu contacto y serás de los primeros en acceder a esta herramienta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSubmitted ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre (opcional)</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                    className={error ? 'border-red-500' : ''}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmit(e)
                      }
                    }}
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                </div>

                <Button 
                  onClick={handleSubmit}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Notificarme cuando esté listo
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  No compartiremos tu información con terceros. Solo te avisaremos cuando 
                  el índice esté disponible.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">¡Listo!</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Te avisaremos en cuanto el Índice del Costo de la Construcción esté disponible.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsSubmitted(false)}
                >
                  Registrar otro email
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-12 max-w-3xl mx-auto">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>¿Qué incluirá el ICC?</strong> El Índice del Costo de la Construcción medirá las 
              variaciones mensuales del costo de construcción de viviendas, incluyendo materiales, 
              mano de obra y gastos generales. Los datos serán actualizados mensualmente con información 
              oficial del INDEC y análisis sectorial complementario.
            </AlertDescription>
          </Alert>
        </div>

        {/* Expected Features */}
        <div className="mt-12 bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Lo que vas a poder hacer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Análisis histórico</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visualizá la evolución del ICC desde 2016 con gráficos interactivos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Comparación regional</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Compará costos entre diferentes provincias y regiones del país
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Calculadora de costos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Estimá el costo de tu proyecto con valores actualizados
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Exportación de datos</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Descargá los datos en CSV para tu propio análisis
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-12 text-center">
          <Badge variant="outline" className="mb-4">
            <TrendingUp className="w-3 h-3 mr-1" />
            Lanzamiento estimado: Octubre 2025
          </Badge>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Mientras tanto, podés explorar nuestros otros indicadores económicos disponibles
          </p>
        </div>
      </div>
    </div>
  )
}