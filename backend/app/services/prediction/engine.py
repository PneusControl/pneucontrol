from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class PredictionService:
    """
    Motor de predição para estimar vida útil de pneus e cálculo de CPK.
    Baseado em histórico de sulcos, KM percorrido e custos.
    """
    
    # Limite de segurança legal/técnico (mm)
    MIN_TREAD_DEPTH = 3.0 

    def __init__(self, settings=None):
        self.settings = settings

    def calculate_tire_metrics(self, history: List[Dict[str, Any]], tire_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula as principais métricas de performance para um pneu específico.
        
        history: [{ date: "...", km: 123, tread: 15.5 }, ...]
        tire_data: { cost: 1200.0, initial_tread: 18.0, ... }
        """
        if len(history) < 1:
            return {"status": "insuficiente", "message": "Sem inspeções registradas."}

        # Converter para DataFrame para facilitar manipulação
        df = pd.DataFrame(history)
        df['date'] = pd.to_datetime(df['date'])
        df = df.sort_values('date')

        # 1. Taxa de Desgaste (KM por mm)
        # Usamos o sulco inicial do cadastro como ponto de partida se disponível
        initial_tread = tire_data.get('initial_tread', df['tread'].iloc[0])
        initial_km = tire_data.get('initial_km', df['km'].iloc[0])

        current_tread = df['tread'].iloc[-1]
        current_km = df['km'].iloc[-1]

        total_km_run = current_km - initial_km
        total_wear = initial_tread - current_tread

        if total_wear <= 0 or total_km_run <= 0:
            # Se for a primeira inspeção ou não houve desgaste/rodagem, retornamos estimativa baseada em zero
            return {
                "status": "aguardando_dados",
                "km_per_mm": 0,
                "current_wear_percent": 0
            }

        km_per_mm = total_km_run / total_wear
        
        # 2. Projeção de Fim de Vida (Quilometragem Total Estimada)
        remaining_wear = current_tread - self.MIN_TREAD_DEPTH
        expected_remaining_km = max(0, remaining_wear * km_per_mm)
        total_estimated_km = total_km_run + expected_remaining_km

        # 3. Cálculo de CPK (Custo por KM)
        cost = tire_data.get('cost', 0)
        cpk = cost / total_estimated_km if total_estimated_km > 0 else 0

        # 4. Estimativa de Data para Troca
        # Suposição média de rodagem mensal do tenant se não informado (ex: 5000km/mês)
        avg_monthly_km = tire_data.get('avg_monthly_km', 5000)
        days_remaining = (expected_remaining_km / avg_monthly_km) * 30 if avg_monthly_km > 0 else 365
        
        estimated_retirement_date = datetime.now() + timedelta(days=int(days_remaining))

        return {
            "status": "sucesso",
            "stats": {
                "km_per_mm": round(km_per_mm, 2),
                "total_estimated_km": round(total_estimated_km, 0),
                "expected_remaining_km": round(expected_remaining_km, 0),
                "cpk": round(cpk, 4),
                "wear_percent": round((total_wear / (initial_tread - self.MIN_TREAD_DEPTH)) * 100, 1) if initial_tread > self.MIN_TREAD_DEPTH else 100,
                "estimated_retirement_date": estimated_retirement_date.strftime("%Y-%m-%d")
            }
        }

    def benchmark_brands(self, fleet_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Compara o desempenho de diferentes marcas com base nos pneus já finalizados ou avançados.
        """
        if not fleet_data:
            return []

        df = pd.DataFrame(fleet_data)
        # fleet_data deve conter: brand, model, total_km, cpk
        
        summary = df.groupby(['brand', 'model']).agg({
            'total_km': 'mean',
            'cpk': 'mean'
        }).reset_index()

        return summary.sort_values('cpk').to_dict('records')
