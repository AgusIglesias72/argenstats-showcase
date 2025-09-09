// lib/schemas/labor-market.schemas.ts

interface LaborMarketData {
    current: any
    regional: any[]
    historical: any[]
    stats: any
    demographic: any
  }
  
  // Schema para el dataset del mercado laboral
  export const generateLaborMarketSchema = (data: LaborMarketData) => ({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": "Indicadores del Mercado Laboral Argentina",
    "description": "Datos del mercado laboral argentino incluyendo tasas de empleo, desempleo y actividad por regiones y segmentos demográficos",
    "url": "https://argenstats.com/indicadores/empleo",
    "dateModified": data.current?.date || new Date().toISOString(),
    "datePublished": "2024-01-01",
    "updateFrequency": "P3M", // Trimestral
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
    "temporalCoverage": "2003/..",
    "distribution": {
      "@type": "DataDownload",
      "encodingFormat": "application/json",
      "contentUrl": "https://api.argenstats.com/v1/empleo"
    },
    "variableMeasured": [
      {
        "@type": "PropertyValue",
        "name": "Tasa de Desempleo",
        "value": data.current?.unemploymentRate,
        "unitText": "%"
      },
      {
        "@type": "PropertyValue",
        "name": "Tasa de Empleo",
        "value": data.current?.employmentRate,
        "unitText": "%"
      },
      {
        "@type": "PropertyValue",
        "name": "Tasa de Actividad",
        "value": data.current?.activityRate,
        "unitText": "%"
      }
    ]
  });
  
  // Schema para el análisis del mercado laboral
  export const generateLaborMarketAnalysisSchema = (data: LaborMarketData) => ({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `Mercado Laboral Argentina: Desempleo ${data.current?.unemploymentRate?.toFixed(1)}%`,
    "description": `Análisis completo del mercado laboral argentino con datos de empleo, desempleo y actividad económica por regiones`,
    "datePublished": "2024-01-01",
    "dateModified": data.current?.date || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "ArgenStats"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ArgenStats",
      "logo": {
        "@type": "ImageObject",
        "url": "https://argenstats.com/logo.png"
      }
    },
    "about": {
      "@type": "Thing",
      "name": "Mercado Laboral",
      "description": "Estadísticas de empleo y desempleo en Argentina"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://argenstats.com/indicadores/empleo"
    },
    "keywords": "empleo, desempleo, mercado laboral, tasa de actividad, EPH, INDEC",
    "articleSection": "Indicadores Económicos",
    "inLanguage": "es-AR"
  });
  
  // FAQ Schema para el mercado laboral
  export const generateLaborMarketFAQSchema = () => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "¿Qué es la tasa de desempleo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La tasa de desempleo es el porcentaje de la población económicamente activa (PEA) que no tiene empleo pero lo busca activamente. Se calcula como el cociente entre la población desocupada y la PEA, multiplicado por 100."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cómo se calcula la tasa de empleo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La tasa de empleo es el porcentaje de la población de 14 años y más que tiene empleo. Se calcula dividiendo la cantidad de personas ocupadas por la población total de referencia y multiplicando por 100."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es la tasa de actividad?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La tasa de actividad mide el porcentaje de la población de 14 años y más que participa activamente del mercado de trabajo, ya sea trabajando o buscando trabajo. Incluye tanto a los ocupados como a los desocupados."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es la EPH y cómo se realiza?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La Encuesta Permanente de Hogares (EPH) es un programa nacional de producción de indicadores sociales del INDEC. Se realiza trimestralmente en 31 aglomerados urbanos que representan aproximadamente el 70% de la población urbana del país."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es el desempleo juvenil?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "El desempleo juvenil se refiere a la tasa de desempleo en el grupo etario de 14 a 29 años. Históricamente presenta valores más altos que el promedio general debido a factores como menor experiencia laboral y mayor rotación."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué es la subocupación?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La subocupación es la situación de los ocupados que trabajan menos de 35 horas semanales por causas involuntarias y están disponibles para trabajar más horas. Se divide en subocupación demandante (buscan activamente otro trabajo) y no demandante."
        }
      },
      {
        "@type": "Question",
        "name": "¿Cada cuánto se actualizan los datos de empleo?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Los datos de empleo del INDEC se publican trimestralmente, generalmente dos meses después del cierre de cada trimestre. Por ejemplo, los datos del primer trimestre se publican en mayo."
        }
      },
      {
        "@type": "Question",
        "name": "¿Qué regiones tienen mayor desempleo en Argentina?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Históricamente, las regiones del NEA y NOA suelen presentar mayores tasas de desempleo, mientras que la Patagonia tiende a tener las menores tasas. Sin embargo, esto puede variar según la coyuntura económica."
        }
      }
    ]
  });