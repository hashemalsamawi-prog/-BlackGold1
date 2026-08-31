export type Language = 'ar' | 'en';
export type ThemeMode = 'dark' | 'light';
export type ProductSortOption = 'popular' | 'price-asc' | 'price-desc' | 'rating' | 'stock';

export interface ProductWeightOption {
  weightGrams?: number;
  weight?: string;
  price: number;
  bonusGrams?: number;
  inStock?: boolean;
  isPopular?: boolean;
}

export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  category: 'premium' | 'local' | 'accessories' | 'b2b' | string;
  price: number;
  originalPrice?: number;
  weightGrams?: number;
  bonusGrams?: number;
  weightOptions?: ProductWeightOption[];
  inStock?: boolean;
  stock?: number;
  stockCount?: number;
  minOrder?: number;
  maxOrder?: number;
  image?: string;
  images?: string[];
  isPopular?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  origin?: string;
  moisture?: string;
  specs?: any;
  burnTimeMinutes?: number;
  burnDurationHours?: number;
  sparkLevel?: string;
  smokeLevel?: string;
  ashContent?: string;
  ashPercentage?: string;
  carbonLevel?: string;
  heatOutput?: string;
  discountPercent?: number;
  featuresAr?: string[];
  featuresEn?: string[];
  reviewsCount?: number;
  reviewCount?: number;
  rating?: number;
}

export interface CartItem {
  id?: string;
  productId?: string;
  product: Product;
  quantity: number;
  selectedWeight?: number;
  unitPrice?: number;
}

export interface OrderItem {
  id?: string;
  productId: string;
  productNameAr: string;
  productNameEn?: string;
  quantity: number;
  unitPrice: number;
  weightGrams?: number;
  bonusGrams?: number;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[] | OrderItem[] | any;
  itemsSummary?: string;
  totalAmount?: number;
  total?: number;
  subtotal?: number;
  shippingFee: number;
  discount?: number;
  discountAmount?: number;
  district?: string;
  addressDetails?: string;
  address?: any;
  latitude?: number;
  longitude?: number;
  status: 'pending' | 'preparing' | 'on_way' | 'delivered' | 'cancelled' | string;
  paymentMethod: 'cash_on_delivery' | 'kuraimi' | 'one_cash' | 'floosak' | 'jawali' | string;
  paymentStatus?: 'pending' | 'paid' | 'refunded' | string;
  notes?: string;
  driverNotes?: string;
  assignedDriver?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  createdAt?: string;
  date?: string;
  updatedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  isWholesale?: boolean;
  isStockRolledBack?: boolean;
  timeline?: Array<{ status: string; timestamp?: string; time?: string; titleAr?: string; titleEn?: string; note?: string }>;
}

export interface DeliveryAddress {
  id: string;
  title: string;
  district: string;
  street: string;
  building?: string;
  landmark?: string;
  city?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  coords?: { lat: number; lng: number };
  coordinates?: { lat: number; lng: number };
  isDefault?: boolean;
  notes?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName?: string;
  userName?: string;
  rating: number;
  comment: string;
  createdAt?: string;
  date?: string;
  verifiedPurchase?: boolean;
}

export interface Coupon {
  code: string;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountPercent?: number;
  minOrderAmount: number;
  maxDiscount?: number;
  expiresAt?: string;
  validUntil?: string;
  isActive: boolean;
  usageCount?: number;
}

export interface DeliveryAgent {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'motorcycle' | 'car' | 'van' | string;
  assignedDistricts: string[];
  isActive: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  completedOrdersCount?: number;
  rating?: number;
}

export interface MarketingCampaign {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  discountPercentage: number;
  bannerImage: string;
  targetCategory?: string;
  isActive: boolean;
  validUntil: string;
  code?: string;
}

export interface DistrictDeliveryConfig {
  id?: string;
  nameAr?: string;
  fee?: number;
  district: string | any;
  deliveryFee: number;
  estimatedMinutes: number;
  isAvailable: boolean;
}

export interface StoreSettings {
  storeNameAr: string;
  storeNameEn: string;
  supportPhone: string;
  whatsappPhone?: string;
  whatsappNumber: string;
  supportEmail: string;
  minOrderAmount: number;
  freeShippingThreshold: number;
  freeDeliveryThreshold?: number;
  defaultShippingFee: number;
  workingHoursAr: string;
  workingHoursEn: string;
  announcementAr: string;
  announcementEn: string;
  isOrderingEnabled: boolean;
  currencySymbol: string;
  districts: DistrictDeliveryConfig[];
  deliveryDistricts?: any[];
  loyaltyPointsPer1000YER: number;
  customLogoUrl?: string;
}

export interface GalleryItem {
  id: string;
  titleAr: string;
  titleEn: string;
  category: 'fleet' | 'sessions' | 'retail' | 'branding' | 'merch' | string;
  image: string;
  descriptionAr?: string;
  descriptionEn?: string;
}
