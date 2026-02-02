from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "pneucontrol_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
)

@celery_app.task(name="tasks.update_tire_predictions")
def update_tire_predictions(tenant_id: str):
    """
    Task de background para recalcular as predicoes de todos os pneus de um tenant.
    """
    from app.services.prediction.engine import PredictionService
    # Logica de busca de dados no Supabase e execucao do motor
    print(f"Recalculando predicoes para o tenant: {tenant_id}")
    return True
