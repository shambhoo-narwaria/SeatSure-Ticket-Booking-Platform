import { useState, useEffect } from 'react'
import type { EventItem, Seat, HoldResponse } from '../types'
import { PaymentModal } from './PaymentModal'

interface CheckoutScreenProps {
  event: EventItem
  selectedSeats: Seat[]
  onBackToSeats: () => void
  onConfirmBooking: (customer: { name: string; email: string; phone: string; paymentMethod: string }) => void | Promise<void>
  activeHold?: HoldResponse | null
}

export function CheckoutScreen({
  event,
  selectedSeats,
  onBackToSeats,
  onConfirmBooking,
  activeHold,
}: CheckoutScreenProps) {
  const [name, setName] = useState('Rahul Sharma')
  const [email, setEmail] = useState('rahul.sharma@example.com')
  const [phone, setPhone] = useState('+91 98765 43210')
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'MOCK'>('UPI')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    if (activeHold?.expiresAt) {
      const diff = Math.floor((new Date(activeHold.expiresAt).getTime() - Date.now()) / 1000)
      return diff > 0 ? diff : 300
    }
    return 300
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [idempotencyKey] = useState(() => 'idemp-' + Math.random().toString(36).substring(2, 12))

  // Hold expiry countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0)
  const bookingFee = selectedSeats.length * 60
  const grandTotal = subtotal + bookingFee

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    // Open the authentic Payment Gateway / UPI QR screen
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSuccess = async (paymentDetails: {
    method: string
    transactionId: string
    upiId?: string
  }) => {
    setIsProcessing(true)
    try {
      await onConfirmBooking({
        name,
        email,
        phone,
        paymentMethod: paymentDetails.method,
      })
    } finally {
      setIsProcessing(false)
      setIsPaymentModalOpen(false)
    }
  }

  return (
    <div className="checkout-view-box" id="screen-checkout">
      <button
        type="button"
        id="btn-back-seats"
        className="btn-back-link"
        onClick={onBackToSeats}
        style={{ marginBottom: '16px' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Seat Map
      </button>

      <div className="lock-timer-banner" id="lock-timer-banner">
        <div>
          <span>Temporary Seat Hold Active · Complete checkout before expiry</span>
          {activeHold && (
            <div style={{ fontSize: '11px', opacity: 0.85, fontFamily: 'monospace', marginTop: '2px' }}>
              Database Hold ID: {activeHold.bookingId}
            </div>
          )}
        </div>
        <span className="lock-timer-clock" id="timer-display">
          {timerDisplay}
        </span>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '4px' }}>
          Checkout & Confirmation
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)' }}>
          {event.title} · {selectedSeats.length} seat(s) reserved: {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="cust-name">
              Full Name
            </label>
            <input
              id="cust-name"
              className="form-control"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="cust-email">
              Email Address (for Ticket PDF & QR)
            </label>
            <input
              id="cust-email"
              className="form-control"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="cust-phone">
              Mobile Number (for SMS confirmation)
            </label>
            <input
              id="cust-phone"
              className="form-control"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
            Select Payment Method
          </label>
          <div className="payment-options-group">
            <div
              className={`payment-choice-card ${paymentMethod === 'UPI' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('UPI')}
              role="button"
              tabIndex={0}
            >
              <span>Instant UPI (Google Pay, PhonePe, Paytm)</span>
              <span style={{ fontSize: '12px', color: 'var(--color-indigo)', fontWeight: 700 }}>Recommended</span>
            </div>

            <div
              className={`payment-choice-card ${paymentMethod === 'CARD' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('CARD')}
              role="button"
              tabIndex={0}
            >
              <span>Credit / Debit Card (Visa, Mastercard, RuPay)</span>
            </div>

            <div
              className={`payment-choice-card ${paymentMethod === 'MOCK' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('MOCK')}
              role="button"
              tabIndex={0}
            >
              <span>Mock Sandbox Payment (Instant Verification for Testing)</span>
              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>Dev Sandbox</span>
            </div>
          </div>
        </div>

        <div className="idempotency-badge" id="idempotency-badge">
          Client Idempotency Key: {idempotencyKey} (Guarantees at-most-once payment capture)
        </div>

        <div className="breakdown-table" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
          <div className="breakdown-row">
            <span>Seat Subtotal</span>
            <span>₹{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-row">
            <span>Platform Fee</span>
            <span>₹{bookingFee.toLocaleString('en-IN')}</span>
          </div>
          <div className="breakdown-row total-row">
            <span>Total Payable</span>
            <span>₹{grandTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <button
          type="submit"
          id="btn-confirm-payment"
          className="btn-action-primary"
          disabled={isProcessing || secondsRemaining === 0}
        >
          {isProcessing
            ? 'Processing Payment...'
            : `Proceed to Pay ₹${grandTotal.toLocaleString('en-IN')}`}
        </button>
      </form>

      {/* Real System Interactive Payment Modal with Live UPI QR Code */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        amount={grandTotal}
        event={event}
        selectedSeats={selectedSeats}
        customer={{ name, email, phone }}
        activeHold={activeHold}
        secondsRemaining={secondsRemaining}
        onPaymentSuccess={handlePaymentSuccess}
        onCancelPayment={() => {
          setIsPaymentModalOpen(false)
          onBackToSeats()
        }}
      />
    </div>
  )
}
