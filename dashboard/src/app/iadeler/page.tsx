'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getReturns, type ReturnItem } from '@/lib/queries';

export default function IadelerPage() {
    const { sellerId } = useAuth();
    const [returns, setReturns] = useState<ReturnItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    const loadData = useCallback(async () => { if (!sellerId) return; setReturns(await getReturns(sellerId)); setLoading(false); }, [sellerId]);
    useEffect(() => { loadData(); }, [loadData]);
    useRealtimeData({ tables: ['returns'], onDataChange: loadData });

    const labels: Record<string, string> = { talep_edildi: 'Talep Edildi', onaylandi: 'Onaylandı', reddedildi: 'Reddedildi', tamamlandi: 'Tamamlandı' };
    const filtered = filter === 'all' ? returns : returns.filter((r) => r.status === filter);
    const totalRefund = returns.reduce((sum, r) => sum + Number(r.refund_amount), 0);
    const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

    return (
        <DashboardLayout title="İadeler" subtitle={`Toplam ${returns.length} iade`}>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Toplam İade', value: returns.length, cls: 'text-slate-800' },
                    { label: 'Bekleyen', value: returns.filter((r) => r.status === 'talep_edildi').length, cls: 'text-orange-500' },
                    { label: 'Tamamlanan', value: returns.filter((r) => r.status === 'tamamlandi').length, cls: 'text-emerald-600' },
                    { label: 'Toplam Tutar', value: fmt(totalRefund), cls: 'text-red-500' },
                ].map((c) => (
                    <div key={c.label} className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                        <p className={`text-2xl font-extrabold ${c.cls}`}>{c.value}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {['all', 'talep_edildi', 'onaylandi', 'reddedildi', 'tamamlandi'].map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all
              ${filter === s ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                        {s === 'all' ? 'Tümü' : labels[s]}
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
                                {['İade No', 'Sebep', 'İade Tutarı', 'Durum', 'Platform', 'Tarih'].map((h) => (
                                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-16 text-slate-400 text-sm">{filter === 'all' ? 'Henüz iade yok.' : `"${labels[filter]}" durumunda iade bulunamadı.`}</td></tr>
                                ) : filtered.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-700 font-semibold">{item.platform_return_id || '—'}</td>
                                        <td className="px-5 py-3.5 text-sm text-slate-600 max-w-[280px] truncate">{item.reason || '—'}</td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-red-500">{fmt(item.refund_amount)}</td>
                                        <td className="px-5 py-3.5"><span className={`badge badge-${item.status}`}>{labels[item.status] || item.status}</span></td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400 capitalize">{item.platform}</td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{new Date(item.return_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
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
