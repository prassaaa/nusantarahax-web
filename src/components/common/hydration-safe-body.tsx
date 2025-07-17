'use client'

import { useEffect, useState } from 'react'

interface HydrationSafeBodyProps {
  className: string
  children: React.ReactNode
}

export function HydrationSafeBody({ className, children }: HydrationSafeBodyProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <body className={className} suppressHydrationWarning={true}>
      {children}
    </body>
  )
}
