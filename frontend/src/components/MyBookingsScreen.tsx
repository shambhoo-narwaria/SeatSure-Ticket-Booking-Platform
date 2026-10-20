import { useState, useEffect } from 'react'
import type { BookingResponse, EventItem, User } from '../types'
import { fetchUserBookings } from '../services/api'

interface MyBookingsScreenProps {
  currentUser: User | null
  events: EventItem[]
  onNavigateToDiscover: () => void
  onSelectEventForBooking?: (event: EventItem) => void
  lastBookingTimestamp?: number
}

export function MyBookingsScreen({
  currentUser,
  events,
  onNavigateToDiscover,
  onSelectEventForBooking,
  lastBookingTimestamp,
}: MyBookingsScreenProps) {
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'HOLDING' | 'CANCELLED'>('ALL')
  const [copiedRef, setCopiedRef] = useState<string | null>(null)

  const loadBookings = async () => {
    setLoading(true)
    setError(null)
    const result = await fetchUserBookings(currentUser?.id)
    if (result.success && result.data) {
      setBookings(result.data)
    } else {
      setError(result.error || 'Failed to load bookings from database.')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBookings()
  }, [currentUser?.id, lastBookingTimestamp])

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref)
    setCopiedRef(ref)
    setTimeout(() => setCopiedRef(null), 2000)
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'ALL') return true
    if (statusFilter === 'CANCELLED') return b.status === 'CANCELLED' || b.status === 'EXPIRED'
    return b.status === statusFilter
  })

  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length

  return (
    <div className="my-bookings-container" id="screen-my-bookings">
      {/* Top Header */}
      <div className="my-bookings-header">
        <div>
          <button
            type="button"
            id="btn-back-to-discover-from-bookings"
            className="btn-back-link"
            onClick={onNavigateToDiscover}
            style={{ marginBottom: '12px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Discover
          </button>
          <h1 className="bookings-page-title">My Bookings & Passes</h1>
          <p className="bookings-page-subtitle">
            All admission passes booked under{' '}
            <strong>{currentUser?.fullName || 'Rahul Sharma'}</strong> ({currentUser?.email || 'customer@seatsure.com'}), synchronized live with PostgreSQL.
          </p>
        </div>

        <div className="my-bookings-header-actions">
          <button
            type="button"
            id="btn-book-another-top"
            className="btn-book-another-top"
            onClick={onNavigateToDiscover}
            title="Book another show or concert"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Book Another Event
          </button>

          <button
            type="button"
            id="btn-refresh-bookings"
            className="btn-refresh-outline"
            onClick={loadBookings}
            disabled={loading}
            title="Refresh latest bookings from PostgreSQL database"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={loading ? 'spinning-icon' : ''}
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            {loading ? 'Syncing...' : 'Refresh Passes'}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="bookings-stats-grid">
        <div className="stat-card-pill">
          <div className="stat-pill-label">Total Passes Booked</div>
          <div className="stat-pill-value">{bookings.length}</div>
        </div>
        <div className="stat-card-pill">
          <div className="stat-pill-label">Confirmed Admissions</div>
          <div className="stat-pill-value" style={{ color: '#16a34a' }}>
            {confirmedCount}
          </div>
        </div>
        <div className="stat-card-pill">
          <div className="stat-pill-label">Active Holds</div>
          <div className="stat-pill-value" style={{ color: '#d97706' }}>
            {bookings.filter((b) => b.status === 'HOLDING').length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bookings-filter-bar">
        <div className="filter-pill-group">
          {(['ALL', 'CONFIRMED', 'HOLDING', 'CANCELLED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={`filter-pill-btn ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? 'All Passes' : status === 'CONFIRMED' ? 'Confirmed Passes' : status === 'HOLDING' ? 'Holding / Cart' : 'Expired / Cancelled'}
              <span className="pill-count-badge">
                {status === 'ALL'
                  ? bookings.length
                  : status === 'CANCELLED'
                  ? bookings.filter((b) => b.status === 'CANCELLED' || b.status === 'EXPIRED').length
                  : bookings.filter((b) => b.status === status).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && bookings.length === 0 && (
        <div className="bookings-loading-state">
          <div className="payment-spinner" />
          <p>Fetching your verified admission passes from PostgreSQL database...</p>
        </div>
      )}

      {error && (
        <div className="bookings-error-card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Unable to load passes:</strong> {error}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBookings.length === 0 && (
        <div className="bookings-empty-state" id="empty-bookings-view">
          <div className="empty-state-icon-circle">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
          </div>
          <h3>No passes found</h3>
          <p>
            {statusFilter !== 'ALL'
              ? `You do not have any admission passes with status "${statusFilter}".`
              : 'You have not booked any event passes yet. Browse live concerts, movies, and shows!'}
          </p>
          <button
            type="button"
            className="btn-action-primary"
            style={{ width: 'auto', padding: '10px 24px' }}
            onClick={onNavigateToDiscover}
          >
            Explore Live Events & Book
          </button>
        </div>
      )}

      {/* Passes List (Showing multiple passes booked by the user) */}
      <div className="bookings-card-list" id="bookings-card-list">
        {filteredBookings.map((b) => {
          const bookingRef = `SS-${b.id.substring(0, 8).toUpperCase()}`
          const isConfirmed = b.status === 'CONFIRMED'
          const isHolding = b.status === 'HOLDING'
          const matchedEvent = events.find((e) => e.id === b.eventId)

          const eventTitle = b.eventTitle || matchedEvent?.title || 'Live Event'
          const venueDisplay = matchedEvent
            ? `${matchedEvent.venueName}, ${matchedEvent.city}`
            : 'Premium Arena Venue'
          const dateTimeDisplay = matchedEvent
            ? matchedEvent.dateTime
            : b.createdAt
            ? new Date(b.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Upcoming Show'

          return (
            <div key={b.id} className="ticket-pass-card" id={`ticket-pass-${b.id}`}>
              {/* Pass Gradient Header */}
              <div className="pass-header">
                <div className="pass-header-info">
                  <div className="pass-supertitle">
                    <span className="pass-supertitle-dot" />
                    Official Digital Admission Pass · SeatSure Verified
                  </div>
                  <div className="pass-event-title">{eventTitle}</div>
                </div>

                <div className="pass-header-meta">
                  <div className="pass-ref-badge">
                    <span>Ref:</span>
                    <strong>{bookingRef}</strong>
                    <button
                      type="button"
                      className="btn-pass-copy-ref"
                      onClick={() => handleCopyRef(bookingRef)}
                      title="Copy Reference Code"
                    >
                      {copiedRef === bookingRef ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className={`pass-status-badge ${b.status.toLowerCase()}`}>
                    {isConfirmed ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Guaranteed Admission
                      </>
                    ) : isHolding ? (
                      '⏱ Temporary Hold Active'
                    ) : (
                      b.status
                    )}
                  </div>
                </div>
              </div>

              {/* Pass Body */}
              <div className="pass-body">
                <div className="pass-details-grid">
                  <div className="pass-detail-cell">
                    <span className="pass-cell-label">Date & Time</span>
                    <span className="pass-cell-value">{dateTimeDisplay}</span>
                  </div>

                  <div className="pass-detail-cell">
                    <span className="pass-cell-label">Venue Location</span>
                    <span className="pass-cell-value">{venueDisplay}</span>
                  </div>

                  <div className="pass-detail-cell">
                    <span className="pass-cell-label">Attendee</span>
                    <span className="pass-cell-value">
                      {currentUser?.fullName || 'Rahul Sharma'}
                    </span>
                  </div>

                  <div className="pass-detail-cell">
                    <span className="pass-cell-label">Total Amount Paid</span>
                    <span className="pass-cell-value highlight-green">
                      ₹{b.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Allocated Seats Strip */}
                <div className="pass-seats-banner">
                  <div className="pass-seats-header-line">
                    <span className="pass-seats-title">
                      Reserved Admission Seats
                    </span>
                    <span className="pass-seats-count-badge">
                      {b.seats.length} Seat{b.seats.length !== 1 ? 's' : ''} Allocated
                    </span>
                  </div>

                  <div className="pass-seats-pill-row">
                    {b.seats.map((seat) => (
                      <div key={seat.seatId} className="pass-seat-item-pill">
                        <span className="pass-seat-code">
                          Row {seat.row} · Seat {seat.number}
                        </span>
                        <span className="pass-seat-tier-tag">{seat.tier}</span>
                        <span className="pass-seat-price-text">
                          ₹{seat.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Classic Perforated Ticket Notches */}
              <div className="pass-perforation-divider">
                <div className="pass-notch-left" />
                <div className="pass-dashed-line" />
                <div className="pass-notch-right" />
              </div>

              {/* Pass Footer / Turnstile Scan & Actions */}
              <div className="pass-footer-section">
                <div className="pass-qr-cluster">
                  <div className="pass-qr-box">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="currentColor">
                      <rect x="0" y="0" width="30" height="30" />
                      <rect x="70" y="0" width="30" height="30" />
                      <rect x="0" y="70" width="30" height="30" />
                      <rect x="10" y="10" width="10" height="10" fill="#fff" />
                      <rect x="80" y="10" width="10" height="10" fill="#fff" />
                      <rect x="10" y="80" width="10" height="10" fill="#fff" />
                      <rect x="40" y="10" width="20" height="10" />
                      <rect x="40" y="40" width="20" height="20" />
                      <rect x="10" y="40" width="20" height="10" />
                      <rect x="70" y="40" width="20" height="10" />
                      <rect x="40" y="70" width="20" height="20" />
                      <rect x="70" y="70" width="10" height="20" />
                    </svg>
                  </div>

                  <div className="pass-qr-instructions">
                    <div className="pass-qr-title">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Turnstile Contactless Admission
                    </div>
                    <div className="pass-qr-text">
                      Present dynamic QR pass at venue security turnstiles for fast scanner check-in.
                    </div>
                  </div>
                </div>

                <div className="pass-actions-group">
                  <button
                    type="button"
                    className="btn-pass-action-print"
                    onClick={() => window.print()}
                    title="Print or Save PDF of this pass"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print / Save Pass
                  </button>

                  {matchedEvent && onSelectEventForBooking && (
                    <button
                      type="button"
                      className="btn-pass-action-book-again"
                      onClick={() => onSelectEventForBooking(matchedEvent)}
                      title="Book more seats for this event"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                      Book More Seats
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
