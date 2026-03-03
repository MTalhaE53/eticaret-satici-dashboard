'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/auth';
import { TrendingUp } from 'lucide-react';

export default function GirisPage() {
    const router = useRouter();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [storeName, setStoreName] = useState('');
    const [platform, setPlatform] = useState('trendyol');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
        if (isLogin) {
            const { error } = await signIn(email, password);
            if (error) setError(error.message); else router.push('/');
        } else {
            if (!storeName.trim()) { setError('Mağaza adı zorunludur.'); setLoading(false); return; }
            const { error } = await signUp(email, password, storeName, platform);
            if (error) setError(error.message); else { setSuccess('Kayıt başarılı! Giriş yapmayı deneyin.'); setIsLogin(true); }
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto mb-5 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                        <TrendingUp size={30} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800">E-Ticaret Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">{isLogin ? 'Hesabınıza giriş yapın' : 'Yeni hesap oluşturun'}</p>
                </div>

                <div className="rounded-2xl bg-white border border-slate-200 shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2">Mağaza Adı</label>
                                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
                                        placeholder="Örn: Ahmet'in Dükkanı"
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-3">Platform</label>
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
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">E-posta</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@email.com" required
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Şifre</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="En az 6 karakter" required minLength={6}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                        </div>
                        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{error}</div>}
                        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-xl">{success}</div>}
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 transition-all cursor-pointer">
                            {loading ? '...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }}
                            className="text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors cursor-pointer">
                            {isLogin ? 'Hesabınız yok mu? Kayıt olun' : 'Zaten hesabınız var mı? Giriş yapın'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
