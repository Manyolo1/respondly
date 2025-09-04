from fastapi import FastAPI
from .routes import tickets

app = FastAPI(title="EmpathAI Support API")
app.include_router(tickets.router)

@app.get("/healthz")
def health():
    return {"ok": True}
