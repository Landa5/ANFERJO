'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

// Define input types
export type UserData = {
    email: string
    password?: string // Only for creation or reset
    full_name: string
    dni: string
    role: 'admin' | 'manager' | 'operator' | 'jefe_almacen' | 'almacen' | 'envasadora' | 'cortadora'
    cost_per_hour?: number
}

export async function createUser(data: UserData) {
    const supabase = await createClient()

    // check if current user is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Unauthorized' }

    const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()

    if (userRole?.role !== 'admin') {
        return { error: 'Forbidden: Only admins can create users' }
    }

    const supabaseAdmin = createAdminClient()

    try {
        // 1. Create user in Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                full_name: data.full_name,
                dni: data.dni,
                role: data.role,
                email_verified: true,
                phone_verified: true
            }
        })

        if (createError) throw new Error(createError.message)
        if (!newUser.user) throw new Error('Failed to create user')

        // 2. Ensure public.users data is correct and complete
        // The trigger 'on_auth_user_created' might have run and inserted data.
        // We upsert to ensure cost_per_hour is set and everything is correct.
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: newUser.user.id,
                full_name: data.full_name,
                dni: data.dni,
                role: data.role,
                cost_per_hour: data.cost_per_hour || 0,
                active: true
            })

        if (profileError) {
            console.error('Profile creation error:', profileError)
            // Clean up auth user if profile fails? 
            // await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
            throw new Error('Failed to create user profile: ' + profileError.message)
        }

        revalidatePath('/dashboard/users')
        return { success: true, userId: newUser.user.id }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function bulkCreateUsers(users: UserData[]) {
    const results = {
        successCount: 0,
        errors: [] as string[]
    }

    for (const user of users) {
        const res = await createUser(user)
        if (res.success) {
            results.successCount++
        } else {
            results.errors.push(`Error con ${user.email}: ${res.error}`)
        }
    }

    return results
}

export async function getUsers() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

export async function updateUser(userId: string, data: Partial<UserData> & { active?: boolean }) {
    const supabase = await createClient()

    // check if current user is admin
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return { error: 'Unauthorized' }

    const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single()

    if (userRole?.role !== 'admin') {
        return { error: 'Forbidden: Only admins can update users' }
    }

    const supabaseAdmin = createAdminClient()

    try {
        // 1. Update Public Profile
        const updates: any = {}
        if (data.full_name) updates.full_name = data.full_name
        if (data.dni) updates.dni = data.dni
        if (data.role) updates.role = data.role
        if (data.cost_per_hour !== undefined) updates.cost_per_hour = data.cost_per_hour
        if (data.active !== undefined) updates.active = data.active

        if (Object.keys(updates).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from('users')
                .update(updates)
                .eq('id', userId)

            if (profileError) throw new Error(profileError.message)
        }

        // 2. Update Auth (Email, Password, Metadata)
        const authUpdates: any = {}
        if (data.email) authUpdates.email = data.email
        if (data.password) authUpdates.password = data.password
        if (data.full_name || data.dni || data.role) {
            authUpdates.user_metadata = {
                full_name: data.full_name,
                dni: data.dni,
                role: data.role
            }
        }
        // Force email verify if email is changing
        if (data.email) authUpdates.email_confirm = true

        if (Object.keys(authUpdates).length > 0) {
            const { data: updateData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                userId,
                authUpdates
            )
            if (authError) throw new Error(authError.message)
        }

        revalidatePath('/dashboard/users')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
