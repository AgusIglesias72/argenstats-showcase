// lib/hooks/useHydrationFix.ts
'use client'

import { useEffect } from 'react'

/**
 * Hook to handle hydration mismatches caused by browser extensions
 * This is particularly useful for form inputs that get modified by
 * password managers, form fillers, and other browser extensions
 */
export function useHydrationFix() {
  useEffect(() => {
    // Suppress specific hydration warnings caused by browser extensions
    const originalError = console.error
    const originalWarn = console.warn

    console.error = (...args) => {
      const message = args[0]
      if (
        typeof message === 'string' &&
        (message.includes('Hydration failed') || message.includes('Text content does not match')) &&
        (message.includes('fdprocessedid') || 
         message.includes('data-lastpass') || 
         message.includes('data-1password') ||
         message.includes('data-bitwarden'))
      ) {
        // Suppress these specific hydration warnings
        return
      }
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args[0]
      if (
        typeof message === 'string' &&
        message.includes('Hydration') &&
        (message.includes('fdprocessedid') || 
         message.includes('data-lastpass') || 
         message.includes('data-1password') ||
         message.includes('data-bitwarden'))
      ) {
        // Suppress these specific hydration warnings
        return
      }
      originalWarn.apply(console, args)
    }

    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])
}
