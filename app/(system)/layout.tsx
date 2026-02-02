'use client'

import React, { useEffect } from 'react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import MobileLayout from '@/components/mobile/MobileLayout'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SystemLayout({ children }: { children: React.ReactNode }) {
    const { isSystemAdmin, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isSystemAdmin) {
            router.push('/dashboard')
        }
    }, [isSystemAdmin, loading, router])

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#F8F9FD]">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        )
    }

    if (!isSystemAdmin) {
        return null // Will redirect in useEffect
    }

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Desktop */}
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
