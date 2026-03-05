'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getKioskData() {
    const supabase = createAdminClient()

    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('active', true)
        .order('full_name')

    const { data: references, error: refError } = await supabase
        .from('references')
        .select('id, name')
        .eq('active', true)
        .order('name')

    return {
        users: users || [],
        references: references || [],
        error: usersError?.message || refError?.message || null
    }
}

export async function getActiveLogsForUser(userId: string) {
    const supabase = createAdminClient()
    const { data: activeLogs, error } = await supabase
        .from('production_logs')
        .select(`
            id,
            start_time,
            reference_id,
            reference:references(name)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')

    return { activeLogs: activeLogs || [], error: error?.message || null }
}

export async function startProductionAction(userId: string, referenceId: string) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('production_logs').insert({
        user_id: userId,
        reference_id: referenceId,
        start_time: new Date().toISOString(),
        status: 'active'
    })

    if (error) return { error: error.message }

    revalidatePath('/produccion')
    return { success: true }
}

export async function endProductionAction(logId: string, units: number) {
    const supabase = createAdminClient()
    const { error } = await supabase.from('production_logs').update({
        end_time: new Date().toISOString(),
        units_produced: units,
        status: 'completed'
    }).eq('id', logId)

    if (error) return { error: error.message }

    revalidatePath('/produccion')
    return { success: true }
}
