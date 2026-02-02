'use client'

import React from 'react'
import { FileText, Construction } from 'lucide-react'

export default function ReportsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-indigo-600 mb-8">
                <FileText size={48} />
            </div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Relatórios Avançados</h1>
            <p className="text-gray-500 font-medium max-w-md mb-10">
                Esta funcionalidade está sendo preparada para consolidação de dados de telemetria e custos operacionais.
            </p>
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex items-center gap-4">
                <Construction className="text-amber-500" size={24} />
                <span className="font-bold text-gray-700">Módulo em Desenvolvimento</span>
            </div>
        </div>
    )
}
