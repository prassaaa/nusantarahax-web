import { MainLayout } from '@/components/layout/main-layout'
import { HeroSection } from '@/components/sections/hero-section'
import { FeaturedProductsSection } from '@/components/sections/featured-products-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'

export default function Home() {
  return (
    <MainLayout>
      <HeroSection />
      <FeaturedProductsSection />
      <FeaturesSection />
      <TestimonialsSection />
    </MainLayout>
  )
}
