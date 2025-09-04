import uuid
import os
import requests
from datetime import datetime
from sqlalchemy import text
from ..db import SessionLocal
from ..config import settings
from .celery_app import celery
from tenacity import retry, stop_after_attempt, wait_exponential

ORCH_URL = settings.ORCHESTRATOR_URL

@retry(stop=stop_after_attempt(3), wait=wait_exponential())
def call_orchestrator(payload: dict):
    resp = requests.post(f"{ORCH_URL}/v1/process_ticket", json=payload, timeout=30)
    resp.raise_for_status()
    return resp.json()

@celery.task(bind=True, max_retries=5, default_retry_delay=5)
def process_email(self, email_id: str):
    db = SessionLocal()
    started = datetime.utcnow()
    try:
        row = db.execute(text("SELECT * FROM emails WHERE id=:id"), {"id": email_id}).mappings().first()
        if not row:
            return
        db.execute(text("UPDATE emails SET status='PROCESSING' WHERE id=:id"), {"id": email_id})
        db.commit()

        payload = {
            "ticket_id": email_id,
            "from_addr": row["from_addr"],
            "to_addr": row["to_addr"],
            "subject": row.get("subject"),
            "body": row["body"]
        }

        orch_res = call_orchestrator(payload)

        category = orch_res.get("category")
        draft = orch_res.get("draft")
        final_response = orch_res.get("final_response")
        result = orch_res.get("result")
        notes = orch_res.get("notes")

        pr_id = str(uuid.uuid4())
        latency = int((datetime.utcnow() - started).total_seconds() * 1000)
        db.execute(text("""
            INSERT INTO processing_runs (id, email_id, category, draft, final_response, verifier_notes, result, latency_ms, started_at, finished_at)
            VALUES (:id, :eid, :cat, :d, :f, :n, :r, :lat, :st, :ft)
        """), {"id": pr_id, "eid": email_id, "cat": category, "d": draft, "f": final_response, "n": notes,
               "r": result, "lat": latency, "st": started, "ft": datetime.utcnow()})

        db.execute(text("UPDATE emails SET status=:s WHERE id=:id"),
                   {"s": "DONE" if result != "REJECTED" else "FAILED", "id": email_id})
        db.commit()
    except Exception as e:
        db.rollback()
        raise self.retry(exc=e)
    finally:
        db.close()
