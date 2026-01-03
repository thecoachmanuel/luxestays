export interface Apartment {
  id: string
  title: string
  description: string
  price: number
  location: string
  image: string
  images: string[]
  bedrooms: number
  bathrooms: number
  amenities: string[]
  rating: number
  category: string
  currentStatus?: 'available' | 'booked'
  nextAvailableDate?: string
  videoUrl?: string
}

export interface Booking {
  id: string
  apartmentId: string
  userId: string
  startDate: Date
  endDate: Date
  totalPrice: number
  status: 'pending' | 'confirmed' | 'cancelled'
  paymentReference?: string
  guestName: string
  guestEmail: string
  guestPhone: string
  couponCode?: string
  discountAmount?: number
  createdAt?: string
}

export interface User {
  id: string;
  name?: string;
  email: string;
  phone?: string;
  password?: string;
  image?: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  template?: 'default' | 'about';
  data?: {
    subtitle?: string;
    heroImage?: string;
    storyTitle?: string;
    storyContent?: string;
    storyImage?: string;
    missionTitle?: string;
    missionContent?: string;
    visionTitle?: string;
    visionContent?: string;
    objectivesTitle?: string;
    objectivesContent?: string;
    stats?: Array<{ label: string; value: string }>;
  };
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Review {
  id: string;
  apartmentId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Favorite {
  userId: string;
  apartmentId: string;
  createdAt: string;
}

export interface BannerSettings {
  isEnabled: boolean;
  text: string;
  link?: string;
  backgroundColor: string;
  textColor: string;
}

export interface FooterLink {
  label: string;
  url: string;
}

export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

export interface FooterSettings {
  copyrightText: string;
  description?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  columns: FooterColumn[];
}

export interface ColorPalette {
  brand: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface EmailSettings {
  provider: string;
  apiKey?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

export interface WelcomeEmailSettings {
  subject: string;
  body: string;
  enabled: boolean;
}

export interface ContactPageSettings {
  title: string;
  description: string;
  email: string; // Additional email besides main contactEmail
  supportEmail: string;
  phone1: string;
  phone2: string;
  addressLine1: string;
  addressLine2: string;
}

export interface AboutPageSettings {
  title: string;
  subtitle: string;
  heroImage: string;
  storyTitle: string;
  storyContent: string;
  storyImage: string;
  missionTitle: string;
  missionContent: string;
  visionTitle: string;
  visionContent: string;
  objectivesTitle: string;
  objectivesContent: string;
  stats: {
    label: string;
    value: string;
  }[];
}

export interface SeoSettings {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  favicon?: string;
  twitterHandle?: string;
}

export interface AppSettings {
  siteName: string; // Used in UI
  appName?: string; // Used in db.ts fallback
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  currency: string;
  logo: string;
  appLogo?: string; // Alias for logo
  banner: BannerSettings;
  footer: FooterSettings;
  customPages?: CustomPage[];
  aboutPage?: AboutPageSettings;
  contactPage?: ContactPageSettings;
  // Added to match db.ts usage
  paystackPublicKey?: string;
  paystackSecretKey?: string;
  emailSettings?: EmailSettings;
  colorPalette?: ColorPalette;
  welcomeEmail?: WelcomeEmailSettings;
  bannerSettings?: BannerSettings; // Alias for banner? db.ts uses bannerSettings
  footerSettings?: FooterSettings; // Alias for footer? db.ts uses footerSettings
  sidebarAdvert?: AdvertSettings;
  cleaningFee?: number;
  seoSettings?: SeoSettings;
}

export interface AdvertSettings {
  enabled: boolean;
  image: string;
  link?: string;
  altText?: string;
}

export interface Subscriber {
  id?: string;
  email: string;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  expirationDate: string;
  usedCount?: number;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
  status?: 'new' | 'read' | 'replied';
}

export interface WhyChooseUsItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  bgColor?: string;
  color?: string;
}

export interface Message {
  id: string;
  senderId?: string;
  content: string;
  senderRole: 'user' | 'admin';
  createdAt: string;
  conversationId: string;
  isRead: boolean;
  image?: string;
}

export interface Conversation {
  id: string;
  userId: string; // The user's email or ID
  userEmail?: string; // Optional if userId is email
  userName?: string;
  lastMessageAt: string;
  status: 'active' | 'closed' | 'archived';
  unreadCount: number; // Unread by admin
  archivedAt?: string; // When the chat was archived
  userClearedAt?: string; // When the user cleared the chat
}

export interface EmailRecipientStatus {
  email: string;
  trackingId: string;
  status: 'sent' | 'opened';
  sentAt: string;
  openedAt?: string;
}

export interface EmailCampaign {
  id: string;
  subject: string;
  message: string;
  sentAt: string;
  recipients: EmailRecipientStatus[];
  totalSent: number;
  totalOpened: number;
}

