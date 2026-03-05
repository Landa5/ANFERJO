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
import { Plus } from 'lucide-react'
import PurchaseDialog from '@/components/purchase/purchase-dialog'
import { format } from 'date-fns'

export default async function PurchaseLotsPage() {
    const lots = await getPurchaseLots()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lotes de Compra</h1>
                    <p className="text-muted-foreground">Recepción de materia prima (Pescado).</p>
                </div>
                <PurchaseDialog />
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lote</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Proveedor</TableHead>
                            <TableHead>Especie</TableHead>
                            <TableHead>Kg</TableHead>
                            <TableHead>Calibre</TableHead>
                            <TableHead>Temp (ºC)</TableHead>
                            <TableHead>Estado</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lots?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No hay lotes registrados.
                                </TableCell>
                            </TableRow>
                        )}
                        {lots?.map((lot) => (
                            <TableRow key={lot.id}>
                                <TableCell className="font-medium">{lot.lot_code}</TableCell>
                                <TableCell>{format(new Date(lot.purchase_date), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>{lot.provider}</TableCell>
                                <TableCell>{lot.species}</TableCell>
                                <TableCell>{lot.kg_bought} kg</TableCell>
                                <TableCell>{lot.caliber}</TableCell>
                                <TableCell>{lot.reception_temp} ºC</TableCell>
                                <TableCell>
                                    <Badge variant={lot.status === 'received' ? 'default' : 'secondary'}>
                                        {{
                                            'received': 'Recibido'
                                        }[lot.status as string] || lot.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
