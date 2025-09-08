'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { DollarSign, Clock, RefreshCw, Info as InfoIcon, HelpCircle } from 'lucide-react'
import { DOLLAR_TYPE_DESCRIPTIONS, DOLLAR_INFO } from '@/lib/api/constants/dollar'

export function DollarInfo() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <InfoIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-semibold">Información sobre los tipos de dólar</h2>
        </div>
        <p className="text-muted-foreground">
          Conoce las características, restricciones y fuentes de cada tipo de cambio
        </p>
      </div>

      {/* Dólares Financieros */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <CardTitle className="text-xl">$ Dólares Financieros</CardTitle>
          </div>
          <CardDescription>
            Tipos de dólar obtenidos a través de mercados financieros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* MEP */}
          <div className="border-l-4 border-green-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Dólar MEP (Bolsa)</h3>
              <Badge variant="outline" className="text-green-600 border-green-600">
                MEP
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Se obtiene mediante la compra-venta de bonos o acciones que cotizan tanto en pesos como en dólares, 
              permitiendo adquirir dólares de forma legal a través del mercado bursátil.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.MEP}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.MEP}</p>
              </div>
            </div>
          </div>

          {/* CCL */}
          <div className="border-l-4 border-purple-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Contado con Liquidación (CCL)</h3>
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                CCL
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Similar al MEP, pero permite transferir dólares al exterior. Se obtiene mediante la compra de activos 
              en pesos que también cotizan en mercados internacionales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.CCL}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.CCL}</p>
              </div>
            </div>
          </div>

          {/* Crypto */}
          <div className="border-l-4 border-pink-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Dólar Cripto</h3>
              <Badge variant="outline" className="text-pink-600 border-pink-600">
                CRYPTO
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Cotización implícita que surge de la compra-venta de criptomonedas estables (stablecoins) 
              como USDT o DAI a través de exchanges o plataformas P2P.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.CRYPTO}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.CRYPTO}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dólares de Referencia */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl">$ Dólares de Referencia</CardTitle>
          </div>
          <CardDescription>
            Tipos de dólar utilizados como referencia para diferentes operaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Oficial */}
          <div className="border-l-4 border-blue-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Dólar Oficial</h3>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                OFICIAL
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Cotización regulada por el Banco Central de la República Argentina (BCRA) 
              para operaciones en bancos y casas de cambio oficiales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.OFICIAL}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.OFICIAL}</p>
              </div>
            </div>
          </div>

          {/* Blue */}
          <div className="border-l-4 border-indigo-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Dólar Blue</h3>
              <Badge variant="outline" className="text-indigo-600 border-indigo-600">
                BLUE
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Cotización que surge del mercado informal o paralelo, no regulado oficialmente 
              pero ampliamente utilizado como referencia.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.BLUE}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.BLUE}</p>
              </div>
            </div>
          </div>

          {/* Mayorista */}
          <div className="border-l-4 border-gray-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Dólar Mayorista</h3>
              <Badge variant="outline" className="text-gray-600 border-gray-600">
                MAYORISTA
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Utilizado principalmente para operaciones de comercio exterior y entre entidades financieras. 
              Es la referencia para importaciones y exportaciones.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.MAYORISTA}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.MAYORISTA}</p>
              </div>
            </div>
          </div>

          {/* Tarjeta */}
          <div className="border-l-4 border-red-500 pl-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Dólar Tarjeta</h3>
              <Badge variant="outline" className="text-red-600 border-red-600">
                TARJETA
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Cotización aplicada a las compras realizadas en el exterior con tarjetas de crédito o débito, 
              que incluye impuestos adicionales como el PAIS y percepciones a cuenta de Ganancias/Bienes Personales.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fuente:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.sources.TARJETA}</p>
              </div>
              <div>
                <span className="font-medium">Actualización:</span>
                <p className="text-muted-foreground">{DOLLAR_INFO.updateFrequency.TARJETA}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Las cotizaciones se actualizan automáticamente durante los días hábiles</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-4 w-4" />
              <span>Fuente: API Argentina Datos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-xl">Preguntas Frecuentes</CardTitle>
          </div>
          <CardDescription>
            Resuelve tus dudas sobre los diferentes tipos de dólar en Argentina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>¿Qué es el dólar Blue y por qué es importante?</AccordionTrigger>
              <AccordionContent>
                El dólar Blue es la cotización que surge del mercado paralelo o informal, no regulado oficialmente pero ampliamente utilizado como referencia. Se obtiene a través de casas de cambio no oficiales y representa el precio real de mercado del dólar en Argentina. Es importante porque refleja la demanda real de dólares en el mercado y se usa como referencia para muchas transacciones.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>¿Cuál es la diferencia entre el dólar oficial y el Blue?</AccordionTrigger>
              <AccordionContent>
                El dólar oficial es la cotización regulada por el Banco Central para operaciones en bancos oficiales. El dólar Blue es la cotización del mercado paralelo, sin respaldo oficial. La diferencia entre ambos se conoce como 'brecha cambiaria' y puede ser significativa.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>¿Qué es el dólar MEP y cómo funciona?</AccordionTrigger>
              <AccordionContent>
                El dólar MEP (Mercado Electrónico de Pagos) se obtiene mediante la compra-venta de bonos o acciones que cotizan tanto en pesos como en dólares, permitiendo adquirir dólares de forma legal a través del mercado bursátil. Requiere un parking de 5 días para bonos y es una forma legal de acceder a dólares.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>¿Qué es el dólar CCL y en qué se diferencia del MEP?</AccordionTrigger>
              <AccordionContent>
                El dólar CCL (Contado con Liquidación) es similar al MEP pero permite transferir dólares al exterior. Se obtiene mediante la compra de activos en pesos que también cotizan en mercados internacionales, sin parking para bonos con liquidación externa. Es ideal para quienes necesitan enviar dólares al exterior.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>¿Qué es el dólar Crypto y cómo se calcula?</AccordionTrigger>
              <AccordionContent>
                El dólar Crypto es una cotización implícita que surge de la compra-venta de criptomonedas estables (stablecoins) como USDT o DAI a través de exchanges o plataformas P2P. Ofrece disponibilidad 24/7 pero con límites según el exchange utilizado. Se calcula basándose en el precio de estas criptomonedas en pesos argentinos.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-6">
              <AccordionTrigger>¿Por qué el dólar Tarjeta es más caro que el oficial?</AccordionTrigger>
              <AccordionContent>
                El dólar Tarjeta incluye impuestos adicionales como el PAIS (30%) y percepciones a cuenta de Ganancias (30%), resultando en un tipo de cambio significativamente más alto que el oficial. Se aplica a las compras realizadas en el exterior con tarjetas de crédito o débito, por lo que el costo final incluye todos estos impuestos.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-7">
              <AccordionTrigger>¿Con qué frecuencia se actualizan las cotizaciones?</AccordionTrigger>
              <AccordionContent>
                Las cotizaciones se actualizan con diferentes frecuencias: Dólar Oficial y Mayorista se actualizan diariamente en días hábiles, el Dólar Blue varias veces al día, MEP y CCL durante el horario bursátil, y el Dólar Crypto 24/7. Nuestra plataforma actualiza los datos cada minuto para mantener la información lo más actualizada posible.
              </AccordionContent>
            </AccordionItem>
            
          </Accordion>
        </CardContent>
      </Card>
    </div>
  )
}
