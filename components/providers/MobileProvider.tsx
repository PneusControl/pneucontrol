'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { SyncManager } from '@/lib/sync/SyncManager'
import { WifiOff, CloudSync } from 'lucide-react'

interface MobileContextType {
    isOnline: boolean
    isSyncing: boolean
}

const MobileContext = createContext<MobileContextType>({ isOnline: true, isSyncing: false })

export const useMobile = () => useContext(MobileContext)

export function MobileProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)

    useEffect(() => {
        // Monitorar conexão browser-native
        const handleOnline = () => {
            setIsOnline(true)
            triggerSync()
        }
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)
        setIsOnline(navigator.onLine)

        // Tentar sync inicial se online
        if (navigator.onLine) triggerSync()

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const triggerSync = async () => {
        setIsSyncing(true)
        await SyncManager.syncPendingInspections()
        setIsSyncing(false)
    }

    return (
        <MobileContext.Provider value={{ isOnline, isSyncing }}>
            {/* Banner de Status Offline */}
            {!isOnline && (
                <div className="fixed top-0 left-0 right-0 bg-rose-600 text-white py-2 px-4 z-[9999] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-top duration-300">
                    <WifiOff size={14} /> Modo Offline Ativo - Dados sendo salvos localmente
                </div>
            )}

            {/* Indicador de Sincronização */}
            {isSyncing && (
                <div className="fixed bottom-24 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-2xl z-[9999] animate-bounce">
                    <CloudSync size={24} />
                </div>
            )}

            {children}
        </MobileContext.Provider>
    )
}
