"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  ZapOff,
  Zap,
} from "lucide-react";
import clsx from "clsx";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  isProcessing: boolean;
}

export function CameraCapture({ onCapture, isProcessing }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [flash, setFlash] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError(
        "Não foi possível acessar a câmera. Verifique as permissões."
      );
      console.error(err);
    }
  }, [facingMode]);

  const toggleFacing = useCallback(async () => {
    stopCamera();
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  }, [stopCamera]);

  // Reinicia câmera quando troca o facingMode
  useEffect(() => {
    if (cameraActive) startCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  // Para câmera ao desmontar
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setFlash(true);
    setTimeout(() => setFlash(false), 200);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        onCapture(file);
      },
      "image/jpeg",
      0.92
    );
  }, [onCapture]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onCapture(file);
      e.target.value = "";
    },
    [onCapture]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Visor da câmera Estilo High-Tech */}
      <div className="relative rounded-[2rem] overflow-hidden bg-surface-950 border border-white/5 shadow-2xl aspect-[4/3] sm:aspect-video">
        {/* Flash overlay */}
        {flash && (
          <div className="absolute inset-0 bg-white z-50 animate-pulse pointer-events-none" />
        )}

        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover scale-[1.01]"
              playsInline
              muted
            />
            {/* HUD de Scan Avançado */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[20px] border-black/20" />
              <div className="scanline absolute left-0 right-0 h-[2px] bg-brand-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              
              {/* Mira Central */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border border-white/10 rounded-3xl relative">
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-brand-500 rounded-tl-xl" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-brand-500 rounded-tr-xl" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-brand-500 rounded-bl-xl" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-brand-500 rounded-br-xl" />
                  
                  {/* Pontos de grade */}
                  <div className="absolute top-1/2 left-0 w-4 h-px bg-white/20" />
                  <div className="absolute top-1/2 right-0 w-4 h-px bg-white/20" />
                  <div className="absolute top-0 left-1/2 w-px h-4 bg-white/20" />
                  <div className="absolute bottom-0 left-1/2 w-px h-4 bg-white/20" />
                </div>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] text-white font-black tracking-[0.2em] uppercase">Rec Mode: Active</span>
            </div>
            
            <div className="absolute top-8 right-8 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">4K Ultra HD</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-12">
            <div className="w-24 h-24 rounded-full bg-surface-900 border border-white/5 flex items-center justify-center shadow-inner">
               <CameraOff size={40} className="text-slate-700" strokeWidth={1} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 text-center">Sensor Óptico Offline</p>
              {cameraError && (
                <p className="text-xs text-red-500/70 max-w-xs">{cameraError}</p>
              )}
            </div>
            <button
              onClick={startCamera}
              className="bg-brand-500 hover:bg-brand-400 text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg shadow-brand-500/20"
            >
              Ativar Câmera
            </button>
          </div>
        )}

        {/* Overlay de processando */}
        {isProcessing && (
          <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 gap-4">
            <div className="relative">
               <div className="w-20 h-20 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin" />
               <RefreshCw size={24} className="absolute inset-0 m-auto text-brand-500 animate-pulse" />
            </div>
            <p className="text-brand-400 font-black uppercase tracking-[0.3em] text-xs">Analisando Frame...</p>
          </div>
        )}
      </div>

      {/* Controles Estilo Deck */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={captureFrame}
          disabled={!cameraActive || isProcessing}
          className="col-span-2 group relative overflow-hidden rounded-2xl p-4 bg-brand-500 hover:bg-brand-400 text-white transition-all disabled:opacity-20 shadow-lg shadow-brand-500/10"
        >
          <div className="relative z-10 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm">
            <Zap size={20} className="group-hover:scale-125 transition-transform" />
            Capturar Agora
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        </button>

        <button
          onClick={toggleFacing}
          disabled={isProcessing}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 glass-panel hover:bg-white/5 text-slate-400 transition-all disabled:opacity-50"
        >
          <RefreshCw size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Inverter</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 glass-panel hover:bg-white/5 text-slate-400 transition-all disabled:opacity-50"
        >
          <Upload size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Arquivo</span>
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
