"""
Pneu Control API v3.0
Sistema Inteligente de Gestao e Predicao de Pneus
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import (
    cnpj, system_admin, companies, suppliers, 
    vehicles, tires, invoices, inspections, 
    dashboard, predictions
)

app = FastAPI(
    title="Pneu Control API",
    description="API REST para gestao preditiva de pneus de frotas pesadas",
    version="3.0.0",
)

# CORS - permite frontend (Vercel + localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://pneucontrol.vercel.app",
        "https://trax.app.br",
        "https://www.trax.app.br",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(cnpj.router, prefix="/api/v1", tags=["CNPJ"])
app.include_router(system_admin.router, prefix="/api/v1/system", tags=["System Admin"])
app.include_router(companies.router, prefix="/api/v1/system", tags=["Companies"])
app.include_router(suppliers.router, prefix="/api/v1", tags=["Suppliers"])
app.include_router(vehicles.router, prefix="/api/v1", tags=["Vehicles"])
app.include_router(tires.router, prefix="/api/v1", tags=["Tires"])
app.include_router(invoices.router, prefix="/api/v1", tags=["Invoices"])
app.include_router(inspections.router, prefix="/api/v1", tags=["Inspections"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["Dashboard"])
app.include_router(predictions.router, prefix="/api/v1", tags=["Predictions"])


@app.get("/health")
def health_check():
    """Health check endpoint para monitoramento."""
    return {"status": "healthy", "version": "3.0.0", "service": "pneu-control-api"}


@app.get("/health/detailed")
async def detailed_health_check():
    """Health check detalhado com verificação de dependências."""
    from datetime import datetime
    from app.core.config import get_settings
    from supabase import create_client
    
    settings = get_settings()
    checks = {
        "api": "healthy",
        "database": "unknown",
        "timestamp": datetime.now().isoformat(),
        "version": "3.0.0"
    }
    
    try:
        # Testar conexão com Supabase
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        result = supabase.table("tenants").select("id", count="exact").limit(1).execute()
        checks["database"] = "healthy"
        checks["tenants_count"] = result.count
    except Exception as e:
        checks["database"] = "unhealthy"
        checks["database_error"] = str(e)
    
    overall_status = "healthy" if checks["database"] == "healthy" else "degraded"
    return {"status": overall_status, **checks}

