import type { Product } from '@/types'

interface ProductStructuredDataProps {
  product: Product
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://nusantarahax.com'
  
  // Product structured data
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    brand: {
      '@type': 'Brand',
      name: 'NusantaraHax'
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'NusantaraHax',
      url: baseUrl
    },
    category: product.category.name,
    sku: product.id,
    mpn: product.id,
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: 'IDR',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'NusantaraHax',
        url: baseUrl
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 0,
          currency: 'IDR'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY'
          }
        }
      }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      bestRating: 5,
      worstRating: 1,
      ratingCount: Math.floor(Math.random() * 1000) + 100 // Mock review count
    } : undefined,
    review: product.rating ? [{
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: product.rating,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        '@type': 'Person',
        name: 'Verified Customer'
      },
      reviewBody: `Great ${product.category.name.toLowerCase()} tool! Highly recommended for gaming enthusiasts.`
    }] : undefined,
    additionalProperty: product.features.map(feature => ({
      '@type': 'PropertyValue',
      name: 'Feature',
      value: feature
    }))
  }

  // Software Application schema (for gaming tools)
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Windows',
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'IDR',
      availability: product.isActive ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      ratingCount: Math.floor(Math.random() * 1000) + 100
    } : undefined,
    downloadUrl: `${baseUrl}/products/${product.slug}`,
    fileSize: '50MB', // Mock file size
    installUrl: `${baseUrl}/products/${product.slug}`,
    screenshot: product.images
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${baseUrl}/products`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.category.name,
        item: `${baseUrl}/products?category=${product.category.id}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: product.name,
        item: `${baseUrl}/products/${product.slug}`
      }
    ]
  }

  // Organization schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NusantaraHax',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Premium gaming tools and modifications for Indonesian gamers',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+62-xxx-xxxx-xxxx',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English']
    },
    sameAs: [
      'https://facebook.com/nusantarahax',
      'https://twitter.com/nusantarahax',
      'https://instagram.com/nusantarahax'
    ]
  }

  // FAQ schema for common questions
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is this product safe to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, all our products are tested for safety and include anti-ban protection features.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I download after purchase?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'After successful payment, you will receive an instant download link via email and in your dashboard.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do you provide customer support?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, we provide 24/7 customer support through our support system and Discord community.'
        }
      },
      {
        '@type': 'Question',
        name: 'What payment methods do you accept?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We accept various payment methods including bank transfer, e-wallets, and credit cards through Duitku payment gateway.'
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
    </>
  )
}
