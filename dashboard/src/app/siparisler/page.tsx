'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getOrders, type Order } from '@/lib/queries';

export default function SiparislerPage() {
    const { sellerId } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadData = useCallback(async () => { if (!sellerId) return; setOrders(await getOrders(sellerId)); setLoading(false); }, [sellerId]);
    useEffect(() => { loadData(); }, [loadData]);
    useRealtimeData({ tables: ['orders'], onDataChange: loadData });

    const labels: Record<string, string> = { yeni: 'Yeni', hazirlaniyor: 'Hazırlanıyor', kargoda: 'Kargoda', teslim_edildi: 'Teslim Edildi', iptal: 'İptal', iade: 'İade' };
    const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
    const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

    return (
        <DashboardLayout title="Siparişler" subtitle={`Toplam ${orders.length} sipariş`}>
            <div className="flex flex-wrap gap-2 mb-6">
                {['all', 'yeni', 'hazirlaniyor', 'kargoda', 'teslim_edildi', 'iptal', 'iade'].map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer
              ${filter === s ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}>
                        {s === 'all' ? 'Tümü' : labels[s]}
                        {s !== 'all' && <span className="ml-1 opacity-60">({orders.filter((o) => o.status === s).length})</span>}
                    </button>
                ))}
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="text-left bg-slate-50">
                                {['Sipariş No', 'Müşteri', 'Tutar', 'Komisyon', 'Durum', 'Platform', 'Kargo', 'Tarih'].map((h) => (
                                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="text-center py-16 text-slate-400 text-sm">{filter === 'all' ? 'Henüz sipariş yok.' : `"${labels[filter]}" durumunda sipariş bulunamadı.`}</td></tr>
                                ) : filtered.map((o) => (
                                    <tr key={o.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-700 font-semibold">#{o.platform_order_id}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-600">{o.customer_name || '—'}</td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{fmt(o.total_amount)}</td>
                                        <td className="px-5 py-3.5 text-xs text-red-500">-{fmt(o.commission_amount)}</td>
                                        <td className="px-5 py-3.5"><span className={`badge badge-${o.status}`}>{labels[o.status] || o.status}</span></td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400 capitalize">{o.platform}</td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400">{o.cargo_company || '—'}</td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{new Date(o.order_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
