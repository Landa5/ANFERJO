'use server'

import { createClient } from '@/utils/supabase/server'

export async function getAuditLogs() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Authorization check: only admins
    const { data: dbUser } = await supabase.from('users').select('role').eq('id', user?.id).single()
    if (dbUser?.role !== 'admin') {
        throw new Error('Unauthorized')
    }

    const { data, error } = await supabase
        .from('audit_logs')
        .select(`
            *,
            user:users(full_name) 
        `)
        .order('created_at', { ascending: false })
        .limit(100)

    if (error) throw new Error(error.message)
    return data
}
