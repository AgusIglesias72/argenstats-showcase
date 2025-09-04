// /lib/api/constants/inflation.ts
export const IPC_COMPONENTS = {
    'GENERAL': 'Nivel general',
    'ALIMENTOS': 'Alimentos y bebidas no alcohólicas',
    'BEBIDAS_ALCOHOLICAS': 'Bebidas alcohólicas y tabaco',
    'VESTIMENTA': 'Prendas de vestir y calzado',
    'VIVIENDA': 'Vivienda, agua, electricidad, gas y otros combustibles',
    'EQUIPAMIENTO': 'Equipamiento y mantenimiento del hogar',
    'SALUD': 'Salud',
    'TRANSPORTE': 'Transporte',
    'COMUNICACION': 'Comunicación',
    'RECREACION': 'Recreación y cultura',
    'EDUCACION': 'Educación',
    'RESTAURANTES': 'Restaurantes y hoteles',
    'BIENES_DIVERSOS': 'Bienes y servicios varios',
    'BIENES': 'Bienes',
    'SERVICIOS': 'Servicios'
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
  
  export type IPCComponentCode = keyof typeof IPC_COMPONENTS
  export type IPCRegion = keyof typeof IPC_REGIONS