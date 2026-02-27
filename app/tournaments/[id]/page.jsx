"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Shuffle, Users, ShieldCheck, Pencil, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useTournaments } from "@/lib/store";





function getNextPowerOf2(n) {
  if (n <= 2) return 2;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 16) return 16;
  return 32;
}

function shufflePairs(teams) {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    pairs.push({ a: shuffled[i] ?? "BYE", b: shuffled[i + 1] ?? "BYE", scoreA: "", scoreB: "", validation: null });
  }
  return pairs;
}

function buildRounds(teams) {
  const size = getNextPowerOf2(teams.length);
  
  const padded = [...teams];
  while (padded.length < size) padded.push("BYE");
  
  const r1 = [];
  for (let i = 0; i < padded.length; i += 2) {
    r1.push({ a: padded[i], b: padded[i + 1], scoreA: "", scoreB: "", validation: null });
  }
  
  const rounds = [r1];
  let current = r1.length;
  while (current > 1) {
    current = Math.ceil(current / 2);
    rounds.push(Array.from({ length: current }, () => ({ a: "TBD", b: "TBD", scoreA: "", scoreB: "", validation: null })));
  }
  return rounds;
}

function roundLabel(roundIdx, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIdx;
  if (fromEnd === 0) return "🏆 Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Cuartos";
  return `Ronda ${roundIdx + 1}`;
}





function MatchCard({ match, matchKey, onUpdate, isFinal }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const existingScores = Array.isArray(match.scores) ? match.scores : [];
  const [sets, setSets] = useState([["", ""], ["", ""], ["", ""]]);

  const openDialog = () => {
    const parsed = existingScores.map((s) => s.split("-"));
    setSets([
      parsed[0] ?? ["", ""],
      parsed[1] ?? ["", ""],
      parsed[2] ?? ["", ""],
    ]);
    setDialogOpen(true);
  };

  const setScore = (setIdx, teamIdx, val) => {
    setSets((prev) => {
      const next = prev.map((s) => [...s]);
      next[setIdx][teamIdx] = val.replace(/\D/g, "").slice(0, 2);
      return next;
    });
  };

  const save = (status) => {
    const scores = sets
      .filter(([a, b]) => a !== "" || b !== "")
      .map(([a, b]) => `${a || 0}-${b || 0}`);
    onUpdate(matchKey, { ...match, scores, validation: { status, lastEditedBy: "teamA" } });
    setDialogOpen(false);
  };

  const v = match.validation;
  const isBye = match.a === "BYE" || match.b === "BYE";
  const aShort = match.a?.split(" ")[0] ?? "A";
  const bShort = match.b?.split(" ")[0] ?? "B";

  return (
    <Card className={`rounded-2xl shadow-sm transition-all ${isFinal
      ? "border-[#13ec5b]/60 shadow-[0_10px_28px_rgba(19,236,91,0.15)]"
      : "border-slate-100"
      }`}>
      <CardContent className="py-3 px-4">
        
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider">{matchKey}</span>
          {v?.status === "validating" && (
            <Badge className="bg-amber-50 text-amber-700 border-0 text-[9px]">Validando</Badge>
          )}
          {v?.status === "confirmed" && (
            <Badge className="bg-emerald-50 text-emerald-700 border-0 text-[9px]">✓ Confirmado</Badge>
          )}
        </div>

        
        <div className="space-y-1.5">
          <div className={`flex items-center justify-between gap-1 text-xs font-medium ${isBye ? "text-slate-300" : "text-slate-800"}`}>
            <span className="truncate pr-1 max-w-[100px]">{match.a}</span>
            <div className="flex gap-1 shrink-0">
              {existingScores.length > 0
                ? existingScores.map((s, i) => {
                  const [a, b] = s.split("-");
                  const wins = parseInt(a) > parseInt(b);
                  return (
                    <span key={i} className={`font-bold tabular-nums text-xs px-1 rounded ${wins ? "text-emerald-600" : "text-slate-400"}`}>
                      {a}
                    </span>
                  );
                })
                : <span className="text-[10px] italic text-slate-300">{isBye ? "—" : ""}</span>
              }
            </div>
          </div>
          <div className={`flex items-center justify-between gap-1 text-xs ${isBye ? "text-slate-200" : "text-slate-500"}`}>
            <span className="truncate pr-1 max-w-[100px]">{match.b}</span>
            <div className="flex gap-1 shrink-0">
              {existingScores.length > 0
                ? existingScores.map((s, i) => {
                  const [a, b] = s.split("-");
                  const wins = parseInt(b) > parseInt(a);
                  return (
                    <span key={i} className={`font-bold tabular-nums text-xs px-1 rounded ${wins ? "text-emerald-600" : "text-slate-400"}`}>
                      {b}
                    </span>
                  );
                })
                : <span className="text-[10px] italic text-slate-300">{isBye ? "—" : ""}</span>
              }
            </div>
          </div>
        </div>

        {!isBye && (
          <div className="mt-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full h-7 text-[11px] px-2.5" onClick={openDialog}>
                  <Pencil className="size-3 mr-1" /> Editar
                </Button>
              </DialogTrigger>
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
                          <th className="py-2 px-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">Equipo</th>
                          <th className="py-2 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Set 1</th>
                          <th className="py-2 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">Set 2</th>
                          <th className="py-2 w-16 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Set 3
                            <div className="text-[8px] normal-case font-normal text-slate-300">opc.</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        
                        <tr className="border-b border-slate-100">
                          <td className="py-2 px-3 text-xs font-semibold text-slate-700 truncate max-w-[90px]">{aShort}</td>
                          {sets.map(([a, b], idx) => {
                            const wins = a !== "" && b !== "" && parseInt(a) > parseInt(b);
                            return (
                              <td key={idx} className="py-2 px-1 text-center">
                                <Input
                                  inputMode="numeric"
                                  value={a}
                                  onChange={(e) => setScore(idx, 0, e.target.value)}
                                  placeholder="—"
                                  className={`h-9 w-12 text-center font-bold text-base px-0 mx-auto ${wins ? "border-emerald-400 text-emerald-600 bg-emerald-50" : ""}`}
                                />
                              </td>
                            );
                          })}
                        </tr>
                        
                        <tr>
                          <td className="py-2 px-3 text-xs font-semibold text-slate-700 truncate max-w-[90px]">{bShort}</td>
                          {sets.map(([a, b], idx) => {
                            const wins = a !== "" && b !== "" && parseInt(b) > parseInt(a);
                            return (
                              <td key={idx} className="py-2 px-1 text-center">
                                <Input
                                  inputMode="numeric"
                                  value={b}
                                  onChange={(e) => setScore(idx, 1, e.target.value)}
                                  placeholder="—"
                                  className={`h-9 w-12 text-center font-bold text-base px-0 mx-auto ${wins ? "border-emerald-400 text-emerald-600 bg-emerald-50" : ""}`}
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
                    Proponer guarda en «Validando» hasta que el otro equipo confirme.
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" className="rounded-full" onClick={() => save("validating")}>
                    Proponer resultado
                  </Button>
                  <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={() => save("confirmed")}>
                    <Check className="size-4 mr-1" /> Confirmar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}







const FALLBACK_TEAMS_8 = [
  "Navarro / Lebrón", "Ruiz / Stupa",
  "Tapia / Coello", "Chingotto / Tello",
  "Galán / Sanz", "Bela / Yanguas",
  "Momo / Sanyo", "Di Nenno / Lima",
];

const FALLBACK_TEAMS_4 = [
  "Alex / Sarah", "Mike / Luis",
  "Helen / Pablo", "Ana / Carlos",
];

export default function TournamentBracketPage() {
  const params = useParams();
  const router = useRouter();
  const [allTournaments] = useTournaments();
  const tournament = allTournaments.find((t) => t.id === params.id);

  const [teamsList, setTeamsList] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [initialized, setInitialized] = useState(false);

  
  useEffect(() => {
    let teams = [];
    try {
      const raw = localStorage.getItem(`tournament:${params.id}:config`);
      if (raw) {
        const cfg = JSON.parse(raw);
        const participants = Array.isArray(cfg.participants) ? cfg.participants : [];
        const names = participants.map((p) => `@${p.username}`).filter(Boolean);
        for (let i = 0; i < names.length; i += 2) {
          if (names[i + 1]) teams.push(`${names[i]} / ${names[i + 1]}`);
        }
      }
    } catch { }

    
    if (!teams.length) {
      const count = tournament?.teams ?? 8;
      teams = count <= 4 ? FALLBACK_TEAMS_4 : FALLBACK_TEAMS_8;
    }

    setTeamsList(teams);
    setRounds(buildRounds(teams));
    setInitialized(true);
  }, [params.id, tournament]);

  const handleShuffle = () => {
    const shuffled = [...teamsList].sort(() => Math.random() - 0.5);
    setTeamsList(shuffled);
    setRounds(buildRounds(shuffled));
  };

  const updateMatch = (roundIdx, matchIdx, updated) => {
    setRounds((prev) => {
      const next = prev.map((r) => [...r]);
      next[roundIdx][matchIdx] = updated;
      
      if (updated.validation?.status === "confirmed" && next[roundIdx + 1]) {
        
        const scores = Array.isArray(updated.scores) ? updated.scores : [];
        let winsA = 0, winsB = 0;
        scores.forEach((s) => {
          const [a, b] = s.split("-").map(Number);
          if (a > b) winsA++; else if (b > a) winsB++;
        });
        const winner = winsA >= winsB ? updated.a : updated.b;
        const nextMatchIdx = Math.floor(matchIdx / 2);
        const slot = matchIdx % 2 === 0 ? "a" : "b";
        next[roundIdx + 1][nextMatchIdx] = { ...next[roundIdx + 1][nextMatchIdx], [slot]: winner };
      }
      return next;
    });
  };


  if (!initialized) return null;

  const size = getNextPowerOf2(teamsList.length);
  const totalRounds = rounds.length;
  const champion = rounds[totalRounds - 1]?.[0];
  const hasChampion = champion?.validation?.status === "confirmed";

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16 font-sans">
      <div className="px-6 pt-6 pb-4 max-w-7xl mx-auto">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              onClick={() => router.push("/tournaments")}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-2 transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Volver a torneos
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">
              Tournament bracket
            </p>
            <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {tournament?.name ?? `Torneo #${params.id}`}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                <Users className="size-3.5" />
                {teamsList.length} parejas · bracket de {size}
              </span>
              {tournament && (
                <Badge className={`${tournament.statusColor} border-0 text-xs`}>{tournament.status}</Badge>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={handleShuffle}>
              <Shuffle className="size-4 mr-1.5" /> Reagrupar aleatoriamente
            </Button>
          </div>
        </header>

        
        {hasChampion && (
          <div className="mb-6 flex items-center gap-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-6 py-4 shadow-[0_8px_30px_rgba(19,236,91,0.2)]">
            <Trophy className="size-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Campeón del torneo</p>
              <p className="text-xl font-bold text-slate-900">{champion.a !== "TBD" ? champion.a : champion.b}</p>
            </div>
          </div>
        )}

        
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {rounds.map((round, roundIdx) => (
              <div key={roundIdx} className="flex flex-col gap-3" style={{ minWidth: 200 }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 mb-1">
                  {roundLabel(roundIdx, totalRounds)}
                </p>
                
                <div
                  className="flex flex-col"
                  style={{
                    gap: `${Math.pow(2, roundIdx) * 12}px`,
                    marginTop: `${(Math.pow(2, roundIdx) - 1) * 6}px`,
                  }}
                >
                  {round.map((match, matchIdx) => (
                    <MatchCard
                      key={matchIdx}
                      match={match}
                      matchKey={`R${roundIdx + 1}-M${matchIdx + 1}`}
                      onUpdate={(key, updated) => updateMatch(roundIdx, matchIdx, updated)}
                      isFinal={roundIdx === totalRounds - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        
        <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-300 inline-block" /> Resultado en validación
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Confirmado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> BYE = pasa automáticamente
          </span>
        </div>
      </div>
    </div>
  );
}
