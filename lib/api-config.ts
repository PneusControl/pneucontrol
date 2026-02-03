const getBaseUrl = () => {
    // 1. Tenta pegar da variável de ambiente (Browser ou Server)
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl.startsWith('http')) return envUrl;

    // 2. Se estiver no navegador, tenta inferir pelo domínio
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Se estiver em produção (Vercel ou Domínio Próprio)
        if (hostname.includes('vercel.app') ||
            hostname.includes('trax.app.br') ||
            hostname.includes('31.97.241.105')) {
            return 'https://api.31.97.241.105.sslip.io';
        }
    }

    // 3. Fallback final para desenvolvimento local
    return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();

if (typeof window !== 'undefined') {
    console.log('🚀 API Config:', {
        hostname: window.location.hostname,
        apiUrl: API_BASE_URL,
        envUrl: process.env.NEXT_PUBLIC_API_URL
    });
}
