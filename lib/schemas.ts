
// Organization Schema
export const OrganizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ArgenStats",
    "url": "https://argenstats.com",
    "logo": "https://argenstats.com/argenstats.svg",
    "description": "Plataforma de indicadores económicos oficiales de Argentina con API moderna",
    "foundingDate": "2024",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://argenstats.com/contacto"
    },
    "sameAs": [
      "https://twitter.com/argenstats",
      "https://linkedin.com/company/argenstats"
    ]
  };
  
  // Website Schema
  export const WebsiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ArgenStats",
    "url": "https://argenstats.com",
    "description": "Indicadores económicos oficiales de Argentina en tiempo real",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://argenstats.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };
  
  // Dollar Converter Web Application Schema
  export const DollarConverterWebAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Conversor de Dólar a Peso Argentino",
    "alternateName": "Calculadora USD/ARS",
    "description": "Calculadora de dólar a peso argentino con cotizaciones en tiempo real. Convierte USD a ARS con todos los tipos de cambio: blue, oficial, MEP, CCL actualizados cada 30 segundos.",
    "url": "https://argenstats.com/conversor-dolar-peso-argentino",
    "applicationCategory": "FinanceApplication",
    "applicationSubCategory": "CurrencyConverter",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires HTML5 and JavaScript support",
    "softwareVersion": "2.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString(),
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "category": "Free"
    },
    "featureList": [
      "Conversión USD a ARS en tiempo real",
      "7 tipos de cambio diferentes (Blue, Oficial, MEP, CCL, Crypto, Mayorista, Tarjeta)",
      "Cotizaciones históricas desde 2002",
      "Actualización automática cada 30 segundos",
      "Interfaz responsive para móviles y desktop",
      "Datos del BCRA y mercados oficiales",
      "Sin límites de conversión",
      "Gráficos de tendencias"
    ],
    "screenshot": "https://argenstats.com/screenshots/conversor.jpg",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    },
    "provider": {
      "@type": "Organization",
      "name": "ArgenStats",
      "url": "https://argenstats.com"
    },
    "author": {
      "@type": "Organization", 
      "name": "ArgenStats"
    },
    "potentialAction": {
      "@type": "UseAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://argenstats.com/conversor-dolar-peso-argentino",
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
          "http://schema.org/AndroidPlatform",
          "http://schema.org/IOSPlatform"
        ]
      }
    }
  };
  
  // FAQ Schema for Dollar Converter
  export const DollarConverterFAQSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuánto vale el dólar hoy en Argentina?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El valor del dólar en Argentina varía según el tipo de cambio. En nuestro conversor podés ver todas las cotizaciones actualizadas cada 30 segundos: dólar blue (mercado informal), oficial (BCRA), MEP (bolsa), CCL (contado con liquidación), crypto y tarjeta. Cada tipo tiene su propia cotización."
        }
      },
      {
        "@type": "Question", 
        "name": "¿Cómo calcular dólares a pesos argentinos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Para calcular dólares a pesos argentinos: 1) Ingresá el monto en USD en nuestro conversor, 2) Seleccioná el tipo de cambio deseado (blue, oficial, MEP, etc.), 3) Obtendrás instantáneamente el equivalente en pesos argentinos con la cotización actualizada."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la diferencia entre dólar blue y oficial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El dólar oficial es el tipo de cambio establecido por el Banco Central de la República Argentina (BCRA) para operaciones autorizadas. El dólar blue es la cotización del mercado informal o paralelo, generalmente 30-50% más alta que el oficial debido a las restricciones cambiarias."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con qué frecuencia se actualizan las cotizaciones?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Las cotizaciones se actualizan automáticamente cada 30 segundos durante el horario bancario (10:00 a 15:00 hs). El dólar blue y crypto se actualizan las 24 horas. Los datos provienen del BCRA para el oficial y APIs especializadas para el resto de las cotizaciones."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué tipos de dólar puedo convertir?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Podés convertir 7 tipos de cambio: Dólar Blue (mercado informal), Oficial (BCRA), MEP o Bolsa (Mercado Electrónico de Pagos), CCL (Contado con Liquidación), Crypto (cotización en exchanges), Mayorista (grandes operaciones) y Tarjeta (compras en el exterior con impuestos incluidos)."
        }
      },
      {
        "@type": "Question",
        "name": "¿Puedo ver cotizaciones históricas del dólar?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, podés consultar cotizaciones históricas de cualquier fecha desde 2002. Usá el selector de fecha en la parte superior del conversor, elegí la fecha deseada y obtendrás las cotizaciones de ese día específico para todos los tipos de dólar."
        }
      },
      {
        "@type": "Question",
        "name": "¿El conversor de dólar es gratuito?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Sí, nuestro conversor es 100% gratuito, sin límites de uso ni registro requerido. Podés realizar todas las conversiones que necesites, consultar datos históricos y cambiar entre todos los tipos de dólar sin ningún costo."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es el dólar MEP y cómo se calcula?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El dólar MEP (Mercado Electrónico de Pagos) o 'dólar bolsa' se obtiene comprando bonos en pesos y vendiéndolos en dólares en el mercado de valores local. Es una alternativa legal para acceder a dólares sin restricciones del cepo cambiario."
        }
      }
    ]
  };
  
  // Breadcrumb Schema Generator
  interface BreadcrumbItem {
    name: string;
    url: string;
  }
  
  export const BreadcrumbSchema = (items: BreadcrumbItem[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  });
  
  // Dataset Schema Generator for Economic Indicators
  export const DatasetSchema = (
    indicatorType: string, 
    description: string, 
    lastModified: string,
    updateFrequency?: string
  ) => ({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${indicatorType} Argentina`,
    "description": description,
    "url": `https://argenstats.com/indicadores/${indicatorType.toLowerCase().replace(/\s+/g, '-')}`,
    "dateModified": lastModified,
    "datePublished": "2024-01-01",
    "updateFrequency": updateFrequency || "PT1H",
    "creator": {
      "@type": "Organization",
      "name": "INDEC",
      "url": "https://www.indec.gob.ar"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ArgenStats",
      "url": "https://argenstats.com"
    },
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "spatialCoverage": {
      "@type": "Place",
      "name": "Argentina",
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "-38.416097",
        "longitude": "-63.616672"
      }
    },
    "temporalCoverage": "2002/..",
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": `https://api.argenstats.com/v1/${indicatorType.toLowerCase()}`
    }
  });
  
  // Financial Product Schema for Dollar Types
  export const FinancialProductSchema = (
    dollarType: string, 
    buyPrice?: number, 
    sellPrice?: number, 
    lastUpdate?: string
  ) => ({
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    "name": `Cotización Dólar ${dollarType}`,
    "description": `Tipo de cambio ${dollarType} en Argentina - Compra y venta en tiempo real`,
    "url": `https://argenstats.com/dolar#${dollarType.toLowerCase()}`,
    "provider": {
      "@type": "Organization",
      "name": "ArgenStats"
    },
    "offers": buyPrice && sellPrice ? [{
      "@type": "Offer",
      "name": "Compra",
      "price": buyPrice,
      "priceCurrency": "ARS",
      "availability": "https://schema.org/InStock",
      "validFrom": lastUpdate
    },
    {
      "@type": "Offer",
      "name": "Venta", 
      "price": sellPrice,
      "priceCurrency": "ARS",
      "availability": "https://schema.org/InStock",
      "validFrom": lastUpdate
    }] : undefined,
    "areaServed": {
      "@type": "Country",
      "name": "Argentina"
    }
  });
  
  // Currency Exchange Rate Schema - Para datos dinámicos
  export const ExchangeRateSchema = (
    fromCurrency: string,
    toCurrency: string,
    exchangeRate: number,
    lastUpdate: string
  ) => ({
    "@context": "https://schema.org",
    "@type": "ExchangeRateSpecification",
    "currency": fromCurrency,
    "currentExchangeRate": {
      "@type": "UnitPriceSpecification",
      "price": exchangeRate,
      "priceCurrency": toCurrency
    },
    "provider": {
      "@type": "Organization",
      "name": "ArgenStats"
    },
    "dateModified": lastUpdate
  });
  
  // Inflation Calculator WebApp Schema
  export const InflationCalculatorWebAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Calculadora de Inflación Argentina",
    "description": "Calculadora de inflación argentina con índice CER del BCRA. Calculá cuánto valen hoy tus pesos del pasado y el poder adquisitivo desde 2002.",
    "url": "https://argenstats.com/calculadora-inflacion",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires HTML5 support",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "category": "Free"
    },
    "featureList": [
      "Cálculo de inflación con índice CER oficial",
      "Datos del BCRA desde febrero 2002",
      "Cálculo bidireccional de poder adquisitivo",
      "Interfaz responsive",
      "Actualización diaria de datos"
    ],
    "provider": {
      "@type": "Organization",
      "name": "ArgenStats",
      "url": "https://argenstats.com"
    }
  };
  
  // FAQ Schema for Inflation Calculator
  export const InflationCalculatorFAQSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Cuánto valen hoy $1000 de 2010?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Usando nuestra calculadora podés ver exactamente cuánto valen $1000 de 2010 en pesos actuales. La respuesta varía según la fecha específica y la evolución de la inflación medida por el índice CER."
        }
      },
      {
        "@type": "Question", 
        "name": "¿Cómo se calcula la inflación acumulada?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La inflación acumulada se calcula comparando el índice CER entre dos fechas. Nuestra calculadora hace este cálculo automáticamente mostrando tanto el valor equivalente como el porcentaje de inflación del período."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es el índice CER?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El CER (Coeficiente de Estabilización de Referencia) es un índice que refleja la evolución del IPC publicado por el BCRA. Se usa para ajustar contratos y medir el poder adquisitivo desde febrero de 2002."
        }
      },
      {
        "@type": "Question",
        "name": "¿Desde cuándo están disponibles los datos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los datos del índice CER están disponibles desde el 2 de febrero de 2002, fecha de implementación de este coeficiente por parte del Banco Central de la República Argentina."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con qué frecuencia se actualizan los datos?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los datos del CER se actualizan diariamente siguiendo las publicaciones oficiales del Banco Central, reflejando la evolución del Índice de Precios al Consumidor."
        }
      }
    ]
  };
  
  // Country Risk Schema with real-time features
  export const CountryRiskSchema = (currentValue?: number, lastUpdate?: string, changePercent?: number) => ({
    "@context": "https://schema.org",
    "@type": ["Dataset", "FinancialProduct"],
    "name": "Riesgo País Argentina - EMBI+ en Tiempo Real",
    "description": "Seguimiento en tiempo real del indicador de riesgo soberano argentino con análisis intradía cada 30 minutos. Incluye visualizaciones de 1 día, 7 días y análisis histórico completo.",
    "url": "https://argenstats.com/indicadores/riesgo-pais",
    "keywords": "riesgo país, argentina, EMBI, bonos soberanos, análisis intradía, tiempo real",
    "dateModified": lastUpdate || new Date().toISOString(),
    "temporalCoverage": "2016/P8Y",
    "variableMeasured": [
      {
        "@type": "PropertyValue",
        "name": "Riesgo País (puntos básicos)",
        "value": currentValue,
        "unitText": "puntos básicos"
      },
      {
        "@type": "PropertyValue", 
        "name": "Variación porcentual",
        "value": changePercent,
        "unitText": "porcentaje"
      }
    ],
    "updateFrequency": "PT30M",
    "creator": {
      "@type": "Organization",
      "name": "Mercados Financieros Internacionales"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ArgenStats",
      "url": "https://argenstats.com"
    },
    "spatialCoverage": {
      "@type": "Place",
      "name": "Argentina"
    },
    "mainEntity": {
      "@type": "WebApplication",
      "name": "Dashboard Riesgo País Tiempo Real",
      "description": "Herramienta interactiva para monitorear el riesgo país argentino con datos cada 30 minutos",
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web Browser",
      "browserRequirements": "Requires JavaScript"
    }
  });
  
  // Service Schema for API
  export const APIServiceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "ArgenStats API",
    "description": "API REST para indicadores económicos de Argentina en tiempo real",
    "url": "https://api.argenstats.com",
    "serviceType": "Financial Data API",
    "provider": {
      "@type": "Organization",
      "name": "ArgenStats"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "eligibleRegion": {
        "@type": "Place",
        "name": "Worldwide"
      }
    },
    "termsOfService": "https://argenstats.com/terminos",
    "documentation": "https://docs.argenstats.com"
  };
  
  // Review Schema para testimonios
  export const ReviewSchema = (
    author: string,
    rating: number,
    reviewBody: string,
    datePublished: string
  ) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "author": {
      "@type": "Person",
      "name": author
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": rating,
      "bestRating": "5"
    },
    "reviewBody": reviewBody,
    "datePublished": datePublished,
    "itemReviewed": {
      "@type": "WebApplication",
      "name": "Conversor de Dólar ArgenStats"
    }
  });