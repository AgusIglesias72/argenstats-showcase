
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

// Tipos para EMAE - Ajustados a lo que realmente devuelve el servicio
interface EmaeCurrentData {
  date: string;
  value: number;
  index_value: number;
  monthly_change: number | null;
  yearly_change: number | null;
  monthly_pct_change: number | null;
  yearly_pct_change: number | null;
  sector_code: string;
  sector_name: string;
}

interface EmaeSectorData {
  sector_code: string;
  sector_name: string;
  current_value: number;
  monthly_change: number | null;
  yearly_change: number | null;
}

interface EmaeStats {
  lastUpdate: string;
  general: {
    index: number;
    monthly: number | null;
    yearly: number | null;
    seasonallyAdjusted: number | null;
  };
  topGrowthSectors: EmaeSectorData[];
  topDeclineSectors: EmaeSectorData[];
}

// Este es el tipo que devuelve getEmaeData()
export interface EmaePageData {
  current: EmaeCurrentData | null;
  sectors: EmaeSectorData[];
  historical: EmaeHistoricalData[];
  stats: EmaeStats | null;
}

interface EmaeHistoricalData {
  date: string;
  value: number;
  // otros campos según tu servicio
}

export interface EmaeData {
  current: EmaeCurrentData | null;
  sectors: EmaeSectorData[];
  historical: any[];
  stats: EmaeStats | null;
}

// Schema para el EMAE Dataset
export function generateEmaeSchema(data: EmaeData) {
  const lastUpdate = data.current?.date || new Date().toISOString()
  
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "EMAE - Estimador Mensual de Actividad Económica Argentina",
    "description": "Indicador mensual de la evolución de la actividad económica del conjunto de los sectores productivos a nivel nacional. Base 2004=100.",
    "url": "https://argentinadatos.com/indicadores/emae",
    "dateModified": lastUpdate,
    "datePublished": "2004-01-01",
    "updateFrequency": "P1M",
    "creator": {
      "@type": "Organization",
      "name": "Instituto Nacional de Estadística y Censos (INDEC)",
      "url": "https://www.indec.gob.ar"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "ArgentinaDatos",
      "url": "https://argentinadatos.com"
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
    "temporalCoverage": "2004/..",
    "variableMeasured": [
      {
        "@type": "PropertyValue",
        "name": "Índice base 2004",
        "value": data.current?.index_value,
        "unitText": "índice"
      },
      {
        "@type": "PropertyValue",
        "name": "Variación interanual",
        "value": data.current?.yearly_pct_change,
        "unitText": "porcentaje"
      },
      {
        "@type": "PropertyValue",
        "name": "Variación mensual",
        "value": data.current?.monthly_pct_change,
        "unitText": "porcentaje"
      }
    ],
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "https://api.argentinadatos.com/v1/emae"
    },
    "includedInDataCatalog": {
      "@type": "DataCatalog",
      "name": "ArgentinaDatos - Catálogo de Indicadores Económicos"
    }
  }
}

// Schema de análisis económico
export function generateEmaeAnalysisSchema(data: EmaeData) {
  const isGrowth = (data.current?.yearly_pct_change || 0) > 0
  const changeValue = Math.abs(data.current?.yearly_pct_change || 0).toFixed(1)
  
  return {
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    "headline": `EMAE Argentina: Actividad económica ${isGrowth ? 'crece' : 'cae'} ${changeValue}% interanual`,
    "description": "Análisis detallado del Estimador Mensual de Actividad Económica con datos por sectores productivos",
    "datePublished": data.current?.date || new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "ArgentinaDatos"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ArgentinaDatos",
      "logo": {
        "@type": "ImageObject",
        "url": "https://argentinadatos.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://argentinadatos.com/indicadores/emae"
    },
    "about": {
      "@type": "Thing",
      "name": "Economía Argentina",
      "description": "Indicadores de actividad económica"
    }
  }
}

// Schema FAQ para EMAE
export function generateEmaeFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Qué es el EMAE?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El EMAE (Estimador Mensual de Actividad Económica) es un indicador provisional de la evolución del PBI que refleja la actividad económica mensual de todos los sectores productivos de Argentina. Proporciona información temprana sobre el desempeño económico del país."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con qué frecuencia se actualiza el EMAE?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El EMAE se publica mensualmente por el INDEC, aproximadamente 50 días después del cierre del mes de referencia. Los datos se presentan tanto en forma original como desestacionalizada."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué sectores incluye el EMAE?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El EMAE incluye 15 sectores económicos: Agricultura, ganadería, caza y silvicultura; Pesca; Explotación de minas y canteras; Industria manufacturera; Electricidad, gas y agua; Construcción; Comercio mayorista y minorista; Hoteles y restaurantes; Transporte y comunicaciones; Intermediación financiera; Actividades inmobiliarias, empresariales y de alquiler; Administración pública y defensa; Enseñanza; Servicios sociales y de salud; y Otras actividades de servicios."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la diferencia entre el EMAE y el PBI?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El EMAE es un indicador mensual provisional que anticipa la tendencia del PBI. Mientras que el PBI es el indicador trimestral definitivo y más completo de la actividad económica, el EMAE ofrece una lectura más frecuente y oportuna del desempeño económico, aunque con menor cobertura y detalle."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo se interpreta el EMAE?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El EMAE se interpreta comparando las variaciones porcentuales interanuales (respecto al mismo mes del año anterior) y mensuales (respecto al mes previo). Un valor positivo indica crecimiento de la actividad económica, mientras que un valor negativo señala contracción."
        }
      }
    ]
  }
}

// Tipos para IPC
interface IPCCurrentData {
  date: string;
  value: number;
  index_value: number;
  monthly_pct_change: number | null;
  yearly_pct_change: number | null;
  component_code: string;
  component_name: string;
  component_type: string;
  region: string;
}

interface IPCComponentData {
  component_code: string;
  component_name: string;
  component_type: string;
  current_value: number;
  monthly_change: number | null;
  yearly_change: number | null;
  weight?: number;
}

interface IPCHistoricalData {
  date: string;
  value: number;
  monthly_pct_change?: number | null;
  yearly_pct_change?: number | null;
}

export interface IPCPageData {
  current: IPCCurrentData | null;
  components: IPCComponentData[];
  historical: IPCHistoricalData[];
}

// Schema para el IPC Dataset
export function generateIPCSchema(data: IPCPageData) {
  const lastUpdate = data.current?.date || new Date().toISOString()
  
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "IPC - Índice de Precios al Consumidor Argentina",
    "description": "Índice que mide la evolución de los precios de un conjunto de bienes y servicios representativos del consumo de los hogares residentes en áreas urbanas de Argentina.",
    "url": "https://argentinadatos.com/indicadores/inflacion",
    "dateModified": lastUpdate,
    "datePublished": "2016-01-01",
    "updateFrequency": "P1M",
    "creator": {
      "@type": "Organization",
      "name": "Instituto Nacional de Estadística y Censos (INDEC)",
      "url": "https://www.indec.gob.ar"
    },
    "publisher": {
      "@type": "Organization", 
      "name": "ArgentinaDatos",
      "url": "https://argentinadatos.com"
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
    "temporalCoverage": "2016/..",
    "variableMeasured": [
      {
        "@type": "PropertyValue",
        "name": "Índice de Precios al Consumidor",
        "value": data.current?.index_value,
        "unitText": "índice base dic-2016=100"
      },
      {
        "@type": "PropertyValue",
        "name": "Inflación mensual",
        "value": data.current?.monthly_pct_change,
        "unitText": "porcentaje"
      },
      {
        "@type": "PropertyValue",
        "name": "Inflación interanual",
        "value": data.current?.yearly_pct_change,
        "unitText": "porcentaje"
      }
    ],
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "https://api.argentinadatos.com/v1/ipc"
    },
    "includedInDataCatalog": {
      "@type": "DataCatalog",
      "name": "ArgentinaDatos - Catálogo de Indicadores Económicos"
    }
  }
}

// Schema de análisis de inflación
export function generateIPCAnalysisSchema(data: IPCPageData) {
  const monthlyInflation = data.current?.monthly_pct_change || 0
  const yearlyInflation = data.current?.yearly_pct_change || 0
  
  return {
    "@context": "https://schema.org",
    "@type": "AnalysisNewsArticle",
    "headline": `Inflación Argentina: ${yearlyInflation.toFixed(1)}% interanual y ${monthlyInflation.toFixed(1)}% mensual`,
    "description": "Análisis detallado del Índice de Precios al Consumidor con desagregación por rubros y regiones",
    "datePublished": data.current?.date || new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "ArgentinaDatos"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ArgentinaDatos",
      "logo": {
        "@type": "ImageObject",
        "url": "https://argentinadatos.com/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://argentinadatos.com/indicadores/inflacion"
    },
    "about": {
      "@type": "Thing",
      "name": "Inflación Argentina",
      "description": "Evolución de precios al consumidor"
    }
  }
}

// Schema FAQ para IPC
export function generateIPCFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Qué es el IPC?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El IPC (Índice de Precios al Consumidor) es un indicador que mide la evolución de los precios de un conjunto de bienes y servicios representativos del consumo de los hogares. Es el principal indicador para medir la inflación en Argentina."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo se calcula la inflación mensual?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La inflación mensual se calcula como la variación porcentual del IPC entre dos meses consecutivos. Por ejemplo, si el IPC de enero es 100 y el de febrero es 103, la inflación mensual es del 3%."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué rubros incluye el IPC?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El IPC incluye 12 divisiones principales: Alimentos y bebidas no alcohólicas, Bebidas alcohólicas y tabaco, Prendas de vestir y calzado, Vivienda y servicios básicos, Equipamiento del hogar, Salud, Transporte, Comunicación, Recreación y cultura, Educación, Restaurantes y hoteles, y Bienes y servicios varios."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es el IPC Núcleo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El IPC Núcleo es una medida de inflación que excluye los precios más volátiles como alimentos frescos y combustibles. Proporciona una visión de la tendencia inflacionaria subyacente, eliminando fluctuaciones temporales."
        }
      },
      {
        "@type": "Question",
        "name": "¿Con qué frecuencia se actualiza el IPC?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El INDEC publica el IPC mensualmente, generalmente entre el día 12 y 15 de cada mes, con los datos correspondientes al mes anterior."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cuál es la diferencia entre inflación mensual e interanual?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La inflación mensual compara el índice del mes actual con el mes anterior, mientras que la inflación interanual compara con el mismo mes del año anterior. La interanual muestra la acumulación de 12 meses de inflación."
        }
      }
    ]
  }
}