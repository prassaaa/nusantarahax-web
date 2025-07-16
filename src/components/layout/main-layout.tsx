'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Header } from './header'
import { Footer } from './footer'
import { ANIMATIONS } from '@/lib/constants'

interface MainLayoutProps {
  children: ReactNode
  className?: string
}

export function MainLayout({ children, className = '' }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col gradient-background">
      <Header />
      
      <motion.main
        initial={ANIMATIONS.transitions.page.initial}
        animate={ANIMATIONS.transitions.page.animate}
        exit={ANIMATIONS.transitions.page.exit}
        transition={ANIMATIONS.transitions.page.transition}
        className={`flex-1 ${className}`}
      >
        {children}
      </motion.main>
      
      <Footer />
    </div>
  )
}
