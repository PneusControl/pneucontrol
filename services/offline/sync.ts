import { db, getUnsyncedInspections } from './db';

export const syncOfflineData = async (tenantId: string) => {
    const unsynced = await getUnsyncedInspections();

    if (unsynced.length === 0) return { success: true, count: 0 };

    let successCount = 0;
    for (const inspection of unsynced) {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/inspections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenant_id: tenantId,
                    vehicle_id: inspection.vehicle_id,
                    tread_data: inspection.tread_data
                })
            });

            if (response.ok) {
                await db.inspections.update(inspection.id!, { synced: true });
                successCount++;
            }
        } catch (err) {
            console.error('Falha ao sincronizar inspeção:', inspection.id);
        }
    }

    return { success: true, count: successCount };
};
