import { LogOut, Plus, Settings } from 'lucide-react'
import { createContext, useState, useContext, useEffect, useRef } from 'react'
import {
  BrowserRouter,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  Routes,
  Route,
} from 'react-router-dom'
import { Toaster, toast } from 'sonner'

import { ChartsPage, ClimbCard, CoachPage, Logger, ProtectedRoute, SettingsPage, ChatPage } from '@/components/features'
import type { LoggerHandle } from '@/components/features/logger'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { Footer } from '@/components/ui/footer'
import { OfflineStatus } from '@/components/ui/offline-status'
import { useClimbs, useCreateClimb, useUpdateClimb, useDeleteClimb } from '@/hooks/useClimbs'
import { useProfile } from '@/hooks/useProfile'
import { useTagExtractionFeedback } from '@/hooks/useTagExtractionFeedback'
import { useAuth } from '@/lib/auth'
import { initSyncManager } from '@/lib/syncManager'
import type { CreateClimbInput } from '@/lib/validation'
import type { Climb } from '@/types'

/* eslint-disable no-unused-vars */
interface ClimbActionsContextType {
  onEditClick: (climb: Climb) => void
  onDeleteClick: (climb: Climb) => void
}
/* eslint-enable no-unused-vars */

const ClimbActionsContext = createContext<ClimbActionsContextType | undefined>(undefined)

function Dashboard() {
  const context = useContext(ClimbActionsContext)
  if (context === undefined) {
    throw new Error('Dashboard must be used within a ClimbActionsProvider')
  }

  const { onEditClick, onDeleteClick } = context
  const { data: climbs = [], isLoading, error } = useClimbs()

  if (isLoading) {
    return <div className="text-center py-12 text-[#888]">Loading climbs...</div>
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">Failed to load climbs: {error.message}</div>
    )
  }

  if (climbs.length === 0) {
    return (
      <div className="text-center py-12 text-[#888]">
        <p className="text-sm mb-4">No climbs logged yet</p>
        <p className="text-xs font-mono">Tap the + button to log your first climb</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 mb-24">
      {climbs.map((climb) => (
        <ClimbCard key={climb.id} climb={climb} onEditClick={onEditClick} onDeleteClick={onDeleteClick} />
      ))}
    </div>
  )
}

function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loggerOpen, setLoggerOpen] = useState(false)
  const [editingClimb, setEditingClimb] = useState<Climb | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const { isQuotaReached, showQuotaReached, showExtractionError } = useTagExtractionFeedback()
  const createClimb = useCreateClimb()
  const updateClimb = useUpdateClimb()
  const deleteClimb = useDeleteClimb()
  const extractionError = createClimb.extractionError
  const loggerRef = useRef<LoggerHandle>(null)

  // Initialize sync manager on mount
  useEffect(() => {
    initSyncManager()
  }, [])

  // Show extraction error toast when extraction fails (excluding quota_exceeded which is handled separately)
  useEffect(() => {
    if (extractionError !== undefined && extractionError !== 'quota_exceeded') {
      showExtractionError(extractionError)
    }
  }, [extractionError, showExtractionError])

  const handleClimbSubmit = (data: CreateClimbInput) => {
    if (editingClimb) {
      updateClimb.mutate(
        { id: editingClimb.id, updates: data },
        {
          onSuccess: () => {
            setLoggerOpen(false)
            setEditingClimb(null)
            toast.success('Climb updated successfully')
          },
          onError: (error) => {
            console.error('Failed to update climb:', error)
            setErrorMessage(error.message || 'Failed to update climb')
          },
        }
      )
    } else {
      createClimb.mutate(data, {
        onSuccess: () => {
          loggerRef.current?.resetAllState()
          // Check user preference for closing logger after add
          if (profile?.close_logger_after_add === true) {
            setLoggerOpen(false)
          }
          toast.success('Climb logged successfully')

          // Show quota warning if reached
          // The useTagExtractionFeedback hook tracks quota state
          // When quota is reached, show warning toast with reset time
          if (isQuotaReached === true) {
            showQuotaReached()
          }
        },
        onError: (error) => {
          console.error('Failed to create climb:', error)
          setErrorMessage(error.message || 'Failed to save climb')
        },
      })
    }
  }

  const handleEditClick = (climb: Climb) => {
    setEditingClimb(climb)
    setLoggerOpen(true)
  }

  const handleDeleteClick = (climb: Climb) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this climb?')) {
      deleteClimb.mutate(climb.id, {
        onSuccess: () => {
          toast.success('Climb deleted successfully')
        },
        onError: (error) => {
          console.error('Failed to delete climb:', error)
          setErrorMessage(error.message || 'Failed to delete climb')
        },
      })
    }
  }

  const handleLoggerClose = () => {
    setLoggerOpen(false)
    setEditingClimb(null)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] p-4">
      <OfflineStatus />
      {errorMessage !== null && (
        <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}
      <Toaster
        position="top-center"
        richColors
        duration={3000}
        toastOptions={{
          classNames: {
            toast: 'text-sm',
          },
        }}
      />
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 border-b-2 border-white/20 pb-6 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Scenka</h1>
            <div className="flex items-center gap-3">
              <p className="text-sm font-mono text-[#888] uppercase tracking-widest">
                Track your climbing failures
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                void navigate('/settings')
              }}
              variant="outline"
              className="border-white/20 hover:border-white/40 bg-white/[0.02] text-[#888] hover:text-black"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              onClick={() => {
                void signOut()
              }}
              variant="outline"
              className="border-white/20 hover:border-white/40 bg-white/[0.02] text-[#888] hover:text-black"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex gap-2 mb-8">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex-1 text-center px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
              }`
            }
          >
            Climbs
          </NavLink>
          <NavLink
            to="/analytics"
            className={({ isActive }) =>
              `flex-1 text-center px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
              }`
            }
          >
            Analytics
          </NavLink>
          <NavLink
            to="/coach"
            className={({ isActive }) =>
              `flex-1 text-center px-4 py-3 border-2 text-xs font-black uppercase tracking-wider transition-all ${
                isActive
                  ? 'bg-white/10 border-white/30 text-white'
                  : 'border-white/20 hover:border-white/40 bg-white/[0.02] text-[#aaa]'
              }`
            }
          >
            Coach
          </NavLink>
        </nav>

        <ClimbActionsContext.Provider
          value={{ onEditClick: handleEditClick, onDeleteClick: handleDeleteClick }}
        >
          <Outlet />
        </ClimbActionsContext.Provider>
        <Footer />

        {location.pathname === '/' && (
          <div className="fixed bottom-6 right-6">
            <Logger
              ref={loggerRef}
              open={loggerOpen}
              onOpenChange={handleLoggerClose}
              onSubmit={handleClimbSubmit}
              isSaving={createClimb.isPending || updateClimb.isPending}
              climb={editingClimb}
            />
            {!loggerOpen && (
              <Button
                size="lg"
                className="rounded-none h-16 w-16 bg-white text-black hover:bg-white/90 font-black"
                onClick={() => setLoggerOpen(true)}
              >
                <Plus className="h-8 w-8" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DashboardWrapper() {
  const context = useContext(ClimbActionsContext)
  if (context === undefined) {
    throw new Error('DashboardWrapper must be used within a ClimbActionsProvider')
  }

  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardWrapper />} />
            <Route path="analytics" element={<ChartsPage />} />
            <Route path="coach" element={<CoachPage />} />
            <Route path="coach/chat" element={<ChatPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </ProtectedRoute>
    </BrowserRouter>
  )
}
