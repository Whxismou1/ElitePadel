"use client";

import React from "react";
import { Calendar, Trophy, Activity, Lock, Eye, EyeOff, Check, AlertCircle, ChevronDown } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCurrentUser, usePastMatches, useLeague } from "@/lib/store";
import { getSupabase } from "@/lib/supabase";
import { useState } from "react";

function initials(name) {
  return name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function PasswordInput({ id, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        aria-label={show ? "Ocultar" : "Mostrar"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function ChangePasswordAccordion({ email }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setErrorMsg("");
    if (!current) { setStatus("error"); setErrorMsg("Introduce tu contraseña actual."); return; }
    if (next.length < 6) { setStatus("error"); setErrorMsg("Mínimo 6 caracteres."); return; }
    if (next !== confirm) { setStatus("error"); setErrorMsg("Las contraseñas no coinciden."); return; }

    setLoading(true);
    const supabase = getSupabase();

    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });

    if (signError) {
      setLoading(false);
      setStatus("error");
      setErrorMsg("La contraseña actual es incorrecta.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });

    setLoading(false);
    if (updateError) {
      setStatus("error");
      setErrorMsg("Error al actualizar la contraseña.");
      return;
    }

    setStatus("success");
    setCurrent(""); setNext(""); setConfirm("");
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="change-password" className="border border-slate-200 rounded-2xl px-4 data-[state=open]:shadow-sm transition-shadow">
        <AccordionTrigger className="py-4 hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Lock className="size-4 text-slate-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900">Cambiar contraseña</p>
              <p className="text-xs text-slate-500">Actualiza tus credenciales de acceso</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-4">
          <form onSubmit={handleSubmit} className="space-y-3 mt-1">
            <div className="space-y-1">
              <label htmlFor="current-password" className="text-xs font-medium text-slate-600">
                Contraseña actual
              </label>
              <PasswordInput id="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-password" className="text-xs font-medium text-slate-600">
                Nueva contraseña
              </label>
              <PasswordInput id="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div className="space-y-1">
              <label htmlFor="confirm-password" className="text-xs font-medium text-slate-600">
                Confirmar nueva contraseña
              </label>
              <PasswordInput id="confirm-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repite la nueva contraseña" />
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <AlertCircle className="size-4 shrink-0" />{errorMsg}
              </div>
            )}
            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                <Check className="size-4 shrink-0" />Contraseña actualizada correctamente.
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full rounded-full bg-slate-900 text-white hover:bg-slate-800 mt-2">
              {loading ? "Actualizando…" : "Actualizar contraseña"}
            </Button>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function ProfilePage() {
  const currentUser = useCurrentUser();
  const [pastMatches] = usePastMatches();
  const [league] = useLeague();

  const winRate = currentUser?.matches > 0 ? Math.round((currentUser.wins / currentUser.matches) * 100) : 0;

  const myMatches = pastMatches.filter((m) =>
    [...m.team1, ...m.team2].some((name) =>
      name.toLowerCase().includes(currentUser?.fullname?.split(" ")[0].toLowerCase())
    )
  ).slice(0, 5);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
      <div className="px-6 pt-6 pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-slate-900 text-slate-50 flex items-center justify-center text-base font-bold shadow">
              {initials(currentUser.fullname)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {currentUser.fullname}
                </h1>
                <Badge variant="secondary" className="text-xs">{currentUser.role === "admin" ? "Admin" : "Jugador"}</Badge>
              </div>
              <p className="text-sm text-slate-500">@{currentUser.username} · {currentUser.email}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1.6fr] gap-6 items-start">

          <div className="space-y-5">

            <Card className="rounded-2xl border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="size-5 text-[#13ec5b]" />
                  Mis estadísticas
                </CardTitle>
                <CardDescription>Rendimiento en <strong>{league?.name || "la liga actual"}</strong>.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Partidos jugados</span>
                  <span className="font-semibold text-slate-900">{currentUser.matches}</span>
                </div>
                <div className="flex justify-between">
                  <span>Victorias</span>
                  <span className="font-semibold text-emerald-600">{currentUser.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span>Derrotas</span>
                  <span className="text-slate-500">{currentUser.losses}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-1">
                  <span className="text-xs text-slate-500">% Victorias</span>
                  <span className="text-base font-semibold">{winRate}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-[#13ec5b]" style={{ width: `${winRate}%` }} />
                </div>
              </CardContent>
            </Card>

            <ChangePasswordAccordion email={currentUser.email} />
          </div>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-slate-500" />
                Últimos partidos
              </CardTitle>
              <CardDescription>Historial rápido de tus últimos encuentros jugados.</CardDescription>
            </CardHeader>
            <CardContent>
              {myMatches.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Sin partidos registrados todavía.</p>
              ) : (
                <ul className="space-y-3 text-sm">
                  {myMatches.map((match) => {
                    const myTeam = match.team1.some((n) =>
                      n.toLowerCase().includes(currentUser.fullname.split(" ")[0].toLowerCase())
                    ) ? "team1" : "team2";
                    const won = match.winner === myTeam;
                    return (
                      <li
                        key={match.id}
                        className="rounded-xl border border-slate-100 bg-white px-4 py-3 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-slate-800 truncate">
                            {match.team1.join(" / ")} vs {match.team2.join(" / ")}
                          </p>
                          <Badge
                            className={`shrink-0 border-0 text-[11px] uppercase tracking-wider ${match.winner === null
                              ? "bg-amber-50 text-amber-700"
                              : won
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-600"
                              }`}
                          >
                            {match.winner === null ? "Validando" : won ? "Win" : "Loss"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Score: {match.scores.join(", ")}</span>
                          <span>{match.date} · {match.court}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
