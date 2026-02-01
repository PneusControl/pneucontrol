'use client'

import React, { useState, useEffect } from 'react'
import {
    Truck, ClipboardList, AlertTriangle, BrainCircuit,
    ArrowUpRight, TrendingDown, Gauge, Package, Loader2, FileText
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

export default function DashboardHomePage() {
    const { user } = useAuth()
    const tenantId = user?.user_metadata?.tenant_id
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            if (!tenantId) return
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
                const response = await fetch(`${baseUrl}/api/v1/dashboard/stats?tenant_id=${tenantId}`)
                const data = await response.json()
                setStats(data)
            } catch (err) {
                console.error('Erro ao buscar stats:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [tenantId])

    return (
        <div className="p-10 max-w-7xl mx-auto">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Bem-vindo, {user?.user_metadata?.full_name?.split(' ')[0] || 'Gestor'}</h1>
                <p className="text-gray-400 font-medium">Aqui está o panorama atual da sua frota e estoque.</p>
            </header>

            {/* Grid de KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <KPICard
                    title="Frota Ativa"
                    value={stats?.total_vehicles || '0'}
                    icon={<Truck className="text-indigo-600" />}
                    href="/dashboard/fleet"
                />
                <KPICard
                    title="Pneus em Uso"
                    value={stats?.tires_in_use || '0'}
                    icon={<Package className="text-emerald-600" />}
                    href="/dashboard/tires"
                />
                <KPICard
                    title="Inspecionados (Mês)"
                    value={stats?.recent_inspections || '0'}
                    icon={<ClipboardList className="text-amber-600" />}
                    href="/dashboard/inspections"
                />
                <KPICard
                    title="Alertas IA"
                    value={stats?.critical_alerts || '0'}
                    icon={<AlertTriangle className="text-rose-600" />}
                    href="/dashboard/predictions"
                    critical={Number(stats?.critical_alerts) > 0}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Seção de Atalhos Rápidos */}
                <div className="lg:col-span-2 space-y-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ações Rápidas</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ActionButton
                            title="Nova Inspeção"
                            description="Iniciar checklist técnico no pátio."
                            icon={<ClipboardList size={32} />}
                            color="bg-indigo-600"
                            href="/dashboard/inspections/new"
                        />
                        <ActionButton
                            title="Importar Nota"
                            description="Entrada de novos pneus via XML/PDF."
                            icon={<FileText size={32} />}
                            color="bg-gray-900"
                            href="/dashboard/invoices/new"
                        />
                    </div>

                    {/* Feed de Atividades Recentes (Mockup visual por enquanto) */}
                    <div className="bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm">
                        <h2 className="text-xl font-black text-gray-900 mb-8">Últimas Atividades</h2>
                        <div className="space-y-6">
                            <ActivityItem
                                icon={<Plus className="text-emerald-500" />}
                                title="Nova NF Importada"
                                desc="Nota #1290 - 4 pneus Michelin adicionados"
                                time="Há 12 min"
                            />
                            <ActivityItem
                                icon={<ClipboardList className="text-indigo-500" />}
                                title="Inspeção Concluída"
                                desc="Placa ABC-1234 - Eixo 2 Verificado"
                                time="Há 2 horas"
                            />
                            <ActivityItem
                                icon={<AlertTriangle className="text-rose-500" />}
                                title="Alerta de Desgaste"
                                desc="Pneu Serie 992-X atingiu limite de safety"
                                time="Ontem"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar com Resumo de Predição */}
                <div className="space-y-8">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Insights IA</h2>
                    <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <div className="relative z-10">
                            <BrainCircuit size={40} className="mb-6 opacity-80" />
                            <h3 className="text-xl font-black mb-2 tracking-tight">Predição de Desgaste</h3>
                            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                                Com base nas últimas 50 inspeções, sua frota apresenta um rendimento médio de **18.200 KM por milímetro**.
                            </p>
                            <Link href="/dashboard/predictions" className="mt-8 inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-all">
                                Ver Relatório Completo <ArrowUpRight size={16} />
                            </Link>
                        </div>
                        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
                    </div>

                    <div className="bg-white rounded-[40px] p-8 border border-gray-50 shadow-sm">
                        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Eficiência de Custo</h3>
                        <div className="flex items-end gap-2">
                            <span className="text-3xl font-black text-gray-900">R$ 0,08</span>
                            <span className="text-gray-400 font-bold text-xs mb-1.5 uppercase tracking-tighter">/ KM Médio</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase">
                            <TrendingDown size={14} /> 4.2% menor que o mês passado
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function KPICard({ title, value, icon, href, critical }: any) {
    return (
        <Link href={href} className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all">
                    {icon}
                </div>
                {critical && (
                    <div className="w-3 h-3 bg-rose-500 rounded-full animate-ping"></div>
                )}
            </div>
            <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
                <p className="text-3xl font-black text-gray-900 tracking-tighter">{value}</p>
            </div>
        </Link>
    )
}

function ActionButton({ title, description, icon, color, href }: any) {
    return (
        <Link href={href} className={`${color} p-8 rounded-[40px] text-white flex flex-col gap-6 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-200/50 group`}>
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center group-hover:rotate-6 transition-all">
                {icon}
            </div>
            <div>
                <h3 className="text-xl font-black tracking-tight">{title}</h3>
                <p className="text-white/60 text-sm font-medium">{description}</p>
            </div>
        </Link>
    )
}

function ActivityItem({ icon, title, desc, time }: any) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center transition-all group-hover:scale-110">
                    {icon}
                </div>
                <div>
                    <p className="text-sm font-black text-gray-900">{title}</p>
                    <p className="text-xs text-gray-400 font-medium">{desc}</p>
                </div>
            </div>
            <span className="text-[10px] font-black text-gray-300 uppercase">{time}</span>
        </div>
    )
}

function Plus({ className }: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14" /><path d="M12 5v14" /></svg>
    )
}
