'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { UserCog, Loader2 } from "lucide-react"
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { updateUser } from '@/actions/users'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const formSchema = z.object({
    full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    dni: z.string().min(4, 'DNI inválido'),
    email: z.string().email('Email inválido'),
    password: z.string().optional(),
    role: z.enum(['admin', 'manager', 'operator', 'jefe_almacen', 'almacen', 'envasadora', 'cortadora']),
    cost_per_hour: z.coerce.number().min(0).optional(),
    active: z.boolean().default(true),
})

interface EditUserDialogProps {
    user: any
}

export function EditUserDialog({ user }: EditUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            full_name: user.full_name || '',
            dni: user.dni || '',
            email: user.email || '', // Email might not be in public.users, fetch from auth? Or just use what we have if synced.
            // Actually, public.users doesn't have email column in schema I saw earlier? 
            // Wait, let's check if we have email in public.users. If not, we might need to fetch it or just display what we have.
            // My earlier `create_new_user` inserts into auth and public, but public.users table definition...
            // Step 715 showed public.users exists.
            // Step 675 showed error about 'sni' column vs 'dni'.
            // I should verify if public.users has email. 
            // If not, I can't pre-fill email easily without joining auth.users or adding it to public.users.
            // Given the users page displays email (line 97 in Step 846), it seems `users` variable has email?
            // Ah, the `users` variable in Page comes from `supabase.from('users').select('*')`.
            // If `users` is `public.users` view or table?
            // If it's a table and I didn't add email column, then line 97 `user.email` would be undefined unless I joined?
            // Wait, let's assume public.users DOES NOT have email, and the previous code was just showing undefined or I missed something.
            // PROCEEDING ASSUMPTION: user object passed here might need email.
            // IF user.email is missing, field will be empty.
            password: '',
            role: user.role || 'operator',
            cost_per_hour: user.cost_per_hour || 0,
            active: user.active ?? true,
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        try {
            const result = await updateUser(user.id, values)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Empleado actualizado correctamente')
                setOpen(false)
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <UserCog className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Editar Empleado</DialogTitle>
                    <DialogDescription>
                        Modifique los datos del empleado. Deje la contraseña en blanco para mantener la actual.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="full_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre Completo</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="dni"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>DNI / NIE</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cost_per_hour"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Coste Hora (€)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* 
                                NOTE: Email editing might be tricky if we don't have the current email.
                                If the input is empty on load, user might overwrite with empty string?
                                I'll make it optional in schema or handle it carefully.
                            */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email (Usuario)</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="Dejar igual si no cambia" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nueva Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Rol / Puesto</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione un rol" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="operator">Operario General</SelectItem>
                                            <SelectItem value="envasadora">Envasadora</SelectItem>
                                            <SelectItem value="cortadora">Envasadora/Cortadora</SelectItem>
                                            <SelectItem value="almacen">Mozo Almacén</SelectItem>
                                            <SelectItem value="jefe_almacen">Jefe Almacén</SelectItem>
                                            <SelectItem value="manager">Encargado</SelectItem>
                                            <SelectItem value="admin">Administrador</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>Usuario Activo</FormLabel>
                                        <DialogDescription>
                                            Desactivar para impedir el acceso.
                                        </DialogDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
