// ============================================================
// lib/queries.ts — Supabase Veri Sorgulama Fonksiyonları
// ============================================================
// Tüm fonksiyonlar sellerId parametresi alır (AuthContext'ten gelir)
// ============================================================

import { supabase } from './supabase';

// =====================
// TİPLER
// =====================
export interface Order {
    id: string;
    platform: string;
    platform_order_id: string;
    customer_name: string | null;
    total_amount: number;
    commission_amount: number;
    status: string;
    order_date: string;
    cargo_tracking_number: string | null;
    cargo_company: string | null;
    created_at: string;
}

export interface Review {
    id: string;
    platform: string;
    product_name: string;
    product_sku: string | null;
    customer_name: string | null;
    rating: number;
    comment: string | null;
    review_date: string;
    is_replied: boolean;
}

export interface StockItem {
    id: string;
    platform: string;
    product_name: string;
    product_sku: string | null;
    barcode: string | null;
    quantity: number;
    price: number;
    is_active: boolean;
    last_synced_at: string;
}

export interface ReturnItem {
    id: string;
    platform: string;
    platform_return_id: string | null;
    reason: string | null;
    refund_amount: number;
    status: string;
    return_date: string;
}

export interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    avgRating: number;
    returnRate: number;
    totalReviews: number;
    totalStock: number;
    totalReturns: number;
}

// =====================
// GENEL BAKIŞ
// =====================

export async function getDashboardStats(sellerId: string): Promise<DashboardStats> {
    const [ordersRes, reviewsRes, returnsRes] = await Promise.all([
        supabase.from('orders').select('*').eq('seller_id', sellerId),
        supabase.from('reviews').select('*').eq('seller_id', sellerId),
        supabase.from('returns').select('*').eq('seller_id', sellerId),
    ]);

    const orders = ordersRes.data || [];
    const reviews = reviewsRes.data || [];
    const returns = returnsRes.data || [];

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, o: Order) => sum + Number(o.total_amount), 0);
    const avgRating = reviews.length > 0
        ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length
        : 0;
    const returnRate = totalOrders > 0 ? (returns.length / totalOrders) * 100 : 0;

    return {
        totalOrders,
        totalRevenue,
        avgRating: Math.round(avgRating * 10) / 10,
        returnRate: Math.round(returnRate * 10) / 10,
        totalReviews: reviews.length,
        totalStock: 0,
        totalReturns: returns.length,
    };
}

// =====================
// SİPARİŞLER
// =====================

export async function getOrders(sellerId: string): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('order_date', { ascending: false });

    if (error) { console.error('Sipariş çekme hatası:', error); return []; }
    return data || [];
}

export async function getRecentOrders(sellerId: string, limit = 5): Promise<Order[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('seller_id', sellerId)
        .order('order_date', { ascending: false })
        .limit(limit);

    if (error) { console.error('Son sipariş çekme hatası:', error); return []; }
    return data || [];
}

export async function getRevenueChartData(sellerId: string): Promise<{ date: string; gelir: number }[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data, error } = await supabase
        .from('orders')
        .select('order_date, total_amount')
        .eq('seller_id', sellerId)
        .gte('order_date', sevenDaysAgo.toISOString())
        .order('order_date', { ascending: true });

    if (error) { console.error('Gelir verisi çekme hatası:', error); return []; }

    const grouped: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
        grouped[key] = 0;
    }

    (data || []).forEach((order: { order_date: string; total_amount: number }) => {
        const d = new Date(order.order_date);
        const key = d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
        if (key in grouped) grouped[key] += Number(order.total_amount);
    });

    return Object.entries(grouped).map(([date, gelir]) => ({
        date,
        gelir: Math.round(gelir * 100) / 100,
    }));
}

export async function getPlatformDistribution(sellerId: string): Promise<{ name: string; value: number }[]> {
    const { data, error } = await supabase
        .from('orders')
        .select('platform')
        .eq('seller_id', sellerId);

    if (error) return [];

    const counts: Record<string, number> = {};
    (data || []).forEach((o: { platform: string }) => {
        const name = o.platform === 'trendyol' ? 'Trendyol' : 'Hepsiburada';
        counts[name] = (counts[name] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

// =====================
// YORUMLAR
// =====================

export async function getReviews(sellerId: string): Promise<Review[]> {
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('review_date', { ascending: false });

    if (error) { console.error('Yorum çekme hatası:', error); return []; }
    return data || [];
}

// =====================
// STOK
// =====================

export async function getStock(sellerId: string): Promise<StockItem[]> {
    const { data, error } = await supabase
        .from('stock')
        .select('*')
        .eq('seller_id', sellerId)
        .order('product_name', { ascending: true });

    if (error) { console.error('Stok çekme hatası:', error); return []; }
    return data || [];
}

// =====================
// İADELER
// =====================

export async function getReturns(sellerId: string): Promise<ReturnItem[]> {
    const { data, error } = await supabase
        .from('returns')
        .select('*')
        .eq('seller_id', sellerId)
        .order('return_date', { ascending: false });

    if (error) { console.error('İade çekme hatası:', error); return []; }
    return data || [];
}
