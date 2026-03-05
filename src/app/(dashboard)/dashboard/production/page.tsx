import { getOperatorStatus, getOpenPackagingLotsForOperator } from '@/actions/production'
import OperatorPanel from '@/components/production/operator-panel'

export default async function ProductionPage() {
    const { shift, activeLog } = await getOperatorStatus()
    const openLots = await getOpenPackagingLotsForOperator()



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Panel de Operario</h1>
                    <p className="text-muted-foreground">Registro de jornada y producción.</p>
                </div>
            </div>

            <OperatorPanel
                initialShift={shift}
                initialLog={activeLog}
                openLots={openLots || []}
            />
        </div>
    )
}
