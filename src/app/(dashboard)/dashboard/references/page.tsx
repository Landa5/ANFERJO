import { getReferences } from '@/actions/references'
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
import { Plus, Edit, Trash2 } from 'lucide-react'
import ReferenceDialog from '@/components/references/reference-dialog'
import { ImportReferencesDialog } from '@/components/references/import-references-dialog'

export default async function ReferencesPage() {
    const references = await getReferences()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Referencias (SKUs)</h1>
                    <p className="text-muted-foreground">Catálogo de productos y semielaborados.</p>
                </div>
                <div className="flex items-center gap-2">
                    <ImportReferencesDialog />
                    <ReferenceDialog mode="create" />
                </div>
            </div>

            <div className="border rounded-md bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Formato</TableHead>
                            <TableHead>Gramaje (g)</TableHead>
                            <TableHead>Uds/Caja</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {references?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No hay referencias registradas.
                                </TableCell>
                            </TableRow>
                        )}
                        {references?.map((ref) => (
                            <TableRow key={ref.id}>
                                <TableCell className="font-medium">{ref.code}</TableCell>
                                <TableCell>{ref.name}</TableCell>
                                <TableCell>{ref.format}</TableCell>
                                <TableCell>{ref.weight_g} g</TableCell>
                                <TableCell>{ref.units_per_box}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {ref.is_final_product ? 'Producto Final' : 'Semielaborado'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={ref.active ? 'secondary' : 'destructive'} className={ref.active ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
                                        {ref.active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right flex justify-end gap-2">
                                    <ReferenceDialog mode="edit" reference={ref} />
                                    {/* Delete button could be added here with a confirmation dialog */}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
