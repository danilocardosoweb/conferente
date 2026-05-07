"""
CRUD completo de leituras + estatísticas do dashboard.
"""

from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Reading
from app.schemas import (
    DashboardStats,
    ReadingCreate,
    ReadingListOut,
    ReadingOut,
    ReadingUpdate,
)

router = APIRouter(prefix="/readings", tags=["Leituras"])


# ---------------------------------------------------------------------------
# Criar leitura
# ---------------------------------------------------------------------------

@router.post("/", response_model=ReadingOut, status_code=201, summary="Salvar nova leitura")
async def create_reading(payload: ReadingCreate, db: AsyncSession = Depends(get_db)):
    reading = Reading(**payload.model_dump())
    db.add(reading)
    await db.flush()
    await db.refresh(reading)
    return reading


# ---------------------------------------------------------------------------
# Listar leituras (paginado)
# ---------------------------------------------------------------------------

@router.get("/", response_model=ReadingListOut, summary="Listar histórico de leituras")
async def list_readings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    pallet_id: str | None = Query(default=None),
    operator: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Reading).order_by(Reading.created_at.desc())

    if pallet_id:
        stmt = stmt.where(Reading.pallet_id == pallet_id)
    if operator:
        stmt = stmt.where(Reading.operator == operator)

    # Total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    # Página
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()

    return ReadingListOut(items=list(rows), total=total, page=page, page_size=page_size)


# ---------------------------------------------------------------------------
# Buscar leitura por ID
# ---------------------------------------------------------------------------

@router.get("/{reading_id}", response_model=ReadingOut, summary="Buscar leitura por ID")
async def get_reading(reading_id: int, db: AsyncSession = Depends(get_db)):
    reading = await db.get(Reading, reading_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Leitura não encontrada.")
    return reading


# ---------------------------------------------------------------------------
# Atualizar leitura (ajuste manual)
# ---------------------------------------------------------------------------

@router.patch("/{reading_id}", response_model=ReadingOut, summary="Atualizar leitura (ajuste manual)")
async def update_reading(
    reading_id: int, payload: ReadingUpdate, db: AsyncSession = Depends(get_db)
):
    reading = await db.get(Reading, reading_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Leitura não encontrada.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reading, field, value)

    reading.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(reading)
    return reading


# ---------------------------------------------------------------------------
# Deletar leitura
# ---------------------------------------------------------------------------

@router.delete("/{reading_id}", status_code=204, summary="Deletar leitura")
async def delete_reading(reading_id: int, db: AsyncSession = Depends(get_db)):
    reading = await db.get(Reading, reading_id)
    if not reading:
        raise HTTPException(status_code=404, detail="Leitura não encontrada.")
    await db.delete(reading)


# ---------------------------------------------------------------------------
# Estatísticas do dashboard
# ---------------------------------------------------------------------------

@router.get("/stats/dashboard", response_model=DashboardStats, summary="Estatísticas do dashboard")
async def dashboard_stats(db: AsyncSession = Depends(get_db)):
    total_readings = (await db.execute(select(func.count(Reading.id)))).scalar_one()
    total_profiles = (await db.execute(select(func.sum(Reading.final_count)))).scalar_one() or 0
    avg_per = (await db.execute(select(func.avg(Reading.final_count)))).scalar_one() or 0.0
    avg_conf = (await db.execute(select(func.avg(Reading.confidence_score)))).scalar_one() or 0.0

    today = date.today()
    today_start = datetime(today.year, today.month, today.day, tzinfo=timezone.utc)

    today_stmt = select(Reading).where(Reading.created_at >= today_start)
    today_rows = (await db.execute(today_stmt)).scalars().all()
    readings_today = len(today_rows)
    profiles_today = sum(r.final_count for r in today_rows)

    return DashboardStats(
        total_readings=total_readings,
        total_profiles_counted=int(total_profiles),
        avg_per_reading=round(float(avg_per), 1),
        avg_confidence=round(float(avg_conf), 3),
        readings_today=readings_today,
        profiles_today=profiles_today,
    )
