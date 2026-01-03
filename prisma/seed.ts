
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  const dataDir = path.join(process.cwd(), 'data')

  // Helper to read JSON
  const readJson = async (filename: string) => {
    try {
      const content = await fs.readFile(path.join(dataDir, filename), 'utf-8')
      return JSON.parse(content)
    } catch (e) {
      console.warn(`Warning: Could not read ${filename}, skipping.`)
      return []
    }
  }

  // 1. Users
  const users = await readJson('users.json')
  for (const user of users) {
    // Check if password looks hashed (starts with $2b$ or $2a$)
    let password = user.password
    if (!password.startsWith('$2')) {
       password = await bcrypt.hash(password, 10)
    }

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        id: user.id,
        email: user.email,
        name: user.name,
        password: password,
        role: user.role || 'user',
        phone: user.phone,
        image: user.image,
        createdAt: new Date(user.createdAt || Date.now()),
      },
    })
  }
  console.log(`Seeded ${users.length} users`)

  // 2. Apartments
  const apartments = await readJson('apartments.json')
  for (const apt of apartments) {
    await prisma.apartment.upsert({
      where: { id: apt.id },
      update: {},
      create: {
        id: apt.id,
        title: apt.title,
        description: apt.description,
        price: apt.price,
        location: apt.location,
        image: apt.image,
        images: apt.images,
        bedrooms: apt.bedrooms,
        bathrooms: apt.bathrooms,
        amenities: apt.amenities,
        rating: apt.rating,
        category: apt.category,
        videoUrl: apt.videoUrl,
      },
    })
  }
  console.log(`Seeded ${apartments.length} apartments`)

  // 3. Bookings
  const bookings = await readJson('bookings.json')
  for (const booking of bookings) {
    // Ensure user and apartment exist
    const userExists = await prisma.user.findUnique({ where: { id: booking.userId } })
    const aptExists = await prisma.apartment.findUnique({ where: { id: booking.apartmentId } })

    if (userExists && aptExists) {
        await prisma.booking.create({
            data: {
                id: booking.id,
                apartmentId: booking.apartmentId,
                userId: booking.userId,
                startDate: new Date(booking.startDate),
                endDate: new Date(booking.endDate),
                totalPrice: booking.totalPrice,
                status: booking.status,
                createdAt: new Date(booking.createdAt || Date.now()),
            }
        })
    }
  }
  console.log(`Seeded ${bookings.length} bookings`)

  // 4. Reviews
  const reviews = await readJson('reviews.json')
  for (const review of reviews) {
      const userExists = await prisma.user.findUnique({ where: { id: review.userId } })
      const aptExists = await prisma.apartment.findUnique({ where: { id: review.apartmentId } })

      if (userExists && aptExists) {
          await prisma.review.create({
              data: {
                  id: review.id,
                  apartmentId: review.apartmentId,
                  userId: review.userId,
                  rating: review.rating,
                  comment: review.comment,
                  createdAt: new Date(review.createdAt || Date.now()),
              }
          })
      }
  }
  console.log(`Seeded ${reviews.length} reviews`)

  // 5. Favorites
  const favorites = await readJson('favorites.json')
  for (const fav of favorites) {
      // In JSON, favorite might be { userId, apartmentId } or just IDs.
      // Assuming array of objects
      if (fav.userId && fav.apartmentId) {
          const userExists = await prisma.user.findUnique({ where: { id: fav.userId } })
          const aptExists = await prisma.apartment.findUnique({ where: { id: fav.apartmentId } })
          
          if (userExists && aptExists) {
             // Check duplicate
             const existing = await prisma.favorite.findFirst({
                 where: { userId: fav.userId, apartmentId: fav.apartmentId }
             })
             if (!existing) {
                 await prisma.favorite.create({
                     data: {
                         userId: fav.userId,
                         apartmentId: fav.apartmentId,
                     }
                 })
             }
          }
      }
  }
  console.log(`Seeded ${favorites.length} favorites`)

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
