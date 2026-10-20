export type SeatStatus = 'AVAILABLE' | 'HELD' | 'BOOKED'

export type SeatTier = 'VIP' | 'PREMIUM' | 'STANDARD'

export interface Seat {
  id: string
  row: string
  number: number
  tier: SeatTier
  price: number
  status: SeatStatus
  heldExpiresAt?: number | null
}

export interface EventItem {
  id: string
  title: string
  category: string
  city: string
  venueName: string
  dateTime: string
  doorsOpen: string
  description: string
  totalSeats: number
  availableSeats: number
  minPrice: number
  status: 'ACTIVE' | 'SOLD_OUT' | 'UPCOMING'
  imageUrl: string
}

export interface Booking {
  bookingReference: string
  eventId: string
  eventTitle: string
  venueName: string
  dateTime: string
  seats: Seat[]
  customerName: string
  customerEmail: string
  customerPhone: string
  paymentMethod: string
  totalAmount: number
  confirmedAt: string
}

export type ActiveScreen = 'discover' | 'seatmap' | 'checkout' | 'confirmation' | 'admin' | 'bookings'

export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  token?: string
}

export interface HoldResponse {
  bookingId: string
  eventId: string
  status: string
  totalAmount: number
  currency: string
  expiresAt: string
  seatIds: string[]
}
export interface BookingSeatDto {
  seatId: string
  row: string
  number: number
  tier: string
  price: number
}

export interface BookingResponse {
  id: string
  eventId: string
  eventTitle: string
  status: string
  totalAmount: number
  currency: string
  expiresAt?: string | null
  createdAt: string
  seats: BookingSeatDto[]
}
