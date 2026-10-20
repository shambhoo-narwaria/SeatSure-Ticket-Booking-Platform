import type { Seat } from '../types'

interface OrderSummaryProps {
  selectedSeats: Seat[]
  onRemoveSeat: (seatId: string) => void
  onHoldSeats: () => void
  isHolding: boolean
}

export function OrderSummary({
  selectedSeats,
  onRemoveSeat,
  onHoldSeats,
  isHolding,
}: OrderSummaryProps) {
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0)
  const serviceFee = selectedSeats.length > 0 ? selectedSeats.length * 2.5 : 0
  const grandTotal = subtotal + serviceFee

  return (
    <aside className="summary-card" id="order-summary-card">
      <div className="summary-header">
        <h2>Booking Summary</h2>
        <p>Selected Seats ({selectedSeats.length} / max 6)</p>
      </div>

      {selectedSeats.length === 0 ? (
        <div className="no-seats-placeholder" id="empty-selection-placeholder">
          Click any available green seat on the map to select it.
        </div>
      ) : (
        <div className="selected-seats-list" id="selected-seats-list">
          {selectedSeats.map((seat) => (
            <div key={seat.id} className="seat-chip" id={`chip-${seat.id}`}>
              <div>
                <div className="seat-chip-name">
                  Row {seat.row} • Seat {seat.number}
                </div>
                <div className="seat-chip-tier">{seat.tier} Tier</div>
              </div>
              <div className="seat-chip-right">
                <span className="seat-chip-price">${seat.price}.00</span>
                <button
                  type="button"
                  className="chip-remove-btn"
                  onClick={() => onRemoveSeat(seat.id)}
                  title="Remove seat"
                  aria-label={`Remove seat ${seat.row}${seat.number}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pricing-table" id="pricing-table">
        <div className="pricing-row">
          <span>Subtotal</span>
          <span>${subtotal}.00</span>
        </div>
        <div className="pricing-row">
          <span>Processing Fee</span>
          <span>${serviceFee.toFixed(2)}</span>
        </div>
        <div className="pricing-row total">
          <span>Grand Total</span>
          <span>${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="button"
        id="hold-seats-button"
        className="btn-primary"
        disabled={selectedSeats.length === 0 || isHolding}
        onClick={onHoldSeats}
      >
        {isHolding
          ? 'Acquiring Lock...'
          : selectedSeats.length > 0
            ? `Hold ${selectedSeats.length} Seat${selectedSeats.length > 1 ? 's' : ''}`
            : 'Select Seats to Continue'}
      </button>

      <div className="version-note-box" id="version-note-box">
        <strong>Version 0 Focus:</strong> Validating seat grid rendering, selection limits, and pricing calculation. Next phase connects directly to the backend pessimistic locking hold endpoint.
      </div>
    </aside>
  )
}
