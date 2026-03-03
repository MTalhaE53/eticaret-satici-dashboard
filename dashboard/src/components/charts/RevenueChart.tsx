'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps { data: { date: string; gelir: number }[]; }

export default function RevenueChart({ data }: RevenueChartProps) {
    const fmt = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(v);
    return (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-800">Gelir Trendi</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Son 7 gün</p>
                </div>
                <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-600">Haftalık</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorGelir" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `₺${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} dx={-4} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px' }}
                        labelStyle={{ color: '#64748b', fontSize: 11, marginBottom: 4 }}
                        itemStyle={{ color: '#1e293b', fontSize: 13, fontWeight: 600 }}
                        formatter={(value: number) => [fmt(value), 'Gelir']}
                    />
                    <Area type="monotone" dataKey="gelir" stroke="#6366f1" strokeWidth={2.5} fill="url(#colorGelir)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: 'white', strokeWidth: 3 }} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
