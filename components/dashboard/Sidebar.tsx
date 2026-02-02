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
        <aside className="w-72 h-screen bg-white flex flex-col p-6 border-r border-gray-100 shadow-sm overflow-y-auto no-scrollbar">
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                    <span className="font-black text-xl">p</span>
                </div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">pneu<span className="text-indigo-600">track</span></h1>
            </div>

            <div className="space-y-8">
                <div>
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    <item.icon size={18} />
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div>
                    <p className="px-4 mb-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operações</p>
                    <nav className="space-y-1">
                        {operationItems.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
                                >
                                    <item.icon size={18} />
                                    <span className="text-sm tracking-tight">{item.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </div>

            <footer className="mt-auto pt-8">
                <div className="bg-gray-50 rounded-3xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                        {user?.user_metadata?.full_name?.substring(0, 2) || 'JG'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-gray-900 truncate">{user?.user_metadata?.full_name || 'Gestor'}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Administrador</p>
                    </div>
                    <button onClick={() => signOut?.()} className="text-gray-400 hover:text-rose-500 transition-colors">
                        <LogOut size={16} />
                    </button>
                </div>
            </footer>
        </aside>
    )
}
