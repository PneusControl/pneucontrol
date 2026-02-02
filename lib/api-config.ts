
const getBaseUrl = () => {
    // 1. Tenta pegar da variável de ambiente (setada no build ou runtime server-side)
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

    // 2. Se estiver no navegador, tenta inferir pelo domínio
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // Se estiver nos domínios conhecidos de produção
        if (hostname.includes('trax.app.br')) {
            return 'https://api.31.97.241.105.sslip.io'; // Fallback seguro para o IP da API
        }
        if (hostname.includes('31.97.241.105')) {
            return `https://api.${hostname}`;
        }
    }

    // 3. Fallback final para desenvolvimento local
    return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();
console.log('Using API Base URL:', API_BASE_URL);
