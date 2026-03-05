import { getPackagingLots } from '@/actions/packaging'
import { getReferences } from '@/actions/references'
import { getBarrels } from '@/actions/barrels'
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
import { Plus } from 'lucide-react'
import PackagingDialog from '@/components/packaging/packaging-dialog'
import { format } from 'date-fns'
import PackagingActions from '@/components/packaging/packaging-actions'

export default async function PackagingPage() {
    const lots = await getPackagingLots()
    const references = await getReferences()
    // We need barrels that are 'ready' to be consumed
    const allBarrels = await getBarrels()
    const readyBarrels = allBarrels?.filter(b => b.status === 'ready') || []

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Envasado</h1>
                    <p className="text-muted-foreground">Órdenes de producción y consumo de barriles.</p>
                </div>
                <PackagingDialog references={references || []} readyBarrels={readyBarrels} />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lote Envasado</TableHead>
                            <TableHead>Referencia</TableHead>
                            <TableHead>Inicio</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Barriles</TableHead>
                            <TableHead>Total Latas</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lots?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No hay órdenes de envasado.
                                </TableCell>
                            </TableRow>
                        )}
                        {lots?.map((lot) => (
                            <TableRow key={lot.id}>
                                <TableCell className="font-medium">{lot.lot_code}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span>{lot.reference?.code}</span>
                                        <span className="text-xs text-muted-foreground">{lot.reference?.name}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{format(new Date(lot.start_date), 'dd/MM/yyyy HH:mm')}</TableCell>
                                <TableCell>{lot.end_date ? format(new Date(lot.end_date), 'dd/MM/yyyy') : '-'}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {lot.barrel_usage?.map((u: any) => (
                                            <Badge key={u.barrel.barrel_code} variant="outline" className="text-xs">
                                                {u.barrel.barrel_code}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>{lot.total_units_produced}</TableCell>
                                <TableCell>
                                    <Badge variant={lot.status === 'open' ? 'default' : 'secondary'} className={lot.status === 'open' ? 'bg-green-600' : ''}>
                                        {lot.status === 'open' ? 'En Curso' : 'Cerrado'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <PackagingActions id={lot.id} status={lot.status} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
