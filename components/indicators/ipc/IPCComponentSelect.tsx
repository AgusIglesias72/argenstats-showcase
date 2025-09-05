// components/indicators/ipc/IPCComponentSelect.tsx
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
import { IPC_COMPONENTS, IPCComponentCode } from "@/lib/api/constants/inflation"
import { Circle } from "lucide-react"

interface IPCComponentSelectProps {
  value: IPCComponentCode
  onChange: (value: IPCComponentCode) => void
  className?: string
}

// Definir colores y categorías
const componentCategories = {
  general: {
    label: "General",
    color: "text-gray-600",
    dotColor: "bg-gray-500",
    components: ['GENERAL']
  },
  bys: {
    label: "Bienes y Servicios",
    color: "text-blue-600",
    dotColor: "bg-blue-500",
    components: ['BYS_BIENES', 'BYS_SERVICIOS']
  },
  categorias: {
    label: "Categorías",
    color: "text-purple-600",
    dotColor: "bg-purple-500",
    components: ['CAT_ESTACIONAL', 'CAT_NUCLEO', 'CAT_REGULADOS']
  },
  rubros: {
    label: "Rubros",
    color: "text-green-600",
    dotColor: "bg-green-500",
    components: [
      'RUBRO_ALIMENTOS',
      'RUBRO_BEB_ALC_Y_TAB',
      'RUBRO_PRE_DE_VES_Y_CAL',
      'RUBRO_VIVIENDA',
      'RUBRO_EQUIPAMIENTO',
      'RUBRO_SALUD',
      'RUBRO_TRANSPORTE',
      'RUBRO_COMUNICACION',
      'RUBRO_RECREACION_Y_CULT',
      'RUBRO_EDUCACION',
      'RUBRO_RESTAURANTES',
      'RUBRO_BIE_Y_SER_VAR'
    ]
  }
}

export function IPCComponentSelect({ value, onChange, className }: IPCComponentSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Seleccionar componente">
          <div className="flex items-center gap-2">
            <Circle className={`w-2 h-2 rounded-full fill-none ${getComponentDotColor(value)}`} />
            {IPC_COMPONENTS[value]}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {/* General */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-gray-600">
            <Circle className="w-2 h-2 fill-gray-500" />
            General
          </SelectLabel>
          {componentCategories.general.components.map((code) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-gray-500" />
                <span>{IPC_COMPONENTS[code as IPCComponentCode]}</span>
                {code === 'GENERAL' && (
                  <span className="text-xs text-gray-500 ml-auto">✓</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        {/* Bienes y Servicios */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-blue-600">
            <Circle className="w-2 h-2 fill-blue-500" />
            Bienes y Servicios
          </SelectLabel>
          {componentCategories.bys.components.map((code) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-blue-500" />
                <span>{IPC_COMPONENTS[code as IPCComponentCode]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        {/* Categorías */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-purple-600">
            <Circle className="w-2 h-2 fill-purple-500" />
            Categorías
          </SelectLabel>
          {componentCategories.categorias.components.map((code) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-purple-500" />
                <span>{IPC_COMPONENTS[code as IPCComponentCode]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>

        <SelectSeparator />

        {/* Rubros */}
        <SelectGroup>
          <SelectLabel className="flex items-center gap-2 text-green-600">
            <Circle className="w-2 h-2 fill-green-500" />
            Rubros
          </SelectLabel>
          {componentCategories.rubros.components.map((code) => (
            <SelectItem key={code} value={code}>
              <div className="flex items-center gap-2">
                <Circle className="w-2 h-2 fill-green-500" />
                <span>{IPC_COMPONENTS[code as IPCComponentCode]}</span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

// Helper function para obtener el color del punto según la categoría
function getComponentDotColor(code: IPCComponentCode): string {
  for (const category of Object.values(componentCategories)) {
    if (category.components.includes(code)) {
      return category.dotColor
    }
  }
  return 'bg-gray-500'
}