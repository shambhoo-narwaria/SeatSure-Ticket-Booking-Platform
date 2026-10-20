import type { EventItem } from '../types'

interface EventHeroProps {
  event: EventItem
  events: EventItem[]
  onSelectEvent: (eventId: string) => void
}

export function EventHero({ event, events, onSelectEvent }: EventHeroProps) {
  return (
    <section className="event-hero" id="event-hero-section">
      <div className="event-meta-category" id="event-category-pill">
        {event.category}
      </div>

      <h2 className="event-hero-title" id="event-title">
        {event.title}
      </h2>

      <div className="event-details-bar" id="event-details-bar">
        <div className="event-detail-item" id="event-venue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>
            {event.venueName}, {event.city}
          </span>
        </div>

        <div className="event-detail-item" id="event-time">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
          <span>{event.dateTime}</span>
        </div>

        <div className="event-detail-item" id="event-price-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span>From ${event.minPrice}.00 USD</span>
        </div>
      </div>

      <p className="event-description" id="event-description-text">
        {event.description}
      </p>

      {events.length > 1 && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          {events.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectEvent(e.id)}
              style={{
                background: e.id === event.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                border: e.id === event.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                color: e.id === event.id ? '#fff' : '#94a3b8',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {e.title.slice(0, 30)}...
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
