"use client";

import { useState } from "react";
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import type { DetectionParams } from "@/lib/api";
import { Card } from "./ui/Card";

const DEFAULTS: DetectionParams = {
  min_radius: 8,
  max_radius: 80,
  canny_low: 30,
  canny_high: 100,
  hough_param1: 50,
  hough_param2: 25,
  min_dist: 20,
  use_contours: true,
  use_morphology: true,
  blur_kernel: 5,
};

interface DetectionSettingsProps {
  params: DetectionParams;
  onChange: (params: DetectionParams) => void;
}

function SliderRow({
  label,
  field,
  min,
  max,
  params,
  onChange,
}: {
  label: string;
  field: keyof DetectionParams;
  min: number;
  max: number;
  params: DetectionParams;
  onChange: (p: DetectionParams) => void;
}) {
  const value = params[field] as number;
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-xs text-brand-400 font-mono">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange({ ...params, [field]: Number(e.target.value) })}
        className="w-full accent-brand-500 h-1.5 rounded-full bg-surface-500 cursor-pointer"
      />
    </div>
  );
}

export function DetectionSettings({ params, onChange }: DetectionSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-3"
      >
        <SlidersHorizontal size={15} />
        Parâmetros de Detecção
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <Card className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Ajuste Fino do Detector</p>
            <button
              onClick={() => onChange(DEFAULTS)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RotateCcw size={12} />
              Resetar
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <SliderRow label="Raio Mínimo (px)" field="min_radius" min={2} max={100} params={params} onChange={onChange} />
              <SliderRow label="Raio Máximo (px)" field="max_radius" min={10} max={300} params={params} onChange={onChange} />
              <SliderRow label="Canny Limiar Baixo" field="canny_low" min={5} max={200} params={params} onChange={onChange} />
              <SliderRow label="Canny Limiar Alto" field="canny_high" min={20} max={300} params={params} onChange={onChange} />
              <SliderRow label="Hough Param1 (borda)" field="hough_param1" min={10} max={300} params={params} onChange={onChange} />
              <SliderRow label="Hough Param2 (acumulador)" field="hough_param2" min={5} max={200} params={params} onChange={onChange} />
              <SliderRow label="Distância Mínima (px)" field="min_dist" min={5} max={200} params={params} onChange={onChange} />
              <SliderRow label="Blur Kernel" field="blur_kernel" min={1} max={21} params={params} onChange={onChange} />
            </div>

            <div className="flex gap-6 pt-2 border-t border-surface-500">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!params.use_contours}
                  onChange={(e) => onChange({ ...params, use_contours: e.target.checked })}
                  className="accent-brand-500 w-4 h-4"
                />
                <span className="text-xs text-gray-400">Análise de Contornos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!params.use_morphology}
                  onChange={(e) => onChange({ ...params, use_morphology: e.target.checked })}
                  className="accent-brand-500 w-4 h-4"
                />
                <span className="text-xs text-gray-400">Morfologia Matemática</span>
              </label>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export { DEFAULTS as DEFAULT_PARAMS };
