"use client";

import { useState } from "react";
import { SlidersHorizontal, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import type { DetectionParams } from "@/lib/api";
import { Card } from "./ui/Card";
import { PresetSelector } from "./PresetSelector";

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
    <div className="bg-surface-900/30 rounded-xl p-3 border border-white/5">
      <div className="flex justify-between mb-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
        <span className="text-xs text-brand-400 font-black font-mono bg-brand-500/10 px-2 py-0.5 rounded">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange({ ...params, [field]: Number(e.target.value) })}
        className="w-full accent-brand-500 h-2 rounded-full bg-surface-700 cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow-lg"
      />
    </div>
  );
}

export function DetectionSettings({ params, onChange }: DetectionSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Seletor de Presets */}
      <PresetSelector currentParams={params} onSelectPreset={onChange} />

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors w-full justify-between p-2 rounded-lg hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} />
          Ajuste Manual dos Parâmetros
        </div>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <Card className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Fine Tuning</p>
            <button
              onClick={() => onChange(DEFAULTS)}
              className="flex items-center gap-1 text-[10px] text-brand-400 hover:text-brand-300 transition-colors font-bold uppercase tracking-wider"
            >
              <RotateCcw size={12} />
              Reset
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
