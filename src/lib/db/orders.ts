import { prisma } from './prisma'
import { generateLicenseKey } from '../utils'
import type { OrderStatus, PaymentMethod, LicenseStatus } from '@prisma/client'

// Order operations
export async function createOrder(data: {
  userId: string
  items: Array<{
    productId: string
    quantity: number
    price: number
  }>
  paymentMethod: PaymentMethod
}) {
  const { userId, items, paymentMethod } = data
  
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return prisma.order.create({
    data: {
      userId,
      total,
      paymentMethod,
      status: 'PENDING',
      items: {
        create: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  })
}

export async function updateOrderStatus(orderId: string, status: OrderStatus, paymentId?: string) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      paymentId,
      updatedAt: new Date(),
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: true,
    },
  })

  // If order is paid, create licenses
  if (status === 'PAID') {
    await createLicensesFromOrder(order)
  }

  return order
}

export async function getUserOrders(userId: string, limit = 10, offset = 0) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.order.count({ where: { userId } }),
  ])

  return {
    orders,
    total,
    hasMore: offset + limit < total,
  }
}

export async function getOrderById(orderId: string, userId?: string) {
  const where: any = { id: orderId }
  if (userId) {
    where.userId = userId
  }

  return prisma.order.findUnique({
    where,
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

// License operations
async function createLicensesFromOrder(order: any) {
  const licenses = []

  for (const item of order.items) {
    for (let i = 0; i < item.quantity; i++) {
      const licenseKey = generateLicenseKey()
      
      licenses.push({
        userId: order.userId,
        productId: item.productId,
        licenseKey,
        status: 'ACTIVE' as LicenseStatus,
      })
    }
  }

  return prisma.license.createMany({
    data: licenses,
  })
}

export async function getUserLicenses(userId: string, limit = 10, offset = 0) {
  const [licenses, total] = await Promise.all([
    prisma.license.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            version: true,
            downloadUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    }),
    prisma.license.count({ where: { userId } }),
  ])

  return {
    licenses,
    total,
    hasMore: offset + limit < total,
  }
}

export async function getLicenseById(licenseId: string, userId?: string) {
  const where: any = { id: licenseId }
  if (userId) {
    where.userId = userId
  }

  return prisma.license.findUnique({
    where,
    include: {
      product: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

export async function updateLicenseStatus(licenseId: string, status: LicenseStatus) {
  return prisma.license.update({
    where: { id: licenseId },
    data: {
      status,
      updatedAt: new Date(),
    },
  })
}

// Review operations
export async function createReview(data: {
  userId: string
  productId: string
  rating: number
  comment: string
}) {
  // Check if user has purchased this product
  const hasPurchased = await prisma.license.findFirst({
    where: {
      userId: data.userId,
      productId: data.productId,
    },
  })

  return prisma.review.create({
    data: {
      ...data,
      isVerified: !!hasPurchased,
    },
    include: {
      user: {
        select: {
          name: true,
          avatar: true,
        },
      },
    },
  })
}

export async function getProductReviews(productId: string, limit = 10, offset = 0) {
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { productId },
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
      take: limit,
      skip: offset,
    }),
    prisma.review.count({ where: { productId } }),
  ])

  return {
    reviews,
    total,
    hasMore: offset + limit < total,
  }
}
