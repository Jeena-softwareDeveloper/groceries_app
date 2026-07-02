import { api, unwrap } from './client';
import type {
  Address,
  CartResponse,
  Category,
  HomeFeed,
  Order,
  Product,
  SearchResults,
  Shop,
} from '@/types/customer';

export async function fetchHomeFeed(districtId: string, areaId?: string) {
  return unwrap<HomeFeed>(
    api.get('/customer/home/feed', { params: { districtId, areaId } }),
  );
}

export async function fetchCategories() {
  return unwrap<Category[]>(api.get('/customer/categories'));
}

export async function fetchShops(districtId: string, areaId?: string, categoryId?: string) {
  return unwrap<Shop[]>(
    api.get('/customer/shops', { params: { districtId, areaId, categoryId } }),
  );
}

export async function fetchShop(id: string) {
  return unwrap<Shop & { area?: { district?: { name: string } } }>(
    api.get(`/customer/shops/${id}`),
  );
}

export async function fetchShopProducts(shopId: string, categoryId?: string) {
  return unwrap<Product[]>(
    api.get(`/customer/shops/${shopId}/products`, { params: { categoryId } }),
  );
}

export async function fetchProduct(id: string) {
  return unwrap<Product>(api.get(`/customer/products/${id}`));
}

export async function searchProducts(q: string, districtId?: string, scope?: string) {
  return unwrap<SearchResults>(
    api.get('/customer/search', { params: { q, districtId, scope } }),
  );
}

export async function fetchCart() {
  return unwrap<CartResponse>(api.get('/customer/cart'));
}

export async function addToCart(productId: string, quantity = 1) {
  return unwrap(api.post('/customer/cart', { productId, quantity }));
}

export async function updateCartItem(productId: string, quantity: number) {
  return unwrap(api.put(`/customer/cart/${productId}`, { quantity }));
}

export async function removeFromCart(productId: string) {
  return unwrap(api.delete(`/customer/cart/${productId}`));
}

export async function checkout(addressId: string, paymentMethod: 'COD' | 'RAZORPAY' = 'COD', couponCode?: string) {
  return unwrap(api.post('/customer/checkout', { addressId, paymentMethod, couponCode }));
}

export async function fetchOrders(page = 1) {
  return unwrap<Order[]>(api.get('/customer/orders', { params: { page } }));
}

export async function fetchOrder(id: string) {
  return unwrap<Order>(api.get(`/customer/orders/${id}`));
}

export async function fetchProfile() {
  return unwrap(api.get('/customer/profile'));
}

export async function fetchAddresses() {
  return unwrap<Address[]>(api.get('/customer/addresses'));
}

export async function createAddress(data: Omit<Address, 'id'>) {
  return unwrap<Address>(api.post('/customer/addresses', data));
}

export async function fetchWishlist() {
  return unwrap<Array<{ id: string; product: Product }>>(api.get('/customer/wishlist'));
}

export async function addToWishlist(productId: string) {
  return unwrap(api.post('/customer/wishlist', { productId }));
}

export async function removeFromWishlist(productId: string) {
  return unwrap(api.delete(`/customer/wishlist/${productId}`));
}

export async function fetchNotifications() {
  return unwrap<Array<{ id: string; title: string; body: string; isRead: boolean; createdAt: string }>>(
    api.get('/customer/notifications'),
  );
}

export async function markNotificationRead(id: string) {
  return unwrap(api.patch(`/customer/notifications/${id}/read`));
}

export async function fetchWallet() {
  return unwrap<{ balance: number; transactions: Array<{ id: string; amount: number; type: string; createdAt: string }> }>(
    api.get('/customer/wallet'),
  );
}

export async function createSupportTicket(subject: string, message: string, orderId?: string) {
  return unwrap(api.post('/customer/support/tickets', { subject, message, orderId }));
}

export async function submitReview(orderId: string, rating: number, comment?: string, productId?: string) {
  return unwrap(api.post('/customer/reviews', { orderId, rating, comment, productId }));
}
