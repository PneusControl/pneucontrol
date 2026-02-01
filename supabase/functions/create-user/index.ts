import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, tenant_id, full_name } = await req.json()

        // 1. Criar ou convidar o usuario admin
        // Usamos generateLink para criar um link de confirmacao/setup
        const { data, error } = await supabaseClient.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                data: {
                    full_name,
                    tenant_id,
                    role: 'admin'
                },
                redirectTo: `${Deno.env.get('FRONTEND_URL') || ''}/setup-password`,
            }
        })

        if (error) throw error

        return new Response(
            JSON.stringify({
                success: true,
                invite_link: data.properties.action_link
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
