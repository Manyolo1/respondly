from pydantic import BaseModel, EmailStr
import uuid
from datetime import datetime
from typing import Optional

class TicketCreate(BaseModel):
    from_addr: EmailStr
    to_addr: EmailStr
    subject: str
    body: str

class TicketOut(BaseModel):
    id: uuid.UUID
    from_addr: EmailStr
    to_addr: EmailStr
    subject: str
    body: str
    status: str
    created_at: datetime
