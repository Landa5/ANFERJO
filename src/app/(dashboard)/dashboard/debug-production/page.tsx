
import { getOperatorStatus, getOpenPackagingLotsForOperator } from '@/actions/production'

export default async function DebugProductionPage() {
    let data = {}
    try {
        const status = await getOperatorStatus()
        const lots = await getOpenPackagingLotsForOperator()
        data = { status, lots }
    } catch (e: any) {
        data = { error: e.message }
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Production Data</h1>
            <pre className="bg-slate-900 text-green-400 p-4 rounded overflow-auto">
                {JSON.stringify(data, null, 2)}
            </pre>
        </div>
    )
}
