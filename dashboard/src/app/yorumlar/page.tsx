'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { getReviews, type Review } from '@/lib/queries';

export default function YorumlarPage() {
    const { sellerId } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);

    const loadData = useCallback(async () => { if (!sellerId) return; setReviews(await getReviews(sellerId)); setLoading(false); }, [sellerId]);
    useEffect(() => { loadData(); }, [loadData]);
    useRealtimeData({ tables: ['reviews'], onDataChange: loadData });

    const filtered = ratingFilter !== null ? reviews.filter((r) => r.rating === ratingFilter) : reviews;
    const avg = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0';
    const dist = [5, 4, 3, 2, 1].map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length, pct: reviews.length > 0 ? Math.round((reviews.filter((r) => r.rating === star).length / reviews.length) * 100) : 0 }));
    const barColor = (s: number) => s >= 4 ? 'bg-emerald-500' : s === 3 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <DashboardLayout title="Yorumlar" subtitle={`Toplam ${reviews.length} yorum`}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                <div className="rounded-2xl bg-white border border-slate-200 p-6 text-center shadow-sm flex flex-col items-center justify-center">
                    <p className="text-5xl font-extrabold text-slate-800 mb-1">{avg}</p>
                    <div className="flex gap-0.5 mb-2">{[1, 2, 3, 4, 5].map((s) => <span key={s} className={`text-lg ${s <= Math.round(Number(avg)) ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>)}</div>
                    <p className="text-xs text-slate-400">{reviews.length} yorum</p>
                </div>
                <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4">Puan Dağılımı</h3>
                    <div className="space-y-2.5">
                        {dist.map(({ star, count, pct }) => (
                            <button key={star} onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                                className={`w-full flex items-center gap-3 rounded-lg px-2 py-1.5 transition-all cursor-pointer ${ratingFilter === star ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                                <span className="text-xs text-slate-500 w-8">{star} ★</span>
                                <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-500 ${barColor(star)}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-slate-400 w-14 text-right">{count} ({pct}%)</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="rounded-2xl bg-white border border-slate-200 p-16 text-center text-slate-400 shadow-sm">{ratingFilter ? `${ratingFilter} yıldızlı yorum bulunamadı.` : 'Henüz yorum yok.'}</div>
                ) : filtered.map((r) => (
                    <div key={r.id} className="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-md transition-all animate-fade-up shadow-sm">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((s) => <span key={s} className={`text-sm ${s <= r.rating ? 'text-yellow-400' : 'text-slate-200'}`}>★</span>)}</div>
                                    <span className="text-xs text-slate-400">{r.customer_name || 'Anonim'}</span>
                                    <span className="text-xs text-slate-300">•</span>
                                    <span className="text-xs text-slate-400">{new Date(r.review_date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <p className="text-sm font-semibold text-slate-700 mb-1">{r.product_name}</p>
                                {r.comment && <p className="text-sm text-slate-500 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>}
                            </div>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{r.platform}</span>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout>
    );
}
