'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

export default function RootPage() {
  // O redirecionamento agora é feito pelo middleware.ts no lado do servidor.
  // Esta página só é vista por milissegundos durante o carregamento inicial.

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-indigo-600" size={56} />
      <div className="flex flex-col items-center gap-2">
        <p className="text-gray-900 font-black uppercase text-[12px] tracking-[6px] animate-pulse">
          TRAX Control
        </p>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
          Sincronizando ambiente seguro...
        </p>
      </div>
    </div>
  )
}