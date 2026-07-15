export const ENDPOINTS = {
  AUTH: {
    OTP_REQUEST: '/auth/customer/otp/request',
    OTP_VERIFY: '/auth/customer/otp/verify',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    SWITCH_TO_VENDOR: '/auth/switch-to-vendor',
    SWITCH_TO_CUSTOMER: '/auth/switch-to-customer',
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
    VENDOR_REQUEST: {
      BASE: '/customer/vendor-request',
      SUBMIT: '/customer/vendor-request/submit',
    },
  },
  VENDOR: {
    DASHBOARD: '/vendor/dashboard',
    PROFILE: '/vendor/profile',
    CATEGORIES: '/vendor/categories',
    PRODUCTS: {
      BASE: '/vendor/products',
      BY_ID: (id: string) => `/vendor/products/${id}`,
      SUBMIT_APPROVAL: (id: string) => `/vendor/products/${id}/submit-approval`,
      PUBLISH: (id: string) => `/vendor/products/${id}/publish`,
      UNPUBLISH: (id: string) => `/vendor/products/${id}/unpublish`,
    },
    INVENTORY: {
      BASE: '/vendor/inventory',
      BY_PRODUCT: (productId: string) => `/vendor/inventory/${productId}`,
    },
    ORDERS: {
      BASE: '/vendor/orders',
      UPDATE_STATUS: (id: string) => `/vendor/orders/${id}`,
    },
    CUSTOMERS: '/vendor/customers',
    FINANCE: '/vendor/finance',
    NOTIFICATIONS: {
      BASE: '/vendor/notifications',
      READ: (id: string) => `/vendor/notifications/${id}/read`,
      READ_ALL: '/vendor/notifications/read-all',
    },
    OFFERS: '/vendor/offers',
  },
} as const;

