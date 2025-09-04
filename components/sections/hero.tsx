'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ArrowRight, Calendar, TrendingUp, Activity, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

const ARGENSTATS_BLUE = '#005288'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <section className="relative bg-white dark:bg-gray-900 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/20" />
      
      <div className="relative max-w-screen-xl px-4 py-8 mx-auto lg:py-16">
        <div className="grid items-center gap-8 lg:gap-12 lg:grid-cols-12">
          {/* Left content */}
          <div className="col-span-12 lg:col-span-6 text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link 
                href="/eventos/prediccion-ipc" 
                className="inline-flex items-center justify-between px-1 py-1 pr-4 mb-6 text-sm text-gray-700 bg-gray-200/50 rounded-full dark:bg-gray-800 dark:text-white hover:bg-gray-300/50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <span className="flex items-center px-3 py-1 mr-3 text-xs text-white rounded-full bg-gray-600">
                  <Calendar className="w-3 h-3 mr-1" />
                  Evento
                </span>
                <span className="text-sm font-medium">Predecí el IPC de Agosto 2025</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </motion.div>

            {/* Main heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl xl:text-6xl dark:text-white"
            >
              Toda la economía Argentina en{' '}
              <span style={{ color: ARGENSTATS_BLUE }} className="dark:text-blue-400">
                un sólo lugar
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-xl mx-auto mb-6 font-light text-gray-500 lg:mx-0 xl:mb-8 md:text-lg xl:text-xl dark:text-gray-400"
            >
              Accede a indicadores económicos oficiales del INDEC, cotizaciones del dólar y herramientas de análisis profesional.
            </motion.p>

            {/* Search bar */}
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="max-w-lg mx-auto lg:ml-0"
              onSubmit={(e) => {
                e.preventDefault()
              }}
            >
              <label htmlFor="hero-search" className="sr-only">Buscar indicador</label>
              <div className="relative">
                <input 
                  type="search" 
                  id="hero-search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-[#005288] focus:border-[#005288] dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                  placeholder="Buscar indicador: IPC, EMAE, Dólar..."
                />
                <button 
                  type="submit" 
                  className="text-white inline-flex items-center absolute right-2.5 bottom-2.5 font-medium rounded-lg text-sm px-4 py-2 cursor-pointer transition-colors"
                  style={{ backgroundColor: ARGENSTATS_BLUE }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#003d66'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ARGENSTATS_BLUE}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </button>
              </div>
            </motion.form>
          </div>
              <div className='hidden lg:block lg:col-span-1'></div>
          {/* Right content - Browser mockup */}
          <motion.div
            initial={{ opacity: 0, x: 20, rotateY: 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="col-span-12 lg:col-span-5 relative"
          >
            {/* Container with tilt effect */}
            <div className="relative transform lg:rotate-2 hover:rotate-1 transition-transform duration-500">
              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-2xl blur-xl"></div>
              
              {/* Screenshot container */}
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                {/* Browser mockup header */}
                <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg px-3 py-1 ml-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">argenstats.com/indicadores</span>
                  </div>
                </div>
                
                {/* Dashboard mockup content */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 p-6 aspect-[4/3]">
                  <div className="space-y-4">
                    {/* Mock title */}
                    <div className="text-center mb-6">
                      <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mx-auto mb-2 animate-pulse"></div>
                      <div className="h-5 bg-blue-200 dark:bg-blue-800 rounded w-1/2 mx-auto animate-pulse"></div>
                    </div>
                    
                    {/* Mock KPIs grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="h-3 bg-red-200 rounded w-12 mb-2"></div>
                        <div className="h-6 bg-red-400 rounded w-16"></div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                          <div className="h-2 bg-red-300 rounded w-8"></div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="h-3 bg-blue-200 rounded w-10 mb-2"></div>
                        <div className="h-6 bg-blue-400 rounded w-14"></div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="h-2 bg-green-300 rounded w-6"></div>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="h-3 bg-green-200 rounded w-8 mb-2"></div>
                        <div className="h-6 bg-green-400 rounded w-12"></div>
                        <div className="flex items-center gap-1 mt-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="h-2 bg-blue-300 rounded w-10"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mock chart */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-3"></div>
                      <div className="h-24 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 dark:from-gray-700 dark:to-gray-600 rounded-lg relative overflow-hidden">
                        {/* Mock chart line */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 40">
                          <path
                            d="M 5 35 Q 15 30 25 28 T 45 22 T 65 15 T 85 10 L 95 8"
                            stroke={ARGENSTATS_BLUE}
                            strokeWidth="2"
                            fill="none"
                            className="opacity-60"
                          />
                          <path
                            d="M 5 35 Q 15 30 25 28 T 45 22 T 65 15 T 85 10 L 95 8 L 95 40 L 5 40 Z"
                            fill={ARGENSTATS_BLUE}
                            className="opacity-10"
                          />
                        </svg>
                        {/* Mock data points */}
                        <div className="absolute top-8 left-6 w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="absolute top-6 left-14 w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="absolute top-4 left-24 w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="absolute top-3 right-10 w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                      <div className="flex justify-between mt-2">
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-6"></div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-10"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              viewport={{ once: true }}
              className="absolute -top-4 -right-4 text-white p-3 rounded-full shadow-lg"
              style={{ backgroundColor: ARGENSTATS_BLUE }}
            >
              <TrendingUp className="h-6 w-6" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              viewport={{ once: true }}
              className="absolute -bottom-4 -left-4 bg-white p-3 rounded-full shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              style={{ color: ARGENSTATS_BLUE }}
            >
              <Activity className="h-6 w-6" />
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid gap-8 sm:gap-12 md:grid-cols-3 mt-16"
        >
          <FeatureCard 
            icon={<TrendingUp className="w-6 h-6" />}
            title="Datos en tiempo real"
            description="Información actualizada constantemente desde fuentes oficiales del INDEC"
          />
          <FeatureCard 
            icon={<DollarSign className="w-6 h-6" />}
            title="Cotizaciones del mercado"
            description="Dólar oficial, blue, MEP, CCL y criptomonedas actualizadas al instante"
          />
          <FeatureCard 
            icon={<Activity className="w-6 h-6" />}
            title="API para desarrolladores"
            description="Integra nuestros datos en tus aplicaciones con nuestra API RESTful"
          />
        </motion.div>
      </div>
    </section>
  )
}

function MiniKPI({ label, value, trend, color }: any) {
  const colorClasses = {
    red: 'text-red-600 bg-red-50 dark:bg-red-900/20',
    purple: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20'
  }

  return (
    <div className={`rounded-lg p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-xs opacity-80 mb-1">{label}</div>
      <div className="font-bold text-lg">{value}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div className="flex">
      <div className="shrink-0 mr-3" style={{ color: ARGENSTATS_BLUE }}>
        {icon}
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="font-light text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
    </div>
  )
}