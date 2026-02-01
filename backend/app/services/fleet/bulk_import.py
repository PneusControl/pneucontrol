import csv
import io
from typing import List, Dict, Any, Optional
from datetime import datetime
from supabase import Client
from app.core.config import settings

class BulkImportService:
    """
    Serviço para importação massiva de dados de pneus e veículos.
    Focado em performance e integridade de dados.
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase

    async def import_tires_csv(self, tenant_id: str, csv_content: str) -> Dict[str, Any]:
        """
        Processa um CSV de pneus e insere em lote no banco.
        Campos esperados: serial_number, brand, model, size, initial_tread, current_tread, dot
        """
        f = io.StringIO(csv_content)
        reader = csv.DictReader(f)
        
        tires_to_insert = []
        errors = []
        counts = {"success": 0, "error": 0}

        # 1. Buscar pneus já existentes para evitar duplicidade (pelo serial_number)
        existing_res = self.supabase.table("tire_inventory") \
            .select("serial_number") \
            .eq("tenant_id", tenant_id) \
            .execute()
        
        existing_serials = {row["serial_number"] for row in existing_res.data}

        for i, row in enumerate(reader):
            try:
                serial = row.get("serial_number", "").strip()
                if not serial:
                    errors.append(f"Linha {i+1}: Número de série ausente.")
                    counts["error"] += 1
                    continue

                if serial in existing_serials:
                    errors.append(f"Linha {i+1}: Pneu com série '{serial}' já cadastrado.")
                    counts["error"] += 1
                    continue

                # Preparar objeto de banco
                tire = {
                    "tenant_id": tenant_id,
                    "serial_number": serial,
                    "brand": row.get("brand", "Genérico").strip(),
                    "model": row.get("model", "N/A").strip(),
                    "size": row.get("size", "N/A").strip(),
                    "initial_tread": float(row.get("initial_tread", 0) or 0),
                    "current_tread": float(row.get("current_tread", 0) or 0),
                    "dot": row.get("dot", "").strip(),
                    "status": "stock", # Pneu importado entra como estoque
                    "created_at": datetime.utcnow().isoformat()
                }
                
                tires_to_insert.append(tire)
                existing_serials.add(serial) # Evita duplicatas dentro do próprio CSV

            except Exception as e:
                errors.append(f"Linha {i+1}: Erro inesperado: {str(e)}")
                counts["error"] += 1

        # 2. Inserção em Lote (Batch Insert)
        if tires_to_insert:
            try:
                # Divide em chunks de 500 para não estourar limites do Postgres/API
                chunk_size = 500
                for i in range(0, len(tires_to_insert), chunk_size):
                    chunk = tires_to_insert[i:i + chunk_size]
                    self.supabase.table("tire_inventory").insert(chunk).execute()
                
                counts["success"] = len(tires_to_insert)
            except Exception as e:
                errors.append(f"Erro Crítico na Inserção: {str(e)}")
                counts["success"] = 0

        return {
            "success": counts["success"] > 0 or len(errors) == 0,
            "counts": counts,
            "errors": errors[:50] # Limita a 50 erros para não sobrecarregar log
        }

    def get_csv_template(self) -> str:
        """Retorna o cabeçalho padrão para o template de importação."""
        return "serial_number,brand,model,size,initial_tread,current_tread,dot\n"
