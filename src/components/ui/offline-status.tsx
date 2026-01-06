import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export function OfflineStatus() {
  const { isOnline, pendingMutations } = useNetworkStatus()

  if (isOnline) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-auto bg-yellow-500 text-black px-4 py-3 z-50">
      <p className="text-xs font-mono uppercase font-bold">
        Offline - {pendingMutations} changes pending sync
      </p>
    </div>
  )
}
