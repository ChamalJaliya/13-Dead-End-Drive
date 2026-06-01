from fastapi import FastAPI

from app.decide import router as decide_router

app = FastAPI(title="13 Dead End Drive Bot AI", version="0.1.0")
app.include_router(decide_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
