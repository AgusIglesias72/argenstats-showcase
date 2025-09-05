// lib/api/constants/inflation.ts
export const IPC_COMPONENTS = {
  // General
  'GENERAL': 'Nivel general',
  
  // Rubros principales
  'RUBRO_ALIMENTOS': 'Alimentos y bebidas no alcohólicas',
  'RUBRO_BEB_ALC_Y_TAB': 'Bebidas alcohólicas y tabaco',
  'RUBRO_PRE_DE_VES_Y_CAL': 'Prendas de vestir y calzado',
  'RUBRO_VIVIENDA': 'Vivienda, agua, electricidad, gas y otros combustibles',
  'RUBRO_EQUIPAMIENTO': 'Equipamiento y mantenimiento del hogar',
  'RUBRO_SALUD': 'Salud',
  'RUBRO_TRANSPORTE': 'Transporte',
  'RUBRO_COMUNICACION': 'Comunicación',
  'RUBRO_RECREACION_Y_CULT': 'Recreación y cultura',
  'RUBRO_EDUCACION': 'Educación',
  'RUBRO_RESTAURANTES': 'Restaurantes y hoteles',
  'RUBRO_BIE_Y_SER_VAR': 'Bienes y servicios varios',
  
  // Categorías BYS (Bienes y Servicios)
  'BYS_BIENES': 'Bienes',
  'BYS_SERVICIOS': 'Servicios',
  
  // Categorías especiales
  'CAT_NUCLEO': 'Núcleo',
  'CAT_ESTACIONAL': 'Estacional',
  'CAT_REGULADOS': 'Regulados'
} as const

export const IPC_REGIONS = {
  'Nacional': 'Total Nacional',
  'GBA': 'Gran Buenos Aires',
  'Pampeana': 'Región Pampeana',
  'Noroeste': 'Región Noroeste',
  'Noreste': 'Región Noreste',
  'Cuyo': 'Región Cuyo',
  'Patagonia': 'Región Patagonia'
} as const

// Componentes principales que siempre existen
export const CORE_IPC_COMPONENTS = [
  'GENERAL',
  'RUBRO_ALIMENTOS',
  'RUBRO_BEB_ALC_Y_TAB',
  'RUBRO_PRE_DE_VES_Y_CAL',
  'RUBRO_VIVIENDA',
  'RUBRO_EQUIPAMIENTO',
  'RUBRO_SALUD',
  'RUBRO_TRANSPORTE',
  'RUBRO_COMUNICACION',
  'RUBRO_RECREACION_Y_CULT',
  'RUBRO_EDUCACION',
  'RUBRO_RESTAURANTES',
  'RUBRO_BIE_Y_SER_VAR'
] as const

// Categorías adicionales
export const CATEGORY_COMPONENTS = [
  'BYS_BIENES',
  'BYS_SERVICIOS',
  'CAT_NUCLEO',
  'CAT_ESTACIONAL',
  'CAT_REGULADOS'
] as const

export type IPCComponentCode = keyof typeof IPC_COMPONENTS
export type IPCRegion = keyof typeof IPC_REGIONS
export type CoreIPCComponent = typeof CORE_IPC_COMPONENTS[number]
export type CategoryComponent = typeof CATEGORY_COMPONENTS[number]