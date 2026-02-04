import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { to, subject, html, resend_api_key } = body

        const apiKey = resend_api_key || Deno.env.get('RESEND_API_KEY')
        // Dominio verificado no Resend: trax.app.br
        const fromDomain = Deno.env.get('EMAIL_FROM_DOMAIN') || 'trax.app.br'

        console.log(`Tentando enviar e-mail para ${to} via ${fromDomain}...`)
        console.log(`API Key prefix: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`)

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                from: `Trax Prediction <noreply@${fromDomain}>`,
                to: Array.isArray(to) ? to : [to],
                subject: subject,
                html: html,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error('Erro no Resend:', JSON.stringify(data))
            return new Response(
                JSON.stringify({ error: 'Falha no Resend', details: data }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400
                }
            )
        }

        console.log('E-mail enviado com sucesso! ID:', data.id)

        return new Response(
            JSON.stringify(data),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        console.error('Erro critico na Edge Function:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
