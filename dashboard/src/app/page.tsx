'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import RevenueChart from '@/components/charts/RevenueChart';
import PlatformChart from '@/components/charts/PlatformChart';
import { ShoppingCart, TrendingUp, Star, RotateCcw } from 'lucide-react';
import { getDashboardStats, getRevenueChartData, getPlatformDistribution, getRecentOrders, type DashboardStats, type Order } from '@/lib/queries';

export default function HomePage() {
  const { sellerId } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<{ date: string; gelir: number }[]>([]);
  const [platformData, setPlatformData] = useState<{ name: string; value: number }[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!sellerId) return;
    try {
      const [s, r, p, o] = await Promise.all([getDashboardStats(sellerId), getRevenueChartData(sellerId), getPlatformDistribution(sellerId), getRecentOrders(sellerId, 5)]);
      setStats(s); setRevenueData(r); setPlatformData(p); setRecentOrders(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [sellerId]);

  useEffect(() => { loadData(); }, [loadData]);
  useRealtimeData({ tables: ['orders', 'reviews', 'returns', 'stock'], onDataChange: loadData });

  const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);
  const statusLabels: Record<string, string> = { yeni: 'Yeni', hazirlaniyor: 'Hazırlanıyor', kargoda: 'Kargoda', teslim_edildi: 'Teslim Edildi', iptal: 'İptal', iade: 'İade' };

  if (loading) {
    return (
      <DashboardLayout title="Genel Bakış" subtitle="Mağazanızın anlık durumu">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Genel Bakış" subtitle="Mağazanızın anlık durumu">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard title="Toplam Sipariş" value={stats?.totalOrders || 0} icon={ShoppingCart} gradient="linear-gradient(135deg, #6366f1, #8b5cf6)" delay={0} />
        <StatCard title="Toplam Gelir" value={fmt(stats?.totalRevenue || 0)} icon={TrendingUp} gradient="linear-gradient(135deg, #22c55e, #10b981)" delay={80} />
        <StatCard title="Ort. Puan" value={`${stats?.avgRating || 0} ⭐`} subtitle={`${stats?.totalReviews || 0} yorum`} icon={Star} gradient="linear-gradient(135deg, #f97316, #fb923c)" delay={160} />
        <StatCard title="İade Oranı" value={`%${stats?.returnRate || 0}`} subtitle={`${stats?.totalReturns || 0} iade`} icon={RotateCcw} gradient="linear-gradient(135deg, #ef4444, #f87171)" delay={240} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-8">
        <div className="xl:col-span-2"><RevenueChart data={revenueData} /></div>
        <div><PlatformChart data={platformData} /></div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Son Siparişler</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">En son gelen 5 sipariş</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left bg-slate-50">
                {['Sipariş No', 'Müşteri', 'Tutar', 'Durum', 'Platform', 'Tarih'].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">Henüz sipariş verisi yok.</td></tr>
              ) : recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-700 font-semibold">#{o.platform_order_id}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{o.customer_name || '—'}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{fmt(o.total_amount)}</td>
                  <td className="px-5 py-3.5"><span className={`badge badge-${o.status}`}>{statusLabels[o.status] || o.status}</span></td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 capitalize">{o.platform}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{new Date(o.order_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
