'use client'

import React from 'react'
import { Settings, Construction } from 'lucide-react'

export default function MaintenancePage() {
    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-amber-50 rounded-[32px] flex items-center justify-center text-amber-600 mb-8">
                <Settings size={48} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Gestão de Manutenções</h1>
            <p className="text-gray-500 font-medium max-w-md mb-10">
                O módulo de agendamento e histórico de manutenções preventivas está em fase final de homologação.
            </p>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-4">
                <Construction className="text-amber-500" size={24} />
                <span className="font-bold text-gray-700">Módulo em Desenvolvimento</span>
            </div>
        </div>
    )
}
