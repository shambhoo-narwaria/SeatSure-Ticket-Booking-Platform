import { useState } from 'react'
import type { Seat } from '../types'

interface SeatMapProps {
  seats: Seat[]
  selectedSeatIds: Set<string>
  onToggleSeat: (seat: Seat) => void
}

export function SeatMap({ seats, selectedSeatIds, onToggleSeat }: SeatMapProps) {
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null)

  // Group seats by row
  const rowsMap = new Map<string, Seat[]>()
  seats.forEach((seat) => {
    const list = rowsMap.get(seat.row) || []
    list.push(seat)
    rowsMap.set(seat.row, list)
  })

  const rows = Array.from(rowsMap.entries()).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="seatmap-container" id="seatmap-container">
      {/* Curved Screen / Stage */}
      <div className="stage-wrapper" id="stage-visual">
        <div className="stage-curve"></div>
        <div className="stage-label">Auditorium Stage / Screen</div>
      </div>

      {/* Legend */}
      <div className="seat-legend" id="seat-legend">
        <div className="legend-item">
          <span className="legend-sample sample-available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-sample sample-selected"></span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-sample sample-held"></span>
          <span>Held (Checkout Pending)</span>
        </div>
        <div className="legend-item">
          <span className="legend-sample sample-booked"></span>
          <span>Booked (Sold)</span>
        </div>
      </div>

      {/* Seating Grid */}
      <div className="seating-grid" id="seating-grid" role="region" aria-label="Interactive Seat Map">
        {rows.map(([rowName, rowSeats]) => (
          <div key={rowName} className="seat-row" id={`seat-row-${rowName}`}>
            <span className="row-label">{rowName}</span>

            {rowSeats
              .sort((a, b) => a.number - b.number)
              .map((seat) => {
                const isSelected = selectedSeatIds.has(seat.id)
                const isAvailable = seat.status === 'AVAILABLE'

                let stateClass = 'available'
                if (isSelected) {
                  stateClass = 'selected'
                } else if (seat.status === 'BOOKED') {
                  stateClass = 'booked'
                } else if (seat.status === 'HELD') {
                  stateClass = 'held'
                }

                return (
                  <div key={seat.id} className="seat-cell">
                    <button
                      type="button"
                      id={`seat-${seat.row}-${seat.number}`}
                      className={`seat-btn ${stateClass}`}
                      disabled={!isSelected && !isAvailable}
                      onClick={() => onToggleSeat(seat)}
                      onMouseEnter={() => setHoveredSeat(seat)}
                      onMouseLeave={() => setHoveredSeat(null)}
                      aria-label={`Seat ${seat.row}${seat.number}, ${seat.tier}, $${seat.price}, ${seat.status}`}
                    >
                      {seat.number}
                    </button>

                    {hoveredSeat?.id === seat.id && (
                      <div className="seat-tooltip">
                        <strong>
                          Seat {seat.row}-{seat.number}
                        </strong>{' '}
                        • {seat.tier} • ${seat.price}
                        <br />
                        <span style={{ color: 'var(--text-muted)' }}>Status: {seat.status}</span>
                      </div>
                    )}
                  </div>
                )
              })}

            <span className="row-label">{rowName}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
