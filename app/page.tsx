"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const [, { login }] = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const result = login(email.trim(), password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/home");
  };

  
  const demoUsers = [
    { label: "Admin (Alex)", email: "alex@elitepadel.app", password: "alex123" },
    { label: "Player (Sarah)", email: "sarah@elitepadel.app", password: "sarah123" },
    { label: "Player (Mike)", email: "mike@elitepadel.app", password: "mike123" },
  ];

  const quickLogin = async (u: { label: string; email: string; password: string }) => {
    setError("");
    setLoading(true);
    setEmail(u.email);
    setPassword(u.password);
    await new Promise((r) => setTimeout(r, 400));
    const result = login(u.email, u.password);
    setLoading(false);
    if (result.ok) router.push("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#bbf7d0_0,#0f172a_55%,#020617_100%)] px-4 py-10 font-sans">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-10 md:flex-row">

        
        <div className="max-w-md text-center text-slate-50 md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
            Elite padel
          </p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">
            Gestiona tu{" "}
            <span className="text-emerald-300">liga de pádel</span> como un pro.
          </h1>
          <p className="mt-4 text-sm text-slate-300">
            Crea ligas, agenda partidos y sigue las estadísticas de tus jugadores en un solo panel.
          </p>

          
          <div className="mt-8 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-1">
              Acceso rápido (demo)
            </p>
            {demoUsers.map((u) => (
              <button
                key={u.email}
                onClick={() => quickLogin(u)}
                className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-slate-900/50 px-4 py-2.5 text-left text-sm text-slate-200 backdrop-blur hover:border-emerald-500/50 hover:bg-slate-900/80 transition-colors"
              >
                <span className="font-medium">{u.label}</span>
                <span className="text-[11px] text-slate-500">{u.email}</span>
              </button>
            ))}
          </div>
        </div>

        
        <Card className="w-full max-w-sm border-slate-800/60 bg-slate-950/70 text-slate-50 shadow-[0_18px_45px_rgba(15,23,42,0.85)] backdrop-blur-xl">
          <CardHeader className="border-b border-slate-800/60">
            <CardTitle className="text-lg font-semibold">Inicia sesión</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Accede a tu panel de control de Elite padel.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1">
                <label htmlFor="email" className="text-xs font-medium text-slate-200">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@club.com"
                  className="border-slate-800/80 bg-slate-900/60 text-sm placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="text-xs font-medium text-slate-200">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="border-slate-800/80 bg-slate-900/60 text-sm placeholder:text-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-800/50 bg-rose-950/50 px-3 py-2 text-xs text-rose-400">
                  <AlertCircle className="size-4 shrink-0" />
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 border-t border-slate-800/60 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-400 text-slate-950 hover:bg-emerald-300 font-semibold"
              >
                {loading ? "Entrando..." : "Entrar al dashboard"}
              </Button>
              <p className="text-center text-[11px] text-slate-500">
                Usa uno de los accesos rápidos de la izquierda para probar sin escribir.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
