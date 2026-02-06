from celery import Celery
from celery.schedules import crontab
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

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
    # Retry configuration
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    # Rate limiting
    task_default_rate_limit="10/m",
)

# Celery Beat schedule - tarefas periódicas
celery_app.conf.beat_schedule = {
    # Recalcular predições diariamente às 2h da manhã
    "update-predictions-daily": {
        "task": "tasks.update_all_predictions",
        "schedule": crontab(hour=2, minute=0),
    },
    # Verificar alertas de sulco crítico a cada 6 horas
    "check-critical-tires": {
        "task": "tasks.check_critical_tires",
        "schedule": crontab(hour="*/6", minute=0),
    },
}


@celery_app.task(name="tasks.update_tire_predictions")
def update_tire_predictions(tenant_id: str):
    """
    Task de background para recalcular as predicoes de todos os pneus de um tenant.
    """
    try:
        logger.info(f"Recalculando predicoes para o tenant: {tenant_id}")
        # TODO: Implementar lógica real de predição
        return {"status": "success", "tenant_id": tenant_id}
    except Exception as e:
        logger.error(f"Erro ao recalcular predicoes: {e}")
        raise


@celery_app.task(name="tasks.update_all_predictions")
def update_all_predictions():
    """
    Task periódica que atualiza predições de todos os tenants.
    Executada pelo Celery Beat diariamente.
    """
    from supabase import create_client
    
    try:
        logger.info("Iniciando atualização de predições para todos tenants")
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Buscar todos os tenants ativos
        tenants = supabase.table("tenants").select("id").eq("status", "active").execute()
        
        count = 0
        for tenant in tenants.data:
            update_tire_predictions.delay(tenant["id"])
            count += 1
        
        logger.info(f"Agendado atualização para {count} tenants")
        return {"status": "success", "tenants_processed": count}
    except Exception as e:
        logger.error(f"Erro ao atualizar predições: {e}")
        raise


@celery_app.task(name="tasks.check_critical_tires")
def check_critical_tires():
    """
    Verifica pneus com sulco crítico (<2mm) e envia alertas.
    Executada pelo Celery Beat a cada 6 horas.
    """
    from supabase import create_client
    
    try:
        logger.info("Verificando pneus com sulco crítico")
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
        
        # Buscar pneus críticos
        critical = supabase.table("tire_inventory")\
            .select("id, numero_serie, sulco_atual, tenant_id")\
            .eq("status", "em_uso")\
            .lt("sulco_atual", 2.0)\
            .execute()
        
        logger.info(f"Encontrados {len(critical.data)} pneus críticos")
        # TODO: Implementar envio de notificações/alertas
        
        return {"status": "success", "critical_count": len(critical.data)}
    except Exception as e:
        logger.error(f"Erro ao verificar pneus críticos: {e}")
        raise

