'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SetupPage() {
    const [loading, setLoading] = useState(false)
    const supabase = createClient()
    const router = useRouter()

    const handleCreateAdmin = async () => {
        setLoading(true)
        // Client-side signup can sometimes be tricky with sessions. 
        // Let's try the direct client approach again but with better error handling.
        // If this button is "missing", it might be some hydration issue or extension blocking it.
        // But the user said "ya puedo entrar". 

        const { data, error } = await supabase.auth.signUp({
            email: 'admin@anferjo.com',
            password: 'admin123',
            options: {
                data: {
                    full_name: 'Admin Anferjo',
                    dni: '00000000X'
                }
            }
        })

        if (error) {
            toast.error('Error al crear: ' + error.message)
            console.error(error)
        } else {
            // Check if user is null (maybe email confirmation required?)
            if (data.user) {
                toast.success('Usuario registrado. ID: ' + data.user.id)
            } else {
                toast.warning('Registro iniciado. Verifique confirmación de email si es necesario.')
            }
        }
        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Configuración Inicial</CardTitle>
                    <CardDescription>Crear usuario administrador</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleCreateAdmin} disabled={loading} className="w-full">
                        {loading ? 'Creando...' : 'Crear Admin (admin@anferjo.com)'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
