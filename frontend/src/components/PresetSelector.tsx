"use client";

import React, { useState } from "react";
import {
  Factory,
  Minimize2,
  Maximize2,
  Moon,
  Sun,
  Grid3x3,
  Circle,
  Square,
  Zap,
  Target,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import clsx from "clsx";
import { DEFAULT_PRESETS, type PresetConfig } from "@/lib/presets";
import type { DetectionParams } from "@/lib/api";

const iconMap: Record<string, React.ReactNode> = {
  Factory: <Factory size={20} />,
  Minimize2: <Minimize2 size={20} />,
  Maximize2: <Maximize2 size={20} />,
  Moon: <Moon size={20} />,
  Sun: <Sun size={20} />,
  Grid3x3: <Grid3x3 size={20} />,
  Circle: <Circle size={20} />,
  Square: <Square size={20} />,
  Zap: <Zap size={20} />,
  Target: <Target size={20} />,
};

interface PresetSelectorProps {
  currentParams: DetectionParams;
  onSelectPreset: (params: DetectionParams) => void;
}

export function PresetSelector({ currentParams, onSelectPreset }: PresetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<PresetConfig | null>(null);

  const handleSelect = (preset: PresetConfig) => {
    setSelectedId(preset.id);
    onSelectPreset(preset.params);
    setIsOpen(false);
  };

  // Encontra qual preset está mais próximo dos parâmetros atuais
  const findClosestPreset = () => {
    if (!currentParams) return null;
    
    let closest = null;
    let minDiff = Infinity;

    for (const preset of DEFAULT_PRESETS) {
      const diff = Math.abs(preset.params.min_radius! - (currentParams.min_radius || 0)) +
                   Math.abs(preset.params.max_radius! - (currentParams.max_radius || 0)) +
                   Math.abs(preset.params.canny_low! - (currentParams.canny_low || 0));
      
      if (diff < minDiff) {
        minDiff = diff;
        closest = preset;
      }
    }
    return closest;
  };

  const activePreset = findClosestPreset();
  const displayPreset = hoveredPreset || activePreset;

  return (
    <div className="relative">
      {/* Botão Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between gap-3 p-4 rounded-2xl transition-all duration-300",
          isOpen 
            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" 
            : "glass-panel hover:bg-white/5 text-slate-300"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
            isOpen ? "bg-white/20" : "bg-brand-500/10 text-brand-400"
          )}>
            <Sparkles size={20} />
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
              Configuração Ativa
            </p>
            <p className="text-sm font-bold">
              {activePreset ? activePreset.name : "Personalizado"}
            </p>
          </div>
        </div>
        <ChevronDown 
          size={18} 
          className={clsx("transition-transform duration-300", isOpen && "rotate-180")} 
        />
      </button>

      {/* Dropdown de Presets */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 animate-fade-in">
          <div className="glass-panel rounded-2xl p-2 max-h-[400px] overflow-y-auto">
            <div className="grid grid-cols-1 gap-1">
              {DEFAULT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelect(preset)}
                  onMouseEnter={() => setHoveredPreset(preset)}
                  onMouseLeave={() => setHoveredPreset(null)}
                  className={clsx(
                    "flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200",
                    selectedId === preset.id
                      ? "bg-brand-500/20 border border-brand-500/30"
                      : "hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className={clsx(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors",
                    selectedId === preset.id 
                      ? "bg-brand-500 text-white" 
                      : "bg-surface-900 text-slate-400"
                  )}>
                    {iconMap[preset.icon] || <Sparkles size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-200 truncate">
                        {preset.name}
                      </p>
                      {selectedId === preset.id && (
                        <Check size={14} className="text-brand-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                    <div className="flex gap-1 mt-2">
                      {preset.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag}
                          className="text-[8px] px-2 py-0.5 rounded-full bg-surface-900 text-slate-400 uppercase font-bold tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview dos Parâmetros */}
      {displayPreset && (
        <div className="mt-4 glass-panel rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Parâmetros da Configuração
            </p>
            <span className="text-[10px] text-brand-400 font-bold">
              {displayPreset.name}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <ParamBadge label="Min R" value={displayPreset.params.min_radius!} />
            <ParamBadge label="Max R" value={displayPreset.params.max_radius!} />
            <ParamBadge label="Canny" value={`${displayPreset.params.canny_low!}-${displayPreset.params.canny_high!}`} />
            <ParamBadge label="Dist" value={displayPreset.params.min_dist!} />
          </div>
          <div className="flex gap-2 mt-3">
            <TechBadge active={displayPreset.params.use_contours!} label="Contornos" />
            <TechBadge active={displayPreset.params.use_morphology!} label="Morfologia" />
          </div>
        </div>
      )}
    </div>
  );
}

function ParamBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-900/50 rounded-lg px-2 py-1.5 text-center border border-white/5">
      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter">{label}</p>
      <p className="text-xs font-bold text-slate-300">{value}</p>
    </div>
  );
}

function TechBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={clsx(
      "text-[9px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider",
      active 
        ? "bg-brand-500/20 text-brand-400 border border-brand-500/20" 
        : "bg-surface-900 text-slate-600 border border-white/5"
    )}>
      {active ? "✓" : "✗"} {label}
    </span>
  );
}
