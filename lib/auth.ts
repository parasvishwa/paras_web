export interface GbUser {
  id: string;
  fullname: string;
  mobile?: string;
  email?: string;
  role: string[];
  profilePhoto?: string;
  businessName?: string;
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function setCookie(token: string) {
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `gb_token=${token}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

function clearCookie() {
  document.cookie = 'gb_token=; Path=/; Max-Age=0; SameSite=Lax';
}

export function saveAuth(token: string, user: GbUser) {
  localStorage.setItem('gb_token', token);
  localStorage.setItem('gb_user', JSON.stringify(user));
  setCookie(token);
}

export function clearAuth() {
  localStorage.removeItem('gb_token');
  localStorage.removeItem('gb_user');
  clearCookie();
}

export function getStoredUser(): GbUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('gb_user');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gb_token');
}

export function isLoggedIn(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearAuth();
      return false;
    }
  } catch {
    // not a standard JWT shape — trust it
  }
  return true;
}

export const ROLES = [
  { value: 'Gaushala', label: 'Gaushala', emoji: '🐄', desc: 'Cow shelter / gaushala operator' },
  { value: 'Vendor', label: 'Vendor', emoji: '🛍️', desc: 'Sell gau products online' },
  { value: 'Volunteer', label: 'Volunteer', emoji: '🤝', desc: 'Help in rescue & gaushala activities' },
  { value: 'Donor', label: 'Donor', emoji: '💛', desc: 'Donate to gaushalas and campaigns' },
  { value: 'Influencer', label: 'Influencer', emoji: '📢', desc: 'Spread gau awareness' },
  { value: 'NGO', label: 'Expert / NGO', emoji: '🏛️', desc: 'Expert, NGO, or researcher' },
];
