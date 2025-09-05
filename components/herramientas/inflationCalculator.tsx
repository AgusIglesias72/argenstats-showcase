'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Calculator, TrendingUp, ArrowRight, Calendar, ArrowUpDown, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Flag from 'react-world-flags';
import { getCurrentCERAction, calculateCERAction } from '@/app/actions/cer-actions';

interface CERData {
  date: string;
  value: number;
  daily_change?: number;
  monthly_change?: number;
  yearly_change?: number;
}

interface InflationCalculatorProps {
  initialCERData?: CERData | null;
}

interface PeriodButton {
  label: string;
  years: number;
  description: string;
}

const periodButtons: PeriodButton[] = [
  { label: '1 año', years: 1, description: '1 año atrás' },
  { label: '5 años', years: 5, description: '5 años atrás' },
  { label: '10 años', years: 10, description: '10 años atrás' },
  { label: '15 años', years: 15, description: '15 años atrás' }
];

// Flag component for Argentina
const ArgentinaFlag = memo(function ArgentinaFlag({ className }: { className?: string }) {
  return (
    <div className={`${className} rounded-sm overflow-hidden flex items-center justify-center shadow-sm`}>
      <Flag code="AR" className="w-full h-full object-cover" />
    </div>
  );
});

type CalculationDirection = 'PAST_TO_PRESENT' | 'PRESENT_TO_PAST';

const InflationCalculator = memo(function InflationCalculator({ initialCERData }: InflationCalculatorProps) {
  const [amount, setAmount] = useState<string>('1000');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodButton>(periodButtons[2]); // Default to 10 years
  const [calculationDirection, setCalculationDirection] = useState<CalculationDirection>('PAST_TO_PRESENT');
  const [fromDate, setFromDate] = useState<Date>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 10);
    return date;
  });
  const [toDate, setToDate] = useState<Date>(new Date());
  const [result, setResult] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCER, setCurrentCER] = useState<CERData | null>(initialCERData || null);

  // Función para obtener CER actual usando Server Action
  const fetchCurrentCER = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCurrentCERAction();
      
      if (data) {
        const cerData: CERData = {
          date: data.date,
          value: data.value,
          daily_change: data.daily_change,
          monthly_change: data.monthly_change,
          yearly_change: data.yearly_change
        };
        setCurrentCER(cerData);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching CER:', err);
      setError('No se pudo cargar el índice CER');
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para calcular inflación usando Server Action
  const calculateInflationAPI = useCallback(async () => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return;

    setIsCalculating(true);
    setResult(null);
    setError(null);

    try {
      const fromStr = fromDate.toISOString().split('T')[0];
      const toStr = toDate.toISOString().split('T')[0];
      
      const data = await calculateCERAction({
        amount: numAmount,
        from: fromStr,
        to: toStr
      });
      
      if (data) {
        let calcResult = data;
        
        // Si es cálculo invertido (PRESENT_TO_PAST)
        if (calculationDirection === 'PRESENT_TO_PAST') {
          const inflationCoeff = calcResult.inflation_coefficient || 1;
          const pastAmount = numAmount / inflationCoeff;
          calcResult = {
            ...calcResult,
            initial_amount: pastAmount,
            adjusted_amount: numAmount
          };
        }
        
        setResult(calcResult);
      }
    } catch (error) {
      console.error('Error calculating inflation:', error);
      setError('Error al calcular la inflación. Por favor, intente nuevamente.');
    } finally {
      setIsCalculating(false);
    }
  }, [amount, fromDate, toDate, calculationDirection]);

  // Update fromDate when selectedPeriod changes
  useEffect(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - selectedPeriod.years);
    setFromDate(date);
  }, [selectedPeriod]);

  // Initial load
  useEffect(() => {
    if (!initialCERData) {
      fetchCurrentCER();
    }
  }, [fetchCurrentCER, initialCERData]);

  // Format amount for display
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d.]/g, '');
    const parts = rawValue.split('.');
    if (parts.length > 2) return;
    
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    const numericValue = rawValue.replace(/\./g, '').replace(',', '.');
    setAmount(numericValue);
    
    // Limpiar el resultado cuando se edita el input
    if (result) {
      setResult(null);
    }
  }, [result]);

  const displayAmount = useMemo(() => {
    if (!amount) return '';
    const parts = amount.split('.');
    if (parts[0]) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    return parts.length === 2 ? `${parts[0]},${parts[1]}` : parts[0];
  }, [amount]);

  // Date Input Component
  const DateInput = ({ value, onChange, label }: { value: Date; onChange: (date: Date) => void; label: string }) => {
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = new Date(e.target.value + 'T00:00:00');
      onChange(newDate);
      
      // Limpiar el resultado cuando se cambia la fecha
      if (result) {
        setResult(null);
      }
    };

    const dateString = value.toISOString().split('T')[0];

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
        <div className="relative">
          <input
            type="date"
            value={dateString}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            disabled={isCalculating || loading}
            min="2002-02-04"
            max={new Date().toISOString().split('T')[0]}
          />
          <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !currentCER) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-orange-400/20 rounded-2xl blur opacity-50"></div>
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-orange-100 dark:border-gray-700">
          <div className="animate-pulse space-y-6">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="group relative"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 to-orange-400/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500"></div>

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-orange-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
              <Calculator className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calculadora de Inflación</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {calculationDirection === 'PAST_TO_PRESENT' 
                  ? 'Valor actualizado por inflación' 
                  : 'Valor necesario en el pasado'}
              </p>
            </div>
          </div>

          <div className="flex md:items-center gap-2 w-full md:w-auto justify-between">
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="lg"
              onClick={fetchCurrentCER}
              disabled={loading}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>

            {/* Direction toggle */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setCalculationDirection(prev => 
                  prev === 'PAST_TO_PRESENT' ? 'PRESENT_TO_PAST' : 'PAST_TO_PRESENT'
                );
                // Limpiar el resultado cuando se cambia la dirección
                if (result) {
                  setResult(null);
                }
              }}
              className="hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 
              dark:hover:border-orange-700 shrink-0 flex-1"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Invertir
            </Button>
          </div>
        </div>

        {/* Quick Period Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Períodos rápidos</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {periodButtons.map((period) => (
              <button
                key={period.years}
                onClick={() => {
                  setSelectedPeriod(period);
                  // Limpiar el resultado cuando se cambia el período
                  if (result) {
                    setResult(null);
                  }
                }}
                className={cn(
                  "px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
                  "border-2 hover:shadow-md",
                  selectedPeriod.years === period.years
                    ? "bg-orange-500 text-white border-orange-500 shadow-md"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                )}
                disabled={isCalculating || loading}
              >
                <div className="text-sm font-semibold">Hace {period.label}</div>
                <div className="text-xs opacity-80 mt-0.5">{period.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <DateInput
            value={fromDate}
            onChange={setFromDate}
            label={calculationDirection === 'PAST_TO_PRESENT' ? 'Desde' : 'Fecha pasada'}
          />
          <DateInput
            value={toDate}
            onChange={setToDate}
            label={calculationDirection === 'PAST_TO_PRESENT' ? 'Hasta' : 'Fecha actual'}
          />
        </div>

        {/* Current CER Display */}
        {currentCER && (
          <div className="mb-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
              <span className="text-sm text-orange-600 dark:text-orange-400">Índice CER actual:</span>
              <div className="flex items-center gap-4">
                <span className="font-bold text-orange-700 dark:text-orange-300">{currentCER.value.toFixed(4)}</span>
                {currentCER.yearly_change && (
                  <Badge variant="outline" className="border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300">
                    +{currentCER.yearly_change.toFixed(2)}% anual
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Amount Input and Result */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-xl focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-opacity-20">
                <ArgentinaFlag className="w-8 h-6" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
                    {calculationDirection === 'PAST_TO_PRESENT' ? 'Pesos del pasado' : 'Pesos de hoy'}
                  </div>
                  <input
                    type="text"
                    value={displayAmount}
                    onChange={handleAmountChange}
                    placeholder="1.000"
                    className="w-full text-lg font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none"
                    disabled={isCalculating || loading}
                  />
                </div>
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400 shrink-0">ARS</div>
              </div>
            </div>

            <div className="flex justify-center lg:block">
              <Button
                onClick={calculateInflationAPI}
                disabled={isCalculating || !amount || loading}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6"
              >
                {isCalculating ? 'Calculando...' : 'Calcular'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                <ArgentinaFlag className="w-8 h-6" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
                    {calculationDirection === 'PAST_TO_PRESENT' ? 'Equivalente hoy' : 'Necesario entonces'}
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                    {result ? 
                      (calculationDirection === 'PRESENT_TO_PAST' ? result.initial_amount : result.adjusted_amount).toLocaleString('es-AR', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      }) 
                      : '...'
                    }
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-600 dark:text-gray-400 shrink-0">ARS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Result Details */}
        {result && !isCalculating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-orange-50/50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-3">
                <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
                  {calculationDirection === 'PAST_TO_PRESENT' 
                    ? `$${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} del ${fromDate.toLocaleDateString('es-AR')} equivalen hoy a $${result.adjusted_amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `Para tener el poder de compra de $${parseFloat(amount).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} de hoy, necesitabas $${result.initial_amount?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} el ${fromDate.toLocaleDateString('es-AR')}`
                  }
                </p>
                
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Inflación: </span>
                    <span className="font-bold text-red-600 dark:text-red-400">
                      +{(result.variation_percentage || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-400">Factor: </span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {(result.inflation_coefficient || 1).toFixed(2)}x
                    </span>
                  </div>
                </div>

                {/* CER Values */}
                {result.initial_cer && result.final_cer && (
                  <div className="pt-3 border-t border-orange-200 dark:border-orange-700">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">CER Inicial:</span> {result.initial_cer.toFixed(4)}
                      </div>
                      <div>
                        <span className="font-medium">CER Final:</span> {result.final_cer.toFixed(4)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Loading indicator */}
        {isCalculating && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Calculando inflación...</span>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={calculateInflationAPI}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Reintentar
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// Add Badge component if not imported
const Badge = ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => {
  return (
    <span className={cn("inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold", className)}>
      {children}
    </span>
  );
};

export default InflationCalculator;