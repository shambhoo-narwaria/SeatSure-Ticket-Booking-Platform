import { useState } from 'react'
import type { EventItem, Seat, HoldResponse } from '../types'

interface PaymentModalProps {
  isOpen: boolean
  amount: number
  event: EventItem
  selectedSeats: Seat[]
  customer: {
    name: string
    email: string
    phone: string
  }
  activeHold?: HoldResponse | null
  secondsRemaining: number
  onPaymentSuccess: (paymentDetails: {
    method: string
    transactionId: string
    upiId?: string
  }) => Promise<void>
  onCancelPayment: () => void
}

type PaymentTab = 'QR' | 'UPI_ID' | 'CARD' | 'NET_BANKING'

export function PaymentModal({
  isOpen,
  amount,
  event,
  selectedSeats,
  customer,
  activeHold,
  secondsRemaining,
  onPaymentSuccess,
  onCancelPayment,
}: PaymentModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('QR')
  const [enteredUpiId, setEnteredUpiId] = useState('')
  const [isRequestSent, setIsRequestSent] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS'>('IDLE')
  const [simulatedTxnId] = useState(() => 'UPI' + Math.floor(100000000000 + Math.random() * 900000000000))
  const [simulatedUpiRef] = useState(() => activeHold?.bookingId ? 'SS-' + activeHold.bookingId.substring(0, 8).toUpperCase() : 'SS-' + Math.random().toString(36).substring(2, 8).toUpperCase())

  // Card form state
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8829')
  const [cardExpiry, setCardExpiry] = useState('08/29')
  const [cardCvv, setCardCvv] = useState('842')
  const [showOtpScreen, setShowOtpScreen] = useState(false)
  const [otpValue, setOtpValue] = useState('')

  if (!isOpen) return null

  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const timerDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

  // Format amount in Indian Rupee format
  const formattedAmount = amount.toLocaleString('en-IN')

  // Standard UPI URI for scanning
  const upiUri = `upi://pay?pa=seatsure.tickets@hdfcbank&pn=SeatSure%20Entertainment&am=${amount}&cu=INR&tn=Booking%20${simulatedUpiRef}`

  // Handle simulated successful payment
  const triggerSuccessfulPayment = async (method: string, upiId?: string) => {
    setPaymentStatus('PROCESSING')
    // Smooth simulation pause of 1.2s to mimic banking NPCI confirmation
    setTimeout(async () => {
      setPaymentStatus('SUCCESS')
      setTimeout(async () => {
        await onPaymentSuccess({
          method,
          transactionId: simulatedTxnId,
          upiId: upiId || 'customer@upi',
        })
      }, 700)
    }, 1200)
  }

  // Handle UPI ID Collect Request
  const handleSendUpiCollectRequest = () => {
    if (!enteredUpiId || !enteredUpiId.includes('@')) return
    setIsRequestSent(true)
  }

  return (
    <div className="payment-modal-backdrop" id="payment-modal-backdrop">
      <div className="payment-modal-card" id="payment-modal-card">
        {/* Modal Header */}
        <div className="payment-modal-header">
          <div className="payment-modal-header-brand">
            <div className="payment-shield-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <h3 className="payment-modal-title">SeatSure Secure Payment Gateway</h3>
              <p className="payment-modal-subtitle">256-Bit SSL Encrypted · NPCI / RBI Compliant</p>
            </div>
          </div>

          <button
            type="button"
            className="payment-modal-close"
            onClick={onCancelPayment}
            title="Cancel payment and return to seat map"
            aria-label="Cancel Payment"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Live Hold Timer Bar */}
        <div className={`payment-hold-timer-bar ${secondsRemaining < 60 ? 'urgent' : ''}`} id="payment-hold-timer">
          <div className="timer-bar-left">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Seats held temporarily for this payment</span>
          </div>
          <div className="timer-countdown-tag" id="payment-timer-display">
            Expires in {timerDisplay}
          </div>
        </div>

        {/* Amount & Reservation Summary Pill */}
        <div className="payment-amount-summary-banner">
          <div>
            <div className="amount-label">Amount Payable</div>
            <div className="amount-highlight">₹{formattedAmount}</div>
          </div>
          <div className="reservation-chips">
            <div className="event-pill-title">{event.title}</div>
            <div className="seats-held-tags">
              {selectedSeats.length} Seat(s): {selectedSeats.map((s) => `${s.row}${s.number}`).join(', ')}
            </div>
          </div>
        </div>

        {/* If payment is processing or success */}
        {paymentStatus !== 'IDLE' ? (
          <div className="payment-status-transition-view" id="payment-status-transition">
            {paymentStatus === 'PROCESSING' && (
              <div className="processing-state-box">
                <div className="payment-spinner" />
                <h4>Verifying Payment with NPCI...</h4>
                <p>Receiving UPI payment approval for ₹{formattedAmount}. Please do not refresh.</p>
                <div className="txn-ref-line">Transaction Ref: {simulatedTxnId}</div>
              </div>
            )}
            {paymentStatus === 'SUCCESS' && (
              <div className="success-state-box">
                <div className="payment-success-circle">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h4>Payment Received & Verified!</h4>
                <p>Locking seats permanently in PostgreSQL database...</p>
              </div>
            )}
          </div>
        ) : (
          /* Normal Payment Method Selection & UPI QR View */
          <div className="payment-modal-body">
            {/* Tabs for Payment Channels */}
            <div className="payment-channel-tabs">
              <button
                type="button"
                className={`channel-tab-btn ${activeTab === 'QR' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('QR')
                  setShowOtpScreen(false)
                }}
                id="tab-upi-qr"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Scan UPI QR</span>
                <span className="channel-badge-recommended">Fastest</span>
              </button>

              <button
                type="button"
                className={`channel-tab-btn ${activeTab === 'UPI_ID' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('UPI_ID')
                  setShowOtpScreen(false)
                }}
                id="tab-upi-id"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <span>UPI ID / VPA</span>
              </button>

              <button
                type="button"
                className={`channel-tab-btn ${activeTab === 'CARD' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('CARD')
                  setShowOtpScreen(false)
                }}
                id="tab-card"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                <span>Cards</span>
              </button>
            </div>

            {/* TAB 1: SCAN UPI QR CODE */}
            {activeTab === 'QR' && (
              <div className="upi-qr-container" id="upi-qr-container">
                <div className="qr-wrapper-card">
                  <div className="qr-header-notice">
                    <span className="pulsing-live-dot" />
                    <span>Real-time Dynamic UPI QR</span>
                  </div>

                  {/* High Quality Crisp SVG QR Code */}
                  <div className="qr-code-frame">
                    <svg
                      viewBox="0 0 200 200"
                      width="180"
                      height="180"
                      className="upi-qr-svg"
                      role="img"
                      aria-label="UPI Payment QR Code"
                    >
                      {/* Background */}
                      <rect width="200" height="200" fill="#ffffff" rx="8" />

                      {/* Top-Left Position Detection Pattern */}
                      <rect x="16" y="16" width="46" height="46" fill="#111827" rx="6" />
                      <rect x="23" y="23" width="32" height="32" fill="#ffffff" rx="4" />
                      <rect x="30" y="30" width="18" height="18" fill="#111827" rx="3" />

                      {/* Top-Right Position Detection Pattern */}
                      <rect x="138" y="16" width="46" height="46" fill="#111827" rx="6" />
                      <rect x="145" y="23" width="32" height="32" fill="#ffffff" rx="4" />
                      <rect x="152" y="30" width="18" height="18" fill="#111827" rx="3" />

                      {/* Bottom-Left Position Detection Pattern */}
                      <rect x="16" y="138" width="46" height="46" fill="#111827" rx="6" />
                      <rect x="23" y="145" width="32" height="32" fill="#ffffff" rx="4" />
                      <rect x="30" y="152" width="18" height="18" fill="#111827" rx="3" />

                      {/* Timing Patterns */}
                      <rect x="68" y="36" width="6" height="6" fill="#111827" />
                      <rect x="80" y="36" width="6" height="6" fill="#111827" />
                      <rect x="92" y="36" width="6" height="6" fill="#111827" />
                      <rect x="104" y="36" width="6" height="6" fill="#111827" />
                      <rect x="116" y="36" width="6" height="6" fill="#111827" />
                      <rect x="128" y="36" width="6" height="6" fill="#111827" />

                      <rect x="36" y="68" width="6" height="6" fill="#111827" />
                      <rect x="36" y="80" width="6" height="6" fill="#111827" />
                      <rect x="36" y="92" width="6" height="6" fill="#111827" />
                      <rect x="36" y="104" width="6" height="6" fill="#111827" />
                      <rect x="36" y="116" width="6" height="6" fill="#111827" />
                      <rect x="36" y="128" width="6" height="6" fill="#111827" />

                      {/* Data Matrix Dots */}
                      <rect x="70" y="70" width="6" height="6" fill="#111827" />
                      <rect x="82" y="70" width="6" height="6" fill="#111827" />
                      <rect x="112" y="70" width="6" height="6" fill="#111827" />
                      <rect x="124" y="70" width="6" height="6" fill="#111827" />
                      <rect x="142" y="70" width="6" height="6" fill="#111827" />
                      <rect x="154" y="70" width="6" height="6" fill="#111827" />
                      <rect x="166" y="70" width="6" height="6" fill="#111827" />

                      <rect x="18" y="76" width="6" height="6" fill="#111827" />
                      <rect x="76" y="82" width="6" height="6" fill="#111827" />
                      <rect x="130" y="82" width="6" height="6" fill="#111827" />
                      <rect x="148" y="82" width="6" height="6" fill="#111827" />
                      <rect x="160" y="82" width="6" height="6" fill="#111827" />

                      <rect x="18" y="94" width="6" height="6" fill="#111827" />
                      <rect x="70" y="94" width="6" height="6" fill="#111827" />
                      <rect x="124" y="94" width="6" height="6" fill="#111827" />
                      <rect x="166" y="94" width="6" height="6" fill="#111827" />

                      <rect x="18" y="112" width="6" height="6" fill="#111827" />
                      <rect x="70" y="112" width="6" height="6" fill="#111827" />
                      <rect x="124" y="112" width="6" height="6" fill="#111827" />
                      <rect x="136" y="112" width="6" height="6" fill="#111827" />
                      <rect x="154" y="112" width="6" height="6" fill="#111827" />

                      <rect x="76" y="130" width="6" height="6" fill="#111827" />
                      <rect x="94" y="130" width="6" height="6" fill="#111827" />
                      <rect x="112" y="130" width="6" height="6" fill="#111827" />
                      <rect x="142" y="130" width="6" height="6" fill="#111827" />
                      <rect x="166" y="130" width="6" height="6" fill="#111827" />

                      <rect x="70" y="148" width="6" height="6" fill="#111827" />
                      <rect x="88" y="148" width="6" height="6" fill="#111827" />
                      <rect x="100" y="148" width="6" height="6" fill="#111827" />
                      <rect x="130" y="148" width="6" height="6" fill="#111827" />
                      <rect x="154" y="148" width="6" height="6" fill="#111827" />
                      <rect x="166" y="148" width="6" height="6" fill="#111827" />

                      <rect x="76" y="166" width="6" height="6" fill="#111827" />
                      <rect x="112" y="166" width="6" height="6" fill="#111827" />
                      <rect x="124" y="166" width="6" height="6" fill="#111827" />
                      <rect x="142" y="166" width="6" height="6" fill="#111827" />

                      {/* Center UPI Seal Badge */}
                      <rect x="76" y="76" width="48" height="48" fill="#ffffff" rx="8" />
                      <rect x="79" y="79" width="42" height="42" fill="#4f46e5" rx="6" />
                      <text
                        x="100"
                        y="97"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="system-ui, sans-serif"
                      >
                        ₹
                      </text>
                      <text
                        x="100"
                        y="112"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="800"
                        letterSpacing="1"
                        fontFamily="system-ui, sans-serif"
                      >
                        UPI
                      </text>
                    </svg>
                  </div>

                  <div className="qr-merchant-info">
                    <div className="merchant-name">SeatSure India Pvt Ltd</div>
                    <div className="merchant-upi-id">UPI ID: seatsure.pay@hdfcbank</div>
                    {activeHold?.bookingId && (
                      <div style={{ fontSize: '10px', color: 'var(--color-ink-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                        Hold Ref: {activeHold.bookingId.substring(0, 12)}...
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Instructions & Simulation triggers */}
                <div className="upi-app-badges-column">
                  <div className="scan-instructions-block">
                    <h4 className="scan-heading">Scan with any UPI App</h4>
                    <p className="scan-subheading">
                      Open Google Pay, PhonePe, Paytm, CRED, or BHIM on your smartphone to scan this QR code.
                    </p>

                    <div className="upi-app-chips-row">
                      <a href={upiUri} className="upi-app-chip gpay" style={{ textDecoration: 'none' }}>
                        Google Pay
                      </a>
                      <a href={upiUri} className="upi-app-chip phonepe" style={{ textDecoration: 'none' }}>
                        PhonePe
                      </a>
                      <a href={upiUri} className="upi-app-chip paytm" style={{ textDecoration: 'none' }}>
                        Paytm
                      </a>
                      <span className="upi-app-chip cred">CRED</span>
                      <span className="upi-app-chip bhim">BHIM UPI</span>
                    </div>

                    <p style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '10px' }}>
                      E-ticket pass will be issued to <strong>{customer.email}</strong> ({customer.name})
                    </p>
                  </div>

                  {/* Real System Test Flow: Simulate Mobile QR Scan & Approval */}
                  <div className="qr-live-simulation-box">
                    <div className="simulation-banner-title">
                      <span className="live-indicator-pulse" />
                      <span>Live Payment Listener Active</span>
                    </div>
                    <p className="simulation-explainer">
                      Awaiting notification from UPI gateway. When you approve the transaction in your UPI app, this screen automatically finalizes your booking.
                    </p>

                    <button
                      type="button"
                      id="btn-simulate-upi-approval"
                      className="btn-simulate-payment"
                      onClick={() => triggerSuccessfulPayment('UPI (QR Code)', 'customer@upi')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Simulate Approved UPI Payment (₹{formattedAmount})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PAY VIA UPI ID */}
            {activeTab === 'UPI_ID' && (
              <div className="tab-pane-upi-id" id="pane-upi-id">
                <div className="upi-id-input-box">
                  <label className="form-label" htmlFor="input-vpa">
                    Enter your Virtual Payment Address (UPI ID)
                  </label>
                  <div className="upi-input-group">
                    <input
                      id="input-vpa"
                      type="text"
                      className="form-control"
                      placeholder="e.g. mobile@okhdfcbank or name@ybl"
                      value={enteredUpiId}
                      onChange={(e) => setEnteredUpiId(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-action-primary upi-verify-btn"
                      disabled={!enteredUpiId.includes('@')}
                      onClick={handleSendUpiCollectRequest}
                    >
                      Verify & Pay
                    </button>
                  </div>
                  <p className="upi-helper-note">
                    A collect request for <strong>₹{formattedAmount}</strong> will be sent to your UPI app.
                  </p>
                </div>

                {isRequestSent && (
                  <div className="upi-request-sent-card" id="upi-request-sent-card">
                    <div className="request-sent-header">
                      <span className="pulsing-live-dot" />
                      <strong>Payment Request Sent to {enteredUpiId}</strong>
                    </div>
                    <p>
                      Open your UPI mobile app (Google Pay / PhonePe) and approve the payment of <strong>₹{formattedAmount}</strong> within the hold timer.
                    </p>
                    <button
                      type="button"
                      id="btn-simulate-vpa-approval"
                      className="btn-simulate-payment"
                      style={{ marginTop: '14px' }}
                      onClick={() => triggerSuccessfulPayment('UPI ID Collect', enteredUpiId)}
                    >
                      Approve ₹{formattedAmount} in UPI App (Demo)
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CREDIT / DEBIT CARD */}
            {activeTab === 'CARD' && (
              <div className="tab-pane-card" id="pane-card">
                {!showOtpScreen ? (
                  <div className="card-input-form">
                    <div className="form-group" style={{ marginBottom: '14px' }}>
                      <label className="form-label">Card Number</label>
                      <input
                        type="text"
                        className="form-control"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="4532 •••• •••• ••••"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">Valid Thru</label>
                        <input
                          type="text"
                          className="form-control"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">CVV / CVC</label>
                        <input
                          type="password"
                          className="form-control"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="•••"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-proceed-card-otp"
                      className="btn-action-primary"
                      onClick={() => setShowOtpScreen(true)}
                    >
                      Pay ₹{formattedAmount} via Card
                    </button>
                  </div>
                ) : (
                  <div className="card-otp-simulation-box" id="card-otp-simulation">
                    <div className="otp-modal-header">
                      <div style={{ fontWeight: 800, fontSize: '15px' }}>Verified by Visa / Mastercard 3DS</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-ink-muted)' }}>Bank OTP Authentication</div>
                    </div>
                    <p style={{ fontSize: '13px', margin: '12px 0' }}>
                      An OTP has been sent to the registered mobile number ending with <strong>•••210</strong>.
                    </p>
                    <div className="otp-demo-code-banner">Demo OTP: <strong>482910</strong></div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter 6-digit OTP"
                        value={otpValue}
                        onChange={(e) => setOtpValue(e.target.value)}
                      />
                      <button
                        type="button"
                        id="btn-submit-card-otp"
                        className="btn-action-primary"
                        onClick={() => triggerSuccessfulPayment('Credit/Debit Card (3DS Verified)')}
                      >
                        Submit OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="payment-modal-footer">
          <button
            type="button"
            id="btn-cancel-payment-hold"
            className="btn-cancel-payment"
            onClick={onCancelPayment}
          >
            Cancel Payment & Release Hold
          </button>

          <div className="payment-footer-security">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>PCI-DSS Level 1 · End-to-End Secure</span>
          </div>
        </div>
      </div>
    </div>
  )
}
