"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, RefreshCw, ChevronLeft, ChevronRight, History as HistoryIcon, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { listReadings, deleteReading, type Reading } from "@/lib/api";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

export function ReadingHistory() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const PAGE_SIZE = 10;

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listReadings(page, PAGE_SIZE);
      setReadings(data.items);
      setTotal(data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  const handleDelete = async (id: number) => {
    if (!confirm("Deletar esta leitura?")) return;
    await deleteReading(id);
    fetchReadings();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const confidenceBadge = (score?: number | null) => {
    if (!score) return "gray";
    if (score >= 0.75) return "green";
    if (score >= 0.5) return "yellow";
    return "red";
  };

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Registros Históricos</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Arquivo Digital de Conferências ({total} entradas)</p>
        </div>
        <button
          onClick={fetchReadings}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 rounded-xl glass-panel text-xs font-black uppercase tracking-widest text-brand-400 hover:bg-brand-500/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Sincronizar
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recuperando Dados...</p>
        </div>
      )}

      {!loading && readings.length === 0 && (
        <Card className="flex flex-col items-center justify-center py-32 border-dashed border-white/5 opacity-50">
           <div className="w-16 h-16 rounded-full bg-surface-900 flex items-center justify-center mb-6">
              <HistoryIcon size={32} className="text-slate-600" />
           </div>
           <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Banco de Dados Vazio</p>
        </Card>
      )}

      {!loading && readings.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4">
            {readings.map((r) => (
              <Card key={r.id} className="group hover:bg-white/5 border-white/5 transition-all duration-300">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Thumbnail com efeito hover */}
                  <div className="relative flex-shrink-0">
                    {r.thumbnail_base64 ? (
                      <img
                        src={`data:image/jpeg;base64,${r.thumbnail_base64}`}
                        alt="leitura"
                        className="w-24 h-24 rounded-2xl object-cover border border-white/10 group-hover:border-brand-500/30 transition-all"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-surface-900 flex items-center justify-center border border-white/10">
                        <Package size={32} className="text-slate-700" />
                      </div>
                    )}
                    <div className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-lg">
                      #{r.id}
                    </div>
                  </div>

                  {/* Info Hierárquica */}
                  <div className="flex-1 min-w-0 flex flex-col gap-2">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-4xl font-black text-white tabular-nums">{r.final_count}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 pt-2">Perfis Detectados</span>
                      
                      <div className="flex gap-2">
                        {r.manual_adjustment !== 0 && (
                          <Badge variant={r.manual_adjustment > 0 ? "yellow" : "red"}>
                            MOD: {r.manual_adjustment > 0 ? "+" : ""}{r.manual_adjustment}
                          </Badge>
                        )}
                        <Badge variant={confidenceBadge(r.confidence_score)}>
                          ACC: {r.confidence_score ? `${Math.round(r.confidence_score * 100)}%` : "—"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                       <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Lote / Pallet</p>
                          <p className="text-xs font-bold text-slate-300 truncate">{r.pallet_id || "Não Identificado"}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Operador</p>
                          <p className="text-xs font-bold text-slate-300 truncate">{r.operator || "Standard"}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Data Registro</p>
                          <p className="text-xs font-bold text-slate-300">
                             {format(new Date(r.created_at), "dd MMM, HH:mm", { locale: ptBR })}
                          </p>
                       </div>
                       <div className="flex justify-end items-center">
                          <button
                             onClick={() => handleDelete(r.id)}
                             className="p-2 rounded-xl text-slate-600 hover:bg-red-500/10 hover:text-red-400 transition-all active:scale-90"
                             title="Remover Registro"
                          >
                             <Trash2 size={18} />
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Paginação Estilizada */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-3 rounded-2xl glass-panel text-slate-400 hover:text-white disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-black text-brand-400">{page}</span>
                 <span className="text-[10px] font-black text-slate-600 uppercase">de</span>
                 <span className="text-xs font-black text-slate-400">{totalPages}</span>
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-3 rounded-2xl glass-panel text-slate-400 hover:text-white disabled:opacity-20 transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
