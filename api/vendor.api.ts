import { api, unwrap } from './client';
import { ENDPOINTS } from './endpoints';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorProduct {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  mrp: number | string;
  sellingPrice: number | string;
  unit: string;
  weight?: string | null;
  tags?: string | null;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'UNPUBLISHED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  subCategoryId?: string | null;
  category?: { id: string; name: string };
  images?: { id: string; url: string; isPrimary: boolean }[];
  inventory?: { stock: number; reorderLevel: number } | null;
  approvals?: { id: string; status: string; rejectionReason?: string | null; adminNotes?: string | null }[];
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number | string;
  discount: number | string;
  deliveryCharge: number | string;
  grandTotal: number | string;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  deliveredAt?: string | null;
  customer?: { id: string; name?: string | null; phone: string };
  address?: { line1: string; city: string; pincode: string };
  items?: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number | string;
    total: number | string;
    product?: { name: string; images?: { url: string }[] };
  }[];
}

export interface VendorDashboard {
  sales: {
    today: number; todayOrders: number;
    weekly: number; weeklyOrders: number;
    monthly: number; monthlyOrders: number;
    totalRevenue: number;
  };
  orders: {
    pending: number; accepted: number; packed: number;
    outForDelivery: number; delivered: number; cancelled: number; returned: number;
  };
  products: {
    active: number; draft: number; pendingApproval: number;
    rejected: number; lowStock: number; outOfStock: number;
  };
  customers: { total: number };
  rating: { average: number; count: number };
  notifications: { unread: number };
  recentOrders: VendorOrder[];
  bestSellers: { productId: string; product?: VendorProduct; totalSold: number; totalRevenue: number }[];
  lowStockItems: { productId: string; stock: number; product?: { name: string } }[];
  outOfStockItems: { productId: string; stock: number; product?: { name: string } }[];
}

export interface VendorCustomer {
  customer?: { id: string; name?: string | null; phone: string; email?: string | null; createdAt: string };
  orderCount: number;
  lifetimeValue: number;
}

export interface VendorFinance {
  summary: {
    totalRevenue: number;
    monthlyRevenue: number;
    commission: number;
    netRevenue: number;
    pendingPayout: number;
  };
  transactions: {
    reference: string;
    amount: number;
    commission: number;
    net: number;
    date: string;
  }[];
}

export interface VendorNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface VendorOffer {
  id: string;
  title: string;
  description?: string | null;
  discountPct?: number | string | null;
  discountAmt?: number | string | null;
  minOrder?: number | string | null;
  isActive: boolean;
  approvalStatus: string;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const vendorApi = {
  // Dashboard
  getDashboard: () =>
    unwrap<VendorDashboard>(api.get(ENDPOINTS.VENDOR.DASHBOARD)),

  // Profile
  getProfile: () =>
    unwrap<any>(api.get(ENDPOINTS.VENDOR.PROFILE)),
  updateProfile: (data: Record<string, any>) =>
    unwrap<any>(api.put(ENDPOINTS.VENDOR.PROFILE, data)),

  // Categories
  getCategories: () =>
    unwrap<{ id: string; name: string; children?: { id: string; name: string }[] }[]>(api.get(ENDPOINTS.VENDOR.CATEGORIES)),

  // Products
  listProducts: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    api.get(ENDPOINTS.VENDOR.PRODUCTS.BASE, { params }).then((r) => r.data),
  createProduct: (data: Partial<VendorProduct> & { stock?: number }) =>
    unwrap<VendorProduct>(api.post(ENDPOINTS.VENDOR.PRODUCTS.BASE, data)),
  updateProduct: (id: string, data: Partial<VendorProduct> & { stock?: number }) =>
    unwrap<VendorProduct>(api.put(ENDPOINTS.VENDOR.PRODUCTS.BY_ID(id), data)),
  deleteProduct: (id: string) =>
    unwrap<{ deleted: boolean }>(api.delete(ENDPOINTS.VENDOR.PRODUCTS.BY_ID(id))),
  submitForApproval: (id: string) =>
    unwrap<any>(api.post(ENDPOINTS.VENDOR.PRODUCTS.SUBMIT_APPROVAL(id), {})),

  // Inventory
  listInventory: (params?: { page?: number; limit?: number }) =>
    api.get(ENDPOINTS.VENDOR.INVENTORY.BASE, { params }).then((r) => r.data),
  updateStock: (productId: string, stock: number) =>
    unwrap<any>(api.put(ENDPOINTS.VENDOR.INVENTORY.BY_PRODUCT(productId), { stock })),

  // Orders
  listOrders: (params?: { status?: string; page?: number; limit?: number; search?: string }) =>
    api.get(ENDPOINTS.VENDOR.ORDERS.BASE, { params }).then((r) => r.data),
  updateOrderStatus: (id: string, status: string) =>
    unwrap<VendorOrder>(api.patch(ENDPOINTS.VENDOR.ORDERS.UPDATE_STATUS(id), { status })),

  // Customers
  listCustomers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get(ENDPOINTS.VENDOR.CUSTOMERS, { params }).then((r) => r.data),

  // Finance
  getFinance: () =>
    unwrap<VendorFinance>(api.get(ENDPOINTS.VENDOR.FINANCE)),

  // Notifications
  listNotifications: (params?: { page?: number }) =>
    api.get(ENDPOINTS.VENDOR.NOTIFICATIONS.BASE, { params }).then((r) => r.data),
  markRead: (id: string) =>
    unwrap<any>(api.patch(ENDPOINTS.VENDOR.NOTIFICATIONS.READ(id), {})),
  markAllRead: () =>
    unwrap<any>(api.post(ENDPOINTS.VENDOR.NOTIFICATIONS.READ_ALL, {})),

  // Offers
  listOffers: () =>
    unwrap<VendorOffer[]>(api.get(ENDPOINTS.VENDOR.OFFERS)),
  createOffer: (data: Partial<VendorOffer>) =>
    unwrap<VendorOffer>(api.post(ENDPOINTS.VENDOR.OFFERS, data)),
  deleteOffer: (id: string) =>
    unwrap<{ deleted: boolean }>(api.delete(`${ENDPOINTS.VENDOR.OFFERS}/${id}`)),
};
