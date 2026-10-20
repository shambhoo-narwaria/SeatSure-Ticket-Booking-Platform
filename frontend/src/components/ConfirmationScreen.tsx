import type { Booking } from '../types'

interface ConfirmationScreenProps {
  booking: Booking
  onBookAnother: () => void
}

export function ConfirmationScreen({ booking, onBookAnother }: ConfirmationScreenProps) {
  return (
    <div className="confirmation-container" id="screen-confirmation">
      <div className="success-badge-circle">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
        Booking Confirmed & Guaranteed
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--color-ink-secondary)', maxWidth: '480px', margin: '0 auto' }}>
        Your seats are confirmed in the system. Confirmation details have been dispatched to{' '}
        <strong>{booking.customerEmail}</strong>.
      </p>

      {/* Digital Ticket Pass */}
      <div className="ticket-card" id="digital-ticket-pass">
        <div className="ticket-header">
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9 }}>
              Official Admission Pass
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>{booking.eventTitle}</div>
          </div>
          <div className="ticket-header-ref" id="booking-ref-badge">
            {booking.bookingReference}
          </div>
        </div>

        <div className="ticket-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Date & Time
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {booking.dateTime}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Venue Location
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {booking.venueName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Customer Name
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-ink)' }}>
                {booking.customerName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Total Paid
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>
                ₹{booking.totalAmount.toLocaleString('en-IN')} ({booking.paymentMethod})
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Allocated Seats ({booking.seats.length})
            </div>
            <div className="ticket-seats-tags">
              {booking.seats.map((seat) => (
                <span key={seat.id} className="ticket-seat-pill">
                  Row {seat.row} · Seat {seat.number} ({seat.tier})
                </span>
              ))}
            </div>
          </div>

          {/* SVG QR Code */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ width: '80px', height: '80px', background: '#f8fafc', padding: '6px', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="currentColor">
                <rect x="0" y="0" width="30" height="30" />
                <rect x="70" y="0" width="30" height="30" />
                <rect x="0" y="70" width="30" height="30" />
                <rect x="10" y="10" width="10" height="10" fill="#fff" />
                <rect x="80" y="10" width="10" height="10" fill="#fff" />
                <rect x="10" y="80" width="10" height="10" fill="#fff" />
                <rect x="40" y="10" width="10" height="20" />
                <rect x="10" y="40" width="20" height="10" />
                <rect x="40" y="40" width="20" height="20" />
                <rect x="70" y="40" width="20" height="10" />
                <rect x="40" y="70" width="10" height="20" />
                <rect x="70" y="70" width="20" height="20" />
              </svg>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>
              Scan this dynamic admission code at the venue gate for rapid contactless verification.
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button
          type="button"
          id="btn-print-ticket"
          className="btn-action-primary"
          style={{ width: 'auto', background: '#ffffff', color: 'var(--color-ink)', border: '1px solid var(--color-border)' }}
          onClick={() => window.print()}
        >
          Print / Save Ticket
        </button>

        <button
          type="button"
          id="btn-book-another"
          className="btn-action-primary"
          style={{ width: 'auto' }}
          onClick={onBookAnother}
        >
          Book Another Event
        </button>
      </div>
    </div>
  )
}
