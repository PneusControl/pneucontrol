/**
 * Configuração da API Backend
 * Usa variável de ambiente em produção/desenvolvimento
 */
const getBaseUrl = () => {
    // 1. Prioritário: variável de ambiente (sempre funciona)
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl.startsWith('http')) return envUrl;

    // 2. Em produção (Vercel/Domínio próprio), usa API fixa
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Produção
        if (hostname === 'trax.app.br' ||
            hostname === 'www.trax.app.br' ||
            hostname.includes('pneucontrol.vercel.app')) {
            return 'https://api.31.97.241.105.sslip.io';
        }
    }

    // 3. Fallback para desenvolvimento local
    return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();

// Log apenas em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log('🚀 API Config:', {
        hostname: window.location.hostname,
        apiUrl: API_BASE_URL,
        envUrl: process.env.NEXT_PUBLIC_API_URL
    });
}

