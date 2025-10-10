
// Export auth interfaces from auth.ts
export * from './auth';


export interface Car {
  id: string;
  name: string;
  type: 'scooter' | 'car';
  batteryLevel: number;
  pricePerHour: number;
  image: string;
  location: string;
  available: boolean;
}

export interface Booking {
  id: string;
  carId: string;
  car: Car;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  pickupLocation: string;
}

export interface DocumentImages {
  frontImage?: string;
  backImage?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  licenseVerified: boolean;
  idVerified: boolean;
  memberSince: string;
  licenseImages?: DocumentImages;
  idImages?: DocumentImages;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
}