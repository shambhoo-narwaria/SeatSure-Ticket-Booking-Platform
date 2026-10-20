import { useState } from 'react'
import type { User, UserRole } from '../types'
import { DEMO_USERS, saveUserSession } from '../services/auth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess: (user: User, message: string) => void
  currentRole?: UserRole
}

// Minimalist Enterprise SVG Icons
function UserIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ShieldIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function CloseIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function AuthModal({ isOpen, onClose, onAuthSuccess, currentRole }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'register'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('ROLE_CUSTOMER')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  // 1-Click Demo Quick Switch
  const handleDemoSelect = (role: 'CUSTOMER' | 'ADMIN') => {
    const user = DEMO_USERS[role]
    saveUserSession(user)
    onAuthSuccess(
      user,
      role === 'ADMIN'
        ? 'Switched to Platform Admin mode (Full inventory telemetry unlocked).'
        : 'Switched to Customer mode (Ticket booking and checkout enabled).',
    )
    onClose()
  }

  // Handle Standard Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email || !password) {
      setErrorMsg('Please enter both email and password.')
      return
    }

    if (tab === 'register' && !fullName) {
      setErrorMsg('Please provide your full name.')
      return
    }

    const assignedRole = tab === 'signin' 
      ? (email.toLowerCase().includes('admin') ? 'ROLE_ADMIN' : 'ROLE_CUSTOMER')
      : selectedRole

    const user: User = {
      id: `usr-${Math.floor(1000 + Math.random() * 9000)}`,
      email,
      fullName: tab === 'register' ? fullName : (email.split('@')[0]),
      role: assignedRole,
      token: `jwt-${assignedRole.toLowerCase()}-token`,
    }

    saveUserSession(user)
    onAuthSuccess(
      user,
      `Welcome, ${user.fullName}. Signed in as ${assignedRole === 'ROLE_ADMIN' ? 'Admin' : 'Customer'}.`,
    )
    onClose()
  }

  return (
    <div
      className="auth-modal-overlay"
      id="modal-auth-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="auth-modal-card" id="modal-auth-card">
        {/* Modal Header */}
        <div className="auth-modal-header">
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)' }}>
              Authentication & Role Portal
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
              Experience SeatSure as a Ticket Buyer or Platform Administrator
            </p>
          </div>
          <button
            type="button"
            className="auth-close-btn"
            id="btn-close-auth-modal"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        {/* 1-Click Recruiter Demo Access Box */}
        <div className="demo-evaluator-box" id="box-recruiter-demo">
          <div className="demo-box-badge">Quick Demo Access</div>
          <p style={{ fontSize: '12px', color: 'var(--color-ink-muted)', marginBottom: '12px' }}>
            Instant role switching with pre-configured accounts to evaluate concurrency and permissions:
          </p>
          <div className="demo-btn-grid">
            <button
              type="button"
              id="btn-demo-customer"
              className={`demo-role-btn ${currentRole === 'ROLE_CUSTOMER' ? 'active-role' : ''}`}
              onClick={() => handleDemoSelect('CUSTOMER')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="demo-icon-wrapper user-icon-wrap">
                  <UserIcon size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Customer Persona</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                    customer@seatsure.com
                  </div>
                </div>
              </div>
              <span className="demo-role-pill customer-pill">Book & Checkout</span>
            </button>

            <button
              type="button"
              id="btn-demo-admin"
              className={`demo-role-btn ${currentRole === 'ROLE_ADMIN' ? 'active-role' : ''}`}
              onClick={() => handleDemoSelect('ADMIN')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="demo-icon-wrapper admin-icon-wrap">
                  <ShieldIcon size={18} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>Admin / Organizer</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                    admin@seatsure.com
                  </div>
                </div>
              </div>
              <span className="demo-role-pill admin-pill">Inventory & Locks</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tab-row">
          <button
            type="button"
            id="tab-btn-signin"
            className={`auth-subtab ${tab === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setTab('signin')
              setErrorMsg(null)
            }}
          >
            Sign In with Email
          </button>
          <button
            type="button"
            id="tab-btn-register"
            className={`auth-subtab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setTab('register')
              setErrorMsg(null)
            }}
          >
            Create New Account
          </button>
        </div>

        {errorMsg && (
          <div className="auth-error-banner" id="auth-error-msg">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginTop: '16px' }}>
          {tab === 'register' && (
            <div style={{ marginBottom: '14px' }}>
              <label className="auth-input-label" htmlFor="reg-fullname">
                Full Name
              </label>
              <input
                id="reg-fullname"
                type="text"
                className="auth-input-field"
                placeholder="e.g. Shambhoo Narwaria"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div style={{ marginBottom: '14px' }}>
            <label className="auth-input-label" htmlFor="auth-email">
              Email Address
            </label>
            <input
              id="auth-email"
              type="email"
              className="auth-input-field"
              placeholder="e.g. name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label className="auth-input-label" htmlFor="auth-password">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="auth-input-field"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Registration Role Selector */}
          {tab === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label className="auth-input-label">Account Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label
                  className={`role-select-card ${
                    selectedRole === 'ROLE_CUSTOMER' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ROLE_CUSTOMER"
                    checked={selectedRole === 'ROLE_CUSTOMER'}
                    onChange={() => setSelectedRole('ROLE_CUSTOMER')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                    <UserIcon size={14} />
                    <span>Customer</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                    Standard ticket booking
                  </div>
                </label>

                <label
                  className={`role-select-card ${
                    selectedRole === 'ROLE_ADMIN' ? 'selected' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value="ROLE_ADMIN"
                    checked={selectedRole === 'ROLE_ADMIN'}
                    onChange={() => setSelectedRole('ROLE_ADMIN')}
                    style={{ display: 'none' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '13px' }}>
                    <ShieldIcon size={14} />
                    <span>Organizer / Admin</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-ink-muted)', marginTop: '4px' }}>
                    Manage events & seats
                  </div>
                </label>
              </div>

              {selectedRole === 'ROLE_ADMIN' && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#475569',
                  }}
                >
                  <strong>Role-Based Access Control:</strong> In production environments, administrative accounts require an organization invitation key to prevent privilege escalation. For this demonstration, permissions are granted directly.
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            id="btn-auth-submit"
            className="btn-action-primary"
            style={{ width: '100%', marginTop: '6px', height: '46px', fontSize: '14px' }}
          >
            {tab === 'signin' ? 'Sign In' : 'Register Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
