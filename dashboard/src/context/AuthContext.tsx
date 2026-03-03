'use client';

// ============================================================
// context/AuthContext.tsx — Auth Durumu Context
// ============================================================

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    sellerId: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    sellerId: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [sellerId, setSellerId] = useState<string | null>(null);
    const [storeName, setStoreName] = useState<string | null>(null);

    useEffect(() => {
        // İlk yükleme
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchSellerData(session.user.id);
            }
            setLoading(false);
        });

        // Değişiklikleri dinle
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    fetchSellerData(session.user.id);
                } else {
                    setSellerId(null);
                    setStoreName(null);
                    removeExtensionData();
                }
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    async function fetchSellerData(authUserId: string) {
        const { data } = await supabase
            .from('sellers')
            .select('id, store_name')
            .eq('auth_user_id', authUserId)
            .single();
        if (data) {
            setSellerId(data.id);
            setStoreName(data.store_name);
            // Extension content script için hidden element oluştur
            syncToExtension(data.id, data.store_name);
        }
    }

    // Extension'a veri iletimi için hidden DOM element
    function syncToExtension(id: string, name: string) {
        let el = document.getElementById('__extension_data');
        if (!el) {
            el = document.createElement('div');
            el.id = '__extension_data';
            el.style.display = 'none';
            document.body.appendChild(el);
        }
        el.dataset.sellerId = id;
        el.dataset.storeName = name || 'Mağazam';
    }

    function removeExtensionData() {
        const el = document.getElementById('__extension_data');
        if (el) el.remove();
    }

    return (
        <AuthContext.Provider value={{ user, session, loading, sellerId }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
