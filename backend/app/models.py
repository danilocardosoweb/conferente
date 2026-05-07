from datetime import datetime
from sqlalchemy import Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class Reading(Base):
    """Registro de cada leitura realizada pelo sistema."""

    __tablename__ = "readings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Resultado da detecção automática
    detected_count: Mapped[int] = mapped_column(Integer, nullable=False)

    # Contagem final após ajuste manual (pode ser igual à detectada)
    final_count: Mapped[int] = mapped_column(Integer, nullable=False)

    # Diferença entre detecção e ajuste manual
    manual_adjustment: Mapped[int] = mapped_column(Integer, default=0)

    # Informações do contexto
    operator: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pallet_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Parâmetros usados no processamento
    processing_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Métricas de qualidade da detecção
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    processing_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Imagem processada em base64 (miniatura para histórico)
    thumbnail_base64: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )
