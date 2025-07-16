'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/common/product-card'
import { getFeaturedProducts } from '@/lib/constants/sample-data'
import { ANIMATIONS } from '@/lib/constants'

export function FeaturedProductsSection() {
  const featuredProducts = getFeaturedProducts()

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-medium mb-6"
          >
            🎮 Featured Products
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-gradient">Premium Gaming Tools</span>
            <br />
            <span className="text-gray-900">for Indonesian Gamers</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover our most popular gaming enhancement tools. Each product comes with 
            anti-ban protection, regular updates, and 24/7 customer support.
          </p>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          variants={ANIMATIONS.transitions.stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
        >
          {featuredProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
            />
          ))}
        </motion.div>

        {/* View All Products CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            whileHover={ANIMATIONS.transitions.buttonHover}
            whileTap={{ scale: 0.95 }}
          >
            <Button size="lg" className="gradient-button text-white border-0" asChild>
              <Link href="/products">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>
          
          <p className="text-gray-500 mt-4">
            Explore our complete collection of gaming tools
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { label: 'Active Users', value: '50K+', icon: '👥' },
            { label: 'Products Sold', value: '100K+', icon: '📦' },
            { label: 'Success Rate', value: '99%', icon: '✅' },
            { label: 'Support Rating', value: '4.9★', icon: '⭐' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-6 rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
