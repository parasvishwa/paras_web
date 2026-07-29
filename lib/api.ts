import axios from 'axios';

const BASE_PROXY = typeof window !== 'undefined' ? '/api/proxy' : 'https://app.gaubook.org/api/v1';
const BASE_V1 = BASE_PROXY;
const BASE_V2 = BASE_PROXY;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gb_token');
}

function makeClient(base: string) {
  const client = axios.create({ baseURL: base });
  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  client.interceptors.response.use(
    (r) => r,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('gb_token');
        localStorage.removeItem('gb_user');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );
  return client;
}

export const apiV1 = makeClient(BASE_V1);
export const apiV2 = makeClient(BASE_V2);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (mobile: string) => apiV1.post('/auth/user/infobip/send-otp', { mobile }),
  verifyOtp: (mobile: string, otp: string, pinId: string) =>
    apiV1.post('/auth/user/infobip/verify-otp', { mobile, otp, pinId }),
  signup: (data: Record<string, unknown>) => apiV1.post('/auth/user/signup', data),
  updateRole: (role: string) => apiV1.put('/user/profile/role', { role }),
  socialSignup: (data: Record<string, unknown>) =>
    apiV1.post('/auth/user/social-signup', data),
};

// ── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => apiV1.get('/user/profile'),
  update: (data: FormData | Record<string, unknown>) =>
    apiV1.put('/user/profile', data),
};

// ── Feed (v2) ─────────────────────────────────────────────────────────────────
export const feedApi = {
  getPosts: (page = 1, limit = 10, type?: string) =>
    apiV2.get('/posts', { params: { page, limit, type } }),
  getMyPosts: (page = 1, limit = 10, userId?: string) =>
    apiV1.get('/posts', { params: { page, limit, ...(userId ? { userId } : {}) } }),
  createPost: (data: FormData) => apiV2.post('/posts', data),
  likePost: (postId: string) => apiV1.post(`/posts/${postId}/like`),
  addComment: (postId: string, comment: string) =>
    apiV1.post(`/posts/${postId}/comment`, { comment }),
  sharePost: (postId: string) => apiV1.post('/post-share-counts/post', { postId }),
  pinPost: (postId: string) => apiV1.patch(`/posts/${postId}/pin`, {}),
  getPostById: (postId: string) => apiV1.get(`/posts/${postId}`),
};

// ── Explore (Gaushalas / Vendors / Experts) ──────────────────────────────────
export const exploreApi = {
  getGaushalas: (params: Record<string, unknown> = {}) =>
    apiV1.get('/explore/gaushalas', { params: { page: 1, limit: 12, ...params } }),
  getGaushalaById: (id: string) => apiV1.get(`/explore/gaushalas/${id}`),
  getVendors: (params: Record<string, unknown> = {}) =>
    apiV1.get('/explore/gaushalas', { params: { page: 1, limit: 12, role: 'Vendor', ...params } }),
  getVendorById: (id: string) => apiV1.get(`/explore/gaushalas/${id}`),
  getNearby: (lat: number, lng: number, radius?: number) =>
    apiV1.get('/explore/gaushalas/nearby', { params: { lat, lng, ...(radius != null ? { radius } : {}) } }),
};

// ── Market / Products ─────────────────────────────────────────────────────────
export const marketApi = {
  getProducts: (params: Record<string, unknown> = {}) =>
    apiV1.get('/products', { params: { page: 1, limit: 12, ...params } }),
  getProductById: (id: string) => apiV1.get(`/products/${id}`),
  createProduct: (data: FormData) => apiV1.post('/products', data),
  updateProduct: (id: string, data: FormData) => apiV1.put(`/products/${id}`, data),
  deleteProduct: (id: string) => apiV1.delete(`/products/${id}`),
  getCategories: () => apiV1.get('/master-data/public/all'),
  getMarketBanners: () => apiV1.get('/expert-banners/market/public'),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getProfileReviews: (profileId: string, page = 1) =>
    apiV1.get(`/explore/gaushalas/${profileId}/reviews`, { params: { page, limit: 10 } }),
  addReview: (reviewedUserId: string, data: { rating: number; review: string }) =>
    apiV1.post('/reviews', { reviewedUserId, ...data }),
};

// ── Expert ────────────────────────────────────────────────────────────────────
export const expertApi = {
  getExperts: (params: Record<string, unknown> = {}) =>
    apiV1.get('/explore/gaushalas', {
      params: { page: 1, limit: 12, role: 'Expert', ...params },
    }),
  getBanners: () => apiV1.get('/expert-banners/public'),
};

// ── Rescue ────────────────────────────────────────────────────────────────────
export const rescueApi = {
  getAll: (params: Record<string, unknown> = {}) =>
    apiV1.get('/rescue', { params: { page: 1, limit: 10, ...params } }),
  getById: (id: string) => apiV1.get(`/rescue/${id}`),
  create: (data: FormData) => apiV1.post('/rescue', data),
  updateStatus: (id: string, status: string) =>
    apiV1.patch(`/rescue/${id}`, { status }),
  deleteReport: (id: string) => apiV1.delete(`/rescue/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getMyOrders: (page = 1) => apiV1.get('/orders', { params: { page } }),
  getVendorOrders: (page = 1) =>
    apiV1.get('/orders/vendor', { params: { page } }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notifApi = {
  getAll: (page = 1) => apiV1.get('/notifications', { params: { page, limit: 20 } }),
  markRead: (ids: string[]) => apiV1.post('/notifications/mark-as-read', { ids }),
  getUnreadCount: () => apiV1.get('/notifications/unread-count'),
};

// ── Events ────────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll: (params: Record<string, unknown> = {}) =>
    apiV1.get('/events', { params: { page: 1, limit: 10, ...params } }),
  getById: (id: string) => apiV1.get(`/events/${id}`),
  toggleAttend: (id: string) => apiV1.post(`/events/${id}/attend`, {}),
};
