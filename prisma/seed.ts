import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mobile-legends' },
      update: {},
      create: {
        name: 'Mobile Legends',
        slug: 'mobile-legends',
        description: 'Premium tools for Mobile Legends Bang Bang',
        icon: '🎮',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pubg-mobile' },
      update: {},
      create: {
        name: 'PUBG Mobile',
        slug: 'pubg-mobile',
        description: 'Advanced tools for PUBG Mobile',
        icon: '🔫',
        isActive: true,
      },
    }),
    prisma.category.upsert({
      where: { slug: 'dfm-garena' },
      update: {},
      create: {
        name: 'DFM Garena',
        slug: 'dfm-garena',
        description: 'Professional tools for DFM Garena',
        icon: '⚔️',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Categories created')

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { slug: 'mlbb-pro-hack' },
      update: {},
      create: {
        name: 'MLBB Pro Hack',
        slug: 'mlbb-pro-hack',
        description: 'Advanced Mobile Legends hack with map hack, damage boost, and auto-aim features. Includes anti-ban protection and regular updates to stay undetected.',
        shortDescription: 'Advanced MLBB hack with map hack, damage boost, and auto-aim',
        price: 150000,
        originalPrice: 200000,
        categoryId: categories[0].id,
        features: JSON.stringify([
          'Map Hack & Wallhack',
          'Damage Boost (1.5x - 3x)',
          'Auto Aim & Lock Target',
          'Speed Hack',
          'Anti-Ban Protection',
          'Regular Updates',
          '24/7 Support',
          'Easy Installation'
        ]),
        images: JSON.stringify([
          'https://picsum.photos/1920/1080?random=1',
          'https://picsum.photos/1920/1080?random=2',
          'https://picsum.photos/1920/1080?random=3'
        ]),
        isActive: true,
        isFeatured: true,
        downloadUrl: '/downloads/mlbb-pro-hack.zip',
        version: '2.1.5',
        compatibility: JSON.stringify(['Android 7+', 'iOS 12+']),
      },
    }),
    prisma.product.upsert({
      where: { slug: 'pubgm-elite-esp' },
      update: {},
      create: {
        name: 'PUBGM Elite ESP',
        slug: 'pubgm-elite-esp',
        description: 'Professional PUBG Mobile ESP with player detection, item ESP, vehicle ESP, and advanced aimbot. Designed for competitive players.',
        shortDescription: 'Professional PUBGM ESP with player detection and advanced aimbot',
        price: 175000,
        originalPrice: 250000,
        categoryId: categories[1].id,
        features: JSON.stringify([
          'Player ESP & Skeleton',
          'Item ESP (Weapons, Armor)',
          'Vehicle ESP',
          'Advanced Aimbot',
          'No Recoil & No Spread',
          'Speed Hack',
          'Anti-Detection System',
          'Lifetime Updates'
        ]),
        images: JSON.stringify([
          'https://picsum.photos/1920/1080?random=4',
          'https://picsum.photos/1920/1080?random=5',
          'https://picsum.photos/1920/1080?random=6'
        ]),
        isActive: true,
        isFeatured: true,
        downloadUrl: '/downloads/pubgm-elite-esp.zip',
        version: '3.2.1',
        compatibility: JSON.stringify(['Android 8+', 'iOS 13+']),
      },
    }),
    prisma.product.upsert({
      where: { slug: 'dfm-premium-mod' },
      update: {},
      create: {
        name: 'DFM Premium Mod',
        slug: 'dfm-premium-mod',
        description: 'Complete DFM Garena modification with unlimited resources, character unlock, and premium features. Perfect for casual and competitive play.',
        shortDescription: 'Complete DFM mod with unlimited resources and character unlock',
        price: 125000,
        categoryId: categories[2].id,
        features: JSON.stringify([
          'Unlimited Gold & Diamonds',
          'All Characters Unlocked',
          'Premium Skins Access',
          'Auto Win Matches',
          'Damage Multiplier',
          'God Mode',
          'Anti-Ban Shield',
          'Regular Updates'
        ]),
        images: JSON.stringify([
          'https://picsum.photos/1920/1080?random=7',
          'https://picsum.photos/1920/1080?random=8',
          'https://picsum.photos/1920/1080?random=9'
        ]),
        isActive: true,
        isFeatured: true,
        downloadUrl: '/downloads/dfm-premium-mod.zip',
        version: '1.8.3',
        compatibility: JSON.stringify(['Android 6+']),
      },
    }),
  ])

  console.log('✅ Products created')

  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nusantarahax.com' },
    update: {},
    create: {
      email: 'admin@nusantarahax.com',
      name: 'Admin NusantaraHax',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  // Create sample users
  const userPassword = await hash('user123', 12)
  const sampleUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'ahmad.rizki@example.com' },
      update: {},
      create: {
        email: 'ahmad.rizki@example.com',
        name: 'Ahmad Rizki',
        password: userPassword,
        avatar: 'https://i.pravatar.cc/400?img=1',
        role: 'USER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'sari.dewi@example.com' },
      update: {},
      create: {
        email: 'sari.dewi@example.com',
        name: 'Sari Dewi',
        password: userPassword,
        avatar: 'https://i.pravatar.cc/400?img=2',
        role: 'USER',
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'budi.santoso@example.com' },
      update: {},
      create: {
        email: 'budi.santoso@example.com',
        name: 'Budi Santoso',
        password: userPassword,
        avatar: 'https://i.pravatar.cc/400?img=3',
        role: 'USER',
        emailVerified: new Date(),
      },
    }),
  ])

  console.log('✅ Users created')

  // Create sample reviews
  await Promise.all([
    prisma.review.upsert({
      where: { userId_productId: { userId: sampleUsers[0].id, productId: products[0].id } },
      update: {},
      create: {
        userId: sampleUsers[0].id,
        productId: products[0].id,
        rating: 5,
        comment: 'Amazing tool! Helped me dominate in Mobile Legends. The anti-ban protection works perfectly and I\'ve been using it for months without any issues. Highly recommended!',
        isVerified: true,
      },
    }),
    prisma.review.upsert({
      where: { userId_productId: { userId: sampleUsers[1].id, productId: products[1].id } },
      update: {},
      create: {
        userId: sampleUsers[1].id,
        productId: products[1].id,
        rating: 5,
        comment: 'Fast delivery and excellent support. The PUBG Mobile ESP is incredible - I can see enemies through walls and my aim has improved dramatically. Worth every penny!',
        isVerified: true,
      },
    }),
    prisma.review.upsert({
      where: { userId_productId: { userId: sampleUsers[2].id, productId: products[2].id } },
      update: {},
      create: {
        userId: sampleUsers[2].id,
        productId: products[2].id,
        rating: 4,
        comment: 'Great features and easy to use. The DFM mod gave me unlimited resources and all characters unlocked. Customer service is very responsive when I had questions.',
        isVerified: true,
      },
    }),
  ])

  console.log('✅ Reviews created')

  // Create content
  await Promise.all([
    prisma.content.upsert({
      where: { key: 'homepage_hero_title' },
      update: {},
      create: {
        key: 'homepage_hero_title',
        title: 'Homepage Hero Title',
        content: 'Premium Game Hacks & Cheats',
        type: 'TEXT',
        category: 'homepage',
        isPublished: true,
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    }),
    prisma.content.upsert({
      where: { key: 'homepage_hero_subtitle' },
      update: {},
      create: {
        key: 'homepage_hero_subtitle',
        title: 'Homepage Hero Subtitle',
        content: 'Dapatkan hack dan cheat game terbaik untuk pengalaman gaming yang tak terlupakan. Aman, undetected, dan mudah digunakan.',
        type: 'TEXT',
        category: 'homepage',
        isPublished: true,
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    })
  ])

  console.log('✅ Content created')

  // Create settings
  await Promise.all([
    prisma.setting.upsert({
      where: { key: 'site_name' },
      update: {},
      create: {
        key: 'site_name',
        value: 'NusantaraHax',
        type: 'STRING',
        category: 'general',
        description: 'Website name',
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    }),
    prisma.setting.upsert({
      where: { key: 'contact_email' },
      update: {},
      create: {
        key: 'contact_email',
        value: 'contact@nusantarahax.com',
        type: 'STRING',
        category: 'general',
        description: 'Contact email address',
        createdById: adminUser.id,
        updatedById: adminUser.id
      }
    })
  ])

  console.log('✅ Settings created')

  // Create email templates
  await Promise.all([
    prisma.emailTemplate.upsert({
      where: { key: 'order_confirmation' },
      update: {},
      create: {
        key: 'order_confirmation',
        name: 'Order Confirmation',
        subject: 'Konfirmasi Pesanan - {{orderNumber}}',
        htmlContent: `
          <h2>Terima kasih atas pesanan Anda!</h2>
          <p>Halo {{customerName}},</p>
          <p>Pesanan Anda dengan nomor <strong>{{orderNumber}}</strong> telah kami terima.</p>
          <p>Total: {{total}}</p>
          <p>Silakan lakukan pembayaran untuk melanjutkan proses pesanan.</p>
        `,
        textContent: 'Terima kasih atas pesanan Anda!',
        isActive: true
      }
    }),
    prisma.emailTemplate.upsert({
      where: { key: 'payment_success' },
      update: {},
      create: {
        key: 'payment_success',
        name: 'Payment Success',
        subject: 'Pembayaran Berhasil - {{orderNumber}}',
        htmlContent: `
          <h2>Pembayaran Berhasil!</h2>
          <p>Halo {{customerName}},</p>
          <p>Pembayaran untuk pesanan {{orderNumber}} telah berhasil diproses.</p>
          <p>Total: {{total}}</p>
          <p>Anda dapat mengunduh produk Anda di dashboard.</p>
          <a href="{{dashboardUrl}}">Buka Dashboard</a>
        `,
        textContent: 'Pembayaran berhasil! Silakan buka dashboard untuk mengunduh produk.',
        isActive: true
      }
    }),
    prisma.emailTemplate.upsert({
      where: { key: 'payment_failed' },
      update: {},
      create: {
        key: 'payment_failed',
        name: 'Payment Failed',
        subject: 'Pembayaran Gagal - {{orderNumber}}',
        htmlContent: `
          <h2>Pembayaran Gagal</h2>
          <p>Halo {{customerName}},</p>
          <p>Pembayaran untuk pesanan {{orderNumber}} gagal diproses.</p>
          <p>Silakan coba lagi atau hubungi customer service.</p>
        `,
        textContent: 'Pembayaran gagal. Silakan coba lagi.',
        isActive: true
      }
    }),
    prisma.emailTemplate.upsert({
      where: { key: 'welcome' },
      update: {},
      create: {
        key: 'welcome',
        name: 'Welcome Email',
        subject: 'Selamat Datang di NusantaraHax!',
        htmlContent: `
          <h2>Selamat Datang, {{userName}}!</h2>
          <p>Terima kasih telah bergabung dengan NusantaraHax.</p>
          <p>Anda dapat mulai berbelanja produk-produk premium kami.</p>
          <a href="{{loginUrl}}">Login ke Akun Anda</a>
        `,
        textContent: 'Selamat datang di NusantaraHax!',
        isActive: true
      }
    })
  ])

  console.log('✅ Email templates created')
  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
