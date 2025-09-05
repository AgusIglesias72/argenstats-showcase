// components/indicators/emae/EmaeSectorSelect.tsx
'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EMAE_SECTORS, EMAE_SECTOR_CATEGORIES, EmaeSectorCode } from "@/lib/api/constants/emae"

interface EmaeSectorSelectProps {
  value: EmaeSectorCode
  onChange: (value: EmaeSectorCode) => void
  className?: string
}

export function EmaeSectorSelect({ value, onChange, className }: EmaeSectorSelectProps) {
  const dotColor = getSectorDotColor(value)
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Seleccionar sector">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span>{EMAE_SECTORS[value]}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[400px]">
        {/* General */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-600">
            General
          </SelectLabel>
          <SelectItem value="GENERAL" className="pl-2 [&>span:first-child]:hidden">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              <span>{EMAE_SECTORS['GENERAL']}</span>
              <span className="text-xs text-gray-500 ml-auto">✓</span>
            </div>
          </SelectItem>
        </SelectGroup>

        <SelectSeparator />

        {/* Sectores Productivos Principales */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-blue-600">
            {EMAE_SECTOR_CATEGORIES.productivos.label}
          </SelectLabel>
          {EMAE_SECTOR_CATEGORIES.productivos.sectors.map((code) => (
            <SelectItem 
              key={code} 
              value={code} 
              className="pl-2 [&>span:first-child]:hidden"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="truncate">{EMAE_SECTORS[code as EmaeSectorCode]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        {/* Sectores de Servicios */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-purple-600">
            {EMAE_SECTOR_CATEGORIES.servicios.label}
          </SelectLabel>
          {EMAE_SECTOR_CATEGORIES.servicios.sectors.map((code) => (
            <SelectItem 
              key={code} 
              value={code} 
              className="pl-2 [&>span:first-child]:hidden"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="truncate">{EMAE_SECTORS[code as EmaeSectorCode]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        {/* Otros Sectores */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-gray-600">
            {EMAE_SECTOR_CATEGORIES.otros.label}
          </SelectLabel>
          {EMAE_SECTOR_CATEGORIES.otros.sectors.map((code) => (
            <SelectItem 
              key={code} 
              value={code} 
              className="pl-2 [&>span:first-child]:hidden"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="truncate">{EMAE_SECTORS[code as EmaeSectorCode]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

// Helper function para obtener el color del punto según la categoría
function getSectorDotColor(code: EmaeSectorCode): string {
  if (code === 'GENERAL') return 'bg-gray-500'
  
  for (const category of Object.values(EMAE_SECTOR_CATEGORIES)) {
    if (category.sectors.includes(code as any)) {
      return category.dotColor
    }
  }
  return 'bg-gray-500'
}