import { prisma } from '@/lib/db/prisma';

// Constante para el ID de la variable CER en la base de datos
const CER_VARIABLE_ID = 30; // ID oficial del CER en BCRA según constants/cer.ts

export interface CERData {
  date: string;
  value: number;
  daily_change?: number;
  monthly_change?: number;
  yearly_change?: number;
}

export interface CERCalculationResult {
  initial_amount: number;
  adjusted_amount: number;
  initial_cer: number;
  final_cer: number;
  variation_percentage: number;
  inflation_coefficient: number;
  from_date: string;
  to_date: string;
}

class CERService {
  /**
   * Obtiene el valor CER más reciente con sus variaciones
   */
  async getCurrentCER(): Promise<CERData | null> {
    try {
      // Obtener el valor más reciente
      const currentData = await prisma.bcraData.findFirst({
        where: { variableId: CER_VARIABLE_ID },
        orderBy: { date: 'desc' }
      });

      if (!currentData) {
        console.error('No se encontraron datos de CER');
        return null;
      }

      // Calcular variaciones
      const variations = await this.calculateVariations(currentData.date, currentData.value);

      return {
        date: currentData.date.toISOString().split('T')[0],
        value: currentData.value,
        daily_change: variations.daily,
        monthly_change: variations.monthly,
        yearly_change: variations.yearly
      };
    } catch (error) {
      console.error('Error obteniendo CER actual:', error);
      return null;
    }
  }

  /**
   * Obtiene el valor CER para una fecha específica
   */
  async getCERForDate(date: Date): Promise<{ date: Date; value: number } | null> {
    try {
      // Buscar el valor exacto o el más cercano anterior
      const cerData = await prisma.bcraData.findFirst({
        where: {
          variableId: CER_VARIABLE_ID,
          date: {
            lte: date
          }
        },
        orderBy: { date: 'desc' }
      });

      return cerData ? { date: cerData.date, value: cerData.value } : null;
    } catch (error) {
      console.error('Error obteniendo CER para fecha:', error);
      return null;
    }
  }

  /**
   * Calcula el ajuste por inflación entre dos fechas
   */
  async calculateCER(params: {
    amount: number;
    from: string;
    to: string;
  }): Promise<CERCalculationResult | null> {
    try {
      const fromDate = new Date(params.from + 'T00:00:00');
      const toDate = new Date(params.to + 'T00:00:00');

      // Validaciones
      if (params.amount <= 0) {
        console.error('Monto inválido:', params.amount);
        return null;
      }

      // Permitir cálculo en ambas direcciones
      const isReversed = fromDate > toDate;
      const startDate = isReversed ? toDate : fromDate;
      const endDate = isReversed ? fromDate : toDate;

      // Obtener valores CER para ambas fechas
      const [startCER, endCER] = await Promise.all([
        this.getCERForDate(startDate),
        this.getCERForDate(endDate)
      ]);

      if (!startCER || !endCER) {
        console.error('No se pudieron obtener valores CER para las fechas especificadas');
        return null;
      }

      // Calcular ajuste
      const inflationCoefficient = endCER.value / startCER.value;
      const adjustedAmount = isReversed 
        ? params.amount / inflationCoefficient 
        : params.amount * inflationCoefficient;
      const variationPercentage = (inflationCoefficient - 1) * 100;

      return {
        initial_amount: params.amount,
        adjusted_amount: adjustedAmount,
        initial_cer: isReversed ? endCER.value : startCER.value,
        final_cer: isReversed ? startCER.value : endCER.value,
        variation_percentage: variationPercentage,
        inflation_coefficient: inflationCoefficient,
        from_date: params.from,
        to_date: params.to
      };
    } catch (error) {
      console.error('Error calculando inflación:', error);
      return null;
    }
  }

  /**
   * Calcula las variaciones diarias, mensuales y anuales
   */
  private async calculateVariations(date: Date, currentValue: number): Promise<{
    daily?: number;
    monthly?: number;
    yearly?: number;
  }> {
    try {
      // Calcular fechas de referencia
      const oneDayAgo = new Date(date);
      oneDayAgo.setDate(date.getDate() - 1);
      
      const oneMonthAgo = new Date(date);
      oneMonthAgo.setMonth(date.getMonth() - 1);
      
      const oneYearAgo = new Date(date);
      oneYearAgo.setFullYear(date.getFullYear() - 1);

      // Obtener valores históricos en paralelo
      const [dayAgo, monthAgo, yearAgo] = await Promise.all([
        this.getCERForDate(oneDayAgo),
        this.getCERForDate(oneMonthAgo),
        this.getCERForDate(oneYearAgo)
      ]);

      return {
        daily: dayAgo ? ((currentValue / dayAgo.value - 1) * 100) : undefined,
        monthly: monthAgo ? ((currentValue / monthAgo.value - 1) * 100) : undefined,
        yearly: yearAgo ? ((currentValue / yearAgo.value - 1) * 100) : undefined
      };
    } catch (error) {
      console.error('Error calculando variaciones:', error);
      return {};
    }
  }
}

// Exportar una instancia única del servicio
export const cerService = new CERService();