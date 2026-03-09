"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar, Clock, MapPin, ShieldCheck, Check, PlusCircle, Pencil, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import CreateMatchForm from "@/components/CreateMatchForm";
import { usePlayers, useUpcomingMatches, usePastMatches, useCurrentUser } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createMatch, proposeResult as proposeResultAction, confirmResult as confirmResultAction } from "@/app/actions/matches";

function isDatePast(dateStr) {
  if (!dateStr || dateStr === "Sin fecha") return false;

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed < today;
  }
  return false;
}

function userInTeam(team, user) {
  if (!user || !team) return false;
  const firstName = user.fullname.split(" ")[0].toLowerCase();
  return team.some((name) => name.toLowerCase().includes(firstName));
}

function ResultDialog({ match, onSave, triggerLabel, triggerVariant = "outline" }) {
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState([
    ["", ""],
    ["", ""],
    ["", ""],
  ]);

  const handleOpen = () => {

    const existing = (match.scores ?? []).map((s) => s.split("-"));
    setScores([
      existing[0] ?? ["", ""],
      existing[1] ?? ["", ""],
      existing[2] ?? ["", ""],
    ]);
    setOpen(true);
  };

  const handleSave = () => {
    const result = scores
      .filter(([a, b]) => a !== "" || b !== "")
      .map(([a, b]) => `${a || 0}-${b || 0}`);
    if (!result.length) return;
    onSave(result);
    setOpen(false);
  };

  const setScore = (setIdx, teamIdx, val) => {
    setScores((prev) => {
      const next = prev.map((s) => [...s]);
      next[setIdx][teamIdx] = val.replace(/\D/g, "").slice(0, 2);
      return next;
    });
  };

  const team1Short = match.team1?.map((n) => n.split(" ")[0]).join(" / ") ?? "Equipo 1";
  const team2Short = match.team2?.map((n) => n.split(" ")[0]).join(" / ") ?? "Equipo 2";

  return (
    <>
      <Button variant={triggerVariant} size="sm" className="rounded-full" onClick={handleOpen}>
        {triggerVariant === "default"
          ? <><PlusCircle className="size-3.5 mr-1.5" />{triggerLabel}</>
          : <><Pencil className="size-3.5 mr-1.5" />{triggerLabel}</>
        }
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle>Resultado del partido</DialogTitle>
            <DialogDescription>
              Rellena los sets. El ganador de cada set se resalta en verde.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Equipo
                    </th>
                    <th className="py-2 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Set 1
                    </th>
                    <th className="py-2 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Set 2
                    </th>
                    <th className="py-2 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Set 3
                      <div className="text-[8px] normal-case font-normal text-slate-300">opc.</div>
                    </th>
                  </tr>
                </thead>
                <tbody>

                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                      {team1Short}
                    </td>
                    {scores.map(([a, b], idx) => {
                      const wins = a !== "" && b !== "" && parseInt(a) > parseInt(b);
                      return (
                        <td key={idx} className="py-2 px-1 text-center">
                          <Input
                            inputMode="numeric"
                            value={a}
                            onChange={(e) => setScore(idx, 0, e.target.value)}
                            placeholder="—"
                            className={`h-9 w-12 text-center font-bold text-base px-0 mx-auto ${wins ? "border-emerald-400 text-emerald-600 bg-emerald-50" : ""
                              }`}
                          />
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <td className="py-2 px-3 text-xs font-semibold text-slate-700 truncate max-w-[100px]">
                      {team2Short}
                    </td>
                    {scores.map(([a, b], idx) => {
                      const wins = a !== "" && b !== "" && parseInt(b) > parseInt(a);
                      return (
                        <td key={idx} className="py-2 px-1 text-center">
                          <Input
                            inputMode="numeric"
                            value={b}
                            onChange={(e) => setScore(idx, 1, e.target.value)}
                            placeholder="—"
                            className={`h-9 w-12 text-center font-bold text-base px-0 mx-auto ${wins ? "border-emerald-400 text-emerald-600 bg-emerald-50" : ""
                              }`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              <ShieldCheck className="size-4 mt-0.5 shrink-0 text-slate-400" />
              El resultado queda en «Validando» hasta que el equipo rival lo confirme.
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button
              className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]"
              onClick={handleSave}
            >
              Proponer resultado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

function PastMatchCard({ match, currentUser, onProposeResult, onConfirm }) {
  const inTeam1 = userInTeam(match.team1, currentUser);
  const inTeam2 = userInTeam(match.team2, currentUser);
  const isParticipant = inTeam1 || inTeam2;
  const isAdmin = currentUser?.role === "admin";
  const canInteract = isParticipant || isAdmin;

  const vs = match.validation?.status;
  const hasScores = match.scores?.length > 0;

  const proposedByTeam1 = match.validation?.proposedBy === "team1";

  const otherTeamShouldConfirm = proposedByTeam1 ? inTeam2 : inTeam1;
  const proposingTeamShouldEdit = proposedByTeam1 ? inTeam1 : inTeam2;

  return (
    <Card className={`rounded-2xl transition-all ${vs === "confirmed"
      ? "border-emerald-200"
      : vs === "validating"
        ? "border-amber-200"
        : "border-slate-100"
      }`}>
      <CardContent className="py-4">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">

            <span className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">
              {match.team1.join(" / ")}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              {hasScores ? (
                match.scores.map((set, i) => (
                  <span
                    key={i}
                    className="font-bold text-slate-900 tabular-nums text-sm bg-slate-100 rounded px-1.5 py-0.5"
                  >
                    {set}
                  </span>
                ))
              ) : (
                <span className="text-xs italic text-slate-400">Sin resultado</span>
              )}
            </div>

            <span className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">
              {match.team2.join(" / ")}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />{match.date}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />{match.court}
            </span>
          </div>
        </div>

        {!hasScores && !vs && (
          <div className="mt-3">
            {canInteract ? (
              <ResultDialog
                match={match}
                triggerLabel="Añadir resultado"
                triggerVariant="default"
                onSave={(scores) => onProposeResult(match.id, scores, inTeam1 ? "team1" : "team2")}
              />
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="size-3.5" />
                Solo los participantes pueden añadir el resultado.
              </div>
            )}
          </div>
        )}

        {vs === "validating" && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 space-y-2">
            <div className="flex items-start gap-2 text-xs text-amber-800">
              <ShieldCheck className="size-4 shrink-0 mt-0.5" />
              <span>
                Resultado propuesto por{" "}
                <strong>{proposedByTeam1 ? match.team1.join(" / ") : match.team2.join(" / ")}</strong>.{" "}

                {proposingTeamShouldEdit && "Puedes editarlo si te equivocaste."}
                {otherTeamShouldConfirm && "Confírmalo si es correcto, o edítalo si no lo es (se reiniciará la validación)."}
                {isAdmin && !isParticipant && "Admin: puedes editar o confirmar."}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">

              {proposingTeamShouldEdit && (
                <ResultDialog
                  match={match}
                  triggerLabel="Editar mi propuesta"
                  triggerVariant="outline"
                  onSave={(scores) => onProposeResult(match.id, scores, inTeam1 ? "team1" : "team2")}
                />
              )}

              {otherTeamShouldConfirm && (
                <>
                  <ResultDialog
                    match={match}
                    triggerLabel="Proponer otro resultado"
                    triggerVariant="outline"
                    onSave={(scores) => {

                      const myTeam = inTeam1 ? "team1" : "team2";
                      onProposeResult(match.id, scores, myTeam);
                    }}
                  />
                  <Button
                    size="sm"
                    className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]"
                    onClick={() => onConfirm(match.id)}
                  >
                    <Check className="size-3.5 mr-1" /> Confirmar
                  </Button>
                </>
              )}

              {isAdmin && !isParticipant && (
                <>
                  <ResultDialog
                    match={match}
                    triggerLabel="Editar (admin)"
                    triggerVariant="outline"
                    onSave={(scores) => onProposeResult(match.id, scores, "team1")}
                  />
                  <Button
                    size="sm"
                    className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]"
                    onClick={() => onConfirm(match.id)}
                  >
                    <Check className="size-3.5 mr-1" /> Confirmar (admin)
                  </Button>
                </>
              )}

              {!canInteract && (
                <div className="flex items-center gap-1 text-xs text-amber-700">
                  <Lock className="size-3.5" /> Solo participantes
                </div>
              )}
            </div>
          </div>
        )}

        {vs === "confirmed" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            <Check className="size-4" />
            Resultado confirmado por ambos equipos
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const tabs = [
  { id: "upcoming", label: "Próximos" },
  { id: "past", label: "Pasados" },
];

export default function MatchesPage() {
  const [players] = usePlayers();
  const [upcomingMatches] = useUpcomingMatches();
  const [pastMatches] = usePastMatches();
  const currentUser = useCurrentUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [fichaMatch, setFichaMatch] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const handleCreateMatch = async (match) => {
    const isPast = isDatePast(match.date);
    const scores = match.result ? match.result.map(([a, b]) => `${a}-${b}`) : [];
    setSaving(true);
    await createMatch({
      teamA: match.teamA,
      teamB: match.teamB,
      type: "Liga",
      typeColor: "bg-purple-100 text-purple-600",
      date: match.date,
      time: match.time,
      court: match.court,
      scores,
      isPast: isPast || scores.length > 0,
    });
    setSaving(false);
    setActiveTab(isPast || scores.length > 0 ? "past" : "upcoming");

  };

  const proposeResult = async (id, scores, proposedBy) => {
    await proposeResultAction(id, scores, proposedBy);

  };

  const confirmResult = async (id) => {
    await confirmResultAction(id);

  };

  const pendingForMe = useMemo(() => {
    return pastMatches.filter((m) => {
      if (m.validation?.status !== "validating") return false;

      const inT1 = userInTeam(m.team1, currentUser);
      const inT2 = userInTeam(m.team2, currentUser);
      if (!inT1 && !inT2) return false;
      const proposer = m.validation?.proposedBy;
      return (proposer === "team1" && inT2) || (proposer === "team2" && inT1);
    }).length;
  }, [pastMatches, currentUser]);

  const noResultCount = useMemo(
    () => pastMatches.filter((m) => !m.scores?.length && !m.validation?.status).length,
    [pastMatches]
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
      <div className="px-6 pt-6 pb-8 max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Partidos</h1>
            <p className="text-slate-500 font-medium">Partidos próximos y pasados de la liga.</p>

            <div className="flex flex-wrap gap-2 mt-3">
              {pendingForMe > 0 && (
                <button
                  onClick={() => setActiveTab("past")}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <ShieldCheck className="size-4" />
                  {pendingForMe} resultado(s) esperando tu confirmación
                </button>
              )}
              {noResultCount > 0 && (
                <button
                  onClick={() => setActiveTab("past")}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  <PlusCircle className="size-4" />
                  {noResultCount} partido(s) sin resultado
                </button>
              )}
            </div>
          </div>
          <CreateMatchForm players={players} onCreate={handleCreateMatch} />
        </header>

        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={activeTab === tab.id ? "bg-slate-900 text-white hover:bg-slate-800 relative" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.id === "past" && pendingForMe > 0 && (
                <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-white">
                  {pendingForMe}
                </span>
              )}
            </Button>
          ))}
        </div>

        {activeTab === "upcoming" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Próximos partidos</h2>
            {upcomingMatches.length === 0 ? (
              <Card className="rounded-2xl border-slate-100 border-dashed">
                <CardContent className="py-12 text-center text-slate-400 text-sm">
                  No hay partidos programados. Crea uno desde arriba.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingMatches.map((match) => (
                  <Card key={match.id} className="rounded-2xl border-slate-100 hover:border-[#13ec5b]/50 transition-colors">
                    <CardContent className="pt-6">
                      <Badge className={`${match.typeColor} border-0 font-bold text-[10px] uppercase tracking-wider`}>
                        {match.type}
                      </Badge>
                      <div className="flex items-center justify-center gap-4 my-5">
                        <div className="text-center">
                          <AvatarGroup className="justify-center -space-x-2 mb-1">
                            <Avatar className="size-8 border-2 border-white bg-slate-200">
                              <AvatarFallback className="text-xs">{match.team1[0]?.[0]}</AvatarFallback>
                            </Avatar>
                            <Avatar className="size-8 border-2 border-white bg-slate-300">
                              <AvatarFallback className="text-xs">{match.team1[1]?.[0]}</AvatarFallback>
                            </Avatar>
                          </AvatarGroup>
                          <p className="text-xs font-medium text-slate-600">
                            {match.team1?.map((n) => n.split(" ")[0]).join(" / ")}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">VS</span>
                        <div className="text-center">
                          <AvatarGroup className="justify-center -space-x-2 mb-1">
                            <Avatar className="size-8 border-2 border-white bg-slate-200">
                              <AvatarFallback className="text-xs">{match.team2[0]?.[0]}</AvatarFallback>
                            </Avatar>
                            <Avatar className="size-8 border-2 border-white bg-slate-300">
                              <AvatarFallback className="text-xs">{match.team2[1]?.[0]}</AvatarFallback>
                            </Avatar>
                          </AvatarGroup>
                          <p className="text-xs font-medium text-slate-600">
                            {match.team2?.map((n) => n.split(" ")[0]).join(" / ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-50">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Calendar className="size-3.5" />{match.date} · {match.time}</span>
                          <span className="flex items-center gap-1"><MapPin className="size-3.5" />{match.court}</span>
                        </div>
                        <button
                          onClick={() => setFichaMatch(match)}
                          className="text-xs font-bold text-[#13ec5b] hover:text-[#0eb846] transition-colors"
                        >Ver ficha</button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "past" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Partidos pasados</h2>
            {pastMatches.length === 0 ? (
              <Card className="rounded-2xl border-slate-100 border-dashed">
                <CardContent className="py-12 text-center text-slate-400 text-sm">
                  Sin partidos pasados todavía.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pastMatches.map((match) => (
                  <PastMatchCard
                    key={match.id}
                    match={match}
                    currentUser={currentUser}
                    onProposeResult={proposeResult}
                    onConfirm={confirmResult}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!fichaMatch} onOpenChange={(v) => { if (!v) setFichaMatch(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <Badge className={`w-fit mb-2 border-0 ${fichaMatch?.typeColor ?? "bg-slate-100 text-slate-600"}`}>
              {fichaMatch?.type ?? "Partido"}
            </Badge>
            <DialogTitle>Ficha del partido</DialogTitle>
            <DialogDescription>Detalles completos del encuentro.</DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center flex-1">
                <AvatarGroup className="justify-center -space-x-2 mb-1.5">
                  <Avatar className="size-9 border-2 border-white bg-slate-200"><AvatarFallback className="text-xs">{fichaMatch?.team1?.[0]?.[0]}</AvatarFallback></Avatar>
                  <Avatar className="size-9 border-2 border-white bg-slate-300"><AvatarFallback className="text-xs">{fichaMatch?.team1?.[1]?.[0]}</AvatarFallback></Avatar>
                </AvatarGroup>
                <p className="text-xs font-semibold text-slate-800">{fichaMatch?.team1?.map(n => n.split(" ")[0]).join(" / ")}</p>
              </div>
              <span className="text-sm font-bold text-slate-300 shrink-0">VS</span>
              <div className="text-center flex-1">
                <AvatarGroup className="justify-center -space-x-2 mb-1.5">
                  <Avatar className="size-9 border-2 border-white bg-slate-200"><AvatarFallback className="text-xs">{fichaMatch?.team2?.[0]?.[0]}</AvatarFallback></Avatar>
                  <Avatar className="size-9 border-2 border-white bg-slate-300"><AvatarFallback className="text-xs">{fichaMatch?.team2?.[1]?.[0]}</AvatarFallback></Avatar>
                </AvatarGroup>
                <p className="text-xs font-semibold text-slate-800">{fichaMatch?.team2?.map(n => n.split(" ")[0]).join(" / ")}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-500"><Calendar className="size-3.5" /> Fecha</span>
                <span className="font-medium text-slate-800">{fichaMatch?.date || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-500"><Clock className="size-3.5" /> Hora</span>
                <span className="font-medium text-slate-800">{fichaMatch?.time || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-500"><MapPin className="size-3.5" /> Pista</span>
                <span className="font-medium text-slate-800">{fichaMatch?.court || "—"}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
