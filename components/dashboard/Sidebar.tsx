'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard, ClipboardList, Package, BrainCircuit,
    Truck, Settings, LogOut, FileText
} from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export function Sidebar() {
    const pathname = usePathname()
    const { signOut } = useAuth()

    const menuItems = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Notas Fiscais', icon: FileText, href: '/dashboard/invoices' },
        { label: 'Inspeções', icon: ClipboardList, href: '/dashboard/inspections' },
        { label: 'Inventário Pneus', icon: Package, href: '/dashboard/inventory' },
        { label: 'Frota/Veículos', icon: Truck, href: '/dashboard/fleet' },
        { label: 'Motor de Predição', icon: BrainCircuit, href: '/dashboard/predictions' },
    ]

    return (
        <aside className="w-80 h-screen bg-gray-900 flex flex-col p-8 border-r border-gray-800">
            <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                    <Package size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-white tracking-tight">Pneu Control</h1>
                    <p className="text-gray-500 text-[10px] uppercase font-black tracking-widest">v3.0 - Enterprise</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                        >
                            <item.icon size={20} />
                            <span className="text-sm tracking-tight">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <footer className="mt-auto space-y-2 pt-8 border-t border-gray-800">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-4 px-6 py-4 rounded-2xl text-gray-500 font-bold hover:bg-gray-800 hover:text-white transition-all"
                >
                    <Settings size={20} />
                    <span className="text-sm tracking-tight">Ajustes</span>
                </Link>
                <button
                    onClick={() => signOut?.()}
                    className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-rose-500 font-bold hover:bg-rose-500/10 transition-all"
                >
                    <LogOut size={20} />
                    <span className="text-sm tracking-tight">Sair</span>
                </button>
            </footer>
        </aside>
    )
}
