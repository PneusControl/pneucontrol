import { db, type PendingInspection } from '../db';

export class SyncManager {
    private static isSyncing = false;

    static async syncPendingInspections() {
        if (this.isSyncing) return;

        // Verificar se há conexão antes de tentar (opcional, Capacitor Network pode ser usado aqui)
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.log('App Offline: Sincronização adiada');
            return;
        }

        this.isSyncing = true;
        console.log('Iniciando sincronização de inspeções pendentes...');

        try {
            const pending = await db.pending_inspections
                .where('synced')
                .equals(0)
                .toArray();

            if (pending.length === 0) {
                console.log('Nada para sincronizar.');
                this.isSyncing = false;
                return;
            }

            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            for (const inspection of pending) {
                try {
                    const response = await fetch(`${baseUrl}/api/v1/inspections`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tenant_id: inspection.tenant_id,
                            vehicle_id: inspection.vehicle_id,
                            inspector_id: inspection.inspector_id,
                            odometer_km: inspection.odometer_km,
                            items: inspection.items
                        })
                    });

                    if (response.ok) {
                        await db.pending_inspections.update(inspection.id!, { synced: 1 });
                        console.log(`Inspeção ${inspection.id_uuid} sincronizada com sucesso.`);
                    }
                } catch (err) {
                    console.error(`Falha ao sincronizar inspeção ${inspection.id_uuid}:`, err);
                    // Continua para a próxima, tentará novamente depois
                }
            }
        } catch (err) {
            console.error('Erro no SyncManager:', err);
        } finally {
            this.isSyncing = false;
        }
    }

    static async cacheRequiredData(tenant_id: string, tires: any[], vehicles: any[]) {
        await db.tires.clear();
        await db.vehicles.clear();

        await db.tires.bulkAdd(tires);
        await db.vehicles.bulkAdd(vehicles);
        console.log('Cache de dados offline atualizado.');
    }
}
