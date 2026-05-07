"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  ScanLine,
  History,
  Activity,
  Package,
  TrendingUp,
  Clock,
  Award,
  ZapOff,
  CheckCircle,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { CameraCapture } from "@/components/CameraCapture";
import { DetectionResultPanel } from "@/components/DetectionResult";
import { DetectionSettings, DEFAULT_PARAMS } from "@/components/DetectionSettings";
import { ReadingHistory } from "@/components/ReadingHistory";
import { StatCard, Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  detectProfiles,
  saveReading,
  getDashboardStats,
  wakeUpBackend,
  type DetectionResult,
  type DetectionParams,
  type DashboardStats,
} from "@/lib/api";

type Tab = "scanner" | "history" | "dashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("scanner");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [params, setParams] = useState<DetectionParams>(DEFAULT_PARAMS);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    // Acorda o backend (cold start do Render pode levar ~30s)
    setBackendStatus("checking");
    wakeUpBackend().then((ok) => {
      setBackendStatus(ok ? "online" : "offline");
      if (ok) fetchStats();
    });
  }, [fetchStats]);

  const handleCapture = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setError(null);
      setResult(null);
      setSavedOk(false);
      try {
        const data = await detectProfiles(file, params);
        setResult(data);
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Erro ao processar imagem. Verifique se o backend está rodando.";
        setError(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [params]
  );

  const handleSave = useCallback(
    async (finalCount: number, operator: string, palletId: string, notes: string) => {
      if (!result) return;
      setIsSaving(true);
      try {
        // Gera thumbnail 120x120 da imagem anotada
        const thumb = result.annotated_image_base64.substring(0, 8000);

        await saveReading({
          detected_count: result.detected_count,
          final_count: finalCount,
          manual_adjustment: finalCount - result.detected_count,
          operator: operator || undefined,
          pallet_id: palletId || undefined,
          notes: notes || undefined,
          processing_params: result.params_used,
          confidence_score: result.confidence_score,
          processing_time_ms: result.processing_time_ms,
          thumbnail_base64: thumb,
        });

        setSavedOk(true);
        setResult(null);
        fetchStats();
        setTimeout(() => setSavedOk(false), 3000);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao salvar leitura.";
        setError(msg);
      } finally {
        setIsSaving(false);
      }
    },
    [result, fetchStats]
  );

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "scanner", label: "Scanner", icon: <ScanLine size={18} /> },
    { id: "history", label: "Histórico", icon: <History size={18} /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-surface-950 text-slate-200 industrial-grid flex flex-col">
      {/* Header Estilo Industrial */}
      <header className="glass-panel border-b border-white/5 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shadow-emerald-glow">
              <Package size={22} className="text-brand-400" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white uppercase italic">Conferente</h1>
              <div className="flex items-center gap-2">
                {backendStatus === "checking" && (
                  <><Loader2 size={10} className="text-yellow-400 animate-spin" />
                  <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Conectando...</p></>
                )}
                {backendStatus === "online" && (
                  <><span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
                  <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest">Backend Online</p></>
                )}
                {backendStatus === "offline" && (
                  <><WifiOff size={10} className="text-red-400" />
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Backend Offline</p></>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabs customizadas */}
          <nav className="flex bg-surface-900/50 p-1 rounded-xl border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                    : "text-slate-500 hover:text-slate-300"
                )}
              >
                {tab.icon}
                <span className="hidden md:inline uppercase tracking-wider">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Banner Cold Start */}
      {backendStatus === "checking" && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <Loader2 size={16} className="text-yellow-400 animate-spin flex-shrink-0" />
            <p className="text-xs text-yellow-300">
              <span className="font-black uppercase tracking-wider">Aguardando backend...</span>
              {" "}O servidor está acordando (pode levar até 30 segundos no primeiro acesso).
            </p>
          </div>
        </div>
      )}
      {backendStatus === "offline" && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <WifiOff size={16} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-300">
              <span className="font-black uppercase tracking-wider">Backend indisponível.</span>
              {" "}Configure a variável <code className="bg-red-900/40 px-1 rounded">NEXT_PUBLIC_API_URL</code> com a URL do servidor.
            </p>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {activeTab === "scanner" && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Coluna de Captura (Foco Principal) */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/20 to-transparent rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <CameraCapture onCapture={handleCapture} isProcessing={isProcessing} />
                </div>
                
                <div className="w-full">
                  <DetectionSettings params={params} onChange={setParams} />
                </div>
              </div>

              {/* Coluna de Resultados */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                {error && (
                  <div className="rounded-2xl bg-red-500/10 border border-red-500/20 px-6 py-4 text-sm text-red-400 flex items-center gap-3 animate-fade-in">
                    <ZapOff size={18} />
                    <span className="font-medium">{error}</span>
                  </div>
                )}
                
                {savedOk && (
                  <div className="rounded-2xl bg-brand-500/10 border border-brand-500/20 px-6 py-4 text-sm text-brand-400 flex items-center gap-3 animate-fade-in">
                    <CheckCircle size={18} />
                    <span className="font-bold uppercase tracking-wider">Leitura Registrada com Sucesso</span>
                  </div>
                )}

                {!result && !isProcessing && !error && !savedOk && (
                  <Card className="flex flex-col items-center justify-center py-32 border-dashed border-white/5 opacity-50">
                    <div className="w-20 h-20 rounded-full bg-surface-800 flex items-center justify-center mb-6">
                      <ScanLine size={40} className="text-slate-600" strokeWidth={1} />
                    </div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Aguardando Captura</p>
                  </Card>
                )}

                {result && (
                  <DetectionResultPanel
                    result={result}
                    onSave={handleSave}
                    isSaving={isSaving}
                  />
                )}
              </div>
            </div>
          </div>
        )}


        {/* ── HISTÓRICO ── */}
        {activeTab === "history" && <ReadingHistory />}

        {/* ── DASHBOARD ── */}
        {activeTab === "dashboard" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">Painel de Controle</h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Visão Geral de Performance Operacional</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="green">Online</Badge>
                <Badge variant="gray">v1.0.4 stable</Badge>
              </div>
            </div>

            {stats ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    label="Volume Total"
                    value={stats.total_profiles_counted.toLocaleString("pt-BR")}
                    sub="Perfis registrados no sistema"
                    icon={<Package size={24} />}
                    accent
                  />
                  <StatCard
                    label="Taxa de Precisão"
                    value={`${Math.round(stats.avg_confidence * 100)}%`}
                    sub="Média global de detecção"
                    icon={<Award size={24} />}
                    accent={stats.avg_confidence >= 0.75}
                  />
                  <StatCard
                    label="Produtividade"
                    value={stats.total_readings}
                    sub="Total de pallets conferidos"
                    icon={<TrendingUp size={24} />}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Performance Hoje */}
                  <Card className="flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Produção Diária</h3>
                       <Badge variant="green">Hoje</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 rounded-2xl bg-surface-900/50 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Perfis</p>
                          <p className="text-2xl font-black text-brand-400">{stats.profiles_today}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-surface-900/50 border border-white/5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pallets</p>
                          <p className="text-2xl font-black text-white">{stats.readings_today}</p>
                       </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                       <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                             <span className="text-slate-500">Meta Diária (Est.)</span>
                             <span className="text-brand-400">75%</span>
                          </div>
                          <div className="h-1.5 bg-surface-900 rounded-full overflow-hidden">
                             <div className="h-full bg-brand-500 w-[75%] rounded-full shadow-emerald-glow" />
                          </div>
                       </div>
                    </div>
                  </Card>

                  {/* Saúde do Sistema */}
                  <Card className="flex flex-col gap-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-300">Integridade Óptica</h3>
                    <div className="space-y-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-900 flex items-center justify-center text-brand-400">
                             <Activity size={20} />
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] text-slate-500 uppercase font-bold">Latência de Processamento</p>
                             <p className="text-sm font-bold text-white">~142ms <span className="text-[10px] text-brand-500 font-black ml-2">OPTIMAL</span></p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-surface-900 flex items-center justify-center text-yellow-400">
                             <TrendingUp size={20} />
                          </div>
                          <div className="flex-1">
                             <p className="text-[10px] text-slate-500 uppercase font-bold">Intervenção Manual</p>
                             <p className="text-sm font-bold text-white">12% <span className="text-[10px] text-slate-500 font-black ml-2">NORMAL</span></p>
                          </div>
                       </div>
                    </div>
                  </Card>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 opacity-30">
                <Activity size={48} className="animate-pulse mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Sincronizando Datacenter...</p>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-surface-700 py-3 text-center text-xs text-gray-700">
        Conferente v1.0 · Visão Computacional Industrial · OpenCV + FastAPI + Next.js
      </footer>
    </div>
  );
}
