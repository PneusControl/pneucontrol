import Dexie, { Table } from 'dexie';

export interface OfflineInspection {
    id?: number;
    vehicle_id: string;
    tread_data: any;
    photos: any[];
    synced: boolean;
    created_at: number;
}

export class PneuControlDatabase extends Dexie {
    inspections!: Table<OfflineInspection>;

    constructor() {
        super('PneuControlOffline');
        this.version(1).stores({
            inspections: '++id, vehicle_id, synced, created_at'
        });
    }
}

export const db = new PneuControlDatabase();

export const saveOfflineInspection = async (inspection: Omit<OfflineInspection, 'id' | 'synced' | 'created_at'>) => {
    return await db.inspections.add({
        ...inspection,
        synced: false,
        created_at: Date.now()
    });
};

export const getUnsyncedInspections = async () => {
    return await db.inspections.where('synced').equals(0).toArray(); // false is 0 in Dexie query sometimes
};
