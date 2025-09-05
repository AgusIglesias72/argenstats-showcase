// lib/api/constants/emae.ts
export const EMAE_SECTORS = {
  'GENERAL': 'Nivel general',
  'A': 'Agricultura, ganadería, caza y silvicultura',
  'B': 'Pesca',
  'C': 'Explotación de minas y canteras',
  'D': 'Industria manufacturera',
  'E': 'Electricidad, gas y agua',
  'F': 'Construcción',
  'G': 'Comercio mayorista, minorista y reparaciones',
  'H': 'Hoteles y restaurantes',
  'I': 'Transporte y comunicaciones',
  'J': 'Intermediación financiera',
  'K': 'Actividades inmobiliarias, empresariales y de alquiler',
  'L': 'Administración pública y defensa',
  'M': 'Enseñanza',
  'N': 'Servicios sociales y de salud',
  'O': 'Otras actividades de servicios comunitarios',
  'P': 'Impuestos netos de subsidios'
} as const

// Agrupación de sectores por categoría
export const EMAE_SECTOR_CATEGORIES = {
  productivos: {
    label: "Sectores Productivos Principales",
    color: "text-blue-600",
    dotColor: "bg-blue-500",
    sectors: ['D', 'G', 'K', 'A', 'I', 'C']
  },
  servicios: {
    label: "Sectores de Servicios",
    color: "text-purple-600",
    dotColor: "bg-purple-500",
    sectors: ['L', 'M', 'J', 'F', 'N', 'E', 'H']
  },
  otros: {
    label: "Otros Sectores",
    color: "text-gray-600",
    dotColor: "bg-gray-500",
    sectors: ['B', 'O', 'P']
  }
}

// Información adicional de sectores con sus porcentajes del PIB
export const EMAE_SECTOR_INFO = {
  'D': { percentage: 18.9, description: 'Sector que transforma físicamente y químicamente materiales, sustancias o componentes en productos nuevos. Incluye desde alimentos y textiles hasta automotores y productos químicos.' },
  'G': { percentage: 12.4, description: 'Abarca el comercio de productos agropecuarios, industriales nacionales, importados y exportaciones, junto con mantenimiento y reparación de automotores.' },
  'K': { percentage: 11.0, description: 'Incluye servicios inmobiliarios, alquiler de viviendas, actividades jurídicas y contables, alquiler de equipos, y servicios empresariales como informática y seguridad.' },
  'A': { percentage: 8.1, description: 'Comprende cultivos agrícolas como soja, trigo, maíz, y actividades pecuarias incluyendo producción bovina, lechería, carne aviar y huevos.' },
  'I': { percentage: 6.1, description: 'Servicios de transporte de pasajeros y cargas por vía férrea, automotor, aéreo y fluvial, así como telefonía, servicios postales, Internet y transmisión audiovisual.' },
  'C': { percentage: 5.0, description: 'Extracción de petróleo, gas natural y minerales metalíferos no ferrosos, junto con sus servicios relacionados.' },
  'L': { percentage: 4.4, description: 'Servicios administrativos del gobierno nacional, provincial y municipal, incluyendo seguridad y defensa nacional.' },
  'M': { percentage: 3.5, description: 'Servicios educativos públicos y privados en todos los niveles, desde educación inicial hasta universitaria y formación profesional.' },
  'J': { percentage: 3.1, description: 'Servicios bancarios, seguros, casas de cambio y otros servicios financieros incluyendo obras sociales y medicina prepaga.' },
  'F': { percentage: 3.1, description: 'Actividades de construcción residencial, comercial e infraestructura, medida a través de indicadores como el ISAC y empleo sectorial.' },
  'N': { percentage: 2.7, description: 'Servicios de salud públicos y privados, incluyendo hospitales, clínicas, centros de salud y servicios médicos especializados.' },
  'E': { percentage: 1.8, description: 'Generación, transmisión y distribución de energía eléctrica, servicios de gas natural y distribución de agua potable y saneamiento.' },
  'H': { percentage: 1.4, description: 'Servicios de alojamiento temporal y gastronómicos, incluyendo hoteles, restaurantes, bares y servicios de catering.' }
}

// Tipos de visualización de datos
export const EMAE_DATA_TYPES = {
  'original': 'Serie Original',
  'seasonally_adjusted': 'Serie Desestacionalizada',
  'cycle_trend': 'Tendencia-Ciclo'
} as const

// Tipos de variación
export const EMAE_VARIATION_TYPES = {
  'monthly': 'Variación Mensual',
  'yearly': 'Variación Interanual',
  'accumulated': 'Variación Acumulada'
} as const

export type EmaeSectorCode = keyof typeof EMAE_SECTORS
export type EmaeDataType = keyof typeof EMAE_DATA_TYPES
export type EmaeVariationType = keyof typeof EMAE_VARIATION_TYPES