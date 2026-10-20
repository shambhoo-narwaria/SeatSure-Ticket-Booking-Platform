import type { EventItem, Seat, User } from '../types'

interface AdminScreenProps {
  events: EventItem[]
  seats: Seat[]
  currentUser: User | null
  onResetDemo: () => void
  onSwitchToAdminRole?: () => void
}

function LockIcon({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function AdminScreen({
  events,
  seats,
  currentUser,
  onResetDemo,
  onSwitchToAdminRole,
}: AdminScreenProps) {
  const isAdmin = currentUser?.role === 'ROLE_ADMIN'

  // Access Denied / 403 Guard for Non-Admins
  if (!isAdmin) {
    return (
      <div className="admin-overview-container" id="screen-admin-forbidden">
        <div className="admin-forbidden-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <LockIcon size={44} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
            403 Forbidden — Administrative Access Required
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', maxWidth: '520px', margin: '0 auto 24px' }}>
            You are currently signed in as <strong>{currentUser?.fullName || 'Guest'}</strong> with role{' '}
            <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>
              {currentUser?.role || 'UNAUTHENTICATED'}
            </code>
            . Inventory monitoring, PostgreSQL seat lock telemetry, and event publishing are restricted to{' '}
            <strong>ROLE_ADMIN</strong>.
          </p>
          {onSwitchToAdminRole && (
            <button
              type="button"
              id="btn-switch-admin-forbidden"
              className="btn-action-primary"
              style={{ width: 'auto', padding: '10px 24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              onClick={onSwitchToAdminRole}
            >
              <ShieldIcon size={16} />
              <span>Switch to Admin Demo Role</span>
            </button>
          )}
        </div>
      </div>
    )
  }

  const totalSeats = seats.length
  const availableSeats = seats.filter((s) => s.status === 'AVAILABLE').length
  const heldSeats = seats.filter((s) => s.status === 'HELD').length
  const bookedSeats = seats.filter((s) => s.status === 'BOOKED').length

  const confirmedRevenue = seats
    .filter((s) => s.status === 'BOOKED')
    .reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="admin-overview-container" id="screen-admin">
      {/* Admin Authorization Status Banner */}
      <div className="admin-auth-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="admin-shield-icon-wrap">
            <ShieldIcon size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#1e3a8a' }}>
              Authenticated as Platform Administrator
            </div>
            <div style={{ fontSize: '12px', color: '#3b82f6' }}>
              User: <strong>{currentUser?.email}</strong> &bull; Authority:{' '}
              <code>ROLE_ADMIN</code> &bull; All administrative CRUD and PostgreSQL lock controls active
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            id="btn-admin-reset"
            className="btn-action-primary"
            style={{ width: 'auto', background: 'var(--color-ink)', fontSize: '13px' }}
            onClick={onResetDemo}
          >
            Refresh Live Inventory
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-ink)' }}>
          Inventory Telemetry & Concurrency Monitor
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)' }}>
          Real-time visibility into row-level lock states, active hold timeouts, and confirmed revenue
        </p>
      </div>

      {/* Metrics Row */}
      <div className="admin-stats-grid">
        <div className="stat-metric-card">
          <div className="stat-label">Total Capacity</div>
          <div className="stat-value">{totalSeats}</div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-label">Available Seats</div>
          <div className="stat-value" style={{ color: '#16a34a' }}>
            {availableSeats}
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-label">Active Holds (Pending)</div>
          <div className="stat-value" style={{ color: '#d97706' }}>
            {heldSeats}
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-label">Confirmed Bookings</div>
          <div className="stat-value" style={{ color: 'var(--color-indigo)' }}>
            {bookedSeats}
          </div>
        </div>

        <div className="stat-metric-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value" style={{ color: 'var(--color-ink)' }}>
            ₹{confirmedRevenue.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="admin-table-box">
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            fontWeight: 700,
            fontSize: '15px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Configured Events & Published Shows ({events.length})</span>
          <span style={{ fontSize: '12px', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
            Managed by Event Organizers & Admins
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Event Title</th>
              <th>Category</th>
              <th>Venue</th>
              <th>City</th>
              <th>Date & Time</th>
              <th>Base Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((evt) => (
              <tr key={evt.id}>
                <td style={{ fontWeight: 600 }}>{evt.title}</td>
                <td>
                  <span style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    {evt.category}
                  </span>
                </td>
                <td>{evt.venueName}</td>
                <td>{evt.city}</td>
                <td>{evt.dateTime}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>₹{evt.minPrice}</td>
                <td>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {evt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
