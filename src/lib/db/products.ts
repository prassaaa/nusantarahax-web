import { prisma } from './prisma'
import type { Product, Category } from '@prisma/client'

// Product queries
export async function getProducts(options?: {
  categoryId?: string
  featured?: boolean
  active?: boolean
  search?: string
  limit?: number
  offset?: number
}) {
  const {
    categoryId,
    featured,
    active = true,
    search,
    limit = 10,
    offset = 0
  } = options || {}

  const where: any = {
    isActive: active,
  }

  if (categoryId) {
    where.categoryId = categoryId
  }

  if (featured !== undefined) {
    where.isFeatured = featured
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            licenses: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    total,
    hasMore: offset + limit < total,
  }
}

export async function getProductBySlug(slug: string) {
  return await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      reviews: {
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          reviews: true,
          licenses: true,
        },
      },
    },
  })
}

export async function getFeaturedProducts(limit = 6) {
  return prisma.product.findMany({
    where: {
      isFeatured: true,
      isActive: true,
    },
    include: {
      category: true,
      _count: {
        select: {
          reviews: true,
          licenses: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}

export async function getRelatedProducts(productId: string, categoryId: string, limit = 3) {
  return prisma.product.findMany({
    where: {
      id: { not: productId },
      categoryId,
      isActive: true,
    },
    include: {
      category: true,
      _count: {
        select: {
          reviews: true,
          licenses: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}

// Category queries
export async function getCategories(activeOnly = true) {
  return prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    include: {
      _count: {
        select: {
          products: {
            where: {
              isActive: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      products: {
        where: {
          isActive: true,
        },
        include: {
          category: true,
          _count: {
            select: {
              reviews: true,
              licenses: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  })
}
