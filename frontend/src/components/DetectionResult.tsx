"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Edit3, Save, RefreshCw } from "lucide-react";
import clsx from "clsx";
import type { DetectionResult as DetectionResultType } from "@/lib/api";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface DetectionResultProps {
  result: DetectionResultType;
  onSave: (finalCount: number, operator: string, palletId: string, notes: string) => void;
  isSaving: boolean;
}

export function DetectionResultPanel({ result, onSave, isSaving }: DetectionResultProps) {
  const [finalCount, setFinalCount] = useState(result.detected_count);
  const [operator, setOperator] = useState("");
  const [palletId, setPalletId] = useState("");
  const [notes, setNotes] = useState("");
  const [showDebug, setShowDebug] = useState(false);

  const adjustment = finalCount - result.detected_count;
  const confidencePct = Math.round(result.confidence_score * 100);
  const confidenceVariant = confidencePct >= 75 ? "green" : confidencePct >= 50 ? "yellow" : "red";

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      {/* Card de Destaque da Contagem */}
      <Card glow className="relative overflow-hidden bg-gradient-to-br from-surface-800 to-surface-900 border-brand-500/20">
        <div className="absolute top-0 right-0 p-4">
          <Badge variant={confidenceVariant}>Precisão: {confidencePct}%</Badge>
        </div>
        
        <div className="flex flex-col items-center py-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-2">Contagem Final</p>
          <div className="flex items-center gap-8">
            <button
              onClick={() => setFinalCount((n) => Math.max(0, n - 1))}
              className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-xl hover:bg-brand-500/10 hover:text-brand-400 transition-all active:scale-90"
            >
              −
            </button>
            <span className="text-8xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
              {finalCount}
            </span>
            <button
              onClick={() => setFinalCount((n) => n + 1)}
              className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-xl hover:bg-brand-500/10 hover:text-brand-400 transition-all active:scale-90"
            >
              +
            </button>
          </div>
          <div className="mt-4 flex gap-3">
             <Badge variant="gray">{result.processing_time_ms.toFixed(0)}ms latency</Badge>
             {adjustment !== 0 && (
               <Badge variant={adjustment > 0 ? "yellow" : "red"}>
                 Ajuste: {adjustment > 0 ? "+" : ""}{adjustment}
               </Badge>
             )}
          </div>
        </div>
      </Card>

      {/* Preview Visual */}
      <Card className="p-2 overflow-hidden bg-surface-950">
        <div className="relative group cursor-zoom-in">
          <img
            src={`data:image/jpeg;base64,${result.annotated_image_base64}`}
            alt="Análise Visual"
            className="w-full rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute bottom-4 left-4">
             <p className="text-[10px] bg-black/60 backdrop-blur-md text-white/70 px-3 py-1.5 rounded-full border border-white/10 uppercase tracking-widest font-bold">
               Mapa de Detecção Ativo
             </p>
          </div>
        </div>
      </Card>

      {/* Formulário de Registro */}
      <Card className="space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-white/5">
          <Edit3 size={16} className="text-brand-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Dados do Lote</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">Operador Responsável</label>
            <input
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="Identificação do Operador"
              className="w-full glass-panel rounded-xl px-4 py-3 text-sm focus:border-brand-500/50 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">ID do Pallet / Carga</label>
            <input
              value={palletId}
              onChange={(e) => setPalletId(e.target.value)}
              placeholder="Ex: PLT-001-24"
              className="w-full glass-panel rounded-xl px-4 py-3 text-sm focus:border-brand-500/50 outline-none transition-all placeholder:text-slate-700"
            />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] text-slate-500 uppercase tracking-widest font-bold ml-1">Observações Técnicas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais sobre a carga..."
              rows={2}
              className="w-full glass-panel rounded-xl px-4 py-3 text-sm focus:border-brand-500/50 outline-none transition-all placeholder:text-slate-700 resize-none"
            />
          </div>
        </div>

        <button
          onClick={() => onSave(finalCount, operator, palletId, notes)}
          disabled={isSaving}
          className="w-full relative group overflow-hidden rounded-2xl py-4 bg-brand-500 hover:bg-brand-400 text-white transition-all disabled:opacity-50"
        >
          <div className="relative z-10 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm">
            {isSaving ? (
              <><RefreshCw size={18} className="animate-spin" /> Processando Registro...</>
            ) : (
              <><Save size={18} /> Finalizar e Arquivar</>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        </button>
      </Card>

      {/* Debug Section */}
      <div className="px-2">
        <button
          onClick={() => setShowDebug((v) => !v)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-brand-400 transition-colors"
        >
          {showDebug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Logs do Pipeline de Visão
        </button>
        {showDebug && (
          <Card className="mt-4 p-4 bg-black/40 font-mono text-[10px] text-brand-400/80 leading-relaxed border-white/5">
            {result.debug_steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="opacity-30">[{String(i + 1).padStart(2, "0")}]</span>
                <span>{step}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
