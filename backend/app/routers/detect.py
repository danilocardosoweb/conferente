"""
Rota de detecção: recebe imagem, executa pipeline OpenCV, retorna resultado.
"""

import json
from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from app.schemas import DetectionParams, DetectionResult
from app.vision.processor import detector

router = APIRouter(prefix="/detect", tags=["Detecção"])


@router.post("/", response_model=DetectionResult, summary="Processar imagem e contar perfis")
async def detect_profiles(
    file: UploadFile = File(..., description="Imagem JPEG ou PNG da extremidade do pallet"),
    params: str = Form(
        default="{}",
        description="JSON com DetectionParams (opcional, usa defaults se omitido)",
    ),
):
    """
    Recebe uma imagem e parâmetros de detecção, executa o pipeline OpenCV
    e retorna a contagem de perfis com a imagem anotada em base64.
    """
    # Valida tipo de arquivo
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=415,
            detail="Formato não suportado. Use JPEG, PNG ou WebP.",
        )

    # Parse dos parâmetros (enviados como JSON string no form)
    try:
        params_dict = json.loads(params)
        detection_params = DetectionParams(**params_dict)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Parâmetros inválidos: {exc}") from exc

    # Lê bytes da imagem
    image_bytes = await file.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Imagem vazia.")

    # Executa processamento OpenCV
    try:
        result = detector.process(image_bytes, detection_params)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro no processamento: {exc}") from exc

    return DetectionResult(
        detected_count=result.detected_count,
        confidence_score=result.confidence_score,
        processing_time_ms=result.processing_time_ms,
        annotated_image_base64=result.annotated_image_base64,
        debug_steps=result.debug_steps,
        params_used=detection_params,
    )
