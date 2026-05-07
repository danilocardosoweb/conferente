"""
Módulo de visão computacional para detecção de extremidades de perfis de alumínio.

Pipeline:
  1. Pré-processamento (redimensionamento, desfoque, conversão para cinza)
  2. Realce de contraste via CLAHE
  3. Threshold adaptativo + morfologia
  4. Canny Edge Detection
  5. HoughCircles para perfis circulares/tubulares
  6. Análise de contornos para perfis retangulares/complexos
  7. Fusão de detecções e eliminação de duplicatas (NMS simples)
  8. Anotação da imagem de saída
"""

import time
import base64
from dataclasses import dataclass, field

import cv2
import numpy as np

from app.schemas import DetectionParams


# ---------------------------------------------------------------------------
# Estrutura de resultado interno
# ---------------------------------------------------------------------------

@dataclass
class _Detection:
    x: int
    y: int
    radius: int
    source: str  # "hough" | "contour"
    score: float = 1.0


@dataclass
class ProcessingResult:
    detected_count: int
    confidence_score: float
    processing_time_ms: float
    annotated_image_base64: str
    debug_steps: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Processador principal
# ---------------------------------------------------------------------------

class ProfileDetector:
    """Detecta extremidades de perfis de alumínio em imagem BGR."""

    # Cores para anotação
    _COLOR_HOUGH = (0, 255, 100)    # verde
    _COLOR_CONTOUR = (0, 180, 255)  # amarelo-laranja
    _COLOR_CENTER = (0, 0, 255)     # vermelho
    _COLOR_TEXT_BG = (20, 20, 20)
    _COLOR_TEXT = (255, 255, 255)

    def process(self, image_bytes: bytes, params: DetectionParams) -> ProcessingResult:
        """
        Recebe bytes de uma imagem JPEG/PNG, executa o pipeline completo
        e retorna o resultado com a imagem anotada em base64.
        """
        t_start = time.perf_counter()
        steps: list[str] = []

        # ------------------------------------------------------------------
        # 1. Decodificação e redimensionamento
        # ------------------------------------------------------------------
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Não foi possível decodificar a imagem enviada.")

        img_bgr = self._resize_if_needed(img_bgr, max_dim=1280)
        steps.append(f"Imagem: {img_bgr.shape[1]}x{img_bgr.shape[0]}px")

        # ------------------------------------------------------------------
        # 2. Conversão para cinza + desfoque
        # ------------------------------------------------------------------
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        blur_k = params.blur_kernel if params.blur_kernel % 2 == 1 else params.blur_kernel + 1
        blurred = cv2.GaussianBlur(gray, (blur_k, blur_k), 0)
        steps.append(f"Desfoque Gaussiano kernel={blur_k}")

        # ------------------------------------------------------------------
        # 3. Realce de contraste via CLAHE
        #    Melhora a visibilidade em ambientes industriais com variação de luz
        # ------------------------------------------------------------------
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        enhanced = clahe.apply(blurred)
        steps.append("CLAHE aplicado (clipLimit=2.5)")

        # ------------------------------------------------------------------
        # 4. Morfologia matemática para fechar buracos e remover ruído
        # ------------------------------------------------------------------
        detections: list[_Detection] = []

        if params.use_morphology:
            kernel_open = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
            kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            morph = cv2.morphologyEx(enhanced, cv2.MORPH_OPEN, kernel_open)
            morph = cv2.morphologyEx(morph, cv2.MORPH_CLOSE, kernel_close)
            steps.append("Morfologia: abertura + fechamento elípticos")
        else:
            morph = enhanced

        # ------------------------------------------------------------------
        # 5. Canny Edge Detection
        # ------------------------------------------------------------------
        edges = cv2.Canny(morph, params.canny_low, params.canny_high, apertureSize=3)

        # Dilatar levemente as bordas para conectar fragmentos
        edge_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        edges = cv2.dilate(edges, edge_kernel, iterations=1)
        steps.append(f"Canny: low={params.canny_low}, high={params.canny_high}")

        # ------------------------------------------------------------------
        # 6. HoughCircles – detecta perfis tubulares / circulares
        # ------------------------------------------------------------------
        hough_detections = self._run_hough(morph, params)
        detections.extend(hough_detections)
        steps.append(f"HoughCircles: {len(hough_detections)} candidatos")

        # ------------------------------------------------------------------
        # 7. Análise de contornos – perfis retangulares ou hexagonais
        # ------------------------------------------------------------------
        if params.use_contours:
            contour_detections = self._run_contour_analysis(edges, params)
            detections.extend(contour_detections)
            steps.append(f"Contornos: {len(contour_detections)} candidatos")

        # ------------------------------------------------------------------
        # 8. Non-Maximum Suppression – elimina detecções duplicadas
        # ------------------------------------------------------------------
        final_detections = self._nms(detections, overlap_thresh=0.4)
        steps.append(f"Após NMS: {len(final_detections)} perfis detectados")

        # ------------------------------------------------------------------
        # 9. Cálculo do score de confiança
        # ------------------------------------------------------------------
        confidence = self._compute_confidence(final_detections, img_bgr.shape)

        # ------------------------------------------------------------------
        # 10. Anotação da imagem
        # ------------------------------------------------------------------
        annotated = self._annotate(img_bgr.copy(), final_detections, len(final_detections), confidence)

        t_end = time.perf_counter()
        elapsed_ms = (t_end - t_start) * 1000
        steps.append(f"Tempo total: {elapsed_ms:.1f}ms")

        # Encode para base64
        _, buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
        img_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        return ProcessingResult(
            detected_count=len(final_detections),
            confidence_score=round(confidence, 3),
            processing_time_ms=round(elapsed_ms, 2),
            annotated_image_base64=img_b64,
            debug_steps=steps,
        )

    # ------------------------------------------------------------------
    # Métodos privados
    # ------------------------------------------------------------------

    def _resize_if_needed(self, img: np.ndarray, max_dim: int = 1280) -> np.ndarray:
        """Redimensiona a imagem para que nenhuma dimensão exceda max_dim."""
        h, w = img.shape[:2]
        if max(h, w) <= max_dim:
            return img
        scale = max_dim / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        return cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

    def _run_hough(self, gray: np.ndarray, params: DetectionParams) -> list[_Detection]:
        """Executa HoughCircles e retorna detecções."""
        circles = cv2.HoughCircles(
            gray,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=params.min_dist,
            param1=params.hough_param1,
            param2=params.hough_param2,
            minRadius=params.min_radius,
            maxRadius=params.max_radius,
        )

        result: list[_Detection] = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype(int)
            for (x, y, r) in circles:
                result.append(_Detection(x=int(x), y=int(y), radius=int(r), source="hough"))
        return result

    def _run_contour_analysis(
        self, edges: np.ndarray, params: DetectionParams
    ) -> list[_Detection]:
        """
        Analisa contornos fechados para detectar perfis não-circulares.
        Filtra por:
          - Área mínima/máxima compatível com os raios configurados
          - Circularidade (4π·A / P²) > 0.3 → aceita elipses e polígonos
          - Solidez (área / área convexa) > 0.5 → evita formas fragmentadas
        """
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        min_area = np.pi * (params.min_radius ** 2)
        max_area = np.pi * (params.max_radius ** 2) * 4  # alguma folga

        result: list[_Detection] = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < min_area or area > max_area:
                continue

            perimeter = cv2.arcLength(cnt, True)
            if perimeter < 1:
                continue

            # Circularidade
            circularity = (4 * np.pi * area) / (perimeter ** 2)
            if circularity < 0.30:
                continue

            # Solidez
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            if hull_area < 1:
                continue
            solidity = area / hull_area
            if solidity < 0.50:
                continue

            # Centro e raio equivalente
            M = cv2.moments(cnt)
            if M["m00"] == 0:
                continue
            cx = int(M["m10"] / M["m00"])
            cy = int(M["m01"] / M["m00"])
            radius = int(np.sqrt(area / np.pi))

            score = circularity * solidity
            result.append(_Detection(x=cx, y=cy, radius=radius, source="contour", score=score))

        return result

    def _nms(self, detections: list[_Detection], overlap_thresh: float = 0.4) -> list[_Detection]:
        """
        Non-Maximum Suppression baseada em distância entre centros.
        Remove detecções cujo centro está a menos de overlap_thresh * (r1+r2) de outra.
        Prioriza detecções Hough sobre contornos quando há sobreposição.
        """
        if not detections:
            return []

        # Ordena: hough primeiro (maior prioridade), depois por score decrescente
        sorted_dets = sorted(
            detections,
            key=lambda d: (0 if d.source == "hough" else 1, -d.score),
        )

        kept: list[_Detection] = []
        for det in sorted_dets:
            suppress = False
            for kept_det in kept:
                dist = np.hypot(det.x - kept_det.x, det.y - kept_det.y)
                min_dist = overlap_thresh * (det.radius + kept_det.radius)
                if dist < min_dist:
                    suppress = True
                    break
            if not suppress:
                kept.append(det)

        return kept

    def _compute_confidence(
        self, detections: list[_Detection], shape: tuple
    ) -> float:
        """
        Estima um score de confiança (0–1) baseado em:
          - Proporção de detecções Hough vs contornos
          - Score médio dos contornos
          - Densidade de detecção (não muito esparsa, não muito densa)
        """
        if not detections:
            return 0.0

        n = len(detections)
        hough_count = sum(1 for d in detections if d.source == "hough")
        contour_scores = [d.score for d in detections if d.source == "contour"]

        hough_ratio = hough_count / n
        avg_contour_score = float(np.mean(contour_scores)) if contour_scores else 1.0

        # Penaliza densidades extremas
        h, w = shape[:2]
        image_area = h * w
        avg_profile_area = np.pi * (np.mean([d.radius for d in detections]) ** 2)
        coverage = (n * avg_profile_area) / image_area
        density_penalty = 1.0 if 0.05 < coverage < 0.85 else 0.7

        confidence = (hough_ratio * 0.6 + avg_contour_score * 0.4) * density_penalty
        return min(max(confidence, 0.0), 1.0)

    def _annotate(
        self,
        img: np.ndarray,
        detections: list[_Detection],
        count: int,
        confidence: float,
    ) -> np.ndarray:
        """Desenha círculos, IDs e painel de resultado na imagem."""
        for i, det in enumerate(detections, start=1):
            color = self._COLOR_HOUGH if det.source == "hough" else self._COLOR_CONTOUR
            # Círculo externo
            cv2.circle(img, (det.x, det.y), det.radius, color, 2)
            # Ponto central
            cv2.circle(img, (det.x, det.y), 3, self._COLOR_CENTER, -1)
            # Número do perfil
            label = str(i)
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
            tx = det.x - tw // 2
            ty = det.y + th // 2
            cv2.rectangle(
                img,
                (tx - 2, ty - th - 2),
                (tx + tw + 2, ty + 2),
                self._COLOR_TEXT_BG,
                -1,
            )
            cv2.putText(
                img, label, (tx, ty),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, self._COLOR_TEXT, 1, cv2.LINE_AA,
            )

        # Painel superior com contagem e confiança
        panel_h = 50
        panel = img[:panel_h, :].copy()
        overlay = panel.copy()
        cv2.rectangle(overlay, (0, 0), (img.shape[1], panel_h), (15, 15, 15), -1)
        cv2.addWeighted(overlay, 0.75, panel, 0.25, 0, img[:panel_h, :])

        cv2.putText(
            img,
            f"Perfis detectados: {count}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 255, 100), 2, cv2.LINE_AA,
        )
        conf_text = f"Confianca: {confidence * 100:.0f}%"
        (cw, _), _ = cv2.getTextSize(conf_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 1)
        cv2.putText(
            img,
            conf_text,
            (img.shape[1] - cw - 10, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (180, 180, 180), 1, cv2.LINE_AA,
        )

        return img


# Instância global reutilizável
detector = ProfileDetector()
