// lib/services/poverty.service.ts

export interface PovertyData {
    period: string
    date: string
    poverty: {
      persons: number
      households: number
      variation: {
        persons: number
        households: number
      }
    }
    indigence: {
      persons: number
      households: number
      variation: {
        persons: number
        households: number
      }
    }
  }
  
  export interface RegionalData {
    region: string
    regionCode: string
    poverty: {
      persons: number
      households: number
      ranking: number
    }
    indigence: {
      persons: number
      households: number
      ranking: number
    }
  }
  
  export interface HistoricalPoint {
    date: string
    period: string
    poverty: {
      persons: number
      households: number
    }
    indigence: {
      persons: number
      households: number
    }
  }
  
  class PovertyService {
    /**
     * Genera datos mock actuales de pobreza e indigencia
     */
    private generateMockCurrentData(): PovertyData {
      return {
        period: '2do Semestre 2024',
        date: '2024-12-31',
        poverty: {
          persons: 38.1,
          households: 28.6,
          variation: {
            persons: -14.8, // vs semestre anterior
            households: -13.9
          }
        },
        indigence: {
          persons: 8.2,
          households: 6.4,
          variation: {
            persons: -9.9,
            households: -7.2
          }
        }
      }
    }
  
    /**
     * Genera datos de comparación regional
     */
    private generateMockRegionalData(): RegionalData[] {
      return [
        {
          region: 'Noreste',
          regionCode: 'NEA',
          poverty: {
            persons: 47.0,
            households: 37.1,
            ranking: 1
          },
          indigence: {
            persons: 11.6,
            households: 9.5,
            ranking: 1
          }
        },
        {
          region: 'Noroeste',
          regionCode: 'NOA',
          poverty: {
            persons: 42.8,
            households: 33.3,
            ranking: 2
          },
          indigence: {
            persons: 8.1,
            households: 6.6,
            ranking: 4
          }
        },
        {
          region: 'Cuyo',
          regionCode: 'CUYO',
          poverty: {
            persons: 41.9,
            households: 32.5,
            ranking: 3
          },
          indigence: {
            persons: 6.5,
            households: 5.0,
            ranking: 6
          }
        },
        {
          region: 'Total 31 aglomerados',
          regionCode: 'TOTAL',
          poverty: {
            persons: 38.1,
            households: 28.6,
            ranking: 4
          },
          indigence: {
            persons: 8.2,
            households: 6.4,
            ranking: 3
          }
        },
        {
          region: 'Gran Buenos Aires',
          regionCode: 'GBA',
          poverty: {
            persons: 37.3,
            households: 28.0,
            ranking: 5
          },
          indigence: {
            persons: 8.6,
            households: 6.7,
            ranking: 2
          }
        },
        {
          region: 'Pampeana',
          regionCode: 'PAMPEANA',
          poverty: {
            persons: 35.6,
            households: 26.1,
            ranking: 6
          },
          indigence: {
            persons: 7.7,
            households: 5.7,
            ranking: 5
          }
        },
        {
          region: 'Patagonia',
          regionCode: 'PATAGONIA',
          poverty: {
            persons: 33.5,
            households: 26.2,
            ranking: 7
          },
          indigence: {
            persons: 4.5,
            households: 4.0,
            ranking: 7
          }
        }
      ]
    }
  
    /**
     * Genera datos históricos de pobreza e indigencia
     */
    private generateMockHistoricalData(from: string, to: string): HistoricalPoint[] {
      const data: HistoricalPoint[] = [
        // 2016
        { date: '2016-06-30', period: 'S1 2016', poverty: { persons: 30.3, households: 21.5 }, indigence: { persons: 6.1, households: 4.5 } },
        { date: '2016-12-31', period: 'S2 2016', poverty: { persons: 28.6, households: 20.8 }, indigence: { persons: 5.7, households: 4.2 } },
        // 2017
        { date: '2017-06-30', period: 'S1 2017', poverty: { persons: 28.6, households: 20.4 }, indigence: { persons: 6.2, households: 4.5 } },
        { date: '2017-12-31', period: 'S2 2017', poverty: { persons: 25.7, households: 18.0 }, indigence: { persons: 4.8, households: 3.5 } },
        // 2018
        { date: '2018-06-30', period: 'S1 2018', poverty: { persons: 27.3, households: 19.6 }, indigence: { persons: 4.9, households: 3.8 } },
        { date: '2018-12-31', period: 'S2 2018', poverty: { persons: 32.0, households: 23.4 }, indigence: { persons: 6.7, households: 4.8 } },
        // 2019
        { date: '2019-06-30', period: 'S1 2019', poverty: { persons: 35.4, households: 25.4 }, indigence: { persons: 7.7, households: 5.5 } },
        { date: '2019-12-31', period: 'S2 2019', poverty: { persons: 35.5, households: 25.9 }, indigence: { persons: 8.0, households: 5.7 } },
        // 2020
        { date: '2020-06-30', period: 'S1 2020', poverty: { persons: 40.9, households: 30.4 }, indigence: { persons: 10.5, households: 7.8 } },
        { date: '2020-12-31', period: 'S2 2020', poverty: { persons: 42.0, households: 31.6 }, indigence: { persons: 10.5, households: 7.8 } },
        // 2021
        { date: '2021-06-30', period: 'S1 2021', poverty: { persons: 40.6, households: 31.2 }, indigence: { persons: 10.7, households: 8.2 } },
        { date: '2021-12-31', period: 'S2 2021', poverty: { persons: 37.3, households: 27.9 }, indigence: { persons: 8.2, households: 6.1 } },
        // 2022
        { date: '2022-06-30', period: 'S1 2022', poverty: { persons: 36.5, households: 27.6 }, indigence: { persons: 8.8, households: 6.8 } },
        { date: '2022-12-31', period: 'S2 2022', poverty: { persons: 39.2, households: 29.6 }, indigence: { persons: 8.1, households: 6.3 } },
        // 2023
        { date: '2023-06-30', period: 'S1 2023', poverty: { persons: 40.1, households: 29.6 }, indigence: { persons: 9.3, households: 7.0 } },
        { date: '2023-12-31', period: 'S2 2023', poverty: { persons: 41.7, households: 29.9 }, indigence: { persons: 11.9, households: 8.3 } },
        // 2024
        { date: '2024-06-30', period: 'S1 2024', poverty: { persons: 52.9, households: 42.5 }, indigence: { persons: 18.1, households: 13.6 } },
        { date: '2024-12-31', period: 'S2 2024', poverty: { persons: 38.1, households: 28.6 }, indigence: { persons: 8.2, households: 6.4 } }
      ]
  
      // Filtrar por fechas si es necesario
      const fromDate = new Date(from)
      const toDate = new Date(to)
      
      return data.filter(point => {
        const pointDate = new Date(point.date)
        return pointDate >= fromDate && pointDate <= toDate
      })
    }
  
    /**
     * Obtiene los datos actuales de pobreza e indigencia
     */
    async getCurrentPoverty(): Promise<PovertyData> {
      try {
        // TODO: Implementar llamada real al backend cuando esté disponible
        // Por ahora retornamos datos mock
        return this.generateMockCurrentData()
      } catch (error) {
        console.error('Error fetching current poverty data:', error)
        return this.generateMockCurrentData()
      }
    }
  
    /**
     * Obtiene comparación por regiones
     */
    async getRegionalComparison(): Promise<RegionalData[]> {
      try {
        // TODO: Implementar llamada real al backend cuando esté disponible
        return this.generateMockRegionalData()
      } catch (error) {
        console.error('Error fetching regional comparison:', error)
        return this.generateMockRegionalData()
      }
    }
  
    /**
     * Obtiene datos históricos de pobreza e indigencia
     */
    async getHistoricalPoverty(params: {
      from: string
      to: string
      metric?: 'poverty' | 'indigence' | 'all'
      population?: 'persons' | 'households' | 'all'
    }): Promise<HistoricalPoint[]> {
      try {
        // TODO: Implementar llamada real al backend cuando esté disponible
        const data = this.generateMockHistoricalData(params.from, params.to)
        
        // Aquí podrías filtrar por metric y population si es necesario
        
        return data
      } catch (error) {
        console.error('Error fetching historical poverty data:', error)
        return this.generateMockHistoricalData(params.from, params.to)
      }
    }
  
    /**
     * Obtiene información sobre las canastas básicas
     */
    async getBasketInfo(): Promise<{
      cbt: { value: number, description: string }
      cba: { value: number, description: string }
    }> {
      return {
        cbt: {
          value: 964620, // Valor ejemplo para familia tipo
          description: 'Canasta Básica Total: incluye alimentos y servicios básicos'
        },
        cba: {
          value: 434621, // Valor ejemplo para familia tipo
          description: 'Canasta Básica Alimentaria: cubre necesidades nutricionales mínimas'
        }
      }
    }
  
    /**
     * Obtiene datos históricos de pobreza e indigencia por región
     */
    async getHistoricalPovertyByRegion(params: {
      from: string
      to: string
      region: string
      metric?: 'poverty' | 'indigence' | 'all'
      population?: 'persons' | 'households' | 'all'
    }): Promise<HistoricalPoint[]> {
      try {
        // Obtener datos base
        const baseData = this.generateMockHistoricalData(params.from, params.to)
        
        // Factores de ajuste por región basados en datos históricos del INDEC
        const regionalFactors: Record<string, { poverty: number, indigence: number }> = {
          'Total': { poverty: 1.0, indigence: 1.0 },
          'Noreste': { poverty: 1.23, indigence: 1.41 },
          'Noroeste': { poverty: 1.12, indigence: 0.99 },
          'Cuyo': { poverty: 1.10, indigence: 0.79 },
          'Gran Buenos Aires': { poverty: 0.98, indigence: 1.05 },
          'Pampeana': { poverty: 0.93, indigence: 0.94 },
          'Patagonia': { poverty: 0.88, indigence: 0.55 }
        }
        
        const factor = regionalFactors[params.region] || regionalFactors['Total']
        
        // Aplicar factores regionales
        return baseData.map(point => ({
          ...point,
          poverty: {
            persons: Number((point.poverty.persons * factor.poverty).toFixed(1)),
            households: Number((point.poverty.households * factor.poverty).toFixed(1))
          },
          indigence: {
            persons: Number((point.indigence.persons * factor.indigence).toFixed(1)),
            households: Number((point.indigence.households * factor.indigence).toFixed(1))
          }
        }))
      } catch (error) {
        console.error('Error fetching regional historical poverty data:', error)
        return this.generateMockHistoricalData(params.from, params.to)
      }
    }
  }
  
  // Exportar una instancia única del servicio
  export const povertyService = new PovertyService()