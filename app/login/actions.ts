'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(prevState: any, formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

// Note: Session limits (max 2 per user) are enforced by a database trigger.
// See supabase/migrations/20260108_limit_user_sessions.sql

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()

    revalidatePath('/', 'layout')
    redirect('/')
}
