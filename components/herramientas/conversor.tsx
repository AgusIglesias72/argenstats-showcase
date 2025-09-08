'use client';

import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { ArrowUpDown, Calculator, TrendingUp, ChevronDown, Check, RefreshCw, CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Flag from 'react-world-flags';
import { dollarConverterService, type DollarType, type DollarRateData } from '@/lib/services/dollar-converter.service';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Types are now imported from the service

type ConversionDirection = 'USD_TO_ARS' | 'ARS_TO_USD';
type PriceType = 'buy' | 'sell' | 'average';

const CountryFlag = memo(function CountryFlag({ country, className }: { country: 'US' | 'AR'; className?: string }) {
    const countryCode = country === 'US' ? 'US' : 'AR';

    return (
        <div className={`${className} rounded-sm overflow-hidden flex items-center justify-center shadow-sm`}>
            <Flag code={countryCode} className="w-full h-full object-cover" />
        </div>
    );
});

const DollarConverter = memo(function DollarConverter() {
    // Estados de datos
    const [dollarRates, setDollarRates] = useState<Record<DollarType, DollarRateData | null>>({
        OFICIAL: null,
        BLUE: null,
        MEP: null,
        CCL: null,
        CRYPTO: null,
        MAYORISTA: null,
        TARJETA: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados del conversor
    const [amount, setAmount] = useState<string>('100');
    const [selectedDollarType, setSelectedDollarType] = useState<DollarType>('BLUE');
    const [priceType, setPriceType] = useState<PriceType>('average');
    const [conversionDirection, setConversionDirection] = useState<ConversionDirection>('USD_TO_ARS');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [historicalRate, setHistoricalRate] = useState<DollarRateData | null>(null);
    const [loadingHistorical, setLoadingHistorical] = useState(false);

    // Estados de UI
    const [dollarTypeOpen, setDollarTypeOpen] = useState(false);

    // Función para obtener todos los rates actuales usando el servicio interno
    const fetchAllRates = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const ratesMap = await dollarConverterService.getAllCurrentRates();
            setDollarRates(ratesMap);
            setError(null);
        } catch (err) {
            console.error('Error fetching rates:', err);
            setError('No se pudieron cargar las cotizaciones');
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle amount input with thousand separators
    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^\d.]/g, '');
        const parts = rawValue.split('.');
        if (parts.length > 2) return;
        const numericValue = rawValue.replace(/\./g, '').replace(',', '.');
        setAmount(numericValue);
    }, []);

    // Format amount for display
    const displayAmount = useMemo(() => {
        if (!amount) return '';
        const parts = amount.split('.');
        if (parts[0]) {
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
        return parts.length === 2 ? `${parts[0]},${parts[1]}` : parts[0];
    }, [amount]);

    // Dollar type options from service
    const dollarTypeOptions = useMemo(() => dollarConverterService.getDollarTypeInfo(), []);

    // Fetch historical data when date is selected using internal service
    const fetchHistoricalRate = useCallback(async (date: Date) => {
        setLoadingHistorical(true);
        try {
            const historicalData = await dollarConverterService.getHistoricalRate(selectedDollarType, date);
            setHistoricalRate(historicalData);
        } catch (error) {
            console.error('Error fetching historical rate:', error);
            setHistoricalRate(null);
        } finally {
            setLoadingHistorical(false);
        }
    }, [selectedDollarType]);

    // Handle date selection
    const handleDateChange = useCallback((newDate: Date | undefined) => {
        setSelectedDate(newDate);
        if (newDate) {
            fetchHistoricalRate(newDate);
        } else {
            setHistoricalRate(null);
        }
    }, [fetchHistoricalRate]);

    // Get current or historical rate
    const currentRate = useMemo(() => {
        if (selectedDate && historicalRate) {
            return historicalRate;
        }
        return dollarRates[selectedDollarType] || null;
    }, [selectedDate, historicalRate, dollarRates, selectedDollarType]);

    // Calculate exchange rate based on price type
    const exchangeRate = useMemo(() => {
        if (!currentRate) return 0;

        const buyPrice = currentRate.buyPrice || 0;
        const sellPrice = currentRate.sellPrice || 0;

        switch (priceType) {
            case 'buy':
                return buyPrice > 0 ? buyPrice : sellPrice;
            case 'sell':
                return sellPrice > 0 ? sellPrice : 0;
            case 'average':
                if (buyPrice > 0 && sellPrice > 0) {
                    return (buyPrice + sellPrice) / 2;
                }
                return sellPrice > 0 ? sellPrice : 0;
            default:
                return 0;
        }
    }, [currentRate, priceType]);

    // Calculate conversion result
    const conversionResult = useMemo(() => {
        const numAmount = parseFloat(amount) || 0;
        if (conversionDirection === 'USD_TO_ARS') {
            return numAmount * exchangeRate;
        } else {
            return numAmount / exchangeRate;
        }
    }, [amount, exchangeRate, conversionDirection]);

    // Format currency
    const formatCurrency = useMemo(() => (value: number, currency: 'USD' | 'ARS') => {
        const locale = currency === 'USD' ? 'en-US' : 'es-AR';
        const currencyCode = currency;

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }, []);

    // Generate conversion phrase
    const conversionPhrase = useMemo(() => {
        if (!currentRate || !amount || isNaN(parseFloat(amount))) return '';

        const numAmount = parseFloat(amount);
        const dollarTypeName = dollarTypeOptions.find(opt => opt.type === selectedDollarType)?.label || selectedDollarType;
        const priceTypeName = priceType === 'buy' ? 'compra' :
            priceType === 'sell' ? 'venta' :
                'promedio';

        const dateContext = selectedDate ? `el ${selectedDate.toLocaleDateString('es-AR')}` : 'en este momento';

        if (conversionDirection === 'USD_TO_ARS') {
            return `${dateContext}, ${formatCurrency(numAmount, 'USD')} ${numAmount === 1 ? 'corresponde' : 'corresponden'} a ${formatCurrency(conversionResult, 'ARS')} al tipo de cambio ${dollarTypeName.toLowerCase()} (${priceTypeName}).`;
        } else {
            return `${dateContext}, ${formatCurrency(numAmount, 'ARS')} ${numAmount === 1 ? 'corresponde' : 'corresponden'} a ${formatCurrency(conversionResult, 'USD')} al tipo de cambio ${dollarTypeName.toLowerCase()} (${priceTypeName}).`;
        }
    }, [currentRate, amount, selectedDollarType, priceType, conversionDirection, conversionResult, formatCurrency, dollarTypeOptions, selectedDate]);

    // Initial load
    useEffect(() => {
        fetchAllRates();
        // Auto-refresh cada 30 segundos
    }, [fetchAllRates]);

    // Re-fetch historical data when dollar type changes (if date is selected)
    useEffect(() => {
        if (selectedDate && selectedDollarType) {
            fetchHistoricalRate(selectedDate);
        }
    }, [selectedDollarType, selectedDate, fetchHistoricalRate]);

    // Handle conversion direction swap
    const handleSwapDirection = () => {
        setConversionDirection(prev =>
            prev === 'USD_TO_ARS' ? 'ARS_TO_USD' : 'USD_TO_ARS'
        );
    };

    const isFromUSD = conversionDirection === 'USD_TO_ARS';

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="group relative"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-green-400/20 rounded-2xl blur opacity-50"></div>
                <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border border-green-100 dark:border-green-800">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        <div className="space-y-4">
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
            {/* Gradient background effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-600/20 to-green-400/20 rounded-2xl 
            blur opacity-50 group-hover:opacity-75 transition duration-500"></div>

            {/* Main converter card */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg border 
            border-green-100 dark:border-green-800">
                {/* Header with date selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                            <Calculator className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conversor de Dólar</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Conversión en tiempo real</p>
                        </div>
                    </div>
                    {/* Date selector in top right */}
                    <div className="flex items-center gap-2">
                        {/* Refresh button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={fetchAllRates}
                            disabled={loading}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                        </Button>

                        {/* Date picker con Calendar de shadcn */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !selectedDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate ? (
                                        format(selectedDate, "PPP", { locale: es })
                                    ) : (
                                        <span>Seleccionar fecha histórica</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(newDate: Date | undefined) => {
                                        handleDateChange(newDate);
                                    }}
                                    disabled={(date: Date) =>
                                        date > new Date() || date < new Date('2020-01-01')
                                    }
                                    initialFocus
                                    locale={es}
                                />
                                {selectedDate && (
                                    <div className="p-3 border-t">
                                        <Button
                                            variant="ghost"
                                            className="w-full"
                                            onClick={() => handleDateChange(undefined)}
                                        >
                                            Usar fecha actual
                                        </Button>
                                    </div>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>


                {/* Configuration Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                    {/* Dollar Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Cambio</label>
                        <Popover open={dollarTypeOpen} onOpenChange={setDollarTypeOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-10 font-normal"
                                    disabled={loadingHistorical}
                                >
                                    <span>
                                        Dólar {dollarTypeOptions.find(opt => opt.type === selectedDollarType)?.label || 'Blue'}
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
                                <div className="max-h-[300px] overflow-auto">
                                    {dollarTypeOptions.map((option) => (
                                        <button
                                            key={option.type}
                                            onClick={() => {
                                                setSelectedDollarType(option.type);
                                                setDollarTypeOpen(false);
                                            }}
                                            className={cn(
                                                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-3 px-3 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground",
                                                selectedDollarType === option.type && "bg-accent"
                                            )}
                                        >
                                            <div className="flex items-start justify-between w-full gap-4">
                                                <div className="min-w-0 text-left">
                                                    <div className="font-medium">Dólar {option.label}</div>
                                                    <div className="text-xs text-muted-foreground">{option.description}</div>
                                                </div>
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs shrink-0"
                                                >
                                                    {option.label.toUpperCase()}
                                                </Badge>
                                            </div>
                                            {selectedDollarType === option.type && (
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio</label>
                        <Select
                            value={priceType}
                            onValueChange={(value: any) => setPriceType(value as PriceType)}
                            disabled={loadingHistorical}
                        >
                            <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="Seleccionar precio">
                                    {priceType === 'buy' ? 'Compra' :
                                        priceType === 'sell' ? 'Venta' :
                                            priceType === 'average' ? 'Promedio' :
                                                'Seleccionar precio'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="average">
                                    <span>Promedio</span>
                                </SelectItem>
                                <SelectItem value="buy">
                                    <span>Compra</span>
                                </SelectItem>
                                <SelectItem value="sell">
                                    <span>Venta</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Exchange Rate Display */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cotización</label>
                        <div className="h-10 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-center justify-between">
                            <span className="text-sm text-green-600 dark:text-green-400">1 USD =</span>
                            <span className="font-bold text-green-700 dark:text-green-300">
                                {loadingHistorical || loading ? '...' : `$${exchangeRate.toFixed(2)}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conversion Interface */}
                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 p-4 border border-gray-300 dark:border-gray-600 rounded-xl focus-within:border-green-500 dark:focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500 dark:focus-within:ring-green-400 focus-within:ring-opacity-20">
                                <CountryFlag country={isFromUSD ? 'US' : 'AR'} className="w-8 h-6" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
                                        {isFromUSD ? 'Dólares estadounidenses' : 'Pesos argentinos'}
                                    </div>
                                    <input
                                        type="text"
                                        value={displayAmount}
                                        onChange={handleAmountChange}
                                        placeholder="100"
                                        className="w-full text-lg font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none"
                                        disabled={loadingHistorical || loading}
                                    />
                                </div>
                                <div className="text-lg font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                    {isFromUSD ? 'USD' : 'ARS'}
                                </div>
                            </div>
                        </div>

                        {/* Swap Button */}
                        <div className="flex justify-center lg:block">
                            <button
                                onClick={handleSwapDirection}
                                className="p-3 bg-green-100 hover:bg-green-200 rounded-xl transition-colors duration-200 group"
                                disabled={loadingHistorical || loading}
                                aria-label="Intercambiar monedas"
                            >
                                <ArrowUpDown className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                            </button>
                        </div>

                        {/* To Currency Display */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                                <CountryFlag country={!isFromUSD ? 'US' : 'AR'} className="w-8 h-6" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">
                                        {!isFromUSD ? 'Dólares estadounidenses' : 'Pesos argentinos'}
                                    </div>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        {loadingHistorical || loading ? '...' : formatCurrency(conversionResult, !isFromUSD ? 'USD' : 'ARS').replace(/[^\d.,]/g, '')}
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-gray-600 dark:text-gray-300 shrink-0">
                                    {!isFromUSD ? 'USD' : 'ARS'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Result Phrase */}
                {conversionPhrase && !loadingHistorical && !loading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 p-4 bg-green-50/50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl"
                    >
                        <div className="flex items-start gap-3">
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
                                {conversionPhrase}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Loading indicator for historical data */}
                {loadingHistorical && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">Buscando cotización histórica...</span>
                        </div>
                    </div>
                )}

                {/* No historical data message */}
                {selectedDate && !loadingHistorical && !historicalRate && (
                    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            <span className="text-sm text-yellow-800 dark:text-yellow-200">
                                No se encontraron datos para la fecha seleccionada. Mostrando cotización actual.
                            </span>
                        </div>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchAllRates}
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

export default DollarConverter;