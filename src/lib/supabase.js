import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdnbrvehvozydzmhvvkc.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkbmJydmVodm96eWR6bWh2dmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDI3NDcsImV4cCI6MjA5NTYxODc0N30.WrLrahR9ld-5YKpgUcJSDUA7H8ZuvXqr7TI_tRpDIyc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'efin-hr-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: (name, acquireTimeout, fn) => fn(),
  }
})
