// hooks/useCER.ts
import { useState, useCallback } from 'react';

interface CERData {
  date: string;
  value: number;
  daily_pct_change?: number;
  monthly_pct_change?: number;
  yearly_pct_change?: number;
}

interface CalculationResult {
  initial_amount: number;
  adjusted_amount: number;
  initial_date: string;
  final_date: string;
  initial_cer: number;
  final_cer: number;
  variation_percentage: number;
  inflation_coefficient: number;
}

export function useCER() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene el CER actual
   */
  const getCurrentCER = useCallback(async (): Promise<CERData | null> => {
    try {
      const response = await fetch('/api/v1/cer?view=current');
      
      if (!response.ok) {
        throw new Error('Error al obtener el CER actual');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return {
          date: data.data.date,
          value: data.data.current_value,
          daily_pct_change: data.data.daily_change,
          monthly_pct_change: data.data.monthly_change,
          yearly_pct_change: data.data.yearly_change
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching current CER:', err);
      setError('Error al obtener el CER actual');
      return null;
    }
  }, []);

  /**
   * Obtiene el CER para una fecha específica
   */
  const getCERByDate = useCallback(async (date: Date): Promise<CERData | null> => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/v1/cer?view=historical&from=${dateStr}&to=${dateStr}&limit=1`);
      
      if (!response.ok) {
        throw new Error('Error al obtener el CER histórico');
      }

      const data = await response.json();
      
      if (data.success && data.data?.series?.length > 0) {
        const cerPoint = data.data.series[0];
        return {
          date: cerPoint.date,
          value: cerPoint.value,
          daily_pct_change: cerPoint.daily_change,
          monthly_pct_change: cerPoint.monthly_change,
          yearly_pct_change: cerPoint.yearly_change
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching CER by date:', err);
      setError(`Error al obtener el CER para ${date.toLocaleDateString('es-AR')}`);
      return null;
    }
  }, []);

  /**
   * Obtiene datos históricos del CER
   */
  const getHistoricalCER = useCallback(async (
    from: Date, 
    to: Date, 
    aggregation?: 'daily' | 'monthly' | 'yearly'
  ) => {
    try {
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      
      let url = `/api/v1/cer?view=historical&from=${fromStr}&to=${toStr}`;
      if (aggregation) {
        url += `&aggregation=${aggregation}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Error al obtener datos históricos');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching historical CER:', err);
      setError('Error al obtener datos históricos del CER');
      return null;
    }
  }, []);

  /**
   * Calcula la inflación usando el endpoint calculator de la API
   */
  const calculateInflation = useCallback(async (
    amount: number,
    fromDate: Date,
    toDate: Date
  ): Promise<CalculationResult | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = toDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/v1/cer?view=calculator&amount=${amount}&from=${fromStr}&to=${toStr}`
      );
      
      if (!response.ok) {
        throw new Error('Error al calcular la inflación');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      
      return null;
    } catch (err) {
      console.error('Error calculating inflation:', err);
      setError('Error al calcular la inflación');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Compara el CER con otros indicadores
   */
  const compareWithIndicators = useCallback(async (
    fromDate: Date,
    toDate: Date
  ) => {
    try {
      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = toDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/v1/cer?view=comparison&from=${fromStr}&to=${toStr}`
      );
      
      if (!response.ok) {
        throw new Error('Error al comparar indicadores');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
      
      return null;
    } catch (err) {
      console.error('Error comparing indicators:', err);
      setError('Error al comparar indicadores');
      return null;
    }
  }, []);

  return {
    loading,
    error,
    getCurrentCER,
    getCERByDate,
    getHistoricalCER,
    calculateInflation,
    compareWithIndicators
  };
}