from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Parâmetros de detecção enviados pelo frontend
# ---------------------------------------------------------------------------

class DetectionParams(BaseModel):
    min_radius: int = Field(default=8, ge=1, le=500, description="Raio mínimo dos círculos em pixels")
    max_radius: int = Field(default=80, ge=1, le=1000, description="Raio máximo dos círculos em pixels")
    canny_low: int = Field(default=30, ge=1, le=255, description="Limiar inferior do Canny")
    canny_high: int = Field(default=100, ge=1, le=255, description="Limiar superior do Canny")
    hough_param1: int = Field(default=50, ge=1, le=300, description="Param1 da HoughCircles (sensibilidade de borda)")
    hough_param2: int = Field(default=25, ge=1, le=300, description="Param2 da HoughCircles (acumulador)")
    min_dist: int = Field(default=20, ge=1, le=500, description="Distância mínima entre centros detectados")
    use_contours: bool = Field(default=True, description="Usar análise de contornos além de HoughCircles")
    use_morphology: bool = Field(default=True, description="Aplicar operações morfológicas antes da detecção")
    blur_kernel: int = Field(default=5, ge=1, le=31, description="Tamanho do kernel de desfoque (ímpar)")


# ---------------------------------------------------------------------------
# Resposta do processamento de imagem
# ---------------------------------------------------------------------------

class DetectionResult(BaseModel):
    detected_count: int
    confidence_score: float
    processing_time_ms: float
    annotated_image_base64: str
    debug_steps: list[str]
    params_used: DetectionParams


# ---------------------------------------------------------------------------
# CRUD de leituras
# ---------------------------------------------------------------------------

class ReadingCreate(BaseModel):
    detected_count: int
    final_count: int
    manual_adjustment: int = 0
    operator: str | None = None
    pallet_id: str | None = None
    notes: str | None = None
    processing_params: dict[str, Any] | None = None
    confidence_score: float | None = None
    processing_time_ms: float | None = None
    thumbnail_base64: str | None = None


class ReadingUpdate(BaseModel):
    final_count: int | None = None
    manual_adjustment: int | None = None
    operator: str | None = None
    pallet_id: str | None = None
    notes: str | None = None


class ReadingOut(BaseModel):
    id: int
    detected_count: int
    final_count: int
    manual_adjustment: int
    operator: str | None
    pallet_id: str | None
    notes: str | None
    confidence_score: float | None
    processing_time_ms: float | None
    thumbnail_base64: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReadingListOut(BaseModel):
    items: list[ReadingOut]
    total: int
    page: int
    page_size: int


# ---------------------------------------------------------------------------
# Estatísticas do dashboard
# ---------------------------------------------------------------------------

class DashboardStats(BaseModel):
    total_readings: int
    total_profiles_counted: int
    avg_per_reading: float
    avg_confidence: float
    readings_today: int
    profiles_today: int
