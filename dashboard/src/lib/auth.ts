'use client';

// ============================================================
// lib/auth.ts — Supabase Auth Yardımcı Fonksiyonları
// ============================================================

import { supabase } from './supabase';

/** E-posta ve şifre ile kayıt ol */
export async function signUp(email: string, password: string, storeName: string, platform: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { store_name: storeName, platform },
        },
    });
    return { data, error };
}

/** E-posta ve şifre ile giriş yap */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

/** Çıkış yap */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/** Mevcut oturumdaki kullanıcıyı getir */
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

/** Kullanıcının seller kaydını getir */
export async function getSellerProfile() {
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

    if (error) {
        console.error('Seller profili alınamadı:', error);
        return null;
    }
    return data;
}

/** Auth durumu değişikliklerini dinle */
export function onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return supabase.auth.onAuthStateChange(callback);
}
