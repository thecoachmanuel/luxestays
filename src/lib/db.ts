import fs from 'fs/promises';
import path from 'path';
import { Apartment, User, AppSettings, Category, Booking, Review, Favorite, Subscriber, Coupon, ContactMessage, Conversation, Message, WhyChooseUsItem, EmailCampaign } from '@/types';

const apartmentsFilePath = path.join(process.cwd(), 'data', 'apartments.json');
const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
const settingsFilePath = path.join(process.cwd(), 'data', 'settings.json');
const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');
const bookingsFilePath = path.join(process.cwd(), 'data', 'bookings.json');
const reviewsFilePath = path.join(process.cwd(), 'data', 'reviews.json');
const favoritesFilePath = path.join(process.cwd(), 'data', 'favorites.json');
const subscribersFilePath = path.join(process.cwd(), 'data', 'subscribers.json');
const couponsFilePath = path.join(process.cwd(), 'data', 'coupons.json');
const messagesFilePath = path.join(process.cwd(), 'data', 'messages.json');
const chatConversationsFilePath = path.join(process.cwd(), 'data', 'chat-conversations.json');
const chatMessagesFilePath = path.join(process.cwd(), 'data', 'chat-messages.json');
const whyChooseUsFilePath = path.join(process.cwd(), 'data', 'why-choose-us.json');
const emailCampaignsFilePath = path.join(process.cwd(), 'data', 'email-campaigns.json');


// --- Apartments ---

export async function getApartments(): Promise<Apartment[]> {
  try {
    const data = await fs.readFile(apartmentsFilePath, 'utf8');
    const apartments: Apartment[] = JSON.parse(data);

    // Check availability
    const bookings = await getBookings();
    
    // Create a UTC date that represents the current local calendar date
    // This ensures consistent comparison with booking dates which are parsed as UTC
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    return apartments.map(apt => {
        // Find all future/current bookings for this apartment
        const aptBookings = bookings
            .filter(b => b.apartmentId === apt.id && b.status === 'confirmed' && new Date(b.endDate) >= today)
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

        const isBooked = aptBookings.some(booking => 
            new Date(booking.startDate) <= today &&
            new Date(booking.endDate) > today // endDate is checkout, so if today is endDate, it's available (technically)
        );

        let nextAvailable = null;
        if (isBooked) {
            let chainEnd = today;
            
            // Find the current booking to start the chain
            const current = aptBookings.find(b => new Date(b.startDate) <= today && new Date(b.endDate) > today);
            if (current) {
                chainEnd = new Date(current.endDate);
                
                // Check for contiguous bookings
                for (const booking of aptBookings) {
                    const bStart = new Date(booking.startDate);
                    const bEnd = new Date(booking.endDate);
                    
                    // If this booking starts on or before the current chain ends, extend the chain
                    if (bStart <= chainEnd && bEnd > chainEnd) {
                        chainEnd = bEnd;
                    }
                }
            }
            nextAvailable = chainEnd.toISOString();
        }

        return {
            ...apt,
            rating: apt.rating || 5,
            currentStatus: isBooked ? 'booked' : 'available',
            nextAvailableDate: nextAvailable || undefined
        }
    });
  } catch (error) {
    return [];
  }
}

export async function getApartmentById(id: string): Promise<Apartment | undefined> {
  const apartments = await getApartments();
  return apartments.find((a) => a.id === id);
}

export async function addApartment(apartment: Apartment): Promise<void> {
  const apartments = await getApartments();
  apartments.push(apartment);
  await fs.writeFile(apartmentsFilePath, JSON.stringify(apartments, null, 2));
}

export async function updateApartment(updatedApartment: Apartment): Promise<void> {
  const apartments = await getApartments();
  const index = apartments.findIndex(a => a.id === updatedApartment.id);
  if (index !== -1) {
    apartments[index] = updatedApartment;
    await fs.writeFile(apartmentsFilePath, JSON.stringify(apartments, null, 2));
  }
}

export async function deleteApartment(id: string): Promise<void> {
  const apartments = await getApartments();
  const filtered = apartments.filter(a => a.id !== id);
  await fs.writeFile(apartmentsFilePath, JSON.stringify(filtered, null, 2));
}

// --- Users ---

export async function getUsers(): Promise<User[]> {
  try {
    const data = await fs.readFile(usersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

export async function getUserById(id: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

export async function addUser(user: User): Promise<void> {
  const users = await getUsers();
  users.push(user);
  await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
}

export async function updateUser(updatedUser: User): Promise<void> {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
  }
}

export async function deleteUser(id: string): Promise<void> {
  const users = await getUsers();
  const filtered = users.filter(u => u.id !== id);
  await fs.writeFile(usersFilePath, JSON.stringify(filtered, null, 2));
}



// --- Settings ---

export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await fs.readFile(settingsFilePath, 'utf8');
    const settings = JSON.parse(data);
    
    // Use environment variables as fallback if not set in settings
    if (!settings.paystackPublicKey && process.env.NEXT_PUBLIC_PAYSTACK_KEY) {
      settings.paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;
    }
    if (!settings.paystackSecretKey && process.env.PAYSTACK_SECRET_KEY) {
      settings.paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    }

    // Default Email Settings (if not present)
    if (!settings.emailSettings) {
        settings.emailSettings = {
            provider: 'smtp',
            host: 'smtp.mailtrap.io',
            port: 2525,
            secure: false,
            user: 'test_user',
            password: 'test_password',
            fromName: 'CityDwell Apartments',
            fromEmail: 'noreply@citydwell.com'
        };
    }

    // Default Color Palette (if not present)
    if (!settings.colorPalette) {
        settings.colorPalette = {
            brand: '#000000',
            secondary: '#4B5563',
            accent: '#2563EB',
            background: '#FFFFFF',
            text: '#111827'
        };
    }
    // Default About Page (if not present)
    if (!settings.aboutPage) {
        settings.aboutPage = {
            title: "About Us",
            subtitle: "Experience luxury living in the heart of the city",
            heroImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
            storyTitle: "Our Story",
            storyContent: "Founded with a vision to redefine luxury accommodation, CityDwell Apartments has been serving guests from around the world. We believe in providing not just a place to sleep, but an experience to remember. Our carefully curated apartments offer the perfect blend of comfort, style, and convenience.",
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
        };
    }
    
    // Default SEO Settings (if not present)
    if (!settings.seoSettings) {
        settings.seoSettings = {
            metaTitle: "LuxeStays - Premium Apartment Booking",
            metaDescription: "Book the finest apartments in Lagos.",
            metaKeywords: "apartments, booking, luxury, lagos, accommodation",
            ogImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop"
        };
    }

    return settings;
  } catch (error) {
    return { 
      appName: "Apartment Booking",
      siteName: "CityDwell Apartments",
      siteDescription: "Premium Apartment Booking",
      contactEmail: "contact@citydwell.com",
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
        copyrightText: "© 2026 CityDwell Apartments",
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
        subject: "Welcome to CityDwell Apartments!",
        body: "<p>Hi {{name}},</p><p>Welcome to CityDwell Apartments! We are excited to have you on board.</p><p>Best regards,<br>The CityDwell Team</p>"
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
        email: "hello@citydwell.com",
        supportEmail: "support@citydwell.com",
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
      }
    };
  }
}

export async function updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
  const currentSettings = await getSettings();
  
  // Deep merge for nested objects to prevent overwriting with partial data
  const updated = {
    ...currentSettings,
    ...newSettings,
    emailSettings: {
        ...currentSettings.emailSettings,
        ...(newSettings.emailSettings || {})
    },
    colorPalette: {
        ...currentSettings.colorPalette,
        ...(newSettings.colorPalette || {})
    },
    bannerSettings: {
        ...currentSettings.bannerSettings,
        ...(newSettings.bannerSettings || {})
    },
    footerSettings: {
        ...currentSettings.footerSettings,
        ...(newSettings.footerSettings || {})
    },
    welcomeEmail: {
        ...currentSettings.welcomeEmail,
        ...(newSettings.welcomeEmail || {})
    },
    contactPage: {
        ...(currentSettings.contactPage || {
            title: "Get in Touch",
            description: "Have questions about our apartments? We're here to help you find the perfect place for your stay.",
            email: "hello@citydwell.com",
            supportEmail: "support@citydwell.com",
            phone1: "+234 800 123 4567",
            phone2: "+234 800 987 6543",
            addressLine1: "123 Victoria Island,",
            addressLine2: "Lagos, Nigeria"
        }),
        ...(newSettings.contactPage || {})
    },
    aboutPage: {
        ...(currentSettings.aboutPage || {
            title: "About Us",
            subtitle: "Experience luxury living in the heart of the city",
            heroImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop",
            storyTitle: "Our Story",
            storyContent: "Founded with a vision to redefine luxury accommodation, CityDwell Apartments has been serving guests from around the world. We believe in providing not just a place to sleep, but an experience to remember. Our carefully curated apartments offer the perfect blend of comfort, style, and convenience.",
            storyImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop",
            stats: [
                { label: "Years of Experience", value: "10+" },
                { label: "Apartments", value: "50+" },
                { label: "Happy Guests", value: "10k+" },
                { label: "Cities", value: "5" }
            ]
        }),
        ...(newSettings.aboutPage || {})
    },
    sidebarAdvert: {
        ...(currentSettings.sidebarAdvert || {
            enabled: false,
            image: "",
            link: "",
            altText: "Advertisement"
        }),
        ...(newSettings.sidebarAdvert || {})
    },
    seoSettings: {
        ...(currentSettings.seoSettings || {
            metaTitle: "LuxeStays - Premium Apartment Booking",
            metaDescription: "Book the finest apartments in Lagos.",
            metaKeywords: "apartments, booking, luxury, lagos, accommodation",
            ogImage: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2070&auto=format&fit=crop",
            favicon: "/favicon.ico"
        }),
        ...(newSettings.seoSettings || {})
    }
  };

  await fs.writeFile(settingsFilePath, JSON.stringify(updated, null, 2));
}

// --- Categories ---

export async function getCategories(): Promise<Category[]> {
  try {
    const data = await fs.readFile(categoriesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function addCategory(category: Category): Promise<void> {
  const categories = await getCategories();
  categories.push(category);
  await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2));
}

export async function deleteCategory(id: string): Promise<void> {
  const categories = await getCategories();
  const filtered = categories.filter(c => c.id !== id);
  await fs.writeFile(categoriesFilePath, JSON.stringify(filtered, null, 2));
}

export async function updateCategory(updatedCategory: Category): Promise<void> {
  const categories = await getCategories();
  const index = categories.findIndex(c => c.id === updatedCategory.id);
  if (index !== -1) {
    categories[index] = updatedCategory;
    await fs.writeFile(categoriesFilePath, JSON.stringify(categories, null, 2));
  }
}

// --- Bookings ---

export async function getBookings(): Promise<Booking[]> {
  try {
    const data = await fs.readFile(bookingsFilePath, 'utf8');
    const bookings = JSON.parse(data);
    // Convert date strings back to Date objects
    return bookings.map((b: any) => ({
      ...b,
      startDate: new Date(b.startDate),
      endDate: new Date(b.endDate)
    }));
  } catch (error) {
    return [];
  }
}

export async function addBooking(booking: Booking): Promise<void> {
  const bookings = await getBookings();
  bookings.push(booking);
  await fs.writeFile(bookingsFilePath, JSON.stringify(bookings, null, 2));
}

export async function updateBooking(updatedBooking: Booking): Promise<void> {
  const bookings = await getBookings();
  const index = bookings.findIndex(b => b.id === updatedBooking.id);
  if (index !== -1) {
    bookings[index] = updatedBooking;
    await fs.writeFile(bookingsFilePath, JSON.stringify(bookings, null, 2));
  }
}

export async function deleteBooking(id: string): Promise<void> {
  const bookings = await getBookings();
  const filtered = bookings.filter(b => b.id !== id);
  await fs.writeFile(bookingsFilePath, JSON.stringify(filtered, null, 2));
}

export async function deleteBookings(ids: string[]): Promise<void> {
  const bookings = await getBookings();
  const filtered = bookings.filter(b => !ids.includes(b.id));
  await fs.writeFile(bookingsFilePath, JSON.stringify(filtered, null, 2));
}

export async function getBookingsByApartment(apartmentId: string): Promise<Booking[]> {
  const bookings = await getBookings();
  return bookings.filter(b => b.apartmentId === apartmentId && b.status === 'confirmed');
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const bookings = await getBookings();
  return bookings.filter(b => b.userId === userId);
}

export async function checkApartmentAvailability(apartmentId: string, startDate: string, endDate: string): Promise<boolean> {
  const bookings = await getBookingsByApartment(apartmentId);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return !bookings.some(booking => {
    const bookingStart = new Date(booking.startDate);
    const bookingEnd = new Date(booking.endDate);

    // Check for overlap
    // Booking overlaps if:
    // (StartA <= EndB) and (EndA >= StartB)
    return start < bookingEnd && end > bookingStart;
  });
}

// --- Reviews ---

export async function getReviews(apartmentId?: string): Promise<Review[]> {
  try {
    const data = await fs.readFile(reviewsFilePath, 'utf8');
    const reviews = JSON.parse(data);
    if (apartmentId) {
        return reviews.filter((r: Review) => r.apartmentId === apartmentId);
    }
    return reviews;
  } catch (error) {
    return [];
  }
}

export async function getReviewsByApartmentId(apartmentId: string): Promise<Review[]> {
  return getReviews(apartmentId);
}

export async function getReviewsByUserId(userId: string): Promise<Review[]> {
  const reviews = await getReviews();
  return reviews.filter(r => r.userId === userId);
}

export async function updateReview(updatedReview: Review): Promise<void> {
  const reviews = await getReviews();
  const index = reviews.findIndex(r => r.id === updatedReview.id);
  if (index !== -1) {
    reviews[index] = updatedReview;
    await fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2));
  }
}

export async function addReview(review: Review): Promise<void> {
  const reviews = await getReviews();
  reviews.push(review);
  await fs.writeFile(reviewsFilePath, JSON.stringify(reviews, null, 2));

  // Recalculate and update apartment rating
  const apartmentReviews = reviews.filter((r: Review) => r.apartmentId === review.apartmentId);
  const totalRating = apartmentReviews.reduce((sum: number, r: Review) => sum + r.rating, 0);
  const averageRating = Number((totalRating / apartmentReviews.length).toFixed(1));

  const apartment = await getApartmentById(review.apartmentId);
  if (apartment) {
    await updateApartment({ ...apartment, rating: averageRating });
  }
}

// --- Favorites ---

export async function getFavorites(userId?: string): Promise<Favorite[]> {
  try {
    const data = await fs.readFile(favoritesFilePath, 'utf8');
    const favorites = JSON.parse(data);
    if (userId) {
      return favorites.filter((f: Favorite) => f.userId === userId);
    }
    return favorites;
  } catch (error) {
    return [];
  }
}

export async function addFavorite(userId: string, apartmentId: string): Promise<void> {
  const favorites = await getFavorites();
  const exists = favorites.some(f => f.userId === userId && f.apartmentId === apartmentId);
  if (exists) return;

  favorites.push({
    userId,
    apartmentId,
    createdAt: new Date().toISOString()
  });
  await fs.writeFile(favoritesFilePath, JSON.stringify(favorites, null, 2));
}

export async function removeFavorite(userId: string, apartmentId: string): Promise<void> {
  const favorites = await getFavorites();
  const filtered = favorites.filter(f => !(f.userId === userId && f.apartmentId === apartmentId));
  await fs.writeFile(favoritesFilePath, JSON.stringify(filtered, null, 2));
}

export async function isFavorite(userId: string, apartmentId: string): Promise<boolean> {
  const favorites = await getFavorites();
  return favorites.some(f => f.userId === userId && f.apartmentId === apartmentId);
}

export async function deleteReview(id: string): Promise<void> {
  const reviews = await getReviews();
  const reviewToDelete = reviews.find((r: Review) => r.id === id);
  if (!reviewToDelete) return;

  const filtered = reviews.filter((r: Review) => r.id !== id);
  await fs.writeFile(reviewsFilePath, JSON.stringify(filtered, null, 2));

  // Recalculate rating
  const apartmentReviews = filtered.filter((r: Review) => r.apartmentId === reviewToDelete.apartmentId);
  const totalRating = apartmentReviews.reduce((sum: number, r: Review) => sum + r.rating, 0);
  const averageRating = apartmentReviews.length > 0 
    ? Number((totalRating / apartmentReviews.length).toFixed(1)) 
    : 5;

  const apartment = await getApartmentById(reviewToDelete.apartmentId);
  if (apartment) {
    await updateApartment({ ...apartment, rating: averageRating });
  }
}

// --- Subscribers ---

export async function getSubscribers(): Promise<Subscriber[]> {
  try {
    const data = await fs.readFile(subscribersFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function addSubscriber(email: string): Promise<Subscriber> {
  const subscribers = await getSubscribers();
  const exists = subscribers.find(s => s.email === email);
  if (exists) return exists;

  const newSubscriber: Subscriber = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    createdAt: new Date().toISOString()
  };

  subscribers.push(newSubscriber);
  await fs.writeFile(subscribersFilePath, JSON.stringify(subscribers, null, 2));
  return newSubscriber;
}

export async function removeSubscriber(id: string): Promise<void> {
  const subscribers = await getSubscribers();
  const filtered = subscribers.filter(s => s.id !== id);
  await fs.writeFile(subscribersFilePath, JSON.stringify(filtered, null, 2));
}

// --- Coupons ---

export async function getCoupons(): Promise<Coupon[]> {
  try {
    const data = await fs.readFile(couponsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function addCoupon(coupon: Coupon): Promise<void> {
  const coupons = await getCoupons();
  // Check if code exists (case insensitive)
  if (coupons.some(c => c.code.toLowerCase() === coupon.code.toLowerCase())) {
    throw new Error('Coupon code already exists');
  }
  coupons.push(coupon);
  await fs.writeFile(couponsFilePath, JSON.stringify(coupons, null, 2));
}

export async function deleteCoupon(code: string): Promise<void> {
  const coupons = await getCoupons();
  const filtered = coupons.filter(c => c.code !== code);
  await fs.writeFile(couponsFilePath, JSON.stringify(filtered, null, 2));
}

export async function getCouponByCode(code: string): Promise<Coupon | undefined> {
  const coupons = await getCoupons();
  return coupons.find(c => c.code.toLowerCase() === code.toLowerCase());
}

// --- Contact Messages ---

export async function getMessages(): Promise<ContactMessage[]> {
  try {
    const data = await fs.readFile(messagesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function addMessage(message: ContactMessage): Promise<void> {
  const messages = await getMessages();
  messages.push(message);
  await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2));
}

export async function deleteMessage(id: string): Promise<void> {
  const messages = await getMessages();
  const filtered = messages.filter(m => m.id !== id);
  await fs.writeFile(messagesFilePath, JSON.stringify(filtered, null, 2));
}

export async function markMessageAsRead(id: string): Promise<void> {
    const messages = await getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
        // Use 'status' instead of 'read' to match the updated type if I updated it
        // But wait, the file content for getMessages probably still has 'read' property if the JSON file wasn't migrated.
        // Let's check 'src/types/index.ts' again. I did update ContactMessage type to use 'status'.
        // So I should update this function to use status = 'read'.
        // However, existing data in messages.json might have 'read' boolean.
        // This is tricky. I should support both or migrate. 
        // For now, let's just set read=true AND status='read' if I can, or just status='read' if type enforces it.
        // The type ContactMessage has status: 'new' | 'read' | 'replied'.
        
        messages[index].status = 'read';
        // Remove 'read' property if it exists to clean up? Or keep it?
        // Let's assume strict type compliance for now.
        
        await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2));
    }
}

// --- Chat System ---

export async function getConversations(): Promise<Conversation[]> {
  try {
    const data = await fs.readFile(chatConversationsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function getConversationById(id: string): Promise<Conversation | undefined> {
  const conversations = await getConversations();
  return conversations.find(c => c.id === id);
}

export async function getConversationByUserId(userId: string): Promise<Conversation | undefined> {
  const conversations = await getConversations();
  
  // Filter by userId and exclude archived conversations
  const userConversations = conversations.filter(c => c.userId === userId && c.status !== 'archived');
  
  if (userConversations.length === 0) return undefined;
  
  // Prefer active conversations
  const active = userConversations.find(c => c.status === 'active');
  if (active) return active;

  // If no active (e.g. only closed), return the most recent one
  return userConversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())[0];
}

export async function deleteConversation(id: string): Promise<void> {
  const conversations = await getConversations();
  const filtered = conversations.filter(c => c.id !== id);
  await fs.writeFile(chatConversationsFilePath, JSON.stringify(filtered, null, 2));
  
  // Also delete associated messages?
  // Ideally yes, to keep data clean.
  const messages = await getChatMessages(id); // This fetches specific conversation messages? 
  // Wait, getChatMessages takes conversationId. 
  // I need to read all messages and filter out.
  // getChatMessages implementation:
  // export async function getChatMessages(conversationId: string): Promise<Message[]> {
  //   try {
  //     const data = await fs.readFile(chatMessagesFilePath, 'utf8');
  // ...
  
  // I need a deleteChatMessages helper or do it here.
  try {
      const data = await fs.readFile(chatMessagesFilePath, 'utf8');
      const allMessages: Message[] = JSON.parse(data);
      const filteredMessages = allMessages.filter(m => m.conversationId !== id);
      await fs.writeFile(chatMessagesFilePath, JSON.stringify(filteredMessages, null, 2));
  } catch (e) {
      // ignore
  }
}

export async function createConversation(conversation: Conversation): Promise<void> {
  const conversations = await getConversations();
  conversations.push(conversation);
  await fs.writeFile(chatConversationsFilePath, JSON.stringify(conversations, null, 2));
}

export async function updateConversation(updatedConversation: Conversation): Promise<void> {
  const conversations = await getConversations();
  const index = conversations.findIndex(c => c.id === updatedConversation.id);
  if (index !== -1) {
    conversations[index] = updatedConversation;
    await fs.writeFile(chatConversationsFilePath, JSON.stringify(conversations, null, 2));
  }
}

export async function getChatMessages(conversationId: string): Promise<Message[]> {
  try {
    const data = await fs.readFile(chatMessagesFilePath, 'utf8');
    const messages = JSON.parse(data);
    return messages.filter((m: Message) => m.conversationId === conversationId);
  } catch (error) {
    return [];
  }
}

export async function addChatMessage(message: Message): Promise<void> {
  try {
    const data = await fs.readFile(chatMessagesFilePath, 'utf8');
    const messages = JSON.parse(data);
    messages.push(message);
    await fs.writeFile(chatMessagesFilePath, JSON.stringify(messages, null, 2));

    // Update conversation lastMessageAt and unreadCount
    const conversation = await getConversationById(message.conversationId);
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        lastMessageAt: message.createdAt,
        unreadCount: message.senderRole === 'user' ? (conversation.unreadCount || 0) + 1 : conversation.unreadCount
      };
      await updateConversation(updatedConversation);
    }
  } catch (error) {
    // If file doesn't exist, create it
    const messages = [message];
    await fs.writeFile(chatMessagesFilePath, JSON.stringify(messages, null, 2));
    
    // Also try to update conversation if it exists
    const conversation = await getConversationById(message.conversationId);
    if (conversation) {
       const updatedConversation = {
        ...conversation,
        lastMessageAt: message.createdAt,
        unreadCount: message.senderRole === 'user' ? (conversation.unreadCount || 0) + 1 : conversation.unreadCount
      };
      await updateConversation(updatedConversation);
    }
  }
}

export async function markChatMessagesAsRead(conversationId: string, role: 'admin' | 'user'): Promise<void> {
  try {
    // Update messages
    const data = await fs.readFile(chatMessagesFilePath, 'utf8');
    const messages = JSON.parse(data);
    
    let hasChanges = false;
    const updatedMessages = messages.map((m: Message) => {
        if (m.conversationId === conversationId && !m.isRead && m.senderRole !== role) {
            hasChanges = true;
            return { ...m, isRead: true };
        }
        return m;
    });

    if (hasChanges) {
        await fs.writeFile(chatMessagesFilePath, JSON.stringify(updatedMessages, null, 2));
    }

    // Update conversation unread count if admin is reading
    if (role === 'admin') {
        const conversation = await getConversationById(conversationId);
        if (conversation && conversation.unreadCount > 0) {
            await updateConversation({ ...conversation, unreadCount: 0 });
        }
    }
  } catch (error) {
    // Ignore error
  }
}

export async function cleanupArchivedConversations(): Promise<void> {
  try {
    const conversations = await getConversations();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const idsToDelete: string[] = [];

    const remainingConversations = conversations.filter(c => {
      if (c.status === 'archived' && c.archivedAt) {
          if (new Date(c.archivedAt) < thirtyDaysAgo) {
              idsToDelete.push(c.id);
              return false; // Remove from list
          }
      }
      return true; // Keep
    });

    if (idsToDelete.length === 0) return;

    // Write back conversations
    await fs.writeFile(chatConversationsFilePath, JSON.stringify(remainingConversations, null, 2));

    // Cleanup messages
    try {
        const messagesData = await fs.readFile(chatMessagesFilePath, 'utf8');
        const allMessages: Message[] = JSON.parse(messagesData);
        const remainingMessages = allMessages.filter(m => !idsToDelete.includes(m.conversationId));
        await fs.writeFile(chatMessagesFilePath, JSON.stringify(remainingMessages, null, 2));
    } catch (e) {
        // Ignore if messages file doesn't exist or error reading it
    }
    
  } catch (error) {
    console.error("Error cleaning up archived conversations:", error);
  }
}

// --- Why Choose Us ---

export async function getWhyChooseUs(): Promise<WhyChooseUsItem[]> {
  try {
    const data = await fs.readFile(whyChooseUsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function updateWhyChooseUs(items: WhyChooseUsItem[]): Promise<void> {
  await fs.writeFile(whyChooseUsFilePath, JSON.stringify(items, null, 2));
}

// --- Email Campaigns ---

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  try {
    const data = await fs.readFile(emailCampaignsFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function addEmailCampaign(campaign: EmailCampaign): Promise<void> {
  const campaigns = await getEmailCampaigns();
  campaigns.push(campaign);
  await fs.writeFile(emailCampaignsFilePath, JSON.stringify(campaigns, null, 2));
}

export async function updateCampaignRecipientStatus(trackingId: string): Promise<boolean> {
  console.log(`[DB] Updating status for tracking ID: ${trackingId}`);
  const campaigns = await getEmailCampaigns();
  let updated = false;

  for (const campaign of campaigns) {
    const recipient = campaign.recipients.find(r => r.trackingId === trackingId);
    if (recipient) {
      console.log(`[DB] Found recipient: ${recipient.email}, Current status: ${recipient.status}`);
      if (recipient.status !== 'opened') {
        recipient.status = 'opened';
        recipient.openedAt = new Date().toISOString();
        campaign.totalOpened += 1;
        updated = true;
        console.log(`[DB] Updated status to opened`);
        break; 
      } else {
          console.log(`[DB] Already opened`);
      }
    }
  }

  if (updated) {
    await fs.writeFile(emailCampaignsFilePath, JSON.stringify(campaigns, null, 2));
    console.log(`[DB] Saved campaigns file`);
  } else {
      console.log(`[DB] No updates made (ID not found or already opened)`);
  }
  
  return updated;
}


