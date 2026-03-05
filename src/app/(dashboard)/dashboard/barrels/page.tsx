import { getBarrels } from '@/actions/barrels'
import { getPurchaseLots } from '@/actions/purchase'
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
import { Plus, Check, Ban } from 'lucide-react'
import BarrelDialog from '@/components/barrels/barrel-dialog'
import { format } from 'date-fns'
import BarrelActions from '@/components/barrels/barrel-actions'

export default async function BarrelsPage() {
    const barrels = await getBarrels()
    const purchaseLots = await getPurchaseLots()

    // Filter only received lots for creating new barrels?
    const activeLots = purchaseLots?.filter(l => l.status === 'received') || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Barriles (Curado)</h1>
                    <p className="text-muted-foreground">Gestión de curado y stock intermedio.</p>
                </div>
                <BarrelDialog purchaseLots={activeLots} />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código Barril</TableHead>
                            <TableHead>Lote Origen</TableHead>
                            <TableHead>Fecha Inicio</TableHead>
                            <TableHead>Fecha Fin Est.</TableHead>
                            <TableHead>Kg Netos</TableHead>
                            <TableHead>Ubicación</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {barrels?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No hay barriles registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {barrels?.map((barrel) => (
                            <TableRow key={barrel.id}>
                                <TableCell className="font-medium">{barrel.barrel_code}</TableCell>
                                <TableCell>{barrel.purchase_lot?.lot_code}</TableCell>
                                <TableCell>{format(new Date(barrel.creation_date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{barrel.estimated_ready_date ? format(new Date(barrel.estimated_ready_date), 'dd/MM/yyyy') : '-'}</TableCell>
                                <TableCell>{barrel.net_weight_kg} kg</TableCell>
                                <TableCell>{barrel.location}</TableCell>
                                <TableCell>
                                    <Badge variant={barrel.status === 'ready' ? 'default' : barrel.status === 'curing' ? 'secondary' : 'destructive'}
                                        className={barrel.status === 'ready' ? "bg-green-600" : ""}
                                    >
                                        {{
                                            'curing': 'En Curado',
                                            'ready': 'Listo',
                                            'blocked': 'Bloqueado',
                                            'consumed': 'Consumido'
                                        }[barrel.status as string] || barrel.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <BarrelActions id={barrel.id} currentStatus={barrel.status} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
