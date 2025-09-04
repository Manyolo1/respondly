from celery import Celery
from ..config import settings

celery = Celery("worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.worker.tasks"]
)
celery.conf.task_routes = {"app.worker.tasks.process_email": {"queue": "email_tasks"}}
