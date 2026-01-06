import { offlineQueue } from '@/services/offlineQueue'
import { supabase } from './supabase'

export async function syncOfflineQueue(): Promise<void> {
  const mutations = offlineQueue.getAll()

  if (mutations.length === 0) return

  if (!supabase) {
    console.error('Supabase client not configured')
    return
  }

  console.log(`Syncing ${mutations.length} offline mutations...`)

  for (const mutation of mutations) {
    try {
      switch (mutation.type) {
        case 'create':
          await supabase.from(mutation.tableName).insert(mutation.data)
          break
        case 'update':
          await supabase
            .from(mutation.tableName)
            .update(mutation.data.updates)
            .eq('id', mutation.data.id)
          break
        case 'delete':
          await supabase.from(mutation.tableName).delete().eq('id', mutation.data.id)
          break
      }
      // Success - remove from queue
      offlineQueue.remove(mutation.id)
    } catch (error) {
      console.error(`Failed to sync mutation ${mutation.id}:`, error)
      // Keep in queue for next sync attempt
    }
  }
}

export function initSyncManager(): void {
  // Sync when coming online
  window.addEventListener('online', () => {
    syncOfflineQueue()
  })

  // Sync on app focus
  window.addEventListener('focus', () => {
    if (navigator.onLine) {
      syncOfflineQueue()
    }
  })

  // Initial sync if online
  if (navigator.onLine) {
    syncOfflineQueue()
  }
}
