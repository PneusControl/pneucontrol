'use client'

import React from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import MobileLayout from '@/components/mobile/MobileLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop - Oculta no Mobile pelo componente */}
            <div className="hidden lg:block">
                <Sidebar />
            </div>

            {/* Conteúdo Principal + Layout Mobile */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileLayout>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {children}
                    </div>
                </MobileLayout>
            </div>
        </div>
    )
}
