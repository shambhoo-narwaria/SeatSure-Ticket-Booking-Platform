interface HeaderProps {
  isBackendConnected: boolean
}

export function Header({ isBackendConnected }: HeaderProps) {
  return (
    <header className="app-header" id="main-header">
      <div className="container header-content">
        <div className="brand-wrapper">
          <div className="brand-icon" id="brand-logo" aria-label="SeatSure Logo">
            S
          </div>
          <div className="brand-text">
            <h1>SeatSure</h1>
            <p>Smart Ticket Reservation Platform</p>
          </div>
        </div>

        <div className="header-badges">
          <span className="badge badge-version" id="version-badge">
            Version 0 • MVP Slice
          </span>
          <span
            className={`badge ${isBackendConnected ? 'badge-status-online' : 'badge-status-offline'}`}
            id="backend-status-badge"
            title={
              isBackendConnected
                ? 'Connected to Spring Boot backend and PostgreSQL 16'
                : 'Backend on standby / Demo seed data mode'
            }
          >
            <span className="status-dot"></span>
            {isBackendConnected ? 'API Live (PostgreSQL)' : 'Seed Mode (Standby)'}
          </span>
        </div>
      </div>
    </header>
  )
}
