// __tests__/services/inflation.test.ts
import { 
  getCurrentInflation, 
  calculateInflation,
  InflationServiceError 
} from '@/lib/api/services/inflation'
import { prisma } from '@/lib/db/prisma'

jest.mock('@/lib/db/prisma', () => ({
  prisma: {
    ipc: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    }
  }
}))

describe('Inflation Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getCurrentInflation', () => {
    it('should return current inflation data', async () => {
      const mockData = {
        date: new Date('2024-01-01'),
        component: 'Nivel general',
        componentCode: 'GENERAL',
        componentType: 'GENERAL',
        region: 'Nacional',
        monthlyPctChange: 3.5,
        yearlyPctChange: 42.0,
        accumulatedPctChange: 15.0,
        indexValue: 150.5,
        updatedAt: new Date()
      }

      ;(prisma.ipc.findFirst as jest.Mock).mockResolvedValue(mockData)

      const result = await getCurrentInflation({ 
        component: 'GENERAL', 
        region: 'Nacional' 
      })

      expect(result).toMatchObject({
        values: {
          monthly: 3.5,
          yearly: 42.0,
          accumulated: 15.0
        },
        index: 150.5
      })
    })

    it('should throw error when no data found', async () => {
      ;(prisma.ipc.findFirst as jest.Mock).mockResolvedValue(null)

      await expect(
        getCurrentInflation({ component: 'INVALID', region: 'Nacional' })
      ).rejects.toThrow(InflationServiceError)
    })
  })

  describe('calculateInflation', () => {
    it('should calculate inflation between two dates', async () => {
      ;(prisma.ipc.findFirst as jest.Mock)
        .mockResolvedValueOnce({ date: new Date('2023-01-01'), indexValue: 100 })
        .mockResolvedValueOnce({ date: new Date('2024-01-01'), indexValue: 150 })

      const result = await calculateInflation({
        amount: 1000,
        from: '2023-01-01',
        to: '2024-01-01'
      })

      expect(result.calculation.inflationRate).toBe(50.00)
      expect(result.calculation.adjustedAmount).toBe(1500.00)
      // La tasa anualizada de 50% en 12 meses es 50%, lo cual cae en "Inflación muy alta"
      expect(result.interpretation).toBe('Inflación muy alta')
    })

    it('should throw error for invalid date range', async () => {
      await expect(
        calculateInflation({
          amount: 1000,
          from: '2024-01-01',
          to: '2023-01-01'
        })
      ).rejects.toThrow('Start date must be before end date')
    })
  })
})