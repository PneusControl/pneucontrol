import Dexie, { type Table } from 'dexie';

export interface OfflineTire {
    id: string;
    serial_number: string;
    brand: string;
    model: string;
    tenant_id: string;
}

export interface OfflineVehicle {
    id: string;
    plate: string;
    brand: string;
    model: string;
    axle_configuration: any;
    tenant_id: string;
    current_km?: number;
}

export interface PendingInspection {
    id?: number;
    id_uuid: string; // UUID gerado no mobile para facilitar merge posterior
    tenant_id: string;
    vehicle_id: string;
    inspector_id: string;
    odometer_km: number;
    items: any[];
    created_at: number;
    synced: number; // 0 para falso, 1 para verdadeiro
}

export class PneuControlDB extends Dexie {
    tires!: Table<OfflineTire>;
    vehicles!: Table<OfflineVehicle>;
    pending_inspections!: Table<PendingInspection>;

    constructor() {
        super('PneuControlDB');
        this.version(2).stores({
            tires: 'id, serial_number, tenant_id',
            vehicles: 'id, plate, tenant_id',
            pending_inspections: '++id, id_uuid, tenant_id, synced'
        });
    }
}

export const db = new PneuControlDB();
