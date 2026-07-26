export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  role: string;
}

export interface CustomerProfile {
  id: string;
  role?: 'CUSTOMER' | 'VENDOR';
  vendorId?: string;
  shopName?: string;
  phone: string;
  name?: string | null;
  email?: string | null;
  addresses?: Address[];
}


export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string | null;
  imageUrl?: string | null;
  children?: Category[];
}

export interface Shop {
  id: string;
  shopName: string;
  slug: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  rating?: number | null;
  minOrderValue?: number | null;
  isOpen?: boolean;
  address?: string | null;
  area?: { id: string; name: string };
}

export interface ProductImage {
  id: string;
  url: string;
  isPrimary?: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;
  sellingPrice: number | string;
  mrp?: number | string | null;
  unit?: string | null;
  weight?: string | null;
  tags?: string | string[] | null;
  images?: ProductImage[];
  inventory?: { stock: number } | null;
  category?: Category | null;
  vendor?: { id: string; shopName: string; slug?: string };
  reviews?: { rating: number; comment?: string | null }[];
}

export interface HomeFeed {
  banners: { id: string; imageUrl: string; title?: string | null; themeColor?: string | null; themeColorEnd?: string | null }[];
  microBanners: { id: string; imageUrl: string; title?: string | null }[];
  categories: Category[];
  nearbyShops: Shop[];
  trendingProducts: Product[];
  offers: { id: string; title: string; description?: string | null }[];
  bestSellers: Product[];
  recentlyAdded: Product[];
  flashSale: { id: string; title: string }[];
  deliveryRule?: any;
  layout?: {
    heroBanner?: { trustBadge?: string; title?: string; subtitle?: string; buttonText?: string; imageUrl?: string };
    freeDelivery?: { title?: string; subtitle?: string };
    bulkOrders?: { title?: string; subtitle?: string; buttonText?: string };
    features?: Array<{ icon: any; text: string }>;
    whyShopWithUs?: Array<{ icon: any; title: string; subtitle: string }>;
    referEarn?: { title?: string; subtitle?: string; buttonText?: string };
    popularSearches?: string[];
    footer?: {
      title?: string;
      subtitle?: string;
      stats?: Array<{ icon: any; number: string; label: string }>;
      download?: { title?: string; subtitle?: string };
    };
  } | null;
}

export interface CartItem {
  id: string;
  productId: string;
  vendorId: string;
  quantity: number;
  product: Product;
  vendor?: { id: string; shopName: string; minOrderValue?: number | null };
}

export interface CartResponse {
  items: CartItem[];
  byVendor: {
    vendorId: string;
    vendor: { id: string; shopName: string; minOrderValue?: number | null };
    items: CartItem[];
  }[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number | string;
  createdAt: string;
  vendor?: { shopName: string };
  items?: { name: string; quantity: number; total: number | string }[];
}

export interface SearchResults {
  products: Product[];
  shops: Shop[];
  categories: Category[];
}
