'use client'

import React, { useState, useEffect } from 'react'
import { TrendingDown, AlertCircle, Calendar, DollarSign, ArrowDown, ArrowUp, BarChart3, Loader2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function PredictionsDashboard() {
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setTimeout(() => setLoading(false), 1000)
    }, [])

    const data = [
        { name: 'Jan', cpk: 0.12 },
        { name: 'Fev', cpk: 0.11 },
        { name: 'Mar', cpk: 0.09 },
    ]

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>

    return (
        <div className="p-10">
            <header className="mb-10">
                <h1 className="text-2xl font-bold text-gray-800">Motor de Predição</h1>
                <p className="text-gray-400 text-sm font-medium">Análise de CPK e estimativas de vida útil baseadas em IA</p>
            </header>

            {/* Alertas Críticos */}
            <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 mb-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-rose-900">4 Pneus atingindo zona crítica</h3>
                        <p className="text-rose-700/70 text-sm font-medium">Troca recomendada para os próximos 2.500 KM para garantir segurança.</p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all text-sm">Ver Pneus</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico de CPK */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Evolução do CPK</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Custo por Quilômetro Médio</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
                                <ArrowDown size={20} /> R$ 0,09
                            </p>
                            <p className="text-[10px] text-gray-300 font-bold uppercase">Melhoria de 12% vs jan</p>
                        </div>
                    </div>

                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorCpk" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="cpk" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCpk)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Melhores Marcas (Ranking) */}
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                    <h2 className="text-xl font-bold text-gray-800 mb-8">Top Performance</h2>
                    <div className="space-y-8">
                        <RankingItem brand="Michelin" model="X Multi D" km="214k" cpk="0.07" color="bg-indigo-500" />
                        <RankingItem brand="Bridgestone" model="M729" km="198k" cpk="0.08" color="bg-blue-500" />
                        <RankingItem brand="Continental" model="HDR2" km="185k" cpk="0.10" color="bg-orange-500" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function RankingItem({ brand, model, km, cpk, color }: any) {
    return (
        <div className="flex items-center gap-4">
            <div className={`w-2 h-10 rounded-full ${color}`}></div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{brand}</p>
                <p className="text-xs text-gray-400 font-medium truncate">{model}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold text-gray-800">R$ {cpk}</p>
                <p className="text-[10px] font-bold text-gray-300 uppercase">{km} KM</p>
            </div>
        </div>
    )
}
