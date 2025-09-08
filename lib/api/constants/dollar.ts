// /lib/api/constants/dollar.ts

// Tipos de dólar disponibles
export const DOLLAR_TYPES = [
    'OFICIAL',
    'BLUE',
    'MEP',
    'CCL',
    'CRYPTO',
    'MAYORISTA',
    'TARJETA'
  ] as const
  
  export type DollarType = typeof DOLLAR_TYPES[number]
  
  // Labels amigables para cada tipo
  export const DOLLAR_TYPE_LABELS: Record<string, string> = {
    'OFICIAL': 'Dólar Oficial',
    'BLUE': 'Dólar Blue',
    'MEP': 'Dólar MEP',
    'CCL': 'Dólar CCL',
    'CRYPTO': 'Dólar Crypto',
    'MAYORISTA': 'Dólar Mayorista',
    'TARJETA': 'Dólar Tarjeta'
  }
  
  // Descripciones de cada tipo
  export const DOLLAR_TYPE_DESCRIPTIONS: Record<string, string> = {
    'OFICIAL': 'Cotización del Banco Central de la República Argentina',
    'BLUE': 'Mercado paralelo o informal',
    'MEP': 'Mercado Electrónico de Pagos (Dólar Bolsa)',
    'CCL': 'Contado con Liquidación',
    'CRYPTO': 'Cotización en exchanges de criptomonedas',
    'MAYORISTA': 'Mercado mayorista (Banco Nación)',
    'TARJETA': 'Dólar turista con impuestos (PAIS + Ganancias)'
  }
  
  // Colores para visualización (opcional)
  export const DOLLAR_TYPE_COLORS: Record<string, string> = {
    'OFICIAL': '#10b981',
    'BLUE': '#3b82f6',
    'MEP': '#8b5cf6',
    'CCL': '#f59e0b',
    'CRYPTO': '#ec4899',
    'MAYORISTA': '#6b7280',
    'TARJETA': '#ef4444'
  }
  
  // Impuestos y recargos
  export const DOLLAR_TAXES = {
    TARJETA: {
      PAIS: 0.30,      // Impuesto PAIS 30%
      GANANCIAS: 0.30,  // Retención ganancias 30%
      BIENES_PERSONALES: 0.15, // Opcional, para algunos casos
      TOTAL: 0.75      // Total 75% (30% + 30% + 15%)
    }
  }
  
  // Información adicional
  export const DOLLAR_INFO = {
    sources: {
      OFICIAL: 'Banco Central de la República Argentina',
      BLUE: 'Promedio de casas de cambio informales',
      MEP: 'Bolsas y Mercados Argentinos (BYMA)',
      CCL: 'Mercado de valores internacional',
      CRYPTO: 'Promedio de exchanges (Binance, Buenbit)',
      MAYORISTA: 'Banco de la Nación Argentina',
      TARJETA: 'Cálculo sobre dólar oficial + impuestos'
    },
    updateFrequency: {
      OFICIAL: 'Diaria (días hábiles)',
      BLUE: 'Varias veces al día',
      MEP: 'Durante horario bursátil',
      CCL: 'Durante horario bursátil',
      CRYPTO: '24/7',
      MAYORISTA: 'Diaria (días hábiles)',
      TARJETA: 'Según cambios en oficial o impuestos'
    },
    restrictions: {
      OFICIAL: 'Límite mensual USD 200 (cepo cambiario)',
      BLUE: 'Sin restricciones',
      MEP: 'Parking de 5 días para bonos',
      CCL: 'Sin parking para bonos con liquidación externa',
      CRYPTO: 'Límites según exchange',
      MAYORISTA: 'Solo para operaciones comerciales',
      TARJETA: 'Aplica a consumos en el exterior'
    }
  }
  
  // Configuración de cache
  export const DOLLAR_CACHE_CONFIG = {
    current: 60,      // 1 minuto
    historical: 1800, // 30 minutos
    comparison: 300,  // 5 minutos
    types: 3600,      // 1 hora
    calculator: 0     // Sin cache
  }
  
  // Códigos de error
  export const DOLLAR_ERROR_CODES = {
    NO_DATA: 'NO_DATA',
    INVALID_TYPE: 'INVALID_TYPE',
    INVALID_DATE: 'INVALID_DATE',
    INVALID_AMOUNT: 'INVALID_AMOUNT',
    INVALID_CURRENCY: 'INVALID_CURRENCY',
    RATE_NOT_AVAILABLE: 'RATE_NOT_AVAILABLE'
  } as const