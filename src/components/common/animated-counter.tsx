'use client'

import { useEffect, useState, memo, useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface AnimatedCounterProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
}

export const AnimatedCounter = memo(function AnimatedCounter({
  end,
  duration = 2,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0)
  const [isClient, setIsClient] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isInView || !isClient) return

    let startTime: number
    let animationFrame: number
    let isMounted = true

    const animate = (currentTime: number) => {
      if (!isMounted) return

      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1)

      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const newCount = Math.floor(easeOutQuart * end)

      if (isMounted) {
        setCount(newCount)
      }

      if (progress < 1 && isMounted) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    if (end > 0) {
      animationFrame = requestAnimationFrame(animate)
    }

    return () => {
      isMounted = false
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [end, duration, isInView, isClient])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className={className}
      suppressHydrationWarning
    >
      {prefix}{isClient ? count.toLocaleString() : '0'}{suffix}
    </motion.span>
  )
})
