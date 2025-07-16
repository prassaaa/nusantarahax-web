'use client'

import { motion } from 'framer-motion'
import { 
  Zap, 
  Shield, 
  Headphones, 
  RefreshCw, 
  Download, 
  Star,
  Clock,
  Users
} from 'lucide-react'
import { ANIMATIONS } from '@/lib/constants'

const features = [
  {
    icon: Zap,
    title: 'Instant Key Delivery',
    description: 'Get your license key immediately after purchase. No waiting, no delays - start gaming right away.',
    color: 'from-yellow-400 to-orange-500',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600'
  },
  {
    icon: Shield,
    title: 'Anti-Ban Protection',
    description: 'Advanced protection algorithms keep your account safe. Our tools are designed to be undetectable.',
    color: 'from-green-400 to-emerald-500',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600'
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Round-the-clock customer support via Discord, WhatsApp, and email. We\'re always here to help.',
    color: 'from-blue-400 to-cyan-500',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600'
  },
  {
    icon: RefreshCw,
    title: 'Regular Updates',
    description: 'Continuous updates to stay ahead of game patches. Your tools will always work perfectly.',
    color: 'from-purple-400 to-pink-500',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600'
  },
  {
    icon: Download,
    title: 'Easy Installation',
    description: 'Simple one-click installation process. No technical knowledge required - anyone can use our tools.',
    color: 'from-indigo-400 to-blue-500',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600'
  },
  {
    icon: Star,
    title: 'Premium Quality',
    description: 'High-quality tools tested by thousands of users. Only the best features make it to our products.',
    color: 'from-red-400 to-pink-500',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600'
  },
  {
    icon: Clock,
    title: 'Lifetime Access',
    description: 'Once you purchase, you get lifetime access to updates and support. No recurring fees.',
    color: 'from-teal-400 to-green-500',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600'
  },
  {
    icon: Users,
    title: 'Community Support',
    description: 'Join our active community of 50,000+ gamers. Share tips, get help, and make friends.',
    color: 'from-orange-400 to-red-500',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600'
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 gradient-background">
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
            ⚡ Why Choose Us
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <span className="text-gradient">Premium Features</span>
            <br />
            <span className="text-gray-900">for Serious Gamers</span>
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We provide the most advanced gaming tools with unmatched quality, 
            security, and support. Here's what makes us the #1 choice in Indonesia.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={ANIMATIONS.transitions.stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -10, 
                scale: 1.02,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <div className="relative p-8 rounded-2xl bg-white border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`} />
                
                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:shadow-lg transition-shadow duration-300`}
                >
                  <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-red-200 transition-colors duration-300" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium">
              Trusted by 50,000+ Indonesian gamers
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
