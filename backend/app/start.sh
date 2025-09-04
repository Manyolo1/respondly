#!/bin/bash
set -e

if [ "$1" = "api" ]; then
  echo "Starting FastAPI..."
  alembic upgrade head || true
  uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
elif [ "$1" = "worker" ]; then
  echo "Starting Celery worker..."
  celery -A app.worker.celery_app.celery worker --loglevel=info -Q email_tasks
else
  exec "$@"
fi
