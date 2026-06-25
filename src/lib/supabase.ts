import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const safeStorage = {
  getItem: async (key: string) => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});