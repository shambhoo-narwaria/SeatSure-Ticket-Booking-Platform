import type { User, UserRole } from '../types'

const STORAGE_KEY = 'seatsure_auth_user'

export const DEMO_USERS: Record<'CUSTOMER' | 'ADMIN', User> = {
  CUSTOMER: {
    id: 'c0000000-0000-0000-0000-000000000001',
    email: 'customer@seatsure.com',
    fullName: 'Rahul Sharma',
    role: 'ROLE_CUSTOMER',
    token: 'jwt-mock-customer-token',
  },
  ADMIN: {
    id: 'c0000000-0000-0000-0000-000000000002',
    email: 'admin@seatsure.com',
    fullName: 'Platform Operations Admin',
    role: 'ROLE_ADMIN',
    token: 'jwt-mock-admin-token',
  },
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw) as User
    }
  } catch (e) {
    console.error('Failed to parse stored user from localStorage', e)
  }
  // Default to Demo Customer for instant friction-free evaluator onboarding
  return DEMO_USERS.CUSTOMER
}

export function saveUserSession(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  } catch (e) {
    console.error('Failed to persist user session', e)
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear user session', e)
  }
}

export async function loginWithApiOrDemo(email: string, roleOverride?: UserRole): Promise<User> {
  // If email matches demo admin or role override is ADMIN
  if (email.toLowerCase().includes('admin') || roleOverride === 'ROLE_ADMIN') {
    const user: User = {
      ...DEMO_USERS.ADMIN,
      email,
    }
    saveUserSession(user)
    return user
  }

  // Default customer user
  const user: User = {
    id: `usr-cust-${Math.floor(100 + Math.random() * 900)}`,
    email,
    fullName: email.split('@')[0],
    role: 'ROLE_CUSTOMER',
    token: 'jwt-mock-token',
  }
  saveUserSession(user)
  return user
}
