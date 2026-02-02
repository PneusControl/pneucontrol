'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import { TrendingDown, AlertTriangle, ShieldCheck, BarChart3, Loader2, Gauge, Ruler, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

interface Ranking {
    brand: string
    model: string
    total_km: number
    cpk: number
}

export default function PredictionsDashboard() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id

    const [rankings, setRankings] = useState<Ranking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchRankings = async () => {
            if (!tenantId) return
            try {
                const baseUrl = API_BASE_URL
                const response = await fetch(`${baseUrl}/api/v1/predictions/fleet/rankings?tenant_id=${tenantId}`)
                const data = await response.json()
                setRankings(data.rankings || [])
            } catch (err) {
                console.error('Erro ao buscar rankings:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchRankings()
    }, [tenantId])

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Motor de Predição</h1>
                <p className="text-gray-400 font-medium">Análise financeira e operacional baseada em dados reais de rodagem.</p>
            </header>

            {/* KPIs Rápidos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <KPICard
                    title="CPK Médio da Frota"
                    value="R$ 0,0842"
                    trend="-2.4%"
                    icon={<TrendingDown className="text-emerald-500" />}
                    description="Custo por KM rodado"
                />
                <KPICard
                    title="Vida Média Prevista"
                    value="142.000 KM"
                    trend="+12%"
                    icon={<ShieldCheck className="text-indigo-500" />}
                    description="Projeção para pneus ativos"
                />
                <KPICard
                    title="Alertas de Troca"
                    value="12 Pneus"
                    trend="Atenção"
                    icon={<AlertTriangle className="text-amber-500" />}
                    description="Próximos dos 3mm de sulco"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Ranking de Marcas */}
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ranking de Marcas</h2>
                            <p className="text-gray-400 text-sm font-medium">Menor custo operacional (CPK)</p>
                        </div>
                        <BarChart3 className="text-gray-200" size={32} />
                    </div>

                    {loading ? (
                        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : rankings.length === 0 ? (
                        <div className="py-20 text-center text-gray-300 font-bold uppercase text-xs tracking-widest">
                            Aguardando mais inspeções para gerar ranking
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rankings.map((r, i) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group hover:bg-indigo-50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:text-indigo-600 shadow-sm">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 uppercase tracking-tight">{r.brand}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{r.model}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-indigo-600 text-lg">R$ {r.cpk.toFixed(4)}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">CPK Real</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Últimas Avarias IA Vision */}
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Alertas da IA</h2>
                            <p className="text-gray-400 text-sm font-medium">Avarias críticas detectadas por visão</p>
                        </div>
                        <AlertTriangle className="text-rose-200" size={32} />
                    </div>

                    <div className="space-y-6">
                        <DamageItem
                            plate="ABC-1234"
                            position="Eixo 2 Dir"
                            damage="Bolha Lateral"
                            severity="Critica"
                            date="Há 2 horas"
                        />
                        <DamageItem
                            plate="KMS-8890"
                            position="Eixo 1 Esq"
                            damage="Desgaste Irregular"
                            severity="Média"
                            date="Há 5 horas"
                        />
                        <button className="w-full py-4 text-indigo-600 font-bold text-sm tracking-tight hover:bg-indigo-50 rounded-2xl transition-all">
                            Ver todos os alertas técnicos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, trend, icon, description }: any) {
    return (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 flex flex-col gap-6 relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500">
            <div className="flex items-center justify-between">
                <div className="w-14 h-14 bg-gray-50 rounded-[24px] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    {icon}
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${trend.includes('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {trend.includes('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
                <p className="text-gray-400 text-[10px] font-bold mt-2 uppercase tracking-tight">{description}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {icon}
            </div>
        </div>
    )
}

function DamageItem({ plate, position, damage, severity, date }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-3xl border border-transparent hover:border-indigo-100 group transition-all">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 font-black group-hover:text-rose-500 shadow-sm text-xs">
                    {severity[0]}
                </div>
                <div>
                    <p className="font-black text-gray-900 text-sm">{plate} - <span className="text-gray-400 font-bold uppercase text-[10px]">{position}</span></p>
                    <p className="text-xs font-bold text-rose-500 uppercase tracking-tighter">{damage}</p>
                </div>
            </div>
            <p className="text-[10px] font-black text-gray-300 uppercase">{date}</p>
        </div>
    )
}
