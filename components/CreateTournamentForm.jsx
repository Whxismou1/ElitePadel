"use client";

import React, { useMemo, useState } from "react";
import { X, Users, Shuffle, Check, AlertCircle } from "lucide-react";
import { createTournament } from "@/app/actions/tournaments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function initials(text) {
  return text
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const MIN_PLAYERS = 4;

function ParticipantsPicker({ players, selectedIds, onChange, maxPlayers }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        (p.username || "").toLowerCase().includes(q) ||
        (p.fullname || "").toLowerCase().includes(q)
    );
  }, [players, query]);

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }

    if (maxPlayers && selectedIds.length >= maxPlayers) return;
    onChange([...selectedIds, id]);
  };

  const atMax = maxPlayers && selectedIds.length >= maxPlayers;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full w-full justify-between">
          <span className="inline-flex items-center gap-2">
            <Users className="size-4" />
            Participantes
          </span>
          <span className="text-xs text-slate-500">
            {selectedIds.length} seleccionados
            {maxPlayers ? ` / máx. ${maxPlayers}` : ""}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Elegir participantes</DialogTitle>
          <DialogDescription>
            Selecciona los jugadores que participan en el torneo.
            {maxPlayers && (
              <span className="ml-1 font-semibold text-slate-700">
                Máximo {maxPlayers} jugadores ({maxPlayers / 2} parejas).
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 flex-1 min-h-0 overflow-hidden flex flex-col">
          {atMax && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="size-4 shrink-0" />
              Has alcanzado el límite de jugadores permitidos.
            </div>
          )}
          <Input
            placeholder="Buscar por username o nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
            {filtered.map((p) => {
              const active = selectedIds.includes(p.id);
              const disabled = !active && !!atMax;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={disabled}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${active
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <Avatar className="bg-slate-200">
                    <AvatarFallback className="text-xs font-semibold text-slate-700">
                      {initials(p.username || p.fullname || "??")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      @{p.username || "sin_usuario"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {p.fullname || "Sin nombre"}
                    </div>
                  </div>
                  {active && (
                    <span className="inline-flex items-center justify-center rounded-full bg-emerald-600 text-white size-6">
                      <Check className="size-4" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => setOpen(false)}
          >
            Listo ({selectedIds.length} seleccionados)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CreateTournamentForm({ open, onOpenChange, onSuccess, players = [] }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [maxTeams, setMaxTeams] = useState("");
  const [participantIds, setParticipantIds] = useState([]);
  const [pairingMode, setPairingMode] = useState("random");
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const maxPlayers = maxTeams && Number(maxTeams) > 0 ? Number(maxTeams) * 2 : null;

  const validationError = useMemo(() => {
    if (participantIds.length < MIN_PLAYERS) {
      return `Selecciona al menos ${MIN_PLAYERS} jugadores (${MIN_PLAYERS / 2} parejas).`;
    }
    if (maxPlayers && participantIds.length > maxPlayers) {
      return `Has seleccionado más jugadores de los permitidos (máx. ${maxPlayers}).`;
    }
    return null;
  }, [participantIds, maxPlayers]);

  const reset = () => {
    setName("");
    setStartDate("");
    setEndDate("");
    setMaxTeams("");
    setParticipantIds([]);
    setPairingMode("random");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validationError) return;
    setLoading(true);
    setServerError("");

    const participants = participantIds
      .map((pid) => players.find((p) => p.id === pid))
      .filter(Boolean);

    const res = await createTournament({
      name,
      startDate,
      endDate,
      maxTeams: maxTeams ? Number(maxTeams) : 16,
      teams: Math.floor(participants.length / 2),
      status: "Próximamente",
      statusColor: "bg-amber-100 text-amber-700",
    });

    setLoading(false);
    if (!res.ok) { setServerError(res.error); return; }

    onSuccess?.({ id: res.id, name, startDate, endDate, participants, pairingMode });
    onOpenChange?.(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { onOpenChange?.(val); if (!val) reset(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear torneo</DialogTitle>
          <DialogDescription>
            Rellena los datos del nuevo torneo. Podrás configurar fases después. (Total jugadores disponibles: {players.length})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          <ParticipantsPicker
            players={players}
            selectedIds={participantIds}
            onChange={setParticipantIds}
            maxPlayers={maxPlayers}
          />

          {players.length === 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              <AlertCircle className="size-4 shrink-0" />
              Todavía no hay jugadores en esta liga. Añádelos desde la pestaña 'Jugadores' o 'Liga'.
            </div>
          )}

          {participantIds.length > 0 && validationError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              {validationError}
            </div>
          )}
          {participantIds.length >= MIN_PLAYERS && !validationError && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <Check className="size-4 shrink-0" />
              {participantIds.length} jugadores — {Math.floor(participantIds.length / 2)} parejas posibles.
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">Parejas</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Elige si quieres generar parejas aleatorias o definirlas manualmente.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant={pairingMode === "random" ? "default" : "outline"}
                className={
                  pairingMode === "random"
                    ? "rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    : "rounded-full"
                }
                onClick={() => setPairingMode("random")}
              >
                <Shuffle className="size-4 mr-2" />
                Aleatorias
              </Button>
              <Button
                type="button"
                variant={pairingMode === "manual" ? "default" : "outline"}
                className={
                  pairingMode === "manual"
                    ? "rounded-full bg-slate-900 text-white hover:bg-slate-800"
                    : "rounded-full"
                }
                onClick={() => setPairingMode("manual")}
              >
                Manual
              </Button>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500">Participantes seleccionados</span>
              <AvatarGroup className="*-data-[slot=avatar]:ring-white">
                {participantIds.slice(0, 4).map((pid) => {
                  const p = players.find((x) => x.id === pid);
                  if (!p) return null;
                  return (
                    <Avatar key={pid} className="bg-slate-200">
                      <AvatarFallback className="text-[10px] font-semibold text-slate-700">
                        {initials(p.username || p.fullname || "?")}
                      </AvatarFallback>
                    </Avatar>
                  );
                })}
              </AvatarGroup>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="tournament-name" className="text-sm font-medium text-slate-700">
              Nombre del torneo
            </label>
            <Input
              id="tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Winter Cup 2025"
              required
              className="rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium text-slate-700">
                Fecha inicio
              </label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium text-slate-700">
                Fecha fin
              </label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="max-teams" className="text-sm font-medium text-slate-700">
              Máximo de parejas (opcional)
            </label>
            <Input
              id="max-teams"
              type="number"
              min="2"
              max="64"
              value={maxTeams}
              onChange={(e) => setMaxTeams(e.target.value)}
              placeholder="16"
              className="rounded-lg"
            />
            {maxTeams && Number(maxTeams) > 0 && (
              <p className="text-xs text-slate-500">
                Máximo {Number(maxTeams) * 2} jugadores seleccionables.
              </p>
            )}
          </div>

          {serverError && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="size-4 shrink-0" />
              {serverError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { onOpenChange?.(false); reset(); }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !!validationError || !name || !startDate || !endDate}
              className="flex-1 bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]"
            >
              {loading ? "Creando…" : "Crear torneo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
