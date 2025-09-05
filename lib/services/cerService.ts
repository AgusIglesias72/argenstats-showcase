// lib/services/cerService.ts

export interface CERData {
    date: string;
    value: number;
    daily_pct_change?: number;
    monthly_pct_change?: number;
    yearly_pct_change?: number;
  }
  
  export interface CERHistoricalData {
    date: string;
    value: number;
  }
  
  export interface InflationCalculation {
    initialAmount: number;
    finalAmount: number;
    initialDate: string;
    finalDate: string;
    initialCER: number;
    finalCER: number;
    inflationRate: number;
    inflationPercentage: number;
    annualizedRate?: number;
  }
  
  class CERService {
    private baseUrl = '/api/cer';
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheTimeout = 5 * 60 * 1000; // 5 minutos
  
    /**
     * Obtiene el último valor del CER
     */
    async getLatestCER(): Promise<CERData> {
      const cacheKey = 'latest';
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
  
      try {
        const response = await fetch(`${this.baseUrl}?type=latest`);
        if (!response.ok) {
          throw new Error('Error al cargar datos del CER');
        }
  
        const result = await response.json();
        if (result.success && result.data) {
          this.setCache(cacheKey, result.data);
          return result.data;
        }
        throw new Error('Datos inválidos del servidor');
      } catch (error) {
        console.error('Error fetching latest CER:', error);
        throw error;
      }
    }
  
    /**
     * Obtiene datos históricos del CER entre dos fechas
     */
    async getHistoricalCER(fromDate: string, toDate: string): Promise<CERHistoricalData[]> {
      const cacheKey = `historical-${fromDate}-${toDate}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
  
      try {
        const response = await fetch(
          `${this.baseUrl}?type=historical&from=${fromDate}&to=${toDate}`
        );
        if (!response.ok) {
          throw new Error('Error al cargar datos históricos del CER');
        }
  
        const result = await response.json();
        if (result.success && result.data) {
          this.setCache(cacheKey, result.data);
          return result.data;
        }
        throw new Error('Datos históricos inválidos');
      } catch (error) {
        console.error('Error fetching historical CER:', error);
        throw error;
      }
    }
  
    /**
     * Obtiene el valor del CER para una fecha específica
     */
    async getCERByDate(date: string): Promise<CERData> {
      const cacheKey = `date-${date}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
  
      try {
        const response = await fetch(`${this.baseUrl}?type=date&date=${date}`);
        if (!response.ok) {
          throw new Error('Error al cargar CER para la fecha');
        }
  
        const result = await response.json();
        if (result.success && result.data) {
          this.setCache(cacheKey, result.data);
          return result.data;
        }
        throw new Error('Datos de fecha inválidos');
      } catch (error) {
        console.error('Error fetching CER by date:', error);
        throw error;
      }
    }
  
    /**
     * Calcula la inflación entre dos fechas
     */
    async calculateInflation(
      amount: number,
      fromDate: string,
      toDate: string
    ): Promise<InflationCalculation> {
      try {
        // Obtener CER de ambas fechas
        const [fromCER, toCER] = await Promise.all([
          this.getCERByDate(fromDate),
          this.getCERByDate(toDate)
        ]);
  
        // Calcular inflación
        const inflationRate = toCER.value / fromCER.value;
        const finalAmount = amount * inflationRate;
        const inflationPercentage = ((inflationRate - 1) * 100);
  
        // Calcular tasa anualizada si las fechas son diferentes
        let annualizedRate: number | undefined;
        const fromDateObj = new Date(fromDate);
        const toDateObj = new Date(toDate);
        const daysDiff = Math.abs((toDateObj.getTime() - fromDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 0) {
          const yearsDiff = daysDiff / 365;
          annualizedRate = (Math.pow(inflationRate, 1 / yearsDiff) - 1) * 100;
        }
  
        return {
          initialAmount: amount,
          finalAmount,
          initialDate: fromDate,
          finalDate: toDate,
          initialCER: fromCER.value,
          finalCER: toCER.value,
          inflationRate,
          inflationPercentage,
          annualizedRate
        };
      } catch (error) {
        console.error('Error calculating inflation:', error);
        throw error;
      }
    }
  
    /**
     * Calcula el monto equivalente en el pasado
     */
    async calculatePastEquivalent(
      currentAmount: number,
      pastDate: string,
      currentDate: string = new Date().toISOString().split('T')[0]
    ): Promise<InflationCalculation> {
      try {
        const [pastCER, currentCER] = await Promise.all([
          this.getCERByDate(pastDate),
          this.getCERByDate(currentDate)
        ]);
  
        const inflationRate = currentCER.value / pastCER.value;
        const pastAmount = currentAmount / inflationRate;
        const inflationPercentage = ((inflationRate - 1) * 100);
  
        return {
          initialAmount: pastAmount,
          finalAmount: currentAmount,
          initialDate: pastDate,
          finalDate: currentDate,
          initialCER: pastCER.value,
          finalCER: currentCER.value,
          inflationRate,
          inflationPercentage
        };
      } catch (error) {
        console.error('Error calculating past equivalent:', error);
        throw error;
      }
    }
  
    /**
     * Obtiene estadísticas de inflación para diferentes períodos
     */
    async getInflationStats(): Promise<{
      daily?: number;
      monthly?: number;
      yearly?: number;
      lastUpdate: string;
    }> {
      try {
        const latestCER = await this.getLatestCER();
        return {
          daily: latestCER.daily_pct_change,
          monthly: latestCER.monthly_pct_change,
          yearly: latestCER.yearly_pct_change,
          lastUpdate: latestCER.date
        };
      } catch (error) {
        console.error('Error getting inflation stats:', error);
        throw error;
      }
    }
  
    // Cache helpers
    private getFromCache(key: string): any {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      return null;
    }
  
    private setCache(key: string, data: any): void {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
  
    clearCache(): void {
      this.cache.clear();
    }
  }
  
  // Singleton instance
  export const cerService = new CERService();
  
  // Export helper functions for direct use
  export const getLatestCER = () => cerService.getLatestCER();
  export const getHistoricalCER = (from: string, to: string) => cerService.getHistoricalCER(from, to);
  export const getCERByDate = (date: string) => cerService.getCERByDate(date);
  export const calculateInflation = (amount: number, from: string, to: string) => 
    cerService.calculateInflation(amount, from, to);
  export const calculatePastEquivalent = (amount: number, pastDate: string, currentDate?: string) =>
    cerService.calculatePastEquivalent(amount, pastDate, currentDate);
  export const getInflationStats = () => cerService.getInflationStats();