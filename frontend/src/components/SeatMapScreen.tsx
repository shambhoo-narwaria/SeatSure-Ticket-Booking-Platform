import { useState } from 'react'
import type { EventItem, Seat, HoldResponse } from '../types'

interface SeatMapScreenProps {
  event: EventItem
  seats: Seat[]
  selectedSeatIds: Set<string>
  onToggleSeat: (seat: Seat) => void
  onRemoveSeat: (seatId: string) => void
  onProceedToCheckout: () => void | Promise<void>
  onBackToDiscover: () => void
  isHolding?: boolean
  holdError?: string | null
  activeHold?: HoldResponse | null
  onReleaseHold?: () => void | Promise<void>
}

export function SeatMapScreen({
  event,
  seats,
  selectedSeatIds,
  onToggleSeat,
  onRemoveSeat,
  onProceedToCheckout,
  onBackToDiscover,
  isHolding = false,
  holdError = null,
  activeHold = null,
  onReleaseHold,
}: SeatMapScreenProps) {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null)

  // Group seats by row
  const rowsMap = new Map<string, Seat[]>()
  seats.forEach((seat) => {
    const list = rowsMap.get(seat.row) || []
    list.push(seat)
    rowsMap.set(seat.row, list)
  })

  const rows = Array.from(rowsMap.entries()).sort(([a], [b]) => a.localeCompare(b))
  const selectedSeatsList = seats.filter((s) => selectedSeatIds.has(s.id))

  const subtotal = selectedSeatsList.reduce((sum, s) => sum + s.price, 0)
  const bookingFee = selectedSeatsList.length > 0 ? selectedSeatsList.length * 60 : 0
  const grandTotal = subtotal + bookingFee

  return (
    <div id="screen-seatmap">
      <div className="seatmap-layout">
        {/* Main Auditorium Panel */}
        <section className="seatmap-main-panel" id="seatmap-main-panel">
          <div className="seatmap-header-bar">
            <div>
              <button
                type="button"
                id="btn-back-discover"
                className="btn-back-link"
                onClick={onBackToDiscover}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
                Back to Discover
              </button>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)', marginTop: '4px' }}>
                {event.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                {event.dateTime} · {event.venueName}
              </p>
            </div>
          </div>

          {/* Accessible Legend */}
          <div className="accessible-legend" id="accessible-legend" aria-label="Seat Map Legend">
            <div className="legend-chip">
              <span className="legend-square avail">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="8" />
                </svg>
              </span>
              <span>Available (₹{event.minPrice})</span>
            </div>
            <div className="legend-chip">
              <span className="legend-square selected">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>Selected</span>
            </div>
            <div className="legend-chip">
              <span className="legend-square held">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span>Held (Checkout Pending)</span>
            </div>
            <div className="legend-chip">
              <span className="legend-square booked">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </span>
              <span>Booked (Sold)</span>
            </div>
          </div>

          {/* Stage Visualization */}
          <div className="stage-curve-box" id="stage-visual">
            <div className="stage-line"></div>
            <div className="stage-label-text">Auditorium Stage / Front Screen</div>
          </div>

          {/* Grid Rows */}
          <div className="seat-grid-container" id="seat-grid-container" role="region" aria-label="Seat Selection Grid">
            {rows.map(([rowName, rowSeats]) => (
              <div key={rowName} className="seat-grid-row" id={`row-${rowName}`}>
                <span className="seat-row-label">{rowName}</span>

                {rowSeats
                  .sort((a, b) => a.number - b.number)
                  .map((seat) => {
                    const isSelected = selectedSeatIds.has(seat.id)
                    const isHeldByMe = Boolean(activeHold?.seatIds?.includes(seat.id))
                    const isHeldByOther = seat.status === 'HELD' && !isHeldByMe
                    const isAvailable = seat.status === 'AVAILABLE' || isHeldByMe

                    let nodeClass = 'avail'
                    if (isSelected) {
                      nodeClass = 'selected'
                    } else if (seat.status === 'BOOKED') {
                      nodeClass = 'booked'
                    } else if (isHeldByOther) {
                      nodeClass = 'held'
                    }

                    return (
                      <div key={seat.id} style={{ position: 'relative' }}>
                        <button
                          type="button"
                          id={`seat-${seat.row}-${seat.number}`}
                          className={`seat-node ${nodeClass}`}
                          disabled={!isSelected && !isAvailable}
                          onClick={() => onToggleSeat(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          aria-label={`Seat ${seat.row}${seat.number}, ${seat.tier}, ₹${seat.price}, ${seat.status}`}
                        >
                          {isSelected ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          ) : (
                            seat.number
                          )}
                        </button>

                        {hoveredSeat?.id === seat.id && (
                          <div className="seat-popover">
                            <strong>
                              Row {seat.row} · Seat {seat.number}
                            </strong>{' '}
                            ({seat.tier})
                            <br />
                            ₹{seat.price.toLocaleString('en-IN')} ·{' '}
                            {isHeldByOther
                              ? 'Held by another customer'
                              : isHeldByMe
                              ? 'Your selection'
                              : `Status: ${seat.status}`}
                          </div>
                        )}
                      </div>
                    )
                  })}

                <span className="seat-row-label">{rowName}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Order Summary Sidebar */}
        <aside className="order-panel" id="order-summary-sidebar">
          <h3 className="panel-title">Selected seats</h3>
          <p className="panel-subtitle">
            {selectedSeatsList.length} of 6 seats selected
          </p>

          {selectedSeatsList.length === 0 ? (
            <div className="empty-state-notice" id="empty-selection-placeholder">
              Click any available green seat on the map to add it to your booking.
            </div>
          ) : (
            <div className="selected-chips-box" id="selected-chips-list">
              {selectedSeatsList.map((seat) => (
                <div key={seat.id} className="seat-row-chip" id={`chip-${seat.id}`}>
                  <div>
                    <div className="chip-seat-id">
                      Row {seat.row} · Seat {seat.number}
                    </div>
                    <div className="chip-tier-tag">{seat.tier} Tier</div>
                  </div>
                  <div className="chip-price-group">
                    <span className="chip-price-val">₹{seat.price.toLocaleString('en-IN')}</span>
                    <button
                      type="button"
                      className="btn-remove-chip"
                      onClick={() => onRemoveSeat(seat.id)}
                      title="Remove seat"
                      aria-label={`Remove seat ${seat.row}${seat.number}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="breakdown-table">
            <div className="breakdown-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="breakdown-row">
              <span>Booking Fee</span>
              <span>₹{bookingFee.toLocaleString('en-IN')}</span>
            </div>
            <div className="breakdown-row total-row">
              <span>Total Amount</span>
              <span>₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {activeHold && (
            <div
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: '#60a5fa',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                marginBottom: '12px',
                lineHeight: '1.4',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                <span><strong>Active Hold:</strong> Seats currently reserved for you.</span>
              </div>
              {onReleaseHold && (
                <button
                  type="button"
                  id="btn-release-hold"
                  onClick={onReleaseHold}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#f87171',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Release Hold
                </button>
              )}
            </div>
          )}

          {holdError && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                marginBottom: '12px',
                lineHeight: '1.4',
              }}
            >
              <strong>Hold Conflict:</strong> {holdError}
            </div>
          )}

          <button
            type="button"
            id="btn-proceed-checkout"
            className="btn-action-primary"
            disabled={selectedSeatsList.length === 0 || isHolding}
            onClick={onProceedToCheckout}
          >
            {isHolding ? (
              <span>Acquiring Seat Hold...</span>
            ) : activeHold ? (
              `Resume Checkout (₹${grandTotal.toLocaleString('en-IN')})`
            ) : selectedSeatsList.length > 0 ? (
              `Hold & Proceed to Checkout (₹${grandTotal.toLocaleString('en-IN')})`
            ) : (
              'Choose Seats to Proceed'
            )}
          </button>
        </aside>
      </div>
    </div>
  )
}
