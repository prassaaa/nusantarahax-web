const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@nusantarahax.com',
        name: 'Admin NusantaraHax',
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
      }
    })

    console.log('Admin user created successfully:')
    console.log('Email:', admin.email)
    console.log('Password: admin123')
    console.log('Role:', admin.role)

  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
