// ============================================================
// lib/supabase.ts - Next.js Supabase Client
// ============================================================
// Dashboard tarafında kullanılan Supabase bağlantı istemcisi.
// Singleton pattern ile tek bir instance oluşturulur.
// ============================================================

import { createClient } from '@supabase/supabase-js';

// ⚠️ Bu değerleri .env.local dosyasına taşıyın
// NEXT_PUBLIC_ prefix'i client-side'da erişim sağlar
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
