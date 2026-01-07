/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PWA_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (_registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (_error: unknown) => void
  }

  export function registerSW(_options: RegisterSWOptions): (_reloadPage?: boolean) => Promise<void>
}
