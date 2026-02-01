
export interface TireData {
  id: string;
  brand: string;
  model: string;
  serial: string;
  status: 'Novo' | 'Recapado' | 'Sucateado';
  position: string;
  km_current: number;
  km_estimated: number;
  last_inspection: string;
}

export interface ConsumptionData {
  month: string;
  success: number;
  failed: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: 'Troca' | 'Manutenção' | 'Inspeção';
  description: string;
  date: string;
  vehicle: string;
  cost: number;
}
