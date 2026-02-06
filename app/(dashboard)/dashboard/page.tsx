'use client'
import { API_BASE_URL } from '@/lib/api-config'

import React, { useState, useEffect } from 'react'
import {
    Truck, ShieldCheck, Thermometer, AlertCircle,
    BrainCircuit, Bell, Plus, Camera
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
            if (!tenantId) {
                setLoading(false)
                return
            }
            try {
                const baseUrl = API_BASE_URL
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
        <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-[#F8F9FD]">
            {/* Header com Notificações e Ação */}
            <header className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Controle</h1>
                    <p className="text-gray-400 font-medium text-sm">Monitoramento em tempo real da linha pesada</p>
                </div>
                <div className="flex items-center gap-6">
                    <button className="p-3 bg-white rounded-2xl text-gray-400 hover:text-indigo-600 shadow-sm border border-gray-50 transition-all relative">
                        <Bell size={24} />
                        <span className="absolute top-3 right-3 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
                    </button>
                    <Link href="/dashboard/inspections/new" className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                        <Plus size={20} /> Novo Registro
                    </Link>
                </div>
            </header>

            {/* Linha de Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Card IA (Destaque) */}
                <div className="bg-indigo-600 rounded-[40px] p-8 text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                            <BrainCircuit size={24} />
                        </div>
                        <h3 className="text-xl font-black mb-2 tracking-tight">IA Fleet Advisor</h3>
                        <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest mb-8 leading-relaxed">Insights baseados em telemetria e histórico de desgaste.</p>
                        <button className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-xs hover:scale-[1.02] transition-all">
                            Solicitar Auditoria
                        </button>
                    </div>
                </div>

                <StatusCard
                    title="Pneus em Uso"
                    value={loading ? '...' : (stats?.tires_in_use ?? 0)}
                    subtitle={`Total: ${stats?.total_tires ?? 0} | Saúde: ${stats?.total_fleet_health ?? 100}%`}
                    icon={<ShieldCheck className="text-emerald-500" />}
                    color="text-emerald-500"
                />

                <StatusCard
                    title="Alertas Pressão"
                    value={loading ? '...' : String(stats?.heat_alerts ?? 0).padStart(2, '0')}
                    subtitle="Últimos 7 dias"
                    icon={<Thermometer className="text-amber-500" />}
                    color="text-amber-500"
                />

                <StatusCard
                    title="Trocas Urgentes"
                    value={loading ? '...' : String(stats?.urgent_replacements ?? 0).padStart(2, '0')}
                    subtitle="Sulco < 3mm"
                    icon={<AlertCircle className="text-red-600" />}
                    color="text-red-600"
                />
            </div>

            {/* Grade Principal: Mapa de Eixos e Simulação */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mapa de Eixos */}
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col items-center">
                    <header className="w-full flex justify-between items-center mb-12">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Mapa de Eixos (Scania R450)</h3>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                            <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        </div>
                    </header>

                    <div className="relative w-64 h-[400px] flex items-center justify-center">
                        {/* Diagrama do Caminhão */}
                        <div className="absolute inset-0 border-4 border-gray-50 rounded-[60px] opacity-50"></div>

                        {/* Eixo Frontal */}
                        <div className="absolute top-10 flex w-full justify-between items-center px-10">
                            <TireNode status="ok" label="FL" />
                            <TireNode status="warning" label="FR" />
                        </div>

                        {/* Eixo Tração */}
                        <div className="absolute bottom-32 flex w-full justify-between items-center px-6">
                            <div className="flex gap-1.5">
                                <TireNode status="ok" />
                                <TireNode status="ok" />
                            </div>
                            <div className="flex gap-1.5">
                                <TireNode status="ok" />
                                <TireNode status="ok" />
                            </div>
                        </div>

                        {/* Eixo Truck */}
                        <div className="absolute bottom-10 flex w-full justify-between items-center px-6">
                            <div className="flex gap-1.5">
                                <TireNode status="critical" />
                                <TireNode status="ok" />
                            </div>
                            <div className="flex gap-1.5">
                                <TireNode status="ok" />
                                <TireNode status="ok" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simulação Térmica / IA Vision */}
                <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-50 flex flex-col group cursor-pointer relative overflow-hidden">
                    <header className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">Simulação Térmica (IA)</h3>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Camera size={20} />
                        </div>
                    </header>

                    <div className="flex-1 flex flex-col items-center justify-center gap-6 border-2 border-dashed border-gray-50 rounded-[32px] group-hover:bg-indigo-50/10 transition-all">
                        <div className="w-16 h-24 bg-gray-50 flex items-center justify-center rounded-xl shadow-inner relative overflow-hidden">
                            <Thermometer className="text-gray-200" size={40} />
                            <div className="absolute inset-0 bg-gradient-to-t from-orange-400/20 to-transparent"></div>
                        </div>
                        <p className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center">Clique na câmera para gerar uma análise visual de desgaste simulada por IA.</p>
                    </div>

                    {/* Overlay de Bloqueio/Empty state estilizado */}
                    <div className="absolute inset-x-10 bottom-10 top-24 bg-gradient-to-b from-white/0 via-white/80 to-white flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="font-black text-indigo-600 uppercase text-[10px] tracking-widest">Processador IA Pronto</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatusCard({ title, value, subtitle, icon, color }: any) {
    return (
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-50 hover:shadow-xl hover:shadow-indigo-100/30 transition-all duration-500 group">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-all">
                {icon}
            </div>
            <div>
                <p className="text-3xl font-black text-gray-900 tracking-tighter mb-1">{value}</p>
                <p className="text-xs font-black text-gray-600 tracking-tight mb-2">{title}</p>
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">{subtitle}</p>
            </div>
        </div>
    )
}

function TireNode({ status, label }: { status: 'ok' | 'warning' | 'critical', label?: string }) {
    const colors = {
        ok: 'bg-emerald-500 border-emerald-400 shadow-emerald-200/50',
        warning: 'bg-amber-500 border-amber-400 shadow-amber-200/50',
        critical: 'bg-red-600 border-red-500 shadow-red-200/50'
    }

    return (
        <div className="flex flex-col items-center gap-2">
            {label && <span className="text-[10px] font-black text-gray-300">{label}</span>}
            <div className={`w-8 h-12 rounded-lg border-2 shadow-xl ${colors[status]} transition-transform hover:scale-110 cursor-pointer`}></div>
        </div>
    )
}
