import { useState, useMemo } from 'react'
import type { EventItem } from '../types'

interface EventDiscoveryProps {
  events: EventItem[]
  onSelectEvent: (event: EventItem) => void
}

export function EventDiscovery({ events, onSelectEvent }: EventDiscoveryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('Bengaluru')

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const matchCity = selectedCity === 'ALL' || e.city.toLowerCase() === selectedCity.toLowerCase()
      const matchQuery =
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.venueName.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCity && matchQuery
    })
  }, [events, searchQuery, selectedCity])

  return (
    <div id="screen-discovery">
      {/* Hero Banner */}
      <section className="hero-banner" id="hero-banner">
        <div className="eyebrow-text">Your Next Experience</div>
        <h1 className="hero-heading">Find your next live moment.</h1>
        <p className="hero-subheading">
          Discover events, choose your seats, and book with confidence.
        </p>

        {/* Search & Location Bar */}
        <div className="search-filter-card" id="search-filter-card">
          <div className="search-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              id="search-input"
              className="search-field"
              placeholder="Search concerts, shows and events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            id="city-filter-select"
            className="city-pill-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            aria-label="Filter events by city"
          >
            <option value="Bengaluru">Bengaluru</option>
            <option value="ALL">All Cities</option>
          </select>
        </div>
      </section>

      {/* Featured Events Section */}
      <section id="featured-events-section">
        <div className="section-header-row">
          <h2 className="section-title">
            Featured events <span className="location-tag">· {selectedCity === 'ALL' ? 'All Locations' : selectedCity}</span>
          </h2>
        </div>

        <div className="events-grid" id="events-grid">
          {filteredEvents.map((event) => (
            <article key={event.id} className="event-card" id={`card-${event.id}`}>
              <div className="card-media-wrapper">
                <img
                  src={event.imageUrl || '/images/aurora_live.jpg'}
                  alt={event.title}
                  className="card-cover-image"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/images/aurora_live.jpg'
                  }}
                />
                <span className="category-badge-overlay">{event.category}</span>
              </div>

              <div className="card-body">
                <h3 className="card-event-title">{event.title}</h3>
                <div className="card-meta-line">
                  {event.dateTime} · {event.venueName}
                </div>

                <div className="card-footer-row">
                  <div className="price-text-block">
                    <span className="price-label">Tickets</span>
                    <span className="price-val">From ₹{event.minPrice.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    type="button"
                    id={`btn-choose-${event.id}`}
                    className="btn-choose-seats"
                    onClick={() => onSelectEvent(event)}
                  >
                    Choose seats
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Trust & Guarantees Banner */}
      <section className="trust-banner-card" id="trust-banner">
        <h3 className="trust-title">Booking you can trust</h3>
        <p className="trust-desc">
          Clear seat availability, transparent pricing, and confirmed booking details backed by server-side locking.
        </p>
      </section>
    </div>
  )
}
