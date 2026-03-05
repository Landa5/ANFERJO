'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type ReferenceData = {
    code: string
    name: string
    format?: string
    weight_g: number
    units_per_box: number
    is_final_product: boolean
    active: boolean
    target_units_per_hour: number
    incentive_per_unit: number
}

export async function getReferences() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('references')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function createReference(data: ReferenceData) {
    const supabase = await createClient()
    // Validation? Zod acts on client, but good to have here too.

    const { error } = await supabase.from('references').insert(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/references')
    return { success: true }
}

export async function updateReference(id: string, data: Partial<ReferenceData>) {
    const supabase = await createClient()

    const { error } = await supabase.from('references').update(data).eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/references')
    return { success: true }
}

export async function deleteReference(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('references').delete().eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/references')
    return { success: true }
}
