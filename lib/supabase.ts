import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Server-side client (for API routes)
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey)

// Client-side client (for browser components)
// Using a singleton pattern to avoid multiple client instances
let supabaseClient: ReturnType<typeof createClient> | undefined
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}
