import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface NetworkStatus {
  isOnline: boolean
  isOffline: boolean
  pendingMutations: number
}

export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingMutations] = useState(0)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Back online - syncing changes...')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.error('You are offline - changes will be synced later')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, isOffline: !isOnline, pendingMutations }
}
