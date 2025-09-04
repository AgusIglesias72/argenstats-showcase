// /lib/api/constants/emae.ts
export const EMAE_SECTORS = {
    'GENERAL': 'Nivel general',
    'A': 'Agricultura, ganadería, caza y silvicultura',
    'B': 'Pesca',
    'C': 'Industria manufacturera',
    'D': 'Suministro de electricidad, gas y agua',
    'E': 'Construcción',
    'F': 'Comercio mayorista y minorista',
    'G': 'Hoteles y restaurantes',
    'H': 'Transporte y comunicaciones',
    'I': 'Intermediación financiera',
    'J': 'Actividades inmobiliarias, empresariales y de alquiler',
    'K': 'Administración pública, defensa y seguridad social',
    'L': 'Enseñanza',
    'M': 'Servicios sociales y de salud',
    'N': 'Otras actividades de servicios comunitarios',
    'O': 'Hogares privados con servicio doméstico',
    'P': 'Impuestos netos de subsidios'
  } as const
  
  export const EMAE_SECTOR_GROUPS = {
    'BIENES': ['A', 'B', 'C', 'D', 'E'],
    'SERVICIOS': ['F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'],
    'IMPUESTOS': ['P']
  } as const
  
  export type EmaeSectorCode = keyof typeof EMAE_SECTORS
  export type EmaeSectorGroup = keyof typeof EMAE_SECTOR_GROUPS
  
  // Mapeo de sectores para mejor legibilidad
  export const SECTOR_SHORT_NAMES = {
    'A': 'Agro',
    'B': 'Pesca',
    'C': 'Industria',
    'D': 'Energía',
    'E': 'Construcción',
    'F': 'Comercio',
    'G': 'Hoteles',
    'H': 'Transporte',
    'I': 'Finanzas',
    'J': 'Inmobiliario',
    'K': 'Sector Público',
    'L': 'Educación',
    'M': 'Salud',
    'N': 'Otros Servicios',
    'O': 'Servicio Doméstico',
    'P': 'Impuestos'
  } as const