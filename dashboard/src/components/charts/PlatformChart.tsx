'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444'];

interface PlatformChartProps { data: { name: string; value: number }[]; }

export default function PlatformChart({ data }: PlatformChartProps) {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm h-full">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-800">Platform Dağılımı</h3>
                <p className="text-xs text-slate-400 mt-0.5">Sipariş bazlı</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                    <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                        {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', padding: '10px 14px' }}
                        itemStyle={{ color: '#1e293b', fontSize: 13, fontWeight: 600 }}
                    />
                    <text x="50%" y="47%" textAnchor="middle" fill="#1e293b" fontSize="22" fontWeight="800">{total}</text>
                    <text x="50%" y="60%" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="600">SİPARİŞ</text>
                </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
                {data.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-slate-500">{entry.name}</span>
                        <span className="text-xs font-bold text-slate-700">{total > 0 ? Math.round((entry.value / total) * 100) : 0}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
