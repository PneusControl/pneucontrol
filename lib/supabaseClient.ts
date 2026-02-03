import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    // Fallbacks seguros para produção (as chaves ANON são públicas)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fpdsfepxlcltaoaozvsg.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZHNmZXB4bGNsdGFvYW96dnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDMxNzcsImV4cCI6MjA4NTM3OTE3N30.CaHciYKni3N6l0ICWa3jC-IineD8czCs57WRSMIWUh4';

    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    )
}
