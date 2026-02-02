'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Package, BrainCircuit, LayoutDashboard } from 'lucide-react'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const navItems = [
        { label: 'Início', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Inspeção', icon: ClipboardList, href: '/dashboard/inspections/new' },
        { label: 'Pneus', icon: Package, href: '/dashboard/tires' },
        { label: 'Predição', icon: BrainCircuit, href: '/dashboard/predictions' },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            <main className="flex-1 overflow-x-hidden">
                {children}
            </main>

            {/* Bottom Navigation para Mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-6 py-4 z-50 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1.5 transition-all ${isActive ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}
                        >
                            <div className={`p-2 rounded-2xl ${isActive ? 'bg-indigo-50 shadow-inner' : ''}`}>
                                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
