import uuid
from fastapi import APIRouter, Depends
from sqlalchemy import text
from ..db import SessionLocal
from ..schemas import TicketCreate, TicketOut
from ..worker.tasks import process_email

router = APIRouter(prefix="/v1/tickets", tags=["tickets"])

@router.post("/", response_model=TicketOut)
def create_ticket(ticket: TicketCreate):
    db = SessionLocal()
    try:
        id_ = str(uuid.uuid4())
        db.execute(text("""
            INSERT INTO emails (id, from_addr, to_addr, subject, body, status)
            VALUES (:id, :f, :t, :s, :b, 'QUEUED')
        """), {"id": id_, "f": ticket.from_addr, "t": ticket.to_addr, "s": ticket.subject, "b": ticket.body})
        db.commit()
        process_email.delay(id_)  # enqueue Celery task
        row = db.execute(text("SELECT * FROM emails WHERE id=:id"), {"id": id_}).mappings().first()
        return row
    finally:
        db.close()
