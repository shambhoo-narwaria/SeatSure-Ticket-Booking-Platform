import type { EventItem, Seat, HoldResponse, BookingResponse } from '../types'

/**
 * Live API service communicating directly with the Spring Boot backend
 * and PostgreSQL database. No hardcoded or dummy fallback data.
 */

export async function fetchEvents(): Promise<{ events: EventItem[]; isLiveBackend: boolean; error?: string }> {
  try {
    const res = await fetch('/api/v1/events', {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data: EventItem[] = await res.json()
      return { events: data, isLiveBackend: true }
    } else {
      return {
        events: [],
        isLiveBackend: false,
        error: `Backend returned HTTP status ${res.status}: ${res.statusText}`,
      }
    }
  } catch (err: any) {
    return {
      events: [],
      isLiveBackend: false,
      error: err.message || 'Unable to connect to live backend API at /api/v1/events',
    }
  }
}

export async function fetchEventSeats(
  eventId: string,
): Promise<{ seats: Seat[]; isLiveBackend: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/v1/events/${eventId}/seats`, {
      headers: { Accept: 'application/json' },
    })
    if (res.ok) {
      const data: Seat[] = await res.json()
      return { seats: data, isLiveBackend: true }
    } else {
      return {
        seats: [],
        isLiveBackend: false,
        error: `Backend returned HTTP status ${res.status} when fetching event seats.`,
      }
    }
  } catch (err: any) {
    return {
      seats: [],
      isLiveBackend: false,
      error: err.message || `Failed to fetch seats for event ${eventId}`,
    }
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch('/actuator/health')
    if (res.ok) {
      const data = await res.json()
      return data.status === 'UP'
    }
  } catch {
    // Unreachable
  }
  return false
}

export async function holdSeats(
  eventId: string,
  seatIds: string[],
  idempotencyKey?: string,
  userId?: string,
  holdId?: string,
): Promise<{ success: boolean; data?: HoldResponse; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey
    }
    if (userId) {
      headers['X-User-Id'] = userId
    }
    if (holdId) {
      headers['X-Hold-Id'] = holdId
    }

    const res = await fetch(`/api/v1/events/${eventId}/holds`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ seatIds }),
    })

    const json = await res.json()
    if (res.ok) {
      return { success: true, data: json }
    } else {
      return {
        success: false,
        error: json.detail || json.title || 'Selected seats could not be held.',
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while attempting to hold seats.',
    }
  }
}

export async function confirmBooking(
  bookingId: string,
): Promise<{ success: boolean; data?: BookingResponse; error?: string }> {
  try {
    const res = await fetch(`/api/v1/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })

    const json = await res.json()
    if (res.ok) {
      return { success: true, data: json }
    } else {
      return {
        success: false,
        error: json.detail || json.title || 'Booking confirmation failed.',
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while attempting to confirm booking.',
    }
  }
}

export async function fetchBooking(
  bookingId: string,
): Promise<{ success: boolean; data?: BookingResponse; error?: string }> {
  try {
    const res = await fetch(`/api/v1/bookings/${bookingId}`, {
      headers: { Accept: 'application/json' },
    })

    const json = await res.json()
    if (res.ok) {
      return { success: true, data: json }
    } else {
      return {
        success: false,
        error: json.detail || json.title || 'Booking not found.',
      }
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while fetching booking details.',
    }
  }
}

export async function releaseHold(
  bookingId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/v1/bookings/${bookingId}/hold`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    })
    return { success: res.ok }
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error while releasing seat hold.',
    }
  }
}

export async function fetchUserBookings(
  userId?: string,
): Promise<{ success: boolean; data?: BookingResponse[]; error?: string }> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (userId) {
      headers['X-User-Id'] = userId
    }
    const url = userId ? `/api/v1/bookings?userId=${userId}` : '/api/v1/bookings'
    const res = await fetch(url, { headers })
    if (res.ok) {
      const data: BookingResponse[] = await res.json()
      return { success: true, data }
    } else {
      return { success: false, error: `Failed to fetch bookings (${res.status})` }
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error fetching user bookings.' }
  }
}

