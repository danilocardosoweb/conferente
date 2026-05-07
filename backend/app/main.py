"""
Ponto de entrada da API FastAPI – Conferente
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import detect, readings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa banco de dados na subida da aplicação."""
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API de visão computacional para contagem de perfis de alumínio em pallets.",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – permite chamadas do frontend Next.js
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(detect.router, prefix="/api/v1")
app.include_router(readings.router, prefix="/api/v1")


@app.get("/health", tags=["Status"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}
