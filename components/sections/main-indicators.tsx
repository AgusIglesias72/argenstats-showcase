import { getMainIndicatorsData, formatMonthYear, formatCurrency, formatPercentage } from '@/lib/data/indicators'
import { MainIndicatorsClient } from './main-indicators-client'
import { unstable_noStore as noStore } from 'next/cache'

export async function MainIndicators() {
  // Forzar que no se cachee este componente
  noStore()
  
  const data = await getMainIndicatorsData()
  
  const indicators = [
    {
      id: 'dolar',
      title: 'Dólar Oficial',
      mainValue: data.dollar.sellPrice ? `$${formatCurrency(data.dollar.sellPrice, 0)}` : '-',
      subtitle: 'venta',
      data: [
        { label: 'Compra', value: data.dollar.buyPrice ? `$${formatCurrency(data.dollar.buyPrice, 0)}` : '-' },
        { label: 'Venta', value: data.dollar.sellPrice ? `$${formatCurrency(data.dollar.sellPrice, 0)}` : '-' },
        { 
          label: 'Variación', 
          value: formatPercentage(data.dollar.variation, 1),
          color: data.dollar.variation > 0 ? 'text-red-600' : data.dollar.variation < 0 ? 'text-green-600' : 'text-gray-600'
        }
      ],
      mobileData: [
        { 
          label: 'Compra/Venta', 
          value: `$${formatCurrency(data.dollar.buyPrice, 0)} / $${formatCurrency(data.dollar.sellPrice, 0)}` 
        }
      ],
      variation: data.dollar.variation,
      footer: 'Actualizado en tiempo real',
      type: 'dollar' as const
    },
    {
      id: 'inflacion',
      title: 'Inflación (IPC)',
      mainValue: data.inflation.monthly ? `${formatPercentage(data.inflation.monthly, 1)}` : '-',
      subtitle: 'mensual',
      data: [
        { 
          label: 'Interanual', 
          value: data.inflation.yearly ? formatPercentage(data.inflation.yearly, 1) : '-',
          color: 'text-purple-600' 
        },
        { 
          label: 'Acumulada', 
          value: data.inflation.accumulated ? formatPercentage(data.inflation.accumulated, 1) : '-',
          color: 'text-purple-600' 
        }
      ],
      mobileData: [
        { 
          label: 'Interanual', 
          value: data.inflation.yearly ? formatPercentage(data.inflation.yearly, 1) : '-'
        }
      ],
      variation: data.inflation.monthly,
      footer: data.inflation.date ? `INDEC - ${formatMonthYear(data.inflation.date)}` : 'Sin datos',
      type: 'inflation' as const
    },
    {
      id: 'actividad',
      title: 'Actividad (EMAE)',
      mainValue: data.emae.monthlyVariation !== null ? formatPercentage(data.emae.monthlyVariation, 1) : '-',
      subtitle: 'mensual',
      data: [
        { 
          label: 'Interanual', 
          value: data.emae.yearlyVariation !== null ? formatPercentage(data.emae.yearlyVariation, 1) : '-',
          color: data.emae.yearlyVariation && data.emae.yearlyVariation > 0 ? 'text-green-600' : 'text-red-600'
        },
        { 
          label: 'Índice', 
          value: data.emae.indexValue ? formatCurrency(data.emae.indexValue, 1) : '-'
        }
      ],
      mobileData: [
        { 
          label: 'Interanual', 
          value: data.emae.yearlyVariation !== null ? formatPercentage(data.emae.yearlyVariation, 1) : '-'
        }
      ],
      variation: data.emae.monthlyVariation,
      footer: data.emae.date ? `INDEC - ${formatMonthYear(data.emae.date)}` : 'Sin datos',
      type: 'activity' as const
    },
    {
      id: 'riesgo',
      title: 'Riesgo País',
      mainValue: data.countryRisk.value ? Math.round(data.countryRisk.value).toString() : '-',
      subtitle: 'puntos básicos',
      data: [
        { 
          label: 'Var. Diaria', 
          value: formatPercentage(data.countryRisk.dailyVariation, 2),
          color: data.countryRisk.dailyVariation > 0 ? 'text-red-600' : 'text-green-600'
        },
        { 
          label: 'Var. Mensual', 
          value: formatPercentage(data.countryRisk.monthlyVariation, 1),
          color: data.countryRisk.monthlyVariation > 0 ? 'text-red-600' : 'text-green-600'
        },
        { 
          label: 'Var. Interanual', 
          value: formatPercentage(data.countryRisk.yearlyVariation, 1),
          color: data.countryRisk.yearlyVariation > 0 ? 'text-red-600' : 'text-green-600'
        }
      ],
      mobileData: [
        { 
          label: 'Var. Diaria', 
          value: formatPercentage(data.countryRisk.dailyVariation, 2)
        }
      ],
      variation: data.countryRisk.dailyVariation,
      footer: 'Mercados internacionales',
      type: 'risk' as const
    }
  ]

  return <MainIndicatorsClient indicators={indicators} />
}