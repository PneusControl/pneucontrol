'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, ClipboardList, Package, BrainCircuit,
    Truck, Settings, LogOut, FileText, Bell, Search, ShieldCheck, Thermometer, AlertCircle
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export function Sidebar() {
    const pathname = usePathname()
    const { user, signOut } = useAuth()

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Frota Ativa', icon: Truck, href: '/dashboard/fleet' },
        { label: 'Estoque', icon: Package, href: '/dashboard/tires' },
        { label: 'Relatórios', icon: FileText, href: '/dashboard/reports' },
    ]

    const operationItems = [
        { label: 'Inspeções', icon: ClipboardList, href: '/dashboard/inspections' },
        { label: 'Manutenções', icon: Settings, href: '/dashboard/maintenance' },
        { label: 'Ajustes', icon: Settings, href: '/dashboard/settings' },
    ]

    return (
        <aside className="w-72 h-screen bg-indigo-600 flex flex-col p-6 shadow-2xl overflow-y-auto no-scrollbar border-r border-white/5">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-lg">
                    <span className="font-black text-xl">p</span>
                </div>
                <h1 className="text-xl font-black text-white tracking-tight">pneu<span className="text-white/80">track</span></h1>
            </div>

            <div className="space-y-10">
                <div>
                    <nav className="space-y-2">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold transition-all ${isActive ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <item.icon size={20} />
                                    <span className="text-[15px] tracking-tight">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div>
                    <p className="px-4 mb-4 text-[11px] font-black text-white/30 uppercase tracking-[0.2em]">Operações</p>
                    <nav className="space-y-2">
                        {operationItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl font-semibold transition-all ${isActive ? 'bg-white/20 text-white shadow-inner' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                                >
                                    <item.icon size={20} />
                                    <span className="text-[15px] tracking-tight">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>

            <footer className="mt-auto pt-8">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-4 flex items-center gap-3 border border-white/5">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase border border-white/10">
                        {user?.user_metadata?.full_name?.substring(0, 2) || 'JG'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || 'Gestor'}</p>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Admin</p>
                    </div>
                    <button onClick={() => signOut?.()} className="text-white/40 hover:text-rose-400 transition-colors p-2">
                        <LogOut size={18} />
                    </button>
                </div>
            </footer>
        </aside>
    )
}
