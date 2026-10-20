import type { ActiveScreen, User } from '../types'

interface NavbarProps {
  activeScreen: ActiveScreen
  onSelectScreen: (screen: ActiveScreen) => void
  selectedSeatsCount: number
  currentUser: User | null
  onOpenAuthModal: () => void
  onSignOut: () => void
}

function UserIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function ChevronDownIcon({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function Navbar({
  activeScreen,
  onSelectScreen,
  selectedSeatsCount,
  currentUser,
  onOpenAuthModal,
  onSignOut,
}: NavbarProps) {
  const isAdmin = currentUser?.role === 'ROLE_ADMIN'

  return (
    <header className="site-header" id="site-header">
      <div className="container header-inner">
        <div
          className="brand-section"
          id="brand-home-link"
          onClick={() => onSelectScreen('discover')}
          role="button"
          tabIndex={0}
        >
          <span className="brand-name">SeatSure</span>
          <span className="brand-tagline">Moments worth booking.</span>
        </div>

        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            type="button"
            id="nav-discover"
            className={`nav-tab-btn ${activeScreen === 'discover' ? 'active' : ''}`}
            onClick={() => onSelectScreen('discover')}
          >
            Discover
          </button>

          <button
            type="button"
            id="nav-seatmap"
            className={`nav-tab-btn ${activeScreen === 'seatmap' ? 'active' : ''}`}
            onClick={() => onSelectScreen('seatmap')}
          >
            Seat map
            {selectedSeatsCount > 0 && (
              <span className="nav-badge-count" id="nav-selected-count">
                {selectedSeatsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            id="nav-checkout"
            className={`nav-tab-btn ${activeScreen === 'checkout' ? 'active' : ''}`}
            onClick={() => onSelectScreen('checkout')}
            disabled={selectedSeatsCount === 0 && activeScreen !== 'checkout'}
            style={{
              opacity: selectedSeatsCount === 0 && activeScreen !== 'checkout' ? 0.5 : 1,
            }}
          >
            Checkout
          </button>

          <button
            type="button"
            id="nav-my-bookings"
            className={`nav-tab-btn ${activeScreen === 'bookings' ? 'active' : ''}`}
            onClick={() => onSelectScreen('bookings')}
          >
            My Bookings
          </button>



          {/* RBAC Protected: Only visible if authenticated user has ROLE_ADMIN */}
          {isAdmin && (
            <button
              type="button"
              id="nav-admin"
              className={`nav-tab-btn nav-admin-highlight ${activeScreen === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectScreen('admin')}
            >
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* User Persona & Recruiter Demo Control */}
        <div className="nav-auth-cluster" id="nav-auth-cluster">
          {currentUser ? (
            <div className="user-persona-badge">
              <button
                type="button"
                id="btn-switch-role"
                className={`persona-pill ${isAdmin ? 'admin-pill-badge' : 'customer-pill-badge'}`}
                onClick={onOpenAuthModal}
                title="Click to switch between Customer and Admin demo roles"
              >
                <span className="persona-icon">{isAdmin ? <ShieldIcon size={14} /> : <UserIcon size={14} />}</span>
                <span className="persona-name">{currentUser.fullName}</span>
                <span className="persona-role-tag">
                  {isAdmin ? 'ADMIN' : 'CUSTOMER'}
                </span>
                <span className="persona-switch-hint">
                  Switch <ChevronDownIcon size={10} />
                </span>
              </button>

              <button
                type="button"
                id="btn-signout"
                className="btn-signout"
                onClick={onSignOut}
                title="Sign out of current account"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="btn-open-auth-modal"
              className="btn-evaluator-demo"
              onClick={onOpenAuthModal}
            >
              Demo Switcher / Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
