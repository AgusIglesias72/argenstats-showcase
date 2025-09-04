'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowUpDown, Calculator, TrendingUp, Calendar, ChevronDown, Check, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// Country Flag Component (simplified version)
const CountryFlag = ({ country, className }: { country: 'US' | 'AR'; className?: string }) => {
  const flagStyle = country === 'US' 
    ? 'bg-gradient-to-r from-blue-600 via-white to-red-600' 
    : 'bg-gradient-to-b from-blue-400 via-white to-blue-400'
  
  return (
    <div className={cn('rounded-sm overflow-hidden flex items-center justify-center shadow-sm', className, flagStyle)}>
      <span className="text-xs font-bold text-gray-800">
        {country === 'US' ? '🇺🇸' : '🇦🇷'}
      </span>
    </div>
  )
}

interface DollarRate {
  dollarType: string
  buyPrice: number
  sellPrice: number
  date: string
  averagePrice?: number
}

type ConversionDirection = 'USD_TO_ARS' | 'ARS_TO_USD'
type PriceType = 'buy' | 'sell' | 'average'

const dollarTypeOptions = [
  { value: 'OFICIAL', label: 'Oficial', description: 'Cotización oficial del BCRA', color: 'blue' },
  { value: 'BLUE', label: 'Blue', description: 'Mercado paralelo', color: 'indigo' },
  { value: 'MEP', label: 'MEP', description: 'Mercado Electrónico de Pagos', color: 'green' },
  { value: 'CCL', label: 'CCL', description: 'Contado con Liquidación', color: 'purple' },
  { value: 'CRYPTO', label: 'Crypto', description: 'Criptomonedas stables', color: 'orange' },
  { value: 'MAYORISTA', label: 'Mayorista', description: 'Mercado mayorista', color: 'gray' },
  { value: 'TARJETA', label: 'Tarjeta', description: 'Compras en el exterior', color: 'red' }
]

const priceTypeOptions = [
  { value: 'buy', label: 'Compra', description: 'Precio de compra' },
  { value: 'sell', label: 'Venta', description: 'Precio de venta' },
  { value: 'average', label: 'Promedio', description: 'Promedio compra/venta' }
]

export function ConversorUsdArs() {
  // Estados principales
  const [amount, setAmount] = useState<string>('100')
  const [selectedDollarType, setSelectedDollarType] = useState<string>('BLUE')
  const [priceType, setPriceType] = useState<PriceType>('average')
  const [conversionDirection, setConversionDirection] = useState<ConversionDirection>('USD_TO_ARS')
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  
  // Estados para datos
  const [dollarRate, setDollarRate] = useState<DollarRate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de UI
  const [dollarTypeOpen, setDollarTypeOpen] = useState(false)
  const [priceTypeOpen, setPriceTypeOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Formatear cantidad con separadores
  const displayAmount = useMemo(() => {
    if (!amount) return ''
    const parts = amount.split('.')
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    }
    return parts.length === 2 ? `${parts[0]},${parts[1]}` : parts[0]
  }, [amount])

  // Obtener cotización
  const fetchDollarRate = useCallback(async (type: string, date?: Date) => {
    setLoading(true)
    setError(null)
    
    try {
      let url = `/api/v1/dollar?type=${type}`
      if (date) {
        url += `&date=${format(date, 'yyyy-MM-dd')}`
      }
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Error al obtener cotización')
      
      const data = await response.json()
      if (data.length === 0) throw new Error('No hay datos disponibles')
      
      setDollarRate(data[0])
    } catch (err) {
      setError((err as Error).message)
      setDollarRate(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Calcular precio según tipo
  const exchangeRate = useMemo(() => {
    if (!dollarRate) return 0
    
    switch (priceType) {
      case 'buy':
        return dollarRate.buyPrice || dollarRate.sellPrice || 0
      case 'sell':
        return dollarRate.sellPrice || 0
      case 'average':
        return dollarRate.averagePrice || ((dollarRate.buyPrice + dollarRate.sellPrice) / 2) || 0
      default:
        return 0
    }
  }, [dollarRate, priceType])

  // Calcular resultado de conversión
  const conversionResult = useMemo(() => {
    const numAmount = parseFloat(amount.replace(/\./g, '')) || 0
    if (conversionDirection === 'USD_TO_ARS') {
      return numAmount * exchangeRate
    } else {
      return numAmount / exchangeRate
    }
  }, [amount, exchangeRate, conversionDirection])

  // Formatear moneda
  const formatCurrency = useCallback((value: number, currency: 'USD' | 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }, [])

  // Frase descriptiva
  const conversionPhrase = useMemo(() => {
    if (!dollarRate || !amount || isNaN(parseFloat(amount.replace(/\./g, '')))) return ''

    const numAmount = parseFloat(amount.replace(/\./g, ''))
    const dollarTypeName = dollarTypeOptions.find(opt => opt.value === selectedDollarType)?.label || selectedDollarType
    const priceTypeName = priceType === 'buy' ? 'compra' : priceType === 'sell' ? 'venta' : 'promedio'
    const dateContext = selectedDate 
      ? `el ${format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}` 
      : 'en este momento'

    if (conversionDirection === 'USD_TO_ARS') {
      return `${dateContext}, ${formatCurrency(numAmount, 'USD')} ${numAmount === 1 ? 'corresponde' : 'corresponden'} a ${formatCurrency(conversionResult, 'ARS')} al tipo de cambio ${dollarTypeName.toLowerCase()} (${priceTypeName}).`
    } else {
      return `${dateContext}, ${formatCurrency(numAmount, 'ARS')} ${numAmount === 1 ? 'corresponde' : 'corresponden'} a ${formatCurrency(conversionResult, 'USD')} al tipo de cambio ${dollarTypeName.toLowerCase()} (${priceTypeName}).`
    }
  }, [dollarRate, amount, selectedDollarType, priceType, conversionDirection, conversionResult, formatCurrency, selectedDate])

  // Manejar cambio de cantidad
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.')
    const parts = rawValue.split('.')
    if (parts.length > 2) return
    setAmount(rawValue.replace(/\./g, ''))
  }, [])

  // Intercambiar dirección
  const handleSwapDirection = useCallback(() => {
    setConversionDirection(prev => 
      prev === 'USD_TO_ARS' ? 'ARS_TO_USD' : 'USD_TO_ARS'
    )
  }, [])

  // Efectos
  useEffect(() => {
    fetchDollarRate(selectedDollarType, selectedDate)
  }, [selectedDollarType, selectedDate, fetchDollarRate])

  const isFromUSD = conversionDirection === 'USD_TO_ARS'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="group relative max-w-4xl mx-auto"
    >
      {/* Gradient background effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-emerald-400/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>

      {/* Main converter card */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-xl border border-green-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conversor de Dólar</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Conversión en tiempo real</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDollarRate(selectedDollarType, selectedDate)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          
          {/* Dollar Type Selector */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Cambio
            </label>
            <Popover open={dollarTypeOpen} onOpenChange={setDollarTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-11 font-normal"
                  disabled={loading}
                >
                  <span>Dólar {dollarTypeOptions.find(opt => opt.value === selectedDollarType)?.label}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                <div className="max-h-[300px] overflow-auto">
                  {dollarTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedDollarType(option.value)
                        setDollarTypeOpen(false)
                      }}
                      className={cn(
                        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-3 px-3 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                        selectedDollarType === option.value && "bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between w-full gap-4">
                        <div className="min-w-0 text-left">
                          <div className="font-medium">Dólar {option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.description}</div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {option.label}
                        </Badge>
                      </div>
                      {selectedDollarType === option.value && (
                        <Check className="ml-2 h-4 w-4 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Price Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Precio
            </label>
            <Popover open={priceTypeOpen} onOpenChange={setPriceTypeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-11 font-normal"
                  disabled={loading}
                >
                  <span>{priceTypeOptions.find(opt => opt.value === priceType)?.label}</span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                {priceTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setPriceType(option.value as PriceType)
                      setPriceTypeOpen(false)
                    }}
                    className={cn(
                      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-3 px-3 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                      priceType === option.value && "bg-accent"
                    )}
                  >
                    <div className="text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-muted-foreground">{option.description}</div>
                    </div>
                    {priceType === option.value && (
                      <Check className="ml-auto h-4 w-4 shrink-0" />
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>

          {/* Exchange Rate Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cotización
            </label>
            <div className="h-11 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center justify-between">
              <span className="text-sm text-green-600 dark:text-green-400">1 USD =</span>
              <span className="font-bold text-green-700 dark:text-green-300">
                {loading ? '...' : `$${exchangeRate.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fecha (opcional para datos históricos)
          </label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-80 justify-start text-left font-normal"
                disabled={loading}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: es }) : "Seleccionar fecha histórica"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  setDatePickerOpen(false)
                }}
                disabled={(date) => date > new Date()}
                initialFocus
              />
              {selectedDate && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(undefined)
                      setDatePickerOpen(false)
                    }}
                    className="w-full"
                  >
                    Usar fecha actual
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>

        {/* Loading/Error States */}
        {loading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center text-blue-700 dark:text-blue-300">
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Obteniendo cotización...
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-red-700 dark:text-red-300">{error}</div>
          </div>
        )}

        {/* Conversion Interface */}
        {dollarRate && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* From Currency Input */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all">
                  <CountryFlag country={isFromUSD ? 'US' : 'AR'} className="w-8 h-6" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {isFromUSD ? 'Dólares estadounidenses' : 'Pesos argentinos'}
                    </div>
                    <input
                      type="text"
                      value={displayAmount}
                      onChange={handleAmountChange}
                      placeholder="100"
                      className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                    />
                  </div>
                  <div className="text-lg font-bold text-gray-600 dark:text-gray-400 shrink-0">
                    {isFromUSD ? 'USD' : 'ARS'}
                  </div>
                </div>
              </div>

              {/* Swap Button */}
              <div className="flex justify-center lg:block">
                <button
                  onClick={handleSwapDirection}
                  className="p-3 bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-xl transition-colors duration-200 group"
                  aria-label="Intercambiar monedas"
                >
                  <ArrowUpDown className="h-5 w-5 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform duration-200" />
                </button>
              </div>

              {/* To Currency Display */}
              <div className="flex-1">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl">
                  <CountryFlag country={!isFromUSD ? 'US' : 'AR'} className="w-8 h-6" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {!isFromUSD ? 'Dólares estadounidenses' : 'Pesos argentinos'}
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(conversionResult, !isFromUSD ? 'USD' : 'ARS').replace(/[^\d.,]/g, '')}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-600 dark:text-gray-400 shrink-0">
                    {!isFromUSD ? 'USD' : 'ARS'}
                  </div>
                </div>
              </div>
            </div>

            {/* Result Phrase */}
            <AnimatePresence>
              {conversionPhrase && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                      {conversionPhrase}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Additional Info */}
            {selectedDate && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Consultando datos históricos del {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}