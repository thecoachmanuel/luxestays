import { prisma } from '@/lib/prisma';
import { Apartment, User, AppSettings, Category, Booking, Review, Favorite, Subscriber, Coupon, ContactMessage, Conversation, Message, WhyChooseUsItem, EmailCampaign } from '@/types';
import { Prisma } from '@prisma/client';

// --- Apartments ---

export async function getApartments(): Promise<Apartment[]> {
  try {
    const apartments = await prisma.apartment.findMany({
        include: {
            bookings: {
                where: {
                    status: 'confirmed',
                    endDate: {
                        gte: new Date() // Optimization: only fetch future/current bookings
                    }
                }
            }
        }
    });

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    return apartments.map(apt => {
        // Transform Prisma bookings to domain bookings for calculation
        // Note: We only fetched relevant bookings
        const aptBookings = apt.bookings
            .filter(b => b.status === 'confirmed')
            .map(b => ({
                ...b,
                startDate: new Date(b.startDate),
                endDate: new Date(b.endDate)
            }))
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        const isBooked = aptBookings.some(booking => 
            booking.startDate <= today &&
            booking.endDate > today 
        );

        let nextAvailable = null;
        if (isBooked) {
            let chainEnd = today;
            
            const current = aptBookings.find(b => b.startDate <= today && b.endDate > today);
            if (current) {
                chainEnd = current.endDate;
                
                for (const booking of aptBookings) {
                    const bStart = booking.startDate;
                    const bEnd = booking.endDate;
                    
                    if (bStart <= chainEnd && bEnd > chainEnd) {
                        chainEnd = bEnd;
                    }
                }
            }
            nextAvailable = chainEnd.toISOString();
        }

        // Map Prisma result back to strict Apartment interface
        const { bookings, ...aptData } = apt;
        
        return {
            ...aptData,
            // Ensure rating is number
            rating: aptData.rating || 5,
            currentStatus: isBooked ? 'booked' : 'available',
            nextAvailableDate: nextAvailable || undefined
        } as Apartment;
    });
  } catch (error) {
    console.error("Error fetching apartments:", error);
    return [];
  }
}

export async function getApartmentById(id: string): Promise<Apartment | undefined> {
  const apartments = await getApartments();
  return apartments.find((a) => a.id === id);
}

export async function addApartment(apartment: Apartment): Promise<void> {
  const { id, currentStatus, nextAvailableDate, ...data } = apartment;
  await prisma.apartment.create({
      data: {
          ...data,
          id: id || undefined // Let Prisma generate ID if not provided, though type says it's required string. 
          // If the app generates ID before calling add, we use it.
      }
  });
}

export async function updateApartment(updatedApartment: Apartment): Promise<void> {
  const { id, currentStatus, nextAvailableDate, ...data } = updatedApartment;
  await prisma.apartment.update({
      where: { id },
      data: data
  });
}

export async function deleteApartment(id: string): Promise<void> {
  await prisma.apartment.delete({
      where: { id }
  });
}

// --- Users ---

export async function getUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany();
    return users.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
        role: u.role as 'admin' | 'user',
        // Handle optional fields that might be null in DB but undefined in type
        name: u.name || undefined,
        phone: u.phone || undefined,
        password: u.password || undefined,
        image: u.image || undefined
    }));
  } catch (error) {
    return [];
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
      where: { email }
  });
  if (!user) return undefined;
  
  return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      role: user.role as 'admin' | 'user',
      name: user.name || undefined,
      phone: user.phone || undefined,
      password: user.password || undefined,
      image: user.image || undefined
  };
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({
      where: { id }
  });
  if (!user) return undefined;

  return {
      ...user,
      createdAt: user.createdAt.toISOString(),
      role: user.role as 'admin' | 'user',
      name: user.name || undefined,
      phone: user.phone || undefined,
      password: user.password || undefined,
      image: user.image || undefined
  };
}

export async function addUser(user: User): Promise<void> {
  await prisma.user.create({
      data: {
          id: user.id,
          email: user.email,
          name: user.name,
          password: user.password,
          role: user.role,
          phone: user.phone,
          image: user.image,
          createdAt: new Date(user.createdAt)
      }
  });
}

export async function updateUser(updatedUser: User): Promise<void> {
  await prisma.user.update({
      where: { id: updatedUser.id },
      data: {
          email: updatedUser.email,
          name: updatedUser.name,
          password: updatedUser.password,
          role: updatedUser.role,
          phone: updatedUser.phone,
          image: updatedUser.image,
          // Don't update createdAt usually
      }
  });
}

export async function upsertUserContact(userId: string, name?: string, phone?: string): Promise<void> {
  const data: any = {}
  if (name) data.name = name
  if (phone) data.phone = phone
  if (Object.keys(data).length === 0) return
  await prisma.user.update({
    where: { id: userId },
    data
  })
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({
      where: { id }
  });
}


// --- Settings ---

const DEFAULT_SETTINGS: AppSettings = {
      id: "default",
      appName: "LuxeStays",
      siteName: "LuxeStays",
      siteDescription: "Premium Apartment Booking",
      contactEmail: "contact@luxestays.com",
      contactPhone: "+1234567890",
      address: "123 Luxury Lane",
      currency: "USD",
      logo: "",
      banner: {
        isEnabled: false,
        text: "",
        backgroundColor: "#000000",
        textColor: "#FFFFFF"
      },
      footer: {
        copyrightText: "© 2026 LuxeStays",
        columns: []
      },
      paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
      emailSettings: {
        provider: 'smtp',
        host: 'smtp.mailtrap.io',
        port: 2525,
        secure: false,
        user: 'test_user',
        password: 'test_password',
        fromName: 'LuxeStays',
        fromEmail: 'noreply@luxestays.com'
      },
      welcomeEmail: {
        enabled: true,
        subject: "Welcome to LuxeStays!",
        body: "<p>Hi {{name}},</p><p>Welcome to LuxeStays! We are excited to have you on board.</p><p>Best regards,<br>The LuxeStays Team</p>"
      },
      colorPalette: {
        brand: '#000000',
        secondary: '#4B5563',
        accent: '#2563EB',
        background: '#FFFFFF',
        text: '#111827'
      },
      contactPage: {
        title: "Get in Touch",
        description: "Have questions about our apartments? We're here to help you find the perfect place for your stay.",
        email: "hello@luxestays.com",
        supportEmail: "support@luxestays.com",
        phone1: "+234 800 123 4567",
        phone2: "+234 800 987 6543",
        addressLine1: "123 Victoria Island,",
        addressLine2: "Lagos, Nigeria"
      },
      sidebarAdvert: {
        enabled: false,
        image: "",
        link: "",
        altText: "Advertisement"
      },
      cleaningFee: 5000,
      seoSettings: {
        metaTitle: "LuxeStays - Premium Apartment Booking",
        metaDescription: "Book the finest apartments in Lagos.",
        metaKeywords: "apartments, booking, luxury, lagos, accommodation",
        ogImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
        favicon: "/favicon.ico"
      },
      aboutPage: {
            title: "About Us",
            subtitle: "Experience luxury living in the heart of the city",
            heroImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
            storyTitle: "Our Story",
            storyContent: "Founded with a vision to redefine luxury accommodation, LuxeStays has been serving guests from around the world. We believe in providing not just a place to sleep, but an experience to remember. Our carefully curated apartments offer the perfect blend of comfort, style, and convenience.",
            storyImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop",
            missionTitle: "Our Mission",
            missionContent: "To provide exceptional hospitality and comfortable living spaces that feel like home, ensuring every guest enjoys a seamless and memorable stay.",
            visionTitle: "Our Vision",
            visionContent: "To be the leading provider of premium apartment rentals, recognized globally for our commitment to quality, innovation, and guest satisfaction.",
            objectivesTitle: "Our Objectives",
            objectivesContent: "1. Deliver outstanding customer service.\n2. Maintain high standards of cleanliness and comfort.\n3. Expand our portfolio to prime locations.\n4. Foster sustainable and eco-friendly practices.",
            stats: [
                { label: "Years of Experience", value: "10+" },
                { label: "Apartments", value: "50+" },
                { label: "Happy Guests", value: "10k+" },
                { label: "Cities", value: "5" }
            ]
      }
};

export async function getSettings(): Promise<AppSettings> {
  try {
    const settings = await prisma.appSettings.findUnique({
        where: { id: "default" }
    });

    if (!settings) {
        return DEFAULT_SETTINGS;
    }

    // Merge DB settings with defaults to ensure structure
    // Prisma returns Json types as any/unknown, so we cast
    return {
        ...DEFAULT_SETTINGS,
        ...settings,
        // Helper to safely parse JSON fields
        banner: settings.banner as any || DEFAULT_SETTINGS.banner,
        footer: settings.footer as any || DEFAULT_SETTINGS.footer,
        customPages: settings.customPages as any || [],
        aboutPage: settings.aboutPage as any || DEFAULT_SETTINGS.aboutPage,
        contactPage: settings.contactPage as any || DEFAULT_SETTINGS.contactPage,
        emailSettings: settings.emailSettings as any || DEFAULT_SETTINGS.emailSettings,
        colorPalette: settings.colorPalette as any || DEFAULT_SETTINGS.colorPalette,
        welcomeEmail: settings.welcomeEmail as any || DEFAULT_SETTINGS.welcomeEmail,
        sidebarAdvert: settings.sidebarAdvert as any || DEFAULT_SETTINGS.sidebarAdvert,
        seoSettings: settings.seoSettings as any || DEFAULT_SETTINGS.seoSettings,
        
        // Environment variable fallbacks
        paystackPublicKey: settings.paystackPublicKey || process.env.NEXT_PUBLIC_PAYSTACK_KEY || DEFAULT_SETTINGS.paystackPublicKey,
        paystackSecretKey: settings.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || DEFAULT_SETTINGS.paystackSecretKey,
        cleaningFee: settings.cleaningFee || DEFAULT_SETTINGS.cleaningFee
    };

  } catch (error) {
    console.error("Error fetching settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export async function getAdminNotificationCount(): Promise<number> {
  const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: { lastUserNotificationAck: true }
  });

  const lastAck = settings?.lastUserNotificationAck || new Date(0);
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [pendingBookings, unreadConversations, newMessages, newUsers] = await Promise.all([
    prisma.booking.count({ where: { status: 'pending' } }),
    prisma.conversation.count({ where: { unreadCount: { gt: 0 } } }),
    prisma.contactMessage.count({ where: { status: 'new' } }),
    prisma.user.count({ 
      where: { 
        createdAt: { 
          gte: last24h,
          gt: lastAck 
        } 
      } 
    })
  ])
  return pendingBookings + unreadConversations + newMessages + newUsers
}

export async function markAllNotificationsAsRead() {
    await prisma.$transaction(async (tx) => {
        // 1. Ack Users
        await tx.appSettings.upsert({
            where: { id: "default" },
            create: { lastUserNotificationAck: new Date() },
            update: { lastUserNotificationAck: new Date() }
        });

        // 2. Mark Messages as Read
        await tx.contactMessage.updateMany({
            where: { status: 'new' },
            data: { status: 'read', read: true }
        });

        // 3. Clear Conversation Unread Counts
        // First find conversations with unread counts to update messages efficiently
        // Actually, we can just update all messages sent by users that are unread
        await tx.message.updateMany({
            where: { isRead: false, senderRole: 'user' },
            data: { isRead: true }
        });

        await tx.conversation.updateMany({
            where: { unreadCount: { gt: 0 } },
            data: { unreadCount: 0 }
        });
    });
}

export async function getAnalyticsData(options?: { days?: number; start?: Date; end?: Date }) {
  let startDate: Date;
  let endDate: Date;

  if (options?.start && options?.end) {
      startDate = options.start;
      endDate = options.end;
  } else {
      const days = options?.days || 30;
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
  }

  // Ensure start is before end
  if (startDate > endDate) {
      const temp = startDate;
      startDate = endDate;
      endDate = temp;
  }
  
  // Normalize to start/end of day
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const bookings = await prisma.booking.findMany({
      where: { 
          createdAt: { 
              gte: startDate,
              lte: endDate
          } 
      },
      select: { createdAt: true, totalPrice: true, status: true }
  });

  const users = await prisma.user.findMany({
      where: { 
          createdAt: { 
              gte: startDate,
              lte: endDate
          } 
      },
      select: { createdAt: true }
  });

  const messages = await prisma.contactMessage.findMany({
      where: { 
          createdAt: { 
              gte: startDate,
              lte: endDate
          } 
      },
      select: { createdAt: true }
  });

  const stats = new Map<string, { date: string, revenue: number, bookings: number, users: number, messages: number }>();

  // Initialize all days in range
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      stats.set(dateStr, { date: dateStr, revenue: 0, bookings: 0, users: 0, messages: 0 });
  }

  bookings.forEach(b => {
      const dateStr = b.createdAt.toISOString().split('T')[0];
      const entry = stats.get(dateStr);
      if (entry) {
          entry.bookings++;
          if (b.status === 'confirmed') {
              entry.revenue += b.totalPrice;
          }
      }
  });

  users.forEach(u => {
      const dateStr = u.createdAt.toISOString().split('T')[0];
      const entry = stats.get(dateStr);
      if (entry) entry.users++;
  });

  messages.forEach(m => {
      const dateStr = m.createdAt.toISOString().split('T')[0];
      const entry = stats.get(dateStr);
      if (entry) entry.messages++;
  });

  return Array.from(stats.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
  const currentSettings = await getSettings();
  
  // Deep merge
  const updated = {
    ...currentSettings,
    ...newSettings,
    emailSettings: { ...currentSettings.emailSettings, ...(newSettings.emailSettings || {}) },
    colorPalette: { ...currentSettings.colorPalette, ...(newSettings.colorPalette || {}) },
    bannerSettings: { ...currentSettings.bannerSettings, ...(newSettings.bannerSettings || {}) },
    footerSettings: { ...currentSettings.footerSettings, ...(newSettings.footerSettings || {}) },
    welcomeEmail: { ...currentSettings.welcomeEmail, ...(newSettings.welcomeEmail || {}) },
    contactPage: { ...currentSettings.contactPage, ...(newSettings.contactPage || {}) },
    aboutPage: { ...currentSettings.aboutPage, ...(newSettings.aboutPage || {}) },
    sidebarAdvert: { ...currentSettings.sidebarAdvert, ...(newSettings.sidebarAdvert || {}) },
    seoSettings: { ...currentSettings.seoSettings, ...(newSettings.seoSettings || {}) }
  };

  // Convert to Prisma update input
  // We explicitly map fields to avoid issues
  await prisma.appSettings.upsert({
      where: { id: "default" },
      create: {
          id: "default",
          siteName: updated.siteName,
          siteDescription: updated.siteDescription,
          contactEmail: updated.contactEmail,
          contactPhone: updated.contactPhone,
          address: updated.address,
          currency: updated.currency,
          logo: updated.logo,
          paystackPublicKey: updated.paystackPublicKey,
          paystackSecretKey: updated.paystackSecretKey,
          cleaningFee: updated.cleaningFee,
          banner: updated.banner as any,
          footer: updated.footer as any,
          customPages: updated.customPages as any,
          aboutPage: updated.aboutPage as any,
          contactPage: updated.contactPage as any,
          emailSettings: updated.emailSettings as any,
          colorPalette: updated.colorPalette as any,
          welcomeEmail: updated.welcomeEmail as any,
          sidebarAdvert: updated.sidebarAdvert as any,
          seoSettings: updated.seoSettings as any,
      },
      update: {
          siteName: updated.siteName,
          siteDescription: updated.siteDescription,
          contactEmail: updated.contactEmail,
          contactPhone: updated.contactPhone,
          address: updated.address,
          currency: updated.currency,
          logo: updated.logo,
          paystackPublicKey: updated.paystackPublicKey,
          paystackSecretKey: updated.paystackSecretKey,
          cleaningFee: updated.cleaningFee,
          banner: updated.banner as any,
          footer: updated.footer as any,
          customPages: updated.customPages as any,
          aboutPage: updated.aboutPage as any,
          contactPage: updated.contactPage as any,
          emailSettings: updated.emailSettings as any,
          colorPalette: updated.colorPalette as any,
          welcomeEmail: updated.welcomeEmail as any,
          sidebarAdvert: updated.sidebarAdvert as any,
          seoSettings: updated.seoSettings as any,
      }
  });
}

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  try {
    const categories = await prisma.category.findMany();
    return categories.map(c => ({
        ...c,
        icon: c.icon || undefined
    }));
  } catch (error) {
    return [];
  }
}

export async function addCategory(category: Category): Promise<void> {
  await prisma.category.create({
      data: {
          id: category.id,
          name: category.name,
          icon: category.icon
      }
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
}

export async function updateCategory(updatedCategory: Category): Promise<void> {
  await prisma.category.update({
      where: { id: updatedCategory.id },
      data: {
          name: updatedCategory.name,
          icon: updatedCategory.icon
      }
  });
}

// --- Bookings ---

export async function checkBookingExpirations() {
  const now = new Date()
  await prisma.booking.updateMany({
    where: {
      endDate: { lt: now },
      status: { in: ['pending', 'confirmed'] }
    },
    data: {
      status: 'expired'
    }
  })
}

export async function getBookings(): Promise<Booking[]> {
  await checkBookingExpirations();
  try {
    const bookings = await prisma.booking.findMany();
    return bookings.map(b => ({
        ...b,
        status: b.status as 'pending' | 'confirmed' | 'cancelled' | 'expired',
        createdAt: b.createdAt.toISOString(),
        paymentReference: b.paymentReference || undefined,
        couponCode: b.couponCode || undefined,
        discountAmount: b.discountAmount || undefined
    }));
  } catch (error) {
    return [];
  }
}

export async function addBooking(booking: Booking): Promise<void> {
  await prisma.booking.create({
      data: {
          id: booking.id,
          apartmentId: booking.apartmentId,
          userId: booking.userId,
          startDate: new Date(booking.startDate),
          endDate: new Date(booking.endDate),
          totalPrice: booking.totalPrice,
          status: booking.status,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          paymentReference: booking.paymentReference,
          couponCode: booking.couponCode,
          discountAmount: booking.discountAmount,
          createdAt: booking.createdAt ? new Date(booking.createdAt) : new Date()
      }
  });
}

export async function updateBooking(updatedBooking: Booking): Promise<void> {
  await prisma.booking.update({
      where: { id: updatedBooking.id },
      data: {
          startDate: new Date(updatedBooking.startDate),
          endDate: new Date(updatedBooking.endDate),
          totalPrice: updatedBooking.totalPrice,
          status: updatedBooking.status,
          guestName: updatedBooking.guestName,
          guestEmail: updatedBooking.guestEmail,
          guestPhone: updatedBooking.guestPhone,
          paymentReference: updatedBooking.paymentReference,
          couponCode: updatedBooking.couponCode,
          discountAmount: updatedBooking.discountAmount
      }
  });
}

export async function deleteBooking(id: string): Promise<void> {
  await prisma.booking.delete({ where: { id } });
}

export async function deleteBookings(ids: string[]): Promise<void> {
  await prisma.booking.deleteMany({
      where: {
          id: { in: ids }
      }
  });
}

export async function getBookingsByApartment(apartmentId: string): Promise<Booking[]> {
    await checkBookingExpirations();
    const bookings = await prisma.booking.findMany({
        where: {
            apartmentId,
            status: 'confirmed'
        }
    });
    return bookings.map(b => ({
        ...b,
        status: b.status as 'pending' | 'confirmed' | 'cancelled' | 'expired',
        createdAt: b.createdAt.toISOString(),
        paymentReference: b.paymentReference || undefined,
        couponCode: b.couponCode || undefined,
        discountAmount: b.discountAmount || undefined
    }));
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  await checkBookingExpirations();
  const bookings = await prisma.booking.findMany({
      where: { userId }
  });
  return bookings.map(b => ({
        ...b,
        status: b.status as 'pending' | 'confirmed' | 'cancelled' | 'expired',
        createdAt: b.createdAt.toISOString(),
        paymentReference: b.paymentReference || undefined,
        couponCode: b.couponCode || undefined,
        discountAmount: b.discountAmount || undefined
    }));
}

export async function checkApartmentAvailability(apartmentId: string, startDate: string, endDate: string): Promise<boolean> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const conflictingBooking = await prisma.booking.findFirst({
      where: {
          apartmentId,
          status: 'confirmed',
          // Overlap logic: StartA < EndB AND EndA > StartB
          AND: [
              { startDate: { lt: end } },
              { endDate: { gt: start } }
          ]
      }
  });

  return !conflictingBooking;
}

// --- Reviews ---

export async function getReviews(apartmentId?: string): Promise<Review[]> {
  try {
    const reviews = await prisma.review.findMany({
        where: apartmentId ? { apartmentId } : undefined
    });
    return reviews.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString()
    }));
  } catch (error) {
    return [];
  }
}

export async function getReviewsByApartmentId(apartmentId: string): Promise<Review[]> {
  return getReviews(apartmentId);
}

export async function getReviewsByUserId(userId: string): Promise<Review[]> {
    const reviews = await prisma.review.findMany({
        where: { userId } // Note: Assuming userId matches email in Review schema or logic is adjusted
    });
    return reviews.map(r => ({
        ...r,
        createdAt: r.createdAt.toISOString()
    }));
}

export async function updateReview(updatedReview: Review): Promise<void> {
  await prisma.review.update({
      where: { id: updatedReview.id },
      data: {
          rating: updatedReview.rating,
          comment: updatedReview.comment
      }
  });
}

export async function addReview(review: Review): Promise<void> {
  await prisma.review.create({
      data: {
          id: review.id,
          apartmentId: review.apartmentId,
          userId: review.userId,
          userName: review.userName,
          rating: review.rating,
          comment: review.comment,
          createdAt: new Date(review.createdAt)
      }
  });

  // Recalculate rating
  await recalculateApartmentRating(review.apartmentId);
}

export async function deleteReview(id: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return;

  await prisma.review.delete({ where: { id } });
  
  await recalculateApartmentRating(review.apartmentId);
}

async function recalculateApartmentRating(apartmentId: string) {
    const aggregate = await prisma.review.aggregate({
        where: { apartmentId },
        _avg: { rating: true }
    });
    const averageRating = aggregate._avg.rating ? Number(aggregate._avg.rating.toFixed(1)) : 0;
    
    await prisma.apartment.update({
        where: { id: apartmentId },
        data: { rating: averageRating }
    });
}

// --- Favorites ---

export async function getFavorites(userId?: string): Promise<Favorite[]> {
  try {
    const favorites = await prisma.favorite.findMany({
        where: userId ? { userId } : undefined
    });
    return favorites.map(f => ({
        ...f,
        createdAt: f.createdAt.toISOString()
    }));
  } catch (error) {
    return [];
  }
}

export async function addFavorite(userId: string, apartmentId: string): Promise<void> {
  try {
      await prisma.favorite.create({
          data: {
              userId,
              apartmentId
          }
      });
  } catch (e) {
      // Ignore unique constraint violation
  }
}

export async function removeFavorite(userId: string, apartmentId: string): Promise<void> {
  // Delete by composite key not directly supported easily in basic delete without unique constraint definition
  // But we added @@unique([userId, apartmentId])
  await prisma.favorite.deleteMany({
      where: {
          userId,
          apartmentId
      }
  });
}

export async function isFavorite(userId: string, apartmentId: string): Promise<boolean> {
  const count = await prisma.favorite.count({
      where: { userId, apartmentId }
  });
  return count > 0;
}

// --- Subscribers ---

export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const subs = await prisma.subscriber.findMany();
    return subs.map(s => ({ ...s, createdAt: s.createdAt.toISOString() }));
  } catch (error) {
    return [];
  }
}

export async function addSubscriber(email: string): Promise<Subscriber> {
  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing) return { ...existing, createdAt: existing.createdAt.toISOString() };

  const newSub = await prisma.subscriber.create({
      data: { email }
  });
  return { ...newSub, createdAt: newSub.createdAt.toISOString() };
}

export async function removeSubscriber(id: string): Promise<void> {
  await prisma.subscriber.delete({ where: { id } });
}

// --- Coupons ---

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const coupons = await prisma.coupon.findMany();
    return coupons.map(c => ({
        ...c,
        expirationDate: c.expirationDate.toISOString(),
        discountType: c.discountType as 'percentage' | 'flat'
    }));
  } catch (error) {
    return [];
  }
}

export async function addCoupon(coupon: Coupon): Promise<void> {
  const existing = await prisma.coupon.findUnique({ where: { code: coupon.code } });
  if (existing) throw new Error('Coupon code already exists');

  await prisma.coupon.create({
      data: {
          id: coupon.id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          expirationDate: new Date(coupon.expirationDate),
          usedCount: coupon.usedCount || 0
      }
  });
}

export async function deleteCoupon(code: string): Promise<void> {
  await prisma.coupon.delete({ where: { code } });
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return undefined;
  return {
      ...coupon,
      expirationDate: coupon.expirationDate.toISOString(),
      discountType: coupon.discountType as 'percentage' | 'flat'
  };
}

// --- Contact Messages ---

export async function getMessages(): Promise<ContactMessage[]> {
  try {
    const messages = await prisma.contactMessage.findMany();
    return messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        status: m.status as 'new' | 'read' | 'replied',
        phone: m.phone || undefined
    }));
  } catch (error) {
    return [];
  }
}

export async function addMessage(message: ContactMessage): Promise<void> {
  await prisma.contactMessage.create({
      data: {
          id: message.id,
          name: message.name,
          email: message.email,
          phone: message.phone,
          subject: message.subject,
          message: message.message,
          createdAt: new Date(message.createdAt),
          read: message.read,
          status: message.status
      }
  });
}

export async function deleteMessage(id: string): Promise<void> {
  await prisma.contactMessage.delete({ where: { id } });
}

export async function markMessageAsRead(id: string): Promise<void> {
  await prisma.contactMessage.update({
      where: { id },
      data: {
          read: true,
          status: 'read'
      }
  });
}

// --- Chat System ---

export async function getConversations(): Promise<Conversation[]> {
  try {
    const conversations = await prisma.conversation.findMany();
    return conversations.map(c => ({
        ...c,
        lastMessageAt: c.lastMessageAt.toISOString(),
        archivedAt: c.archivedAt?.toISOString(),
        userClearedAt: c.userClearedAt?.toISOString(),
        userEmail: c.userEmail || undefined,
        userName: c.userName || undefined,
        status: c.status as 'active' | 'closed' | 'archived'
    }));
  } catch (error) {
    return [];
  }
}

export async function getConversationById(id: string): Promise<Conversation | undefined> {
  const c = await prisma.conversation.findUnique({ where: { id } });
  if (!c) return undefined;
  return {
      ...c,
      lastMessageAt: c.lastMessageAt.toISOString(),
      archivedAt: c.archivedAt?.toISOString(),
      userClearedAt: c.userClearedAt?.toISOString(),
      userEmail: c.userEmail || undefined,
      userName: c.userName || undefined,
      status: c.status as 'active' | 'closed' | 'archived'
  };
}

export async function getConversationByUserId(userId: string): Promise<Conversation | undefined> {
  const conversations = await prisma.conversation.findMany({
      where: {
          userId,
          status: { not: 'archived' }
      },
      orderBy: { lastMessageAt: 'desc' }
  });

  const active = conversations.find(c => c.status === 'active');
  const c = active || conversations[0];
  
  if (!c) return undefined;

  return {
      ...c,
      lastMessageAt: c.lastMessageAt.toISOString(),
      archivedAt: c.archivedAt?.toISOString(),
      userClearedAt: c.userClearedAt?.toISOString(),
      userEmail: c.userEmail || undefined,
      userName: c.userName || undefined,
      status: c.status as 'active' | 'closed' | 'archived'
  };
}

export async function deleteConversation(id: string): Promise<void> {
  await prisma.conversation.delete({ where: { id } });
  // Cascade delete handles messages
}

export async function createConversation(conversation: Conversation): Promise<void> {
  await prisma.conversation.create({
      data: {
          id: conversation.id,
          userId: conversation.userId,
          userEmail: conversation.userEmail,
          userName: conversation.userName,
          lastMessageAt: new Date(conversation.lastMessageAt),
          status: conversation.status,
          unreadCount: conversation.unreadCount
      }
  });
}

export async function updateConversation(updatedConversation: Conversation): Promise<void> {
  await prisma.conversation.update({
      where: { id: updatedConversation.id },
      data: {
          status: updatedConversation.status,
          unreadCount: updatedConversation.unreadCount,
          lastMessageAt: new Date(updatedConversation.lastMessageAt),
          archivedAt: updatedConversation.archivedAt ? new Date(updatedConversation.archivedAt) : null,
          userClearedAt: updatedConversation.userClearedAt ? new Date(updatedConversation.userClearedAt) : null,
      }
  });
}

export async function getChatMessages(conversationId: string): Promise<Message[]> {
  try {
    const messages = await prisma.message.findMany({
        where: { conversationId }
    });
    return messages.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
        senderRole: m.senderRole as 'user' | 'admin',
        senderId: m.senderId || undefined,
        image: m.image || undefined
    }));
  } catch (error) {
    return [];
  }
}

export async function addChatMessage(message: Message): Promise<void> {
  // Ensure conversation exists or create logic is handled elsewhere.
  // The original code tried to create if not exists or ignore error.
  // Here we assume conversation exists because of foreign key.
  
  await prisma.$transaction(async (tx) => {
      await tx.message.create({
          data: {
              id: message.id,
              conversationId: message.conversationId,
              content: message.content,
              senderRole: message.senderRole,
              senderId: message.senderId,
              image: message.image,
              isRead: message.isRead,
              createdAt: new Date(message.createdAt)
          }
      });

      // Update conversation
      const conversation = await tx.conversation.findUnique({ where: { id: message.conversationId } });
      if (conversation) {
          await tx.conversation.update({
              where: { id: message.conversationId },
              data: {
                  lastMessageAt: new Date(message.createdAt),
                  unreadCount: message.senderRole === 'user' ? (conversation.unreadCount || 0) + 1 : conversation.unreadCount
              }
          });
      }
  });
}

export async function markChatMessagesAsRead(conversationId: string, role: 'admin' | 'user'): Promise<void> {
  await prisma.$transaction(async (tx) => {
      await tx.message.updateMany({
          where: {
              conversationId,
              isRead: false,
              senderRole: { not: role as any } // Cast because Role enum vs string literal
          },
          data: { isRead: true }
      });

      if (role === 'admin') {
          await tx.conversation.update({
              where: { id: conversationId },
              data: { unreadCount: 0 }
          });
      }
  });
}

export async function cleanupArchivedConversations(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await prisma.conversation.deleteMany({
        where: {
            status: 'archived',
            archivedAt: {
                lt: thirtyDaysAgo
            }
        }
    });
}

// --- Why Choose Us ---

export async function getWhyChooseUs(): Promise<WhyChooseUsItem[]> {
  try {
    const items = await prisma.whyChooseUsItem.findMany();
    return items.map(i => ({
        ...i,
        bgColor: i.bgColor || undefined,
        color: i.color || undefined
    }));
  } catch (error) {
    return [];
  }
}

export async function updateWhyChooseUs(items: WhyChooseUsItem[]): Promise<void> {
  // Full replace
  await prisma.$transaction([
      prisma.whyChooseUsItem.deleteMany(),
      prisma.whyChooseUsItem.createMany({
          data: items.map(i => ({
              id: i.id,
              title: i.title,
              description: i.description,
              icon: i.icon,
              bgColor: i.bgColor,
              color: i.color
          }))
      })
  ]);
}

// --- Email Campaigns ---

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
        include: { recipients: true }
    });
    return campaigns.map(c => ({
        ...c,
        sentAt: c.sentAt.toISOString(),
        recipients: c.recipients.map(r => ({
            ...r,
            sentAt: r.sentAt.toISOString(),
            openedAt: r.openedAt?.toISOString(),
            status: r.status as 'sent' | 'opened'
        }))
    }));
  } catch (error) {
    return [];
  }
}

export async function addEmailCampaign(campaign: EmailCampaign): Promise<void> {
  await prisma.emailCampaign.create({
      data: {
          id: campaign.id,
          subject: campaign.subject,
          message: campaign.message,
          sentAt: new Date(campaign.sentAt),
          totalSent: campaign.totalSent,
          totalOpened: campaign.totalOpened,
          recipients: {
              create: campaign.recipients.map(r => ({
                  email: r.email,
                  trackingId: r.trackingId,
                  status: r.status,
                  sentAt: new Date(r.sentAt),
                  openedAt: r.openedAt ? new Date(r.openedAt) : null
              }))
          }
      }
  });
}

export async function updateCampaignRecipientStatus(trackingId: string): Promise<boolean> {
  try {
      const recipient = await prisma.emailRecipient.findUnique({
          where: { trackingId },
          include: { campaign: true }
      });

      if (!recipient || recipient.status === 'opened') {
          return false;
      }

      await prisma.$transaction([
          prisma.emailRecipient.update({
              where: { id: recipient.id },
              data: {
                  status: 'opened',
                  openedAt: new Date()
              }
          }),
          prisma.emailCampaign.update({
              where: { id: recipient.emailCampaignId },
              data: {
                  totalOpened: { increment: 1 }
              }
          })
      ]);
      return true;
  } catch (e) {
      console.error(e);
      return false;
  }
}
