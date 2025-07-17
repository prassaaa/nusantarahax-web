import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { ProductDetailContent } from '@/components/sections/product-detail-content'
import { ProductStructuredData } from '@/components/seo/product-structured-data'
import { getProductBySlug } from '@/lib/constants/sample-data'

interface ProductDetailPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = params
  const product = getProductBySlug(slug)

  if (!product) {
    return {
      title: 'Product Not Found - NusantaraHax',
      description: 'The requested product could not be found.',
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nusantarahax.com'
  const productUrl = `${baseUrl}/products/${product.slug}`

  // Generate rich keywords
  const keywords = [
    product.name.toLowerCase(),
    product.category.name.toLowerCase(),
    'gaming tool',
    'game hack',
    'mod tool',
    'indonesia',
    'nusantarahax',
    'premium gaming',
    'instant download',
    'anti-ban',
    ...product.features.slice(0, 5).map(f => f.toLowerCase())
  ]

  // Calculate discount percentage for title
  const discountText = product.originalPrice
    ? ` - ${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`
    : ''

  return {
    title: `${product.name}${discountText} | Premium Gaming Tool - NusantaraHax`,
    description: `${product.shortDescription} ✓ Instant Download ✓ 24/7 Support ✓ Anti-Ban Protection. Starting from ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price)}`,
    keywords: keywords.join(', '),
    authors: [{ name: 'NusantaraHax Team' }],
    creator: 'NusantaraHax',
    publisher: 'NusantaraHax',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      title: product.name,
      description: product.shortDescription,
      url: productUrl,
      siteName: 'NusantaraHax',
      images: [
        {
          url: product.images[0],
          width: 1920,
          height: 1080,
          alt: `${product.name} - Premium Gaming Tool`,
        },
        ...product.images.slice(1, 4).map((image, index) => ({
          url: image,
          width: 1920,
          height: 1080,
          alt: `${product.name} - Screenshot ${index + 2}`,
        }))
      ],
      locale: 'id_ID',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDescription,
      images: [product.images[0]],
      creator: '@nusantarahax',
      site: '@nusantarahax',
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'IDR',
      'product:availability': product.isActive ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:retailer_item_id': product.id,
    },
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = params
  const product = getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  return (
    <MainLayout>
      <ProductStructuredData product={product} />
      <ProductDetailContent product={product} />
    </MainLayout>
  )
}
