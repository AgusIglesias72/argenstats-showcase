// lib/schemas/poverty.schemas.ts

interface PovertyData {
    current: {
      period: string
      date: string
      poverty: {
        persons: number
        households: number
        variation: {
          persons: number
          households: number
        }
      }
      indigence: {
        persons: number
        households: number
        variation: {
          persons: number
          households: number
        }
      }
    } | null
    regionalComparison: Array<{
      region: string
      regionCode: string
      poverty: {
        persons: number
        households: number
        ranking: number
      }
      indigence: {
        persons: number
        households: number
        ranking: number
      }
    }>
    historical: Array<{
      date: string
      period: string
      poverty: {
        persons: number
        households: number
      }
      indigence: {
        persons: number
        households: number
      }
    }>
  }
  
  /**
   * Schema para el dataset de pobreza e indigencia
   */
  export function generatePovertySchema(data: PovertyData) {
    const current = data.current
    
    if (!current) {
      return null
    }
  
    return {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Índices de Pobreza e Indigencia en Argentina",
      "description": `Datos oficiales del INDEC sobre pobreza e indigencia en Argentina. Período ${current.period}: Pobreza ${current.poverty.persons.toFixed(1)}% de personas y ${current.poverty.households.toFixed(1)}% de hogares. Indigencia ${current.indigence.persons.toFixed(1)}% de personas y ${current.indigence.households.toFixed(1)}% de hogares.`,
      "url": "https://argenstats.com/indicadores/pobreza",
      "identifier": "argentina-poverty-indigence-dataset",
      "keywords": [
        "pobreza argentina",
        "indigencia argentina", 
        "INDEC",
        "estadísticas sociales",
        "canasta básica",
        "pobreza por regiones",
        "indicadores sociales"
      ],
      "creator": {
        "@type": "Organization",
        "name": "Instituto Nacional de Estadística y Censos (INDEC)",
        "url": "https://www.indec.gob.ar"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ArgenStats",
        "url": "https://argenstats.com"
      },
      "datePublished": current.date,
      "dateModified": new Date().toISOString(),
      "temporalCoverage": `2016/${new Date().getFullYear()}`,
      "spatialCoverage": {
        "@type": "Place",
        "name": "Argentina",
        "geo": {
          "@type": "GeoShape",
          "box": "-55.1850 -73.6603 -21.7814 -53.6375"
        }
      },
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "distribution": [
        {
          "@type": "DataDownload",
          "encodingFormat": "application/json",
          "contentUrl": "https://argenstats.com/api/poverty/current"
        },
        {
          "@type": "DataDownload",
          "encodingFormat": "text/csv",
          "contentUrl": "https://argenstats.com/api/poverty/export/csv"
        }
      ],
      "variableMeasured": [
        {
          "@type": "PropertyValue",
          "name": "Pobreza en personas",
          "value": current.poverty.persons,
          "unitText": "porcentaje"
        },
        {
          "@type": "PropertyValue",
          "name": "Pobreza en hogares",
          "value": current.poverty.households,
          "unitText": "porcentaje"
        },
        {
          "@type": "PropertyValue",
          "name": "Indigencia en personas",
          "value": current.indigence.persons,
          "unitText": "porcentaje"
        },
        {
          "@type": "PropertyValue",
          "name": "Indigencia en hogares",
          "value": current.indigence.households,
          "unitText": "porcentaje"
        }
      ]
    }
  }
  
  /**
   * Schema para el análisis de pobreza
   */
  export function generatePovertyAnalysisSchema(data: PovertyData) {
    const current = data.current
    
    if (!current) {
      return null
    }
  
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://argenstats.com/indicadores/pobreza"
      },
      "headline": `Pobreza ${current.poverty.persons.toFixed(1)}% e Indigencia ${current.indigence.persons.toFixed(1)}% en Argentina - ${current.period}`,
      "description": `Análisis completo de los índices de pobreza e indigencia en Argentina. Datos del INDEC para el ${current.period} con comparación regional y evolución histórica.`,
      "image": [
        "https://argenstats.com/og-poverty.jpg",
        "https://argenstats.com/poverty-chart.jpg",
        "https://argenstats.com/poverty-regions.jpg"
      ],
      "author": {
        "@type": "Organization",
        "name": "ArgenStats",
        "url": "https://argenstats.com"
      },
      "publisher": {
        "@type": "Organization",
        "name": "ArgenStats",
        "logo": {
          "@type": "ImageObject",
          "url": "https://argenstats.com/logo.png"
        }
      },
      "datePublished": current.date,
      "dateModified": new Date().toISOString(),
      "articleSection": "Indicadores Económicos",
      "keywords": "pobreza, indigencia, argentina, indec, estadisticas sociales",
      "articleBody": `El último informe del INDEC sobre pobreza e indigencia correspondiente al ${current.period} muestra que el ${current.poverty.persons.toFixed(1)}% de las personas y el ${current.poverty.households.toFixed(1)}% de los hogares se encuentran bajo la línea de pobreza. En cuanto a la indigencia, afecta al ${current.indigence.persons.toFixed(1)}% de las personas y al ${current.indigence.households.toFixed(1)}% de los hogares. Estos indicadores presentan una variación de ${current.poverty.variation.persons.toFixed(1)} puntos porcentuales en pobreza y ${current.indigence.variation.persons.toFixed(1)} puntos en indigencia respecto al semestre anterior.`,
      "backstory": {
        "@type": "CreativeWork",
        "text": "La medición de la pobreza e indigencia en Argentina se realiza mediante el método de línea de pobreza, que consiste en establecer si los hogares cuentan con ingresos suficientes para cubrir una canasta de alimentos y servicios básicos."
      },
      "mentions": [
        {
          "@type": "Thing",
          "name": "Canasta Básica Total (CBT)",
          "description": "Incluye alimentos y servicios básicos necesarios para la subsistencia"
        },
        {
          "@type": "Thing",
          "name": "Canasta Básica Alimentaria (CBA)",
          "description": "Conjunto de alimentos que cubren las necesidades nutricionales mínimas"
        }
      ]
    }
  }
  
  /**
   * Schema FAQ para preguntas frecuentes sobre pobreza
   */
  export function generatePovertyFAQSchema() {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "¿Qué es la pobreza según el INDEC?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Se considera pobre a una persona cuando el ingreso del hogar donde reside no alcanza para adquirir la Canasta Básica Total (CBT), que incluye alimentos y servicios básicos como vestimenta, transporte, educación, salud y vivienda."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué es la indigencia según el INDEC?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Se considera indigente a una persona cuando el ingreso del hogar no alcanza para adquirir la Canasta Básica Alimentaria (CBA), que cubre las necesidades nutricionales mínimas de un adulto durante un mes."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cuál es la diferencia entre pobreza e indigencia?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La indigencia mide si los ingresos alcanzan para cubrir las necesidades alimentarias básicas (CBA), mientras que la pobreza mide si los ingresos cubren tanto alimentos como servicios básicos (CBT). Toda persona indigente es pobre, pero no toda persona pobre es indigente."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cómo se calcula la Canasta Básica Total?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La CBT se calcula multiplicando la Canasta Básica Alimentaria por el coeficiente de Engel, que representa la relación entre los gastos alimentarios y los gastos totales del hogar. Incluye alimentos, vestimenta, transporte, educación, salud, vivienda, entre otros bienes y servicios."
          }
        },
        {
          "@type": "Question",
          "name": "¿Con qué frecuencia se actualizan los datos de pobreza?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "El INDEC publica los datos de pobreza e indigencia de manera semestral, generalmente en marzo (para el segundo semestre del año anterior) y en septiembre (para el primer semestre del año en curso)."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué regiones de Argentina tienen mayor pobreza?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Históricamente, las regiones del Noreste (NEA) y Noroeste (NOA) presentan los mayores índices de pobreza e indigencia, mientras que la Patagonia suele tener los índices más bajos. Sin embargo, estos valores pueden variar según el período analizado."
          }
        },
        {
          "@type": "Question",
          "name": "¿Cómo se mide la pobreza en personas vs hogares?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La pobreza en hogares cuenta el porcentaje de hogares cuyos ingresos no alcanzan la CBT. La pobreza en personas cuenta el porcentaje de individuos que viven en hogares pobres. Generalmente el porcentaje de personas pobres es mayor porque los hogares pobres tienden a tener más miembros."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué es la Encuesta Permanente de Hogares (EPH)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "La EPH es el relevamiento que realiza el INDEC en 31 aglomerados urbanos del país para recopilar datos sobre la situación socioeconómica de la población, incluyendo empleo, ingresos, educación y condiciones de vida. Es la base para el cálculo de pobreza e indigencia."
          }
        },
        {
          "@type": "Question",
          "name": "¿Dónde puedo encontrar los datos oficiales de pobreza?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Los datos oficiales de pobreza e indigencia se publican en el sitio web del INDEC (www.indec.gob.ar) en la sección de Condiciones de vida. ArgenStats procesa y visualiza estos datos oficiales para facilitar su análisis y comprensión."
          }
        },
        {
          "@type": "Question",
          "name": "¿Qué factores influyen en los índices de pobreza?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Los principales factores que influyen en los índices de pobreza incluyen: la inflación (que afecta el valor de las canastas básicas), el nivel de empleo y salarios, las políticas de transferencias sociales, el crecimiento económico y la distribución del ingreso."
          }
        }
      ]
    }
  }