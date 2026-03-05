// Add 'use client' wrapper or separate client component if needed. 
// Since this is a server component, we need a client wrapper for the dialog or just make the page client?
// Making page client is easiest for dialog state, but we lose async data fetching directly.
// Best approach: Keep page server, create a client wrapper for the list + dialog?
// OR: Just make the Dialog a separate client component. 'UserListManager' maybe.

// Let's refactor:
// 1. Keep page server side for fetching.
// 2. Pass users to a new Client Component <UsersList users={users} />
// 3. Render Dialog inside UsersList.

// ... But for now to fit in tool edits, I'll make the page render a Client Component that handles everything? 
// No, let's keep it simple. I'll make a new client component `UsersClientPage` or similar.

// Actually, I can just change this file to use a Client Component for the "Create Button + Dialog" part.
// But the table also needs to update optimistic or refresh.
// `createUser` calls revalidatePath, so server refresh works.

// Plan: 
// 1. Create `src/components/users/create-user-dialog.tsx` (Client Component)
// 2. Import it here.
// 3. Update Table Badges logic here directly.

import { createClient } from '@/utils/supabase/server'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserCog } from 'lucide-react'
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Encargado',
    operator: 'Operario',
    jefe_almacen: 'Jefe Almacén',
    almacen: 'Mozo Almacén',
    envasadora: 'Envasadora',
    cortadora: 'Cortadora',
}

const ROLE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    admin: 'default',
    manager: 'secondary',
    jefe_almacen: 'secondary',
    operator: 'outline',
    almacen: 'outline',
    envasadora: 'outline',
    cortadora: 'outline',
}

export default async function UsersPage() {
    const supabase = await createClient()
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
                    <p className="text-muted-foreground">Gestión de personal y roles.</p>
                </div>
                <CreateUserDialog />
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>DNI</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Coste/h</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No hay empleados registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {users?.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{user.full_name}</span>
                                        <span className="text-xs text-muted-foreground">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.dni}</TableCell>
                                <TableCell>
                                    <Badge variant={ROLE_VARIANTS[user.role] || 'outline'}>
                                        {ROLE_LABELS[user.role] || user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.cost_per_hour ? `${user.cost_per_hour}€` : '-'}</TableCell>
                                <TableCell>
                                    <Badge variant={user.active ? 'secondary' : 'destructive'} className={user.active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                                        {user.active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <EditUserDialog user={user} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
