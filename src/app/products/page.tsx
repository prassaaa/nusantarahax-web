import { Metadata } from 'next'
import { MainLayout } from '@/components/layout/main-layout'
import { ProductsPageContent } from '@/components/sections/products-page-content'

export const metadata: Metadata = {
  title: 'Products - Premium Gaming Tools',
  description: 'Browse our complete collection of premium gaming tools for Mobile Legends, PUBG Mobile, and DFM Garena. All tools include anti-ban protection and 24/7 support.',
  keywords: ['gaming tools', 'mobile legends hack', 'pubg mobile esp', 'dfm garena mod', 'indonesia gaming'],
}

export default function ProductsPage() {
  return (
    <MainLayout>
      <ProductsPageContent />
    </MainLayout>
  )
}
