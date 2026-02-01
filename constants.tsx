
import { TireData, ConsumptionData, StatusDistribution, RecentActivity } from './types';

export const MOCK_CONSUMPTION: ConsumptionData[] = [
  { month: 'Jan', success: 4, failed: 5 },
  { month: 'Feb', success: 3, failed: 4 },
  { month: 'Mar', success: 2, failed: 3 },
  { month: 'Apr', success: 3, failed: 3 },
  { month: 'May', success: 5, failed: 2 },
  { month: 'Jun', success: 7, failed: 2 },
  { month: 'Jul', success: 8, failed: 4 },
  { month: 'Aug', success: 6, failed: 4 },
  { month: 'Sep', success: 4, failed: 5 },
  { month: 'Oct', success: 3, failed: 5 },
  { month: 'Nov', success: 5, failed: 4 },
  { month: 'Dec', success: 5, failed: 4 },
];

export const MOCK_STATUS: StatusDistribution[] = [
  { name: 'Novo', value: 57, color: '#F97316' },
  { name: 'Recapado', value: 25, color: '#A855F7' },
  { name: 'Sucateado', value: 18, color: '#22C55E' },
];

export const MOCK_TIRES: TireData[] = [
  { id: '1', brand: 'Michelin', model: 'X Multi Z', serial: 'MCH-9923', status: 'Novo', position: 'Eixo Dianteiro L/D', km_current: 12500, km_estimated: 80000, last_inspection: '04/22/2026' },
  { id: '2', brand: 'Bridgestone', model: 'R268', serial: 'BRD-4451', status: 'Recapado', position: 'Eixo Tração L/E', km_current: 45000, km_estimated: 60000, last_inspection: '02/13/2026' },
  { id: '3', brand: 'Pirelli', model: 'TR01', serial: 'PRL-8821', status: 'Novo', position: 'Eixo Dianteiro L/E', km_current: 8200, km_estimated: 85000, last_inspection: '05/10/2026' },
];

export const MOCK_ACTIVITIES: RecentActivity[] = [
  { id: 'a1', type: 'Troca', description: 'Troca de Pneu Eixo 1', date: 'Hoje, 08:19', vehicle: 'Scania R450', cost: -399.00 },
  { id: 'a2', type: 'Manutenção', description: 'Rodízio de Pneus', date: 'Ontem, 10:19', vehicle: 'Volvo FH540', cost: 962.00 },
  { id: 'a3', type: 'Inspeção', description: 'Inspeção de Sulcos', date: '11/02, 14:22', vehicle: 'Mercedes Actros', cost: -120.00 },
];
