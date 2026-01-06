interface QueuedMutation {
  id: string
  type: 'create' | 'update' | 'delete'
  tableName: string
  data: any
  timestamp: number
}

const QUEUE_STORAGE_KEY = 'scenka_offline_queue'

class OfflineQueue {
  private queue: QueuedMutation[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.load()
  }

  private load(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      this.queue = stored ? JSON.parse(stored) : []
    } catch {
      this.queue = []
    }
  }

  private persist(): void {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue))
    this.notifyListeners()
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener())
  }

  add(type: QueuedMutation['type'], tableName: string, data: any): void {
    const mutation: QueuedMutation = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      tableName,
      data,
      timestamp: Date.now(),
    }
    this.queue.push(mutation)
    this.persist()
  }

  getAll(): QueuedMutation[] {
    return [...this.queue]
  }

  getCount(): number {
    return this.queue.length
  }

  remove(id: string): void {
    this.queue = this.queue.filter((m) => m.id !== id)
    this.persist()
  }

  clear(): void {
    this.queue = []
    this.persist()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
}

export const offlineQueue = new OfflineQueue()
