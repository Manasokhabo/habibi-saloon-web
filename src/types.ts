export interface Service {
  id: string;
  name: string;
  price: number;
  duration: string;
  description: string;
  category: 'Hair' | 'Beard' | 'Spa' | 'Package';
  image: string;
}

export interface Booking {
  id: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  price: number;
  status: 'pending' | 'approved' | 'canceled';
  name?: string;
  phone?: string;
  userId?: string;
  firebaseId?: string;
}

export interface NotificationPreferences {
  email: boolean;
  whatsapp: boolean;
  marketing: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  credits: number;
  loyaltyLevel: 'Novice' | 'Vanguard' | 'Elite' | 'Legend';
  avatar: string;
  bookings: Booking[];
  role?: 'admin' | 'user';
  notificationPreferences?: NotificationPreferences;
}

export interface Package extends Service {
  includedServices: string[];
}

export interface HeroImage {
  id: string;
  url: string;
  active: boolean;
}

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  avatar: string;
  reviewImage?: string; // New field for photos of the service result
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  timestamp: string;
}

export interface GalleryItem {
  id: string;
  imageUrl?: string; // For single showcase images
  beforeUrl?: string; // For comparison sliders
  afterUrl?: string; // For comparison sliders
  title: string;
  category: 'Haircut' | 'Beard' | 'Facial' | 'Other';
  createdAt: string;
  type: 'showcase' | 'transformation';
}