'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getStock, type StockItem } from '@/lib/queries';

export default function StokPage() {
    const { sellerId } = useAuth();
    const [stock, setStock] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [lowOnly, setLowOnly] = useState(false);

    const loadData = useCallback(async () => { if (!sellerId) return; setStock(await getStock(sellerId)); setLoading(false); }, [sellerId]);
    useEffect(() => { loadData(); }, [loadData]);
    useRealtimeData({ tables: ['stock'], onDataChange: loadData });

    const LOW = 10;
    const filtered = lowOnly ? stock.filter((s) => s.quantity <= LOW && s.is_active) : stock;
    const active = stock.filter((s) => s.is_active).length;
    const lowCount = stock.filter((s) => s.quantity <= LOW && s.is_active).length;
    const totalVal = stock.reduce((sum, s) => sum + s.quantity * s.price, 0);
    const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n);

    return (
        <DashboardLayout title="Stok Yönetimi" subtitle={`${stock.length} ürün takip ediliyor`}>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Toplam Ürün', value: stock.length, cls: 'text-slate-800' },
                    { label: 'Aktif', value: active, cls: 'text-emerald-600' },
                    { label: 'Düşük Stok', value: lowCount, cls: lowCount > 0 ? 'text-red-500' : 'text-slate-800' },
                    { label: 'Stok Değeri', value: fmt(totalVal), cls: 'text-indigo-600' },
                ].map((c) => (
                    <div key={c.label} className="rounded-2xl bg-white border border-slate-200 p-4 text-center shadow-sm">
                        <p className={`text-2xl font-extrabold ${c.cls}`}>{c.value}</p>
                        <p className="text-[11px] text-slate-400 mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mb-6">
                <button onClick={() => setLowOnly(false)} className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${!lowOnly ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' : 'bg-white text-slate-500 border border-slate-200'}`}>Tüm Ürünler ({stock.length})</button>
                <button onClick={() => setLowOnly(true)} className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${lowOnly ? 'bg-red-500 text-white shadow-lg shadow-red-500/25' : 'bg-white text-slate-500 border border-slate-200'}`}>⚠️ Düşük Stok ({lowCount})</button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="text-left bg-slate-50">
                                {['Ürün Adı', 'SKU', 'Stok', 'Fiyat', 'Durum', 'Platform', 'Güncelleme'].map((h) => (
                                    <th key={h} className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-sm">{lowOnly ? 'Düşük stoklu ürün yok.' : 'Henüz stok verisi yok.'}</td></tr>
                                ) : filtered.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                        <td className="px-5 py-3.5 text-sm text-slate-700 font-medium max-w-[220px] truncate">{item.product_name}</td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{item.product_sku || '—'}</td>
                                        <td className="px-5 py-3.5"><span className={`text-sm font-bold ${item.quantity <= LOW ? 'text-red-500' : item.quantity <= 30 ? 'text-orange-500' : 'text-emerald-600'}`}>{item.quantity}{item.quantity <= LOW && ' ⚠️'}</span></td>
                                        <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{fmt(item.price)}</td>
                                        <td className="px-5 py-3.5"><span className={`badge ${item.is_active ? 'badge-teslim_edildi' : 'badge-iptal'}`}>{item.is_active ? 'Aktif' : 'Pasif'}</span></td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400 capitalize">{item.platform}</td>
                                        <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">{new Date(item.last_synced_at).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
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
