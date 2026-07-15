export const ENDPOINTS = {
  AUTH: {
    OTP_REQUEST: '/auth/customer/otp/request',
    OTP_VERIFY: '/auth/customer/otp/verify',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
  },
  CUSTOMER: {
    HOME_FEED: '/customer/home/feed',
    CATEGORIES: '/customer/categories',
    SHOPS: {
      BASE: '/customer/shops',
      BY_ID: (id: string) => `/customer/shops/${id}`,
      PRODUCTS: (id: string) => `/customer/shops/${id}/products`,
    },
    PRODUCTS: {
      BY_ID: (id: string) => `/customer/products/${id}`,
    },
    SEARCH: '/customer/search',
    CART: {
      BASE: '/customer/cart',
      BY_ID: (id: string) => `/customer/cart/${id}`,
    },
    CHECKOUT: '/customer/checkout',
    ORDERS: {
      BASE: '/customer/orders',
      BY_ID: (id: string) => `/customer/orders/${id}`,
      CANCEL: (id: string) => `/customer/orders/${id}/cancel`,
    },
    PROFILE: '/customer/profile',
    ADDRESSES: '/customer/addresses',
    WISHLIST: {
      BASE: '/customer/wishlist',
      BY_ID: (id: string) => `/customer/wishlist/${id}`,
    },
    NOTIFICATIONS: {
      BASE: '/customer/notifications',
      READ: (id: string) => `/customer/notifications/${id}/read`,
    },
    WALLET: '/customer/wallet',
    SUPPORT: '/customer/support/tickets',
    REVIEWS: '/customer/reviews',
    DISTRICTS: '/customer/districts',
    AREAS: '/customer/areas',
  },
} as const;
