'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { 
  DollarSign, 
  Clock, 
  RefreshCw, 
  Info as InfoIcon, 
  HelpCircle,
  TrendingUp,
  Building2,
  CreditCard,
  Bitcoin,
  Globe,
  Banknote,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

const dollarTypes = {
  financial: [
    {
      id: 'MEP',
      name: 'Dólar MEP',
      fullName: 'Mercado Electrónico de Pagos',
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600 dark:text-purple-400',
      description: 'Compra-venta de bonos o acciones en el mercado bursátil',
      characteristics: [
        'Operación 100% legal',
        'Sin límite de monto',
        'Requiere cuenta comitente'
      ],
      source: 'Mercado de valores (BYMA)',
      updateFrequency: 'En horario bursátil (10:00 - 17:00)'
    },
    {
      id: 'CCL',
      name: 'Dólar CCL',
      fullName: 'Contado con Liquidación',
      icon: Globe,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-500',
      textColor: 'text-amber-600 dark:text-amber-400',
      description: 'Similar al MEP pero permite transferir dólares al exterior',
      characteristics: [
        'Transferencia al exterior',
        'Liquidación inmediata disponible',
        'Operación legal y transparente',
        'Ideal para pagos internacionales'
      ],
      source: 'Mercado de valores internacional',
      updateFrequency: 'En horario bursátil'
    },
    {
      id: 'CRYPTO',
      name: 'Dólar Crypto',
      fullName: 'Cotización via Criptomonedas',
      icon: Bitcoin,
      color: 'pink',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      borderColor: 'border-pink-500',
      textColor: 'text-pink-600 dark:text-pink-400',
      description: 'Compra-venta de stablecoins (USDT, DAI, USDC)',
      characteristics: [
        'Disponibilidad 24/7',
        'Transacciones rápidas',
        'Sin límites regulatorios',
        'Requiere wallet digital'
      ],
      source: 'Exchanges y plataformas P2P',
      updateFrequency: 'Tiempo real - 24/7'
    }
  ],
  reference: [
    {
      id: 'BLUE',
      name: 'Dólar Blue',
      fullName: 'Dólar Paralelo',
      icon: Banknote,
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600 dark:text-blue-400',
      description: 'Cotización del mercado paralelo no regulado',
      characteristics: [
        'Mercado informal',
        'Alta liquidez',
        'Sin restricciones de monto',
        'Referencia de mercado real'
      ],
      source: 'Casas de cambio informales',
      updateFrequency: 'Varias veces al día'
    },
    {
      id: 'OFICIAL',
      name: 'Dólar Oficial',
      fullName: 'Tipo de Cambio Oficial',
      icon: Building2,
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-500',
      textColor: 'text-green-600 dark:text-green-400',
      description: 'Cotización regulada por el BCRA',
      characteristics: [
        'Mercado formal regulado',
        'Operación en bancos oficiales',
        'Documentación requerida',
        'Cotización base del mercado'
      ],
      source: 'Banco Central (BCRA)',
      updateFrequency: 'Días hábiles bancarios'
    },
    {
      id: 'MAYORISTA',
      name: 'Dólar Mayorista',
      fullName: 'Tipo de Cambio Mayorista',
      icon: Building2,
      color: 'gray',
      bgColor: 'bg-gray-50 dark:bg-gray-900/20',
      borderColor: 'border-gray-500',
      textColor: 'text-gray-600 dark:text-gray-400',
      description: 'Para operaciones de comercio exterior',
      characteristics: [
        'Importaciones y exportaciones',
        'Operaciones entre bancos',
        'Grandes volúmenes',
        'Uso empresarial'
      ],
      source: 'Mercado mayorista (MULC)',
      updateFrequency: 'Días hábiles'
    },
    {
      id: 'TARJETA',
      name: 'Dólar Tarjeta',
      fullName: 'Dólar Turista',
      icon: CreditCard,
      color: 'red',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-500',
      textColor: 'text-red-600 dark:text-red-400',
      description: 'Para consumos con tarjeta en el exterior',
      characteristics: [
        'Aplicable a consumos en el exterior',
        'Incluye impuestos adicionales',
        'Para compras con tarjeta',
        'Cotización más alta del mercado'
      ],
      source: 'BCRA + Impuestos',
      updateFrequency: 'Según dólar oficial'
    }
  ]
}

const faqs = [
  {
    question: '¿Cuál es el mejor dólar para ahorrar?',
    answer: 'Depende de tu situación. El MEP y CCL son opciones legales sin límite de monto. El Blue ofrece mayor liquidez pero es informal. El Crypto es útil para operaciones 24/7.'
  },
  {
    question: '¿Qué es la brecha cambiaria?',
    answer: 'Es la diferencia porcentual entre el dólar oficial y los dólares alternativos (principalmente el Blue). Una brecha alta indica distorsiones en el mercado cambiario.'
  },
  {
    question: '¿Puedo operar MEP y CCL sin restricciones?',
    answer: 'El MEP y CCL son operaciones bursátiles legales que no tienen límites de monto. Solo necesitas una cuenta comitente en un broker autorizado.'
  },
  {
    question: '¿Cuál es la diferencia entre MEP y CCL?',
    answer: 'El MEP te permite obtener dólares en tu cuenta local, mientras que el CCL permite transferir dólares al exterior. El CCL generalmente tiene una cotización ligeramente mayor.'
  },
  {
    question: '¿Es legal comprar dólar Blue?',
    answer: 'El mercado Blue opera fuera del sistema regulado. Si bien no es ilegal para personas físicas, las operaciones no tienen respaldo oficial.'
  },
  {
    question: '¿Cómo se calcula el dólar Tarjeta?',
    answer: 'Se toma el dólar oficial y se le suman diversos impuestos y percepciones establecidos por la normativa vigente, resultando en la cotización más alta del mercado.'
  }
]

export function DollarInfo() {
  return (
    <div className="space-y-8 mt-12">
      {/* Header mejorado */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-2">
          <InfoIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Guía de Tipos de Dólar
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Todo lo que necesitas saber sobre las diferentes cotizaciones del dólar en Argentina
        </p>
      </div>

      {/* Alert informativo */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
              Información importante
            </p>
            <p className="text-amber-700 dark:text-amber-400">
              Las cotizaciones pueden variar según la fuente y el momento del día. 
              Siempre verifica los valores antes de realizar una operación.
            </p>
          </div>
        </div>
      </div>

      {/* Dólares Financieros - Diseño mejorado */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-1 w-8 bg-purple-500 rounded-full" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Dólares Financieros
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Operados en mercados bursátiles
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dollarTypes.financial.map((dollar) => {
            const Icon = dollar.icon
            return (
              <Card key={dollar.id} className={`relative overflow-hidden hover:shadow-lg transition-shadow ${dollar.bgColor}`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${dollar.borderColor.replace('border-', 'bg-')}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 ${dollar.bgColor} rounded-lg`}>
                        <Icon className={`h-5 w-5 ${dollar.textColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{dollar.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{dollar.fullName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={dollar.textColor}>
                      {dollar.id}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {dollar.description}
                  </p>
                  
                  <div className="space-y-2">
                    {dollar.characteristics.map((char, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        <span>{char}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-3 border-t space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{dollar.updateFrequency}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span>{dollar.source}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Dólares de Referencia - Diseño mejorado */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-1 w-8 bg-blue-500 rounded-full" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Dólares de Referencia
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Cotizaciones de mercado y oficiales
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dollarTypes.reference.map((dollar) => {
            const Icon = dollar.icon
            return (
              <Card key={dollar.id} className={`relative overflow-hidden hover:shadow-lg transition-shadow ${dollar.bgColor}`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${dollar.borderColor.replace('border-', 'bg-')}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 ${dollar.bgColor} rounded-lg`}>
                        <Icon className={`h-5 w-5 ${dollar.textColor}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{dollar.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{dollar.fullName}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {dollar.description}
                  </p>
                  
                  <div className="space-y-2">
                    {dollar.characteristics.slice(0, 3).map((char, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs">
                        <ChevronRight className="h-3 w-3 text-muted-foreground mt-0.5" />
                        <span>{char}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{dollar.updateFrequency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* FAQ Section mejorada */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Preguntas Frecuentes</CardTitle>
              <CardDescription>
                Las dudas más comunes sobre el mercado cambiario
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, idx) => (
              <AccordionItem key={`faq-${idx}`} value={`item-${idx}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Footer informativo */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Datos actualizados en tiempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Fuente: Argentina Datos API</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}