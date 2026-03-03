'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import { Copy, Check, LogOut, Chrome, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AyarlarPage() {
    const { user, sellerId } = useAuth();
    const router = useRouter();
    const [copied, setCopied] = useState(false);
    const [storeName, setStoreName] = useState('');
    const [platform, setPlatform] = useState('trendyol');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (sellerId) {
            supabase.from('sellers').select('store_name, platform').eq('id', sellerId).single()
                .then(({ data }) => { if (data) { setStoreName(data.store_name); setPlatform(data.platform || 'trendyol'); } });
        }
    }, [sellerId]);

    function handleCopy() { if (sellerId) { navigator.clipboard.writeText(sellerId); setCopied(true); setTimeout(() => setCopied(false), 2000); } }
    async function handleSave() { if (!sellerId || !storeName.trim()) return; setSaving(true); await supabase.from('sellers').update({ store_name: storeName.trim(), platform }).eq('id', sellerId); setSaving(false); }
    async function handleSignOut() { await signOut(); router.push('/giris'); }

    return (
        <DashboardLayout title="Ayarlar" subtitle="Hesap ve eklenti yapılandırması">
            <div className="max-w-2xl space-y-6">
                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Chrome size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Chrome Eklentisi Bağlantısı</h3>
                            <p className="text-[11px] text-slate-400">Dashboard&apos;a giriş yaptığınızda eklenti otomatik bağlanır</p>
                        </div>
                    </div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Satıcı ID</label>
                    <div className="flex gap-2">
                        <div className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-700 select-all overflow-x-auto">{sellerId || 'Yükleniyor...'}</div>
                        <button onClick={handleCopy}
                            className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer ${copied ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'}`}>
                            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Kopyalandı!' : 'Kopyala'}
                        </button>
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                        <p className="text-xs text-slate-500 leading-relaxed"><strong className="text-indigo-600">Nasıl çalışır:</strong> Dashboard&apos;a giriş yaptığınızda eklenti otomatik olarak bağlanır. Manuel bağlantı gerekirse bu kodu kullanın.</p>
                    </div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center"><Globe size={20} className="text-white" /></div>
                        <div><h3 className="text-sm font-bold text-slate-800">Dashboard URL</h3><p className="text-[11px] text-slate-400">Eklentinin bağlandığı adres</p></div>
                    </div>
                    <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm text-slate-700">{typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3200'}</div>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-5">Mağaza Bilgileri</h3>
                    <div className="space-y-4">
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">E-posta</label><div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500">{user?.email || '—'}</div></div>
                        <div><label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mağaza Adı</label>
                            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 outline-none focus:border-indigo-500 transition-all" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Platform</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'trendyol', label: 'Trendyol', emoji: '🟠' },
                                    { id: 'hepsiburada', label: 'Hepsiburada', emoji: '🟣' },
                                    { id: 'her_ikisi', label: 'İkisi de', emoji: '🔄' },
                                ].map((p) => (
                                    <button key={p.id} type="button" onClick={() => setPlatform(p.id)}
                                        className={`py-3 rounded-xl text-center text-xs font-semibold transition-all cursor-pointer border
                                            ${platform === p.id
                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 ring-2 ring-indigo-500/20'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                            }`}>
                                        <span className="text-lg block mb-1">{p.emoji}</span>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={saving}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/25">
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>

                <button onClick={handleSignOut} className="w-full py-3 rounded-xl border border-red-200 text-red-500 font-semibold text-sm hover:bg-red-50 transition-all flex items-center justify-center gap-2 cursor-pointer"><LogOut size={16} /> Çıkış Yap</button>
            </div>
        </DashboardLayout>
    );
}
