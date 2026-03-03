'use client';

import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    gradient: string;
    delay?: number;
}

export default function StatCard({ title, value, subtitle, icon: Icon, gradient, delay = 0 }: StatCardProps) {
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-up"
            style={{ animationDelay: `${delay}ms` }}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</p>
                    <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
                    {subtitle && <p className="text-[11px] text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg" style={{ background: gradient }}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </div>
    );
}
