"use client";

import React, { useMemo, useState } from "react";
import { Users, Check, Pencil, ShieldCheck } from "lucide-react";
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

function PlayerPickerDialog({
  players,
  title,
  selectedIds,
  disabledIds,
  max = 2,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => {
      return (
        p.username.toLowerCase().includes(q) ||
        p.fullname.toLowerCase().includes(q)
      );
    });
  }, [players, query]);

  const toggle = (id) => {
    if (disabledIds.includes(id)) return;
    const exists = selectedIds.includes(id);
    if (exists) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= max) return;
    onChange([...selectedIds, id]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <Users className="size-4 mr-2" />
          Elegir jugadores
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Selecciona {max} jugador{max > 1 ? "es" : ""}. Puedes buscar por
            username o nombre.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3 flex-1 min-h-0 overflow-hidden flex flex-col">
          <Input
            placeholder="Buscar jugador…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1">
            {filtered.map((p) => {
              const isSelected = selectedIds.includes(p.id);
              const isDisabled = disabledIds.includes(p.id);

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  <Avatar className="bg-slate-200">
                    <AvatarFallback className="text-xs font-semibold text-slate-700">
                      {initials(p.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {p.username}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {p.fullname}
                    </div>
                  </div>
                  {isSelected && (
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
            variant="default"
            className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
            type="button"
            onClick={() => setOpen(false)}
          >
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CreateMatchForm({ players, onCreate }) {
  const [open, setOpen] = useState(false);
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [court, setCourt] = useState("Pista Central");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  
  const [set1A, setSet1A] = useState("");
  const [set1B, setSet1B] = useState("");
  const [set2A, setSet2A] = useState("");
  const [set2B, setSet2B] = useState("");
  const [set3A, setSet3A] = useState("");
  const [set3B, setSet3B] = useState("");

  const disabledIdsForA = teamB;
  const disabledIdsForB = teamA;

  const teamALabel = useMemo(
    () => teamA.map((id) => players.find((p) => p.id === id)?.username).filter(Boolean),
    [teamA, players]
  );
  const teamBLabel = useMemo(
    () => teamB.map((id) => players.find((p) => p.id === id)?.username).filter(Boolean),
    [teamB, players]
  );

  const resultSets = useMemo(() => {
    const sets = [];
    if (set1A !== "" || set1B !== "") sets.push([set1A, set1B]);
    if (set2A !== "" || set2B !== "") sets.push([set2A, set2B]);
    if (set3A !== "" || set3B !== "") sets.push([set3A, set3B]);
    return sets;
  }, [set1A, set1B, set2A, set2B, set3A, set3B]);

  const canSubmit =
    teamA.length === 2 &&
    teamB.length === 2 &&
    court.trim().length > 0 &&
    (date.trim().length > 0 || time.trim().length > 0);

  const reset = () => {
    setTeamA([]);
    setTeamB([]);
    setCourt("Pista Central");
    setDate("");
    setTime("");
    setSet1A("");
    setSet1B("");
    setSet2A("");
    setSet2B("");
    setSet3A("");
    setSet3B("");
  };

  const handleCreate = () => {
    if (!canSubmit) return;

    const match = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      court,
      date: date || "Sin fecha",
      time: time || "Sin hora",
      teamA: teamALabel,
      teamB: teamBLabel,
      teamAIds: teamA,
      teamBIds: teamB,
      result: resultSets.length ? resultSets : null,
      status: resultSets.length ? "validating" : "scheduled",
      proposedBy: resultSets.length ? "team1" : null,
    };

    onCreate(match);
    setOpen(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]">
          Crear partido
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear partido</DialogTitle>
          <DialogDescription>
            Define equipos (2 vs 2), pista y fecha/hora. Si añades resultado,
            quedará en <span className="font-semibold">Validando</span> hasta que
            el otro equipo lo confirme.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.2fr,0.8fr] gap-4">
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Equipos</CardTitle>
              <CardDescription>
                Selecciona jugadores por equipo. No se puede repetir jugador.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Equipo A
                      </p>
                      <p className="text-xs text-slate-500">
                        {teamA.length}/2 seleccionados
                      </p>
                    </div>
                    <PlayerPickerDialog
                      title="Elegir jugadores · Equipo A"
                      players={players}
                      selectedIds={teamA}
                      disabledIds={disabledIdsForA}
                      onChange={setTeamA}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <AvatarGroup className="*-data-[slot=avatar]:ring-white">
                      {teamALabel.map((u) => (
                        <Avatar key={u} className="bg-slate-200">
                          <AvatarFallback className="text-xs font-semibold">
                            {initials(u)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <div className="text-xs text-slate-500 text-right">
                      {teamALabel.join(" / ") || "—"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Equipo B
                      </p>
                      <p className="text-xs text-slate-500">
                        {teamB.length}/2 seleccionados
                      </p>
                    </div>
                    <PlayerPickerDialog
                      title="Elegir jugadores · Equipo B"
                      players={players}
                      selectedIds={teamB}
                      disabledIds={disabledIdsForB}
                      onChange={setTeamB}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <AvatarGroup className="*-data-[slot=avatar]:ring-white">
                      {teamBLabel.map((u) => (
                        <Avatar key={u} className="bg-slate-200">
                          <AvatarFallback className="text-xs font-semibold">
                            {initials(u)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </AvatarGroup>
                    <div className="text-xs text-slate-500 text-right">
                      {teamBLabel.join(" / ") || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Detalles</CardTitle>
              <CardDescription>Pista, fecha y hora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600">
                  Pista
                </label>
                <Input value={court} onChange={(e) => setCourt(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Fecha
                  </label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">
                    Hora
                  </label>
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Resultado</p>
                  <span className="text-[11px] text-slate-500">opcional</span>
                </div>

                
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs text-center border-separate border-spacing-1">
                    <thead>
                      <tr>
                        <th className="text-left text-slate-500 font-medium pr-2 w-16"></th>
                        <th className="text-slate-500 font-medium px-1">Set 1</th>
                        <th className="text-slate-500 font-medium px-1">Set 2</th>
                        <th className="text-slate-500 font-medium px-1">Set 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="text-left text-slate-600 font-semibold pr-2 py-1">Eq. A</td>
                        <td className="py-1">
                          <Input inputMode="numeric" className="w-14 text-center mx-auto" value={set1A} onChange={(e) => setSet1A(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="0" />
                        </td>
                        <td className="py-1">
                          <Input inputMode="numeric" className="w-14 text-center mx-auto" value={set2A} onChange={(e) => setSet2A(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="0" />
                        </td>
                        <td className="py-1">
                          <Input inputMode="numeric" className="w-14 text-center mx-auto" value={set3A} onChange={(e) => setSet3A(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="0" />
                        </td>
                      </tr>
                      <tr>
                        <td className="text-left text-slate-600 font-semibold pr-2 py-1">Eq. B</td>
                        <td className="py-1">
                          <Input inputMode="numeric" className="w-14 text-center mx-auto" value={set1B} onChange={(e) => setSet1B(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="0" />
                        </td>
                        <td className="py-1">
                          <Input inputMode="numeric" className="w-14 text-center mx-auto" value={set2B} onChange={(e) => setSet2B(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="0" />
                        </td>
                        <td className="py-1">
                          <Input inputMode="numeric" className="w-14 text-center mx-auto" value={set3B} onChange={(e) => setSet3B(e.target.value.replace(/[^\d]/g, "").slice(0, 2))} placeholder="0" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-start gap-2">
                  <ShieldCheck className="size-4 text-slate-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-700">
                      Validación por ambos equipos
                    </p>
                    <p className="text-slate-500">
                      Si un equipo propone un marcador, queda en "Validando" hasta
                      que el otro equipo lo confirme. Si el otro equipo lo edita,
                      vuelve a requerir confirmación.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-full"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                className="flex-1 rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]"
                disabled={!canSubmit}
                onClick={handleCreate}
              >
                Crear
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
          <Pencil className="size-3.5" />
          Tip: el flujo de validación lo verás reflejado en la lista de partidos
          una vez lo creemos.
        </div>
      </DialogContent>
    </Dialog>
  );
}
