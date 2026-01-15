import { formatDistanceToNow } from 'date-fns'
import {
  LogOut,
  Plus,
  MapPin,
  TrendingDown,
  TrendingUp,
  Flame,
  Settings,
  Edit,
  Trash2,
} from 'lucide-react'
import { createContext, useState, useContext, useEffect } from 'react'
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

import { ChartsPage, Logger, ProtectedRoute, SettingsPage } from '@/components/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ErrorBanner } from '@/components/ui/error-banner'
import { OfflineStatus } from '@/components/ui/offline-status'
import { useClimbs, useCreateClimb, useUpdateClimb, useDeleteClimb } from '@/hooks/useClimbs'
import { useAuth } from '@/lib/auth'
import { COLOR_CIRCUIT } from '@/lib/grades'
import { initSyncManager } from '@/lib/syncManager'
import type { CreateClimbInput } from '@/lib/validation'
import type { Climb, HoldColor } from '@/types'

/* eslint-disable no-unused-vars */
interface ClimbActionsContextType {
  onEditClick: (climb: Climb) => void
  onDeleteClick: (climb: Climb) => void
}
/* eslint-enable no-unused-vars */

const ClimbActionsContext = createContext<ClimbActionsContextType | undefined>(undefined)

// Color mapping for hold colors (matches ColorSettings component)
const HOLD_COLOR_MAP: Record<HoldColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
  black: '#18181b',
  white: '#fafafa',
  orange: '#f97316',
  purple: '#a855f7',
  pink: '#ec4899',
}

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

  const gradeScaleLabels: Record<string, string> = {
    font: 'Font',
    v_scale: 'V-Scale',
    color_circuit: 'Color',
  }

  return (
    <div className="flex flex-col gap-4 mb-24">
      {climbs.map((climb) => {
        const date = new Date(climb.created_at)
        const dateLabel = formatDistanceToNow(date, { addSuffix: true })

        return (
          <div
            key={climb.id}
            className="group bg-white/[0.02] border-2 border-white/10 p-6 hover:border-white/30 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 pt-2">
                <div className="flex flex-col">
                  <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-1">
                    {dateLabel}
                  </div>
                  <div className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {climb.location}
                  </div>
                  {climb.hold_color !== null && climb.hold_color !== undefined && (
                    <div className="text-xs font-mono text-[#666] uppercase tracking-wider flex items-center gap-2 mt-1">
                      <span>Hold Color</span>
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white/20"
                        style={{ backgroundColor: HOLD_COLOR_MAP[climb.hold_color] }}
                        aria-label={`Hold color: ${climb.hold_color}`}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onEditClick(climb)}
                  className="p-2 text-[#666] hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Edit climb"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteClick(climb)}
                  className="p-2 text-[#666] hover:text-red-400 hover:bg-white/10 transition-all"
                  aria-label="Delete climb"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-[#666]">
                  {gradeScaleLabels[climb.grade_scale]}
                </span>
                {climb.grade_scale === 'color_circuit' ? (
                  (() => {
                    const color = COLOR_CIRCUIT.find((c) => c.name === climb.grade_value)
                    return color ? (
                      <div
                        key={color.name}
                        className={`text-3xl font-black tracking-tight ${color.textColor}`}
                      >
                        {color.letter}
                      </div>
                    ) : (
                      <div className="text-3xl font-black tracking-tight">{climb.grade_value}</div>
                    )
                  })()
                ) : (
                  <div className="text-3xl font-black tracking-tight">{climb.grade_value}</div>
                )}
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1 border-2 ${
                  climb.outcome === 'Sent'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/50 text-red-400'
                }`}
              >
                {climb.outcome === 'Sent' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-xs font-black uppercase tracking-wider">{climb.outcome}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-4 text-xs font-mono text-[#666] uppercase tracking-wider">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                <span>Awkwardness: {climb.awkwardness}/5</span>
              </div>
            </div>

            <div className="space-y-3">
              {climb.style.length > 0 && (
                <div>
                  <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                    Style
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {climb.style.map((style) => (
                      <Badge
                        key={style}
                        variant="outline"
                        className="text-xs font-mono uppercase border-white/20 text-[#ccc] px-2 py-1"
                      >
                        {style}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {climb.failure_reasons.length > 0 && (
                <div>
                  <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                    {climb.outcome === 'Fail' ? 'Failure Reasons' : 'Imperfect Aspects'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {climb.failure_reasons.map((reason) => (
                      <Badge
                        key={reason}
                        variant="outline"
                        className="text-xs font-mono uppercase border-white/20 text-[#ccc] px-2 py-1"
                      >
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {climb.notes !== null && climb.notes.trim().length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-xs font-mono text-[#666] uppercase tracking-wider mb-2">
                    Notes
                  </div>
                  <p className="text-sm text-[#bbb] leading-relaxed">{climb.notes}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
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
  const createClimb = useCreateClimb()
  const updateClimb = useUpdateClimb()
  const deleteClimb = useDeleteClimb()

  // Initialize sync manager on mount
  useEffect(() => {
    initSyncManager()
  }, [])

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
          setLoggerOpen(false)
          toast.success('Climb logged successfully')
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
        </nav>

        <ClimbActionsContext.Provider
          value={{ onEditClick: handleEditClick, onDeleteClick: handleDeleteClick }}
        >
          <Outlet />
        </ClimbActionsContext.Provider>

        {location.pathname === '/' && (
          <div className="fixed bottom-6 right-6">
            <Logger
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
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </ProtectedRoute>
    </BrowserRouter>
  )
}
