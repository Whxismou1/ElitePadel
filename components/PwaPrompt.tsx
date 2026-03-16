"use client";

import { useState, useEffect } from "react";
import { Share, PlusSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PwaPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: any) => {
      console.log("PWA: beforeinstallprompt event caught!");
      e.preventDefault();
      setDeferredPrompt(e);
      if (!sessionStorage.getItem('elitepadel-pwa-dismissed')) {
        setShowPrompt(true);
      }
    };

      if ((window as any).deferredPwaPrompt) {
      handler((window as any).deferredPwaPrompt);
    }

    window.addEventListener('beforeinstallprompt', handler);
    
    if (ios && !sessionStorage.getItem('elitepadel-pwa-dismissed')) {
      setShowPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const closePrompt = () => {
    sessionStorage.setItem('elitepadel-pwa-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full p-4 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[360px] z-[9999] animate-in slide-in-from-bottom-5 pointer-events-none">
      <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.5)] p-5 relative overflow-hidden pointer-events-auto">
        
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <button 
          onClick={closePrompt}
          className="absolute top-3 right-3 text-emerald-500/70 hover:text-emerald-400 p-1 transition-colors z-10"
          aria-label="Cerrar aviso"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl w-12 h-12 flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-slate-950 font-black text-xl">E</span>
          </div>
          <div className="flex-1 pr-4 z-10">
            <h3 className="text-white font-bold text-sm sm:text-base leading-tight">Elite Padel App</h3>
            <p className="text-emerald-400/80 text-[12px] leading-tight">Acceso rápido desde la app.</p>
          </div>
        </div>

        {isIOS ? (
          <div className="bg-emerald-900/30 border border-emerald-500/20 p-3 rounded-xl text-[12px] sm:text-[13px] text-slate-100 z-10 relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-emerald-500 p-1 rounded text-slate-950">
                <Share size={14} />
              </div>
              <span>Pulsa <strong>Compartir</strong> en la barra inferior</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-1 rounded text-slate-950">
                <PlusSquare size={14} />
              </div>
              <span>Selecciona <strong>Añadir a pantalla de inicio</strong></span>
            </div>
          </div>
        ) : (
          <Button
            onClick={handleInstallClick}
            className="w-full bg-emerald-400 hover:bg-emerald-500 text-slate-950 font-bold h-10 text-sm shadow-md transition-transform active:scale-95 z-10 relative"
          >
            Instalar ahora
          </Button>
        )}
      </div>
    </div>
  );
}
