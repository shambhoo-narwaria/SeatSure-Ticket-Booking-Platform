import { useState, useEffect } from 'react'
import { Navbar } from './components/Navbar'
import { EventDiscovery } from './components/EventDiscovery'
import { SeatMapScreen } from './components/SeatMapScreen'
import { CheckoutScreen } from './components/CheckoutScreen'
import { ConfirmationScreen } from './components/ConfirmationScreen'
import { AdminScreen } from './components/AdminScreen'
import { MyBookingsScreen } from './components/MyBookingsScreen'
import { AuthModal } from './components/AuthModal'
import { fetchEvents, fetchEventSeats, holdSeats, confirmBooking, releaseHold } from './services/api'
import { getStoredUser, clearUserSession, DEMO_USERS, saveUserSession } from './services/auth'
import type { ActiveScreen, Booking, EventItem, Seat, User, HoldResponse } from './types'

export function App() {
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('discover')
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set())
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auth & RBAC State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getStoredUser())
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false)

  // Seat Hold State
  const [isHolding, setIsHolding] = useState<boolean>(false)
  const [holdError, setHoldError] = useState<string | null>(null)
  const [activeHold, setActiveHold] = useState<HoldResponse | null>(null)
  const [lastBookingTimestamp, setLastBookingTimestamp] = useState<number>(0)

  const triggerToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // 1. Initial Load of live events from PostgreSQL backend
  const loadData = async () => {
    setLoading(true)
    setConnectionError(null)
    const { events: fetchedEvents, error } = await fetchEvents()

    if (error || fetchedEvents.length === 0) {
      setConnectionError(error || 'No live events found in PostgreSQL.')
      setEvents([])
      setSelectedEvent(null)
      setSeats([])
      setLoading(false)
      return
    }

    setEvents(fetchedEvents)
    setSelectedEvent(fetchedEvents[0])
    const { seats: fetchedSeats } = await fetchEventSeats(fetchedEvents[0].id)
    setSeats(fetchedSeats)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // 2. Switch Event selection
  const handleSelectEvent = async (event: EventItem) => {
    if (activeHold?.bookingId) {
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
    }
    setSelectedEvent(event)
    setSelectedSeatIds(new Set())
    setHoldError(null)
    setIsHolding(false)
    const { seats: fetchedSeats } = await fetchEventSeats(event.id)
    setSeats(fetchedSeats)
    setActiveScreen('seatmap')
  }

  // Back from Checkout to Seat Map (releases DB hold so seats become AVAILABLE for all users, matching BookMyShow behavior)
  const handleBackToSeats = async () => {
    if (activeHold?.bookingId) {
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
    }
    if (selectedEvent) {
      const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
      setSeats(freshSeats)
    }
    setActiveScreen('seatmap')
    triggerToast('Seat hold released. You can change your seats freely.')
  }

  // Explicit cancellation of active hold by user
  const handleReleaseActiveHold = async () => {
    if (activeHold?.bookingId) {
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
    }
    setSelectedSeatIds(new Set())
    if (selectedEvent) {
      const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
      setSeats(freshSeats)
    }
    triggerToast('Seat hold released. Seats are available again.')
  }

  const handleBackToDiscover = async () => {
    if (activeHold?.bookingId) {
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
    }
    setSelectedSeatIds(new Set())
    setActiveScreen('discover')
  }

  const handleProceedToCheckout = async () => {
    if (!selectedEvent || selectedSeatIds.size === 0) return

    // If an active hold already covers the exact selected seats, resume directly to checkout
    if (activeHold && activeHold.seatIds) {
      const currentSelected = Array.from(selectedSeatIds).sort()
      const heldSorted = [...activeHold.seatIds].sort()
      const isSame =
        currentSelected.length === heldSorted.length &&
        currentSelected.every((id, idx) => id === heldSorted[idx])
      if (isSame) {
        setActiveScreen('checkout')
        return
      }
      // Selection changed: release previous hold first
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
    }

    setIsHolding(true)
    setHoldError(null)

    const seatIdsArray = Array.from(selectedSeatIds)
    const result = await holdSeats(
      selectedEvent.id,
      seatIdsArray,
      undefined,
      currentUser?.id,
      activeHold?.bookingId,
    )

    setIsHolding(false)
    if (result.success && result.data) {
      setActiveHold(result.data)
      triggerToast('Seats held successfully! 5-minute checkout timer started.')
      // Refresh live seats from backend to reflect true PostgreSQL locked status
      const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
      setSeats(freshSeats)
      setActiveScreen('checkout')
    } else {
      const errMsg = result.error || 'One or more selected seats are no longer available.'
      setHoldError(errMsg)
      triggerToast(`Hold conflict: ${errMsg}`)
      // Refresh live seats from backend
      const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
      setSeats(freshSeats)
    }
  }

  // 3. Toggle Seat Selection (local UI selection, no hold mode until checkout)
  const handleToggleSeat = async (seat: Seat) => {
    const isSelected = selectedSeatIds.has(seat.id)
    const isHeldByMe = Boolean(activeHold?.seatIds?.includes(seat.id))
    if (!isSelected && seat.status !== 'AVAILABLE' && !isHeldByMe) return

    // If an active hold exists and user changes selection, release it so seats become available in PostgreSQL for all
    if (activeHold?.bookingId) {
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
      if (selectedEvent) {
        const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
        setSeats(freshSeats)
      }
    }

    const next = new Set(selectedSeatIds)
    if (isSelected) {
      next.delete(seat.id)
    } else {
      if (next.size >= 6) {
        triggerToast('Maximum booking limit is 6 seats per transaction.')
        return
      }
      next.add(seat.id)
    }
    setSelectedSeatIds(next)
  }

  // 4. Remove Seat from sidebar
  const handleRemoveSeat = async (seatId: string) => {
    if (activeHold?.bookingId) {
      await releaseHold(activeHold.bookingId)
      setActiveHold(null)
      if (selectedEvent) {
        const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
        setSeats(freshSeats)
      }
    }

    const next = new Set(selectedSeatIds)
    next.delete(seatId)
    setSelectedSeatIds(next)
  }

  // 5. Confirm Booking & Checkout (persists to PostgreSQL)
  const handleConfirmBooking = async (customer: {
    name: string
    email: string
    phone: string
    paymentMethod: string
  }) => {
    if (!selectedEvent) return

    const bookedSeats = seats.filter((s) => selectedSeatIds.has(s.id))
    const subtotal = bookedSeats.reduce((sum, s) => sum + s.price, 0)
    const totalAmount = subtotal + bookedSeats.length * 60

    let bookingRef = `SS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    if (activeHold?.bookingId) {
      const confirmResult = await confirmBooking(activeHold.bookingId)
      if (confirmResult.success && confirmResult.data) {
        bookingRef = `SS-${confirmResult.data.id.substring(0, 8).toUpperCase()}`
      } else {
        triggerToast(confirmResult.error || 'Booking confirmation failed.')
        return
      }
    }

    const newBooking: Booking = {
      bookingReference: bookingRef,
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      venueName: selectedEvent.venueName,
      dateTime: selectedEvent.dateTime,
      seats: bookedSeats,
      customerName: customer.name || currentUser?.fullName || 'Rahul Sharma',
      customerEmail: customer.email || currentUser?.email || 'customer@seatsure.com',
      customerPhone: customer.phone,
      paymentMethod: customer.paymentMethod,
      totalAmount,
      confirmedAt: new Date().toLocaleTimeString(),
    }

    // Refresh live seats directly from PostgreSQL
    const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
    setSeats(freshSeats)

    setConfirmedBooking(newBooking)
    setSelectedSeatIds(new Set())
    setActiveHold(null)
    setLastBookingTimestamp(Date.now())
    setActiveScreen('bookings')
    triggerToast(`Booking ${bookingRef} confirmed! Your admission pass is ready in My Bookings.`)
  }

  // 6. Reset Demo / Refresh Live Inventory
  const handleResetDemo = async () => {
    if (!selectedEvent) return
    const { seats: freshSeats } = await fetchEventSeats(selectedEvent.id)
    setSeats(freshSeats)
    setSelectedSeatIds(new Set())
    setConfirmedBooking(null)
    triggerToast('Live inventory re-fetched from PostgreSQL database.')
  }

  // 7. Auth Handlers
  const handleAuthSuccess = (user: User, message: string) => {
    setCurrentUser(user)
    triggerToast(message)
    if (user.role === 'ROLE_ADMIN') {
      setActiveScreen('admin')
    } else if (activeScreen === 'admin') {
      setActiveScreen('discover')
    }
  }

  const handleSignOut = () => {
    clearUserSession()
    setCurrentUser(null)
    if (activeScreen === 'admin') {
      setActiveScreen('discover')
    }
    triggerToast('Signed out of SeatSure.')
  }

  const handleQuickSwitchToAdmin = () => {
    const adminUser = DEMO_USERS.ADMIN
    saveUserSession(adminUser)
    setCurrentUser(adminUser)
    setActiveScreen('admin')
    triggerToast('Switched to Platform Admin mode (ROLE_ADMIN).')
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-ink-muted)',
          fontSize: '15px',
        }}
      >
        Connecting to SeatSure live backend...
      </div>
    )
  }

  if (connectionError || !selectedEvent) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
          Unable to connect to live backend
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--color-ink-muted)', maxWidth: '440px', marginBottom: '20px' }}>
          {connectionError || 'No live events are currently available in the database.'}
        </p>
        <button
          type="button"
          className="btn-action-primary"
          style={{ width: 'auto', padding: '10px 24px' }}
          onClick={() => loadData()}
        >
          Retry Live Connection
        </button>
      </div>
    )
  }

  const selectedSeatsList = seats.filter((s) => selectedSeatIds.has(s.id))

  return (
    <>
      <Navbar
        activeScreen={activeScreen}
        onSelectScreen={(screen) => {
          if (activeScreen === 'checkout' && screen === 'seatmap') {
            handleBackToSeats()
          } else {
            setActiveScreen(screen)
          }
        }}
        selectedSeatsCount={selectedSeatIds.size}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
      />

      <main className="container" id="main-application-view">
        {activeScreen === 'discover' && (
          <EventDiscovery
            events={events}
            onSelectEvent={handleSelectEvent}
          />
        )}

        {activeScreen === 'seatmap' && (
          <SeatMapScreen
            event={selectedEvent}
            seats={seats}
            selectedSeatIds={selectedSeatIds}
            onToggleSeat={handleToggleSeat}
            onRemoveSeat={handleRemoveSeat}
            onProceedToCheckout={handleProceedToCheckout}
            onBackToDiscover={handleBackToDiscover}
            isHolding={isHolding}
            holdError={holdError}
            activeHold={activeHold}
            onReleaseHold={handleReleaseActiveHold}
          />
        )}

        {activeScreen === 'checkout' && (
          <CheckoutScreen
            event={selectedEvent}
            selectedSeats={selectedSeatsList}
            onBackToSeats={handleBackToSeats}
            onConfirmBooking={handleConfirmBooking}
            activeHold={activeHold}
          />
        )}

        {activeScreen === 'confirmation' && confirmedBooking && (
          <ConfirmationScreen
            booking={confirmedBooking}
            onBookAnother={() => setActiveScreen('discover')}
          />
        )}

        {activeScreen === 'admin' && (
          <AdminScreen
            events={events}
            seats={seats}
            currentUser={currentUser}
            onResetDemo={handleResetDemo}
            onSwitchToAdminRole={handleQuickSwitchToAdmin}
          />
        )}

        {activeScreen === 'bookings' && (
          <MyBookingsScreen
            currentUser={currentUser}
            events={events}
            onNavigateToDiscover={() => setActiveScreen('discover')}
            onSelectEventForBooking={handleSelectEvent}
            lastBookingTimestamp={lastBookingTimestamp}
          />
        )}
      </main>

      {/* Recruiter / Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        currentRole={currentUser?.role}
      />

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 100 }}>
          <div
            style={{
              background: 'var(--color-ink)',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            }}
          >
            {toastMessage}
          </div>
        </div>
      )}
    </>
  )
}

export default App
