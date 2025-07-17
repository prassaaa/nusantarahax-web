# 🗄️ Database Setup Guide - NusantaraHax

## MySQL Database Configuration

### 📋 Prerequisites

1. **MySQL Server** installed and running
2. **MySQL Client** or **phpMyAdmin** for database management
3. **Node.js** and **npm** installed

### 🚀 Quick Setup

#### 1. Install MySQL (if not installed)

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS (with Homebrew):**
```bash
brew install mysql
brew services start mysql
```

**Windows:**
- Download MySQL installer from [mysql.com](https://dev.mysql.com/downloads/installer/)
- Follow installation wizard

#### 2. Create Database

Login to MySQL as root:
```bash
mysql -u root -p
```

Create database and user:
```sql
-- Create database
CREATE DATABASE nusantarahax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (optional, you can use root)
CREATE USER 'nusantara'@'localhost' IDENTIFIED BY 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON nusantarahax.* TO 'nusantara'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

#### 3. Configure Environment Variables

Update your `.env` file:
```env
# Using root user (simple for development)
DATABASE_URL="mysql://root:your_root_password@localhost:3306/nusantarahax"

# Or using dedicated user
DATABASE_URL="mysql://nusantara:your_secure_password@localhost:3306/nusantarahax"
```

#### 4. Setup Database Schema

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 🔧 Database Commands

```bash
# Development workflow
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema changes to DB
npm run db:seed       # Populate with sample data
npm run db:studio     # Open Prisma Studio (GUI)

# Production workflow
npm run db:migrate    # Run database migrations
npm run db:generate   # Generate client after migration
```

### 📊 Database Schema Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Users       │    │   Categories    │    │    Products     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    │ id (PK)         │
│ email (unique)  │    │ name (unique)   │    │ name            │
│ name            │    │ slug (unique)   │    │ slug (unique)   │
│ avatar          │    │ description     │    │ description     │
│ role            │    │ icon            │    │ price           │
│ createdAt       │    │ isActive        │    │ categoryId (FK) │
│ updatedAt       │    └─────────────────┘    │ features (JSON) │
└─────────────────┘                           │ images (JSON)   │
                                              │ isActive        │
┌─────────────────┐    ┌─────────────────┐    │ isFeatured      │
│     Orders      │    │   OrderItems    │    └─────────────────┘
├─────────────────┤    ├─────────────────┤
│ id (PK)         │    │ id (PK)         │    ┌─────────────────┐
│ userId (FK)     │    │ orderId (FK)    │    │    Licenses     │
│ status          │    │ productId (FK)  │    ├─────────────────┤
│ total           │    │ quantity        │    │ id (PK)         │
│ paymentMethod   │    │ price           │    │ userId (FK)     │
│ paymentId       │    └─────────────────┘    │ productId (FK)  │
│ createdAt       │                           │ licenseKey      │
└─────────────────┘    ┌─────────────────┐    │ status          │
                       │     Reviews     │    │ expiresAt       │
                       ├─────────────────┤    │ createdAt       │
                       │ id (PK)         │    └─────────────────┘
                       │ userId (FK)     │
                       │ productId (FK)  │
                       │ rating (1-5)    │
                       │ comment         │
                       │ isVerified      │
                       └─────────────────┘
```

### 🛠️ Troubleshooting

#### Common Issues:

**1. Connection Refused**
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL service
sudo systemctl start mysql
```

**2. Access Denied**
```bash
# Reset MySQL root password
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

**3. Database Doesn't Exist**
```sql
-- Check existing databases
SHOW DATABASES;

-- Create if missing
CREATE DATABASE nusantarahax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**4. Prisma Client Issues**
```bash
# Regenerate Prisma client
rm -rf node_modules/.prisma
npm run db:generate
```

### 📱 Prisma Studio

Access database GUI:
```bash
npm run db:studio
```
Opens at: http://localhost:5555

### 🔒 Security Notes

**Development:**
- Use simple passwords for local development
- Database user can have full privileges

**Production:**
- Use strong, unique passwords
- Create dedicated database user with minimal privileges
- Enable SSL connections
- Regular backups
- Monitor database performance

### 📝 Sample Data

After running `npm run db:seed`, you'll have:
- **3 Categories**: Mobile Legends, PUBG Mobile, DFM Garena
- **3 Featured Products** with realistic data
- **1 Admin User**: admin@nusantarahax.com
- **3 Sample Users** with reviews
- **Sample Reviews** for each product

### 🔄 Reset Database

To start fresh:
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS nusantarahax; CREATE DATABASE nusantarahax CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Push schema and seed
npm run db:push
npm run db:seed
```

---

**Need help?** Check the [main README](../README.md) or create an issue in the repository.
