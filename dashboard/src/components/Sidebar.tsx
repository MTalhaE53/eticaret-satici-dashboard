'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/auth';
import {
    LayoutDashboard, ShoppingCart, MessageSquare,
    Package, RotateCcw, Settings, LogOut, TrendingUp, Menu, X,
} from 'lucide-react';
import { useState } from 'react';

const NAV = [
    { href: '/', label: 'Genel Bakış', icon: LayoutDashboard },
    { href: '/siparisler', label: 'Siparişler', icon: ShoppingCart },
    { href: '/yorumlar', label: 'Yorumlar', icon: MessageSquare },
    { href: '/stok', label: 'Stok', icon: Package },
    { href: '/iadeler', label: 'İadeler', icon: RotateCcw },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuth();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    async function handleSignOut() {
        await signOut();
        router.push('/giris');
    }

    const sidebar = (
        <>
            <div className="flex items-center gap-3 px-5 pt-6 pb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <TrendingUp size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-extrabold text-slate-800 tracking-tight">E-Ticaret</h1>
                    <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Dashboard</p>
                </div>
            </div>

            <nav className="flex-1 px-3 mt-4 space-y-1">
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Menü</p>
                {NAV.map((link) => {
                    const active = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link key={link.href} href={link.href} onClick={() => setOpen(false)}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200
                ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all
                ${active ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25' : 'group-hover:bg-slate-100'}`}>
                                <Icon size={16} className={active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'} />
                            </div>
                            {link.label}
                            {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                        </Link>
                    );
                })}

                <div className="my-4 mx-3 border-t border-slate-100" />
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Sistem</p>

                <Link href="/ayarlar" onClick={() => setOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
            ${pathname === '/ayarlar' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                        <Settings size={16} className={pathname === '/ayarlar' ? 'text-indigo-600' : 'text-slate-400'} />
                    </div>
                    Ayarlar
                </Link>
            </nav>

            <div className="px-3 pb-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                            {(user?.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-700 truncate">{user?.email?.split('@')[0]}</p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all cursor-pointer">
                        <LogOut size={12} /> Çıkış Yap
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <>
            <button onClick={() => setOpen(!open)}
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-xl bg-white border border-slate-200 text-slate-700 shadow-lg">
                {open ? <X size={20} /> : <Menu size={20} />}
            </button>

            {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />}

            <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[260px] z-50 flex-col bg-white border-r border-slate-200">
                {sidebar}
            </aside>

            <aside className={`lg:hidden fixed left-0 top-0 bottom-0 w-[280px] z-50 flex flex-col bg-white border-r border-slate-200 shadow-2xl transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebar}
            </aside>
        </>
    );
}
