import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URL de produção hardcoded para garantir funcionamento
const FRONTEND_URL = 'https://trax.app.br'

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { email, tenant_id, full_name, role = 'admin', permissions = [] } = await req.json()

        console.log(`Creating invite for ${email} with redirect to ${FRONTEND_URL}/setup-password`)

        // Criar convite com metadata completo
        const { data, error } = await supabaseClient.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                data: {
                    full_name,
                    tenant_id,
                    role, // 'admin' ou 'operator'
                    permissions // Array de permissoes especificas
                },
                redirectTo: `${FRONTEND_URL}/setup-password`,
            }
        })

        if (error) {
            console.error('Error generating invite link:', error.message)
            throw error
        }

        console.log(`Invite link generated successfully for ${email}`)

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
        console.error('Critical error in create-user:', error.message)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
