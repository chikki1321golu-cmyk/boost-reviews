import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://yqqkhvrgiclvfxobnnhw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcWtodnJnaWNsdmZ4b2Jubmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NDMzNDIsImV4cCI6MjA5MDUxOTM0Mn0.OzeNhQ5pmiJfPFGzJ1upu4OmRA20uF0sgonRrTXdGHo";

// Custom storage wrapper that uses a prefixed key
// This prevents Razorpay and other third-party tools from
// accidentally triggering Supabase's storage event listener
const prefixedStorage = {
  getItem: (key: string) => localStorage.getItem(`br_auth_${key}`),
  setItem: (key: string, value: string) => localStorage.setItem(`br_auth_${key}`, value),
  removeItem: (key: string) => localStorage.removeItem(`br_auth_${key}`),
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: prefixedStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'session',
    detectSessionInUrl: false,
  },
});
