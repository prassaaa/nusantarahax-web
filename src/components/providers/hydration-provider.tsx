'use client'

import { useEffect } from 'react'

interface HydrationProviderProps {
  children: React.ReactNode
}

export function HydrationProvider({ children }: HydrationProviderProps) {
  useEffect(() => {
    // Suppress hydration warnings in development
    if (process.env.NODE_ENV === 'development') {
      const originalError = console.error
      console.error = (...args) => {
        if (
          typeof args[0] === 'string' &&
          args[0].includes('hydration') &&
          args[0].includes('__processed_')
        ) {
          return
        }
        originalError.apply(console, args)
      }

      return () => {
        console.error = originalError
      }
    }
  }, [])

  return <>{children}</>
}
