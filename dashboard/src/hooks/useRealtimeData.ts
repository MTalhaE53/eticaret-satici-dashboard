'use client';

// ============================================================
// hooks/useRealtimeData.ts — Supabase Realtime Hook
// ============================================================
// Supabase Realtime aboneliği + polling ile anlık veri güncelleme.
// Herhangi bir tabloda INSERT/UPDATE/DELETE olduğunda otomatik
// olarak verileri yeniden çeker.
// ============================================================

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseRealtimeOptions {
    /** Dinlenecek tablo adları */
    tables: string[];
    /** Veri değiştiğinde çağrılacak callback */
    onDataChange: () => void;
    /** Polling aralığı (ms) — Realtime çalışmazsa yedek olarak kullanılır */
    pollingInterval?: number;
    /** Aktif mi? */
    enabled?: boolean;
}

/**
 * Supabase Realtime + Polling ile anlık veri güncellemesi sağlar
 *
 * Kullanım:
 * ```
 * useRealtimeData({
 *   tables: ['orders', 'reviews'],
 *   onDataChange: () => reloadData(),
 * });
 * ```
 */
export function useRealtimeData({
    tables,
    onDataChange,
    pollingInterval = 10000, // 10 saniye varsayılan
    enabled = true,
}: UseRealtimeOptions) {
    const onDataChangeRef = useRef(onDataChange);
    onDataChangeRef.current = onDataChange;

    // Debounce: Çok hızlı arka arkaya gelen değişiklikleri birleştir
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedRefresh = useCallback(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            onDataChangeRef.current();
        }, 500); // 500ms debounce
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // =====================
        // 1. SUPABASE REALTIME
        // =====================
        const channel = supabase
            .channel('dashboard-realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tables[0] },
                () => debouncedRefresh()
            );

        // Birden fazla tablo dinle
        tables.slice(1).forEach((table) => {
            channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                () => debouncedRefresh()
            );
        });

        channel.subscribe((status) => {
            console.log(`[Realtime] Kanal durumu: ${status}`);
        });

        // =====================
        // 2. POLLING (Yedek)
        // =====================
        const pollTimer = setInterval(() => {
            onDataChangeRef.current();
        }, pollingInterval);

        // =====================
        // CLEANUP
        // =====================
        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollTimer);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [enabled, pollingInterval, debouncedRefresh, tables]);
}
