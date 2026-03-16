"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, Shuffle, Users, ShieldCheck, Pencil, ArrowLeft, Check, Lock, Edit2, Info, PlusCircle, Shield } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTournaments, useLeague, usePlayers, useCurrentUser } from "@/lib/store";
import { updateTournament } from "@/app/actions/tournaments";

function getNextPowerOf2(n) {
  if (n <= 2) return 2;
  if (n <= 4) return 4;
  if (n <= 8) return 8;
  if (n <= 16) return 16;
  return 32;
}

function cleanName(name) {
  if (!name || name === "TBD") return "TBD";
  if (name === "BYE") return "BYE";
  return name.replace(/@/g, "");
}

function buildRounds(teams) {
  const size = getNextPowerOf2(teams.length);
  const padded = [...teams];
  while (padded.length < size) padded.push("BYE");
  
  const r1 = [];
  for (let i = 0; i < padded.length; i += 2) {
    const isBye = padded[i] === "BYE" || padded[i + 1] === "BYE";
    r1.push({ 
      a: padded[i], 
      b: padded[i + 1], 
      scoreA: "", 
      scoreB: "", 
      scores: [], 
      validation: isBye ? { status: "confirmed", proposedBy: "system" } : null 
    });
  }
  
  
  r1.forEach(m => {
    if (m.a && m.a !== "TBD" && m.a !== "BYE" && !m.a.includes("/")) m.a = `${m.a} / TBD`;
    if (m.b && m.b !== "TBD" && m.b !== "BYE" && !m.b.includes("/")) m.b = `${m.b} / TBD`;
  })
  
  const rounds = [r1];
  let current = r1.length;
  while (current > 1) {
    current = Math.ceil(current / 2);
    rounds.push(Array.from({ length: current }, () => ({ a: "TBD", b: "TBD", scoreA: "", scoreB: "", scores: [], validation: null })));
  }

  
  if (rounds[1]) {
    for (let i = 0; i < r1.length; i++) {
      const m = r1[i];
      if (m.validation?.status === "confirmed") {
        const winner = m.a === "BYE" ? m.b : m.a;
        const nextMatchIdx = Math.floor(i / 2);
        const slot = i % 2 === 0 ? "a" : "b";
        rounds[1][nextMatchIdx][slot] = winner;
      }
    }
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

function MatchCard({ match, matchKey, onUpdate, isFinal, currentUser, isFirstRound, isAdmin, availablePlayers, availablePairs, onPlayerSelect, isManual }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPairsOpen, setEditPairsOpen] = useState(false);
  
  
  const [p1, p2] = (match.a || "").split(" / ").map(s => s?.trim() === "TBD" ? "" : s?.trim());
  const [p3, p4] = (match.b || "").split(" / ").map(s => s?.trim() === "TBD" ? "" : s?.trim());
  const [tempP1, setTempP1] = useState(p1 || "");
  const [tempP2, setTempP2] = useState(p2 || "");
  const [tempP3, setTempP3] = useState(p3 || "");
  const [tempP4, setTempP4] = useState(p4 || "");

  
  const [tempTeamA, setTempTeamA] = useState(match.a && match.a !== "TBD / TBD" && match.a !== "TBD" ? match.a : "");
  const [tempTeamB, setTempTeamB] = useState(match.b && match.b !== "TBD / TBD" && match.b !== "TBD" ? match.b : "");

  
  const userTag = currentUser ? `@${currentUser.username}`.toLowerCase() : "";
  const inTeamA = match.a && match.a.toLowerCase().includes(userTag);
  const inTeamB = match.b && match.b.toLowerCase().includes(userTag);
  const canInteract = !!currentUser; 

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

  const saveResult = (status, proposer) => {
    const scores = sets
      .filter(([a, b]) => a !== "" || b !== "")
      .map(([a, b]) => `${a || 0}-${b || 0}`);
    
    onUpdate({ 
      ...match, 
      scores, 
      validation: { 
        status, 
        proposedBy: proposer || (inTeamA ? "teamA" : inTeamB ? "teamB" : match.validation?.proposedBy || "teamA")
      } 
    });
    setDialogOpen(false);
  };

  const savePairs = () => {
    let newA, newB;
    if (isManual) {
      const aJoined = [tempP1 || "TBD", tempP2 || "TBD"].join(" / ");
      const bJoined = [tempP3 || "TBD", tempP4 || "TBD"].join(" / ");
      newA = tempP1 === "BYE" ? "BYE" : (aJoined === "TBD / TBD" ? "TBD" : aJoined);
      newB = tempP3 === "BYE" ? "BYE" : (bJoined === "TBD / TBD" ? "TBD" : bJoined);
    } else {
      newA = tempTeamA || "TBD";
      newB = tempTeamB || "TBD";
    }
    
    
    const isNowBye = newA === "BYE" || newB === "BYE";
    const newValidation = isNowBye ? { status: "confirmed", proposedBy: "system" } : null;

    onPlayerSelect({ ...match, a: newA, b: newB, validation: newValidation });
    setEditPairsOpen(false);
  };

  const v = match.validation;
  const isBye = match.a === "BYE" || match.b === "BYE";
  const aDisplay = cleanName(match.a);
  const bDisplay = cleanName(match.b);

  const proposerIsA = v?.proposedBy === "teamA";
  const otherTeamShouldConfirm = proposerIsA ? inTeamB : inTeamA;
  const proposingTeamShouldEdit = proposerIsA ? inTeamA : inTeamB;

  return (
    <Card className={`rounded-2xl transition-all relative group overflow-hidden ${isFinal
      ? "border-[#13ec5b]/60 shadow-[0_10px_28px_rgba(19,236,91,0.15)] ring-1 ring-[#13ec5b]/30"
      : "border-slate-100 shadow-sm"
      } ${v?.status === "validating" ? "border-amber-200 bg-amber-50/10" : "bg-white"}
      ${v?.status === "confirmed" ? "border-emerald-100" : ""}
      `}>
      
      {isAdmin && isFirstRound && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-7 w-7 rounded-full bg-slate-50/80 backdrop-blur-sm border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => {
            e.stopPropagation();
            if (isManual) {
                setTempP1(p1 || "");
                setTempP2(p2 || "");
                setTempP3(p3 || "");
                setTempP4(p4 || "");
            } else {
                setTempTeamA(match.a && match.a !== "TBD" ? match.a : "");
                setTempTeamB(match.b && match.b !== "TBD" ? match.b : "");
            }
            setEditPairsOpen(true);
          }}
        >
          <Edit2 className="size-3 text-slate-500" />
        </Button>
      )}

      <CardContent className="p-0">
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/50 border-b border-slate-50 text-[10px] font-bold text-slate-400">
          <span className="uppercase tracking-widest">{matchKey}</span>
          {v?.status === "validating" && (
            <Badge className="bg-amber-100 text-amber-700 border-0 text-[8px] h-4 rounded-full px-1.5">VALIDANDO</Badge>
          )}
          {v?.status === "confirmed" && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[8px] h-4 rounded-full px-1.5">CONFIRMADO</Badge>
          )}
        </div>

        <div className="p-3 space-y-3">
          
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[13px] font-bold truncate max-w-[150px] ${isBye && match.a === "BYE" ? "text-slate-300 italic" : "text-slate-900"}`}>
              {aDisplay}
            </span>
            <div className="flex gap-1.5">
              {existingScores.length > 0 ? (
                existingScores.map((s, i) => {
                  const [a, b] = s.split("-");
                  const wins = parseInt(a) > parseInt(b);
                  return (
                    <span key={i} className={`font-black tabular-nums text-xs min-w-[18px] text-center py-0.5 rounded ${wins ? "text-emerald-600 bg-emerald-50" : "text-slate-300"}`}>
                      {a}
                    </span>
                  );
                })
              ) : <div className="w-4" />}
            </div>
          </div>

          
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[13px] font-bold truncate max-w-[150px] ${isBye && match.b === "BYE" ? "text-slate-300 italic" : "text-slate-900"}`}>
              {bDisplay}
            </span>
            <div className="flex gap-1.5">
              {existingScores.length > 0 ? (
                existingScores.map((s, i) => {
                  const [a, b] = s.split("-");
                  const wins = parseInt(b) > parseInt(a);
                  return (
                    <span key={i} className={`font-black tabular-nums text-xs min-w-[18px] text-center py-0.5 rounded ${wins ? "text-emerald-600 bg-emerald-50" : "text-slate-300"}`}>
                      {b}
                    </span>
                  );
                })
              ) : <div className="w-4" />}
            </div>
          </div>
        </div>

        {!isBye && v?.status !== "confirmed" && (
          <div className="px-3 pb-3">
            {!canInteract ? (
               <div className="text-[9px] text-slate-400 flex items-center gap-1.5 bg-slate-50 rounded-full px-2 py-1 w-fit">
                 <Lock className="size-3" /> Solo participantes
               </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant={v?.status === "validating" ? "outline" : "default"} size="sm" className="rounded-full h-8 text-[11px] font-bold px-4 bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] border-0 shadow-md" onClick={openDialog}>
                      {v?.status === "validating" ? (proposingTeamShouldEdit ? "Corregir" : "Contra-proponer") : <><PlusCircle className="size-3.5 mr-1.5"/>Añadir resultado</>}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm w-full p-6">
                    <DialogHeader>
                      <DialogTitle className="text-xl">Resultado del partido</DialogTitle>
                      <DialogDescription>
                        Rellena los sets. El ganador se resalta en verde.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl border border-slate-100 overflow-hidden shadow-sm bg-white">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="py-3 px-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Equipo</th>
                              <th className="py-3 w-14 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">S1</th>
                              <th className="py-3 w-14 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">S2</th>
                              <th className="py-3 w-14 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">S3</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-50">
                              <td className="py-4 px-4 text-xs font-bold text-slate-800 truncate max-w-[120px]">{aDisplay}</td>
                              {sets.map(([a, b], idx) => {
                                const wins = a !== "" && b !== "" && parseInt(a) > parseInt(b);
                                return (
                                  <td key={idx} className="py-2 px-1 text-center">
                                    <Input inputMode="numeric" value={a} onChange={(e) => setScore(idx, 0, e.target.value)} placeholder="0" className={`h-10 w-12 text-center font-black text-lg px-0 mx-auto border-slate-100 focus:ring-[#13ec5b] transition-all rounded-lg ${wins ? "border-[#13ec5b] text-emerald-600 bg-emerald-50" : ""}`} />
                                  </td>
                                );
                              })}
                            </tr>
                            <tr>
                              <td className="py-4 px-4 text-xs font-bold text-slate-800 truncate max-w-[120px]">{bDisplay}</td>
                              {sets.map(([a, b], idx) => {
                                const wins = a !== "" && b !== "" && parseInt(b) > parseInt(a);
                                return (
                                  <td key={idx} className="py-2 px-1 text-center">
                                    <Input inputMode="numeric" value={b} onChange={(e) => setScore(idx, 1, e.target.value)} placeholder="0" className={`h-10 w-12 text-center font-black text-lg px-0 mx-auto border-slate-100 focus:ring-[#13ec5b] transition-all rounded-lg ${wins ? "border-[#13ec5b] text-emerald-600 bg-emerald-50" : ""}`} />
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] text-slate-500 leading-relaxed">
                        <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                        <span>El resultado quedará «Validando» hasta que el equipo rival lo confirme o un administrador intervenga.</span>
                      </div>
                    </div>

                    <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                      <Button variant="outline" className="rounded-full flex-1 h-11 font-bold" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                      <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] flex-1 h-11 font-bold shadow-lg" onClick={() => saveResult("validating")}>
                        {v?.status === "validating" ? "Contra-proponer" : "Proponer resultado"}
                      </Button>
                      {(otherTeamShouldConfirm || isAdmin) && v?.status === "validating" && (
                        <Button className="rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex-1 h-11 font-bold" onClick={() => saveResult("confirmed")}>
                          Confirmar actual
                        </Button>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {v?.status === "validating" && (otherTeamShouldConfirm || isAdmin) && (
                  <Button size="sm" variant="ghost" className="h-8 text-[11px] font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full px-4 border border-emerald-100" onClick={() => onUpdate({ ...match, validation: { status: "confirmed", proposedBy: v.proposedBy } })}>
                    <Check className="size-3.5 mr-1" /> Confirmar
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {isAdmin && isFirstRound && (
          <Dialog open={editPairsOpen} onOpenChange={setEditPairsOpen}>
            <DialogContent className="max-w-sm p-6 rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Editar Parejas - {matchKey}</DialogTitle>
                <DialogDescription>Selecciona los equipos desde la lista de participantes.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {isManual ? (
                  <>
                    <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pareja 1</label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 size-3"
                            checked={tempP1 === "BYE"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempP1("BYE"); setTempP2("BYE");
                              } else {
                                setTempP1(""); setTempP2("");
                              }
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Es BYE</span>
                        </label>
                      </div>
                      
                      {tempP1 === "BYE" ? (
                        <div className="h-10 rounded-xl border-dashed border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 text-sm italic">Pasa directo (BYE)</div>
                      ) : (
                        <div className="space-y-2">
                          <Select value={tempP1 || "tbd"} onValueChange={(val) => setTempP1(val === "tbd" ? "" : val)}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                              <SelectValue placeholder="Jugador 1" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="tbd" className="text-slate-400 italic">Por determinar (TBD)</SelectItem>
                              {availablePlayers?.map(p => (
                                <SelectItem key={p} value={p} disabled={[tempP2, tempP3, tempP4].includes(p)}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={tempP2 || "tbd"} onValueChange={(val) => setTempP2(val === "tbd" ? "" : val)}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                              <SelectValue placeholder="Jugador 2" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="tbd" className="text-slate-400 italic">Por determinar (TBD)</SelectItem>
                              {availablePlayers?.map(p => (
                                <SelectItem key={p} value={p} disabled={[tempP1, tempP3, tempP4].includes(p)}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pareja 2</label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 size-3"
                            checked={tempP3 === "BYE"}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setTempP3("BYE"); setTempP4("BYE");
                              } else {
                                setTempP3(""); setTempP4("");
                              }
                            }}
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Es BYE</span>
                        </label>
                      </div>
                      
                      {tempP3 === "BYE" ? (
                        <div className="h-10 rounded-xl border-dashed border-2 border-slate-200 bg-white flex items-center justify-center text-slate-400 text-sm italic">Pasa directo (BYE)</div>
                      ) : (
                        <div className="space-y-2">
                          <Select value={tempP3 || "tbd"} onValueChange={(val) => setTempP3(val === "tbd" ? "" : val)}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                              <SelectValue placeholder="Jugador 3" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="tbd" className="text-slate-400 italic">Por determinar (TBD)</SelectItem>
                              {availablePlayers?.map(p => (
                                <SelectItem key={p} value={p} disabled={[tempP1, tempP2, tempP4].includes(p)}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={tempP4 || "tbd"} onValueChange={(val) => setTempP4(val === "tbd" ? "" : val)}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                              <SelectValue placeholder="Jugador 4" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="tbd" className="text-slate-400 italic">Por determinar (TBD)</SelectItem>
                              {availablePlayers?.map(p => (
                                <SelectItem key={p} value={p} disabled={[tempP1, tempP2, tempP3].includes(p)}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pareja 1</label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 size-3"
                            checked={tempTeamA === "BYE"}
                            onChange={(e) => setTempTeamA(e.target.checked ? "BYE" : "")}
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Es BYE</span>
                        </label>
                      </div>
                      
                      {tempTeamA === "BYE" ? (
                        <div className="h-11 rounded-xl border-dashed border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm italic">Pasa directo (BYE)</div>
                      ) : (
                        <Select value={tempTeamA || "tbd"} onValueChange={(val) => setTempTeamA(val === "tbd" ? "" : val)}>
                          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50">
                            <SelectValue placeholder="Selecciona la Pareja 1" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value="tbd" className="text-slate-400 italic">Por determinar (TBD)</SelectItem>
                            {availablePairs?.map(p => (
                              <SelectItem key={p} value={p} disabled={p === tempTeamB}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    <div className="space-y-2 mt-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pareja 2</label>
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 size-3"
                            checked={tempTeamB === "BYE"}
                            onChange={(e) => setTempTeamB(e.target.checked ? "BYE" : "")}
                          />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Es BYE</span>
                        </label>
                      </div>
                      
                      {tempTeamB === "BYE" ? (
                        <div className="h-11 rounded-xl border-dashed border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-sm italic">Pasa directo (BYE)</div>
                      ) : (
                        <Select value={tempTeamB || "tbd"} onValueChange={(val) => setTempTeamB(val === "tbd" ? "" : val)}>
                          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50">
                            <SelectValue placeholder="Selecciona la Pareja 2" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            <SelectItem value="tbd" className="text-slate-400 italic">Por determinar (TBD)</SelectItem>
                            {availablePairs?.map(p => (
                              <SelectItem key={p} value={p} disabled={p === tempTeamA}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-full flex-1" onClick={() => setEditPairsOpen(false)}>Cancelar</Button>
                <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] rounded-full flex-1 font-bold shadow-md" onClick={savePairs}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}

export default function TournamentBracketPage() {
  const params = useParams();
  const router = useRouter();
  const [allTournaments,, refetch] = useTournaments();
  const [league] = useLeague();
  const [players] = usePlayers(league?.id);
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "admin";
  
  const tournament = useMemo(() => allTournaments.find((t) => t.id === params.id), [allTournaments, params.id]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournament?.bracket) {
      setRounds(Array.isArray(tournament.bracket) ? tournament.bracket : tournament.bracket.rounds || []);
    }
  }, [tournament]);

  const updateMatch = useCallback(async (roundIdx, matchIdx, updated) => {
    const nextRounds = rounds.map((r, ri) => {
      if (ri !== roundIdx) return [...r];
      const nextR = [...r];
      nextR[matchIdx] = updated;
      return nextR;
    });

    
    if (updated.validation?.status === "confirmed") {
      const nextRoundIdx = roundIdx + 1;
      if (nextRounds[nextRoundIdx]) {
        const scores = Array.isArray(updated.scores) ? updated.scores : [];
        let winsA = 0, winsB = 0;
        scores.forEach((s) => {
          const [a, b] = s.split("-").map(Number);
          if (a > b) winsA++; else if (b > a) winsB++;
        });
        
        
        let winner;
        if (updated.a === "BYE") winner = updated.b;
        else if (updated.b === "BYE") winner = updated.a;
        else winner = winsA >= winsB ? updated.a : updated.b;

        const nextMatchIdx = Math.floor(matchIdx / 2);
        const slot = matchIdx % 2 === 0 ? "a" : "b";
        
        
        const targetMatch = nextRounds[nextRoundIdx][nextMatchIdx];
        const nextUpdated = { ...targetMatch, [slot]: winner };
        
        
        const isOneBye = slot === "a" ? targetMatch.b === "BYE" : targetMatch.a === "BYE";
        if (isOneBye && winner !== "TBD" && winner !== "BYE") {
            nextUpdated.validation = { status: "confirmed", proposedBy: "system" };
        }

        nextRounds[nextRoundIdx][nextMatchIdx] = nextUpdated;

        
        let currentR = nextRoundIdx;
        let currentM = nextMatchIdx;
        while (nextRounds[currentR + 1] && nextRounds[currentR][currentM].validation?.status === "confirmed") {
            const m = nextRounds[currentR][currentM];
            const w = m.a === "BYE" ? m.b : m.b === "BYE" ? m.a : (function() {
                const sc = m.scores || [];
                let wa = 0, wb = 0;
                sc.forEach(s => { const [a, b] = s.split("-").map(Number); if (a > b) wa++; else if (b > a) wb++; });
                return wa >= wb ? m.a : m.b;
            })();
            const nRI = currentR + 1;
            const nMI = Math.floor(currentM / 2);
            const nSL = currentM % 2 === 0 ? "a" : "b";
            nextRounds[nRI][nMI][nSL] = w;
            if (nextRounds[nRI][nMI].a === "BYE" || nextRounds[nRI][nMI].b === "BYE") {
                nextRounds[nRI][nMI].validation = { status: "confirmed", proposedBy: "system" };
            }
            currentR = nRI;
            currentM = nMI;
        }
      }
    }

    setRounds(nextRounds);
    setLoading(true);
    
    const bracketToSave = Array.isArray(tournament?.bracket) 
       ? nextRounds 
       : { ...tournament.bracket, rounds: nextRounds };
       
    await updateTournament({ id: params.id, bracket: bracketToSave });
    setLoading(false);
  }, [rounds, params.id, tournament?.bracket]);

  const handleShuffle = async () => {
    if (!isAdmin) return;
    const r1 = rounds[0] || [];
    const participants = [];
    r1.forEach(m => {
      if (m.a && m.a !== "BYE") participants.push(m.a);
      if (m.b && m.b !== "BYE") participants.push(m.b);
    });
    
    if (participants.length === 0) return;

    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    const newRounds = buildRounds(shuffled);
    
    setRounds(newRounds);
    setLoading(true);
    const bracketToSave = Array.isArray(tournament?.bracket) 
       ? newRounds 
       : { ...tournament.bracket, rounds: newRounds };
    await updateTournament({ id: params.id, bracket: bracketToSave, teams: Math.floor(participants.length / 2) });
    setLoading(false);
  };

  const totalRounds = rounds.length;
  const championArr = rounds[totalRounds - 1];
  const championMatch = championArr?.[0];
  const hasChampion = championMatch?.validation?.status === "confirmed" && championMatch.a !== "TBD" && championMatch.b !== "TBD" && championMatch.a !== "BYE" && championMatch.b !== "BYE";

  
  const availablePlayers = useMemo(() => {
    let allP = new Set();
    
    
    if (tournament?.bracket?.participants) {
      tournament.bracket.participants.forEach(p => allP.add(p));
    }
    
    
    if (tournament?.participants && tournament.participants.length > 0) {
       tournament.participants.forEach(p => allP.add(`@${p.username || p.fullname}`));
    }
    
    
    rounds[0]?.forEach(m => {
       if (m.a && m.a !== "TBD" && m.a !== "TBD / TBD" && m.a !== "BYE") m.a.split("/").forEach(p => p.trim() && p.trim() !== "TBD" && allP.add(p.trim()));
       if (m.b && m.b !== "TBD" && m.b !== "TBD / TBD" && m.b !== "BYE") m.b.split("/").forEach(p => p.trim() && p.trim() !== "TBD" && allP.add(p.trim()));
    });
    
    return Array.from(allP).sort();
  }, [rounds, tournament]);

  const isManual = useMemo(() => {
    
    
    if (!rounds[0]) return false;
    return rounds[0].some(m => m.a === "TBD" || m.b === "TBD" || m.a === "TBD / TBD" || m.b === "TBD / TBD");
  }, [rounds]);

  const availablePairs = Array.from(new Set(rounds[0]?.flatMap(m => [m.a, m.b]).filter(p => p && p !== "TBD" && p !== "TBD / TBD" && p !== "BYE") || []));

  const removePlayersFromOtherMatches = (playersToPlace, ignoreMatchIdx, currentValuesInSlot) => {
    const nextRounds = [...rounds];
    const r1 = [...nextRounds[0]];
    
    
    if (isManual) {
      for (let i = 0; i < r1.length; i++) {
        if (i === ignoreMatchIdx) continue;
        let m = { ...r1[i] };
        
        let changed = false;
        const removeP = (teamStr) => {
          if (!teamStr || teamStr === "TBD" || teamStr === "BYE" || teamStr === "TBD / TBD") return teamStr;
          let finalP = teamStr.split(" / ").map(p => p.trim()).filter(p => !playersToPlace.includes(p));
          if (finalP.length !== teamStr.split(" / ").length) changed = true;
          if (finalP.length === 0) return "TBD / TBD";
          if (finalP.length === 1) return `${finalP[0]} / TBD`;
          return finalP.join(" / ");
        };
        
        m.a = removeP(m.a);
        m.b = removeP(m.b);
        
        if (changed) r1[i] = m;
      }
    } else {
      
      
      
      
      
      const newTeamA = playersToPlace[0]; 
      const newTeamB = playersToPlace[1]; 
      const oldTeamA = currentValuesInSlot.a;
      const oldTeamB = currentValuesInSlot.b;

      for (let i = 0; i < r1.length; i++) {
        if (i === ignoreMatchIdx) continue;
        let m = { ...r1[i] };
        let changed = false;

        
        if (m.a === newTeamA && newTeamA !== "TBD" && newTeamA !== "BYE") { m.a = oldTeamA || "TBD"; changed = true; }
        else if (m.b === newTeamA && newTeamA !== "TBD" && newTeamA !== "BYE") { m.b = oldTeamA || "TBD"; changed = true; }
        
        
        if (m.a === newTeamB && newTeamB !== "TBD" && newTeamB !== "BYE") { m.a = oldTeamB || "TBD"; changed = true; }
        else if (m.b === newTeamB && newTeamB !== "TBD" && newTeamB !== "BYE") { m.b = oldTeamB || "TBD"; changed = true; }
        
        if (changed) r1[i] = m;
      }
    }

    nextRounds[0] = r1;
    return nextRounds;
  };

  const handlePlayerSelect = useCallback(async (roundIdx, matchIdx, updated) => {
    if (roundIdx !== 0) return;
    
    
    let entitiesToPlace;
    if (isManual) {
      entitiesToPlace = [
        ...updated.a.split(" / "), 
        ...updated.b.split(" / ")
      ].map(p => p.trim()).filter(p => p && p !== "TBD" && p !== "BYE");
    } else {
      entitiesToPlace = [updated.a, updated.b];
    }
    
    
    const currentValuesInSlot = { a: rounds[0][matchIdx].a, b: rounds[0][matchIdx].b };
    
    let nextRounds = removePlayersFromOtherMatches(entitiesToPlace, matchIdx, currentValuesInSlot);
    nextRounds[0][matchIdx] = updated;
    
    
    if (updated.validation?.status === "confirmed") {
      const nextRoundIdx = 1;
      if (nextRounds[nextRoundIdx]) {
        let winner;
        if (updated.a === "BYE") winner = updated.b;
        else if (updated.b === "BYE") winner = updated.a;
        else winner = updated.a; 

        const nextMatchIdx = Math.floor(matchIdx / 2);
        const slot = matchIdx % 2 === 0 ? "a" : "b";
        
        const targetMatch = nextRounds[nextRoundIdx][nextMatchIdx];
        const nextUpdated = { ...targetMatch, [slot]: winner };
        
        const isOneBye = slot === "a" ? targetMatch.b === "BYE" : targetMatch.a === "BYE";
        if (isOneBye && winner !== "TBD" && winner !== "BYE") {
            nextUpdated.validation = { status: "confirmed", proposedBy: "system" };
        }
        nextRounds[nextRoundIdx][nextMatchIdx] = nextUpdated;

        
        let currentR = nextRoundIdx;
        let currentM = nextMatchIdx;
        while (nextRounds[currentR + 1] && nextRounds[currentR][currentM].validation?.status === "confirmed") {
            const m = nextRounds[currentR][currentM];
            const w = m.a === "BYE" ? m.b : m.a;
            const nRI = currentR + 1;
            const nMI = Math.floor(currentM / 2);
            const nSL = currentM % 2 === 0 ? "a" : "b";
            nextRounds[nRI][nMI][nSL] = w;
            if (nextRounds[nRI][nMI].a === "BYE" || nextRounds[nRI][nMI].b === "BYE") {
                nextRounds[nRI][nMI].validation = { status: "confirmed", proposedBy: "system" };
            }
            currentR = nRI;
            currentM = nMI;
        }
      }
    }
    
    setRounds(nextRounds);
    setLoading(true);
    const bracketToSave = Array.isArray(tournament?.bracket) 
       ? nextRounds 
       : { ...tournament.bracket, rounds: nextRounds };
    await updateTournament({ id: params.id, bracket: bracketToSave });
    setLoading(false);
  }, [rounds, params.id, isManual, removePlayersFromOtherMatches, tournament?.bracket]);

  if (!tournament || allTournaments.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] p-6 text-center text-slate-500 font-medium">
        <div className="animate-pulse flex flex-col items-center justify-center h-[50vh] gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Cargando bracket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-16 font-sans">
      <div className="px-6 pt-6 pb-4 max-w-screen-2xl mx-auto">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button onClick={() => router.push("/tournaments")} className="flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-900 mb-4 transition-all group w-fit">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" /> Volver
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Badge className={`${tournament.statusColor} border-0 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest`}>{tournament.status}</Badge>
              <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-400 flex items-center gap-1">
                <Users className="size-3" /> Torneo de {2 ** (totalRounds)}
              </Badge>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              {tournament.name}
            </h1>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full font-bold text-slate-700 bg-white border-slate-200 hover:bg-slate-50 transition-all shadow-sm h-10 px-5" onClick={handleShuffle} disabled={loading}>
                <Shuffle className="size-4 mr-2 text-emerald-500" /> Mezclar al azar
              </Button>
            </div>
          )}
        </header>

        {hasChampion && (
          <div className="mb-12 flex items-center gap-8 rounded-[2rem] border-2 border-[#13ec5b] bg-white p-8 shadow-[0_20px_50px_rgba(19,236,91,0.15)] relative overflow-hidden ring-4 ring-[#13ec5b]/5 animate-in fade-in zoom-in duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] scale-150 rotate-12">
               <Trophy className="size-64" />
            </div>
            <div className="relative z-10 p-5 rounded-3xl bg-emerald-50 shadow-inner border border-emerald-100 flex items-center justify-center">
               <Trophy className="size-14 text-[#13ec5b] drop-shadow-sm" />
            </div>
            <div className="relative z-10 space-y-1">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-500 animate-pulse">¡CAMPEONES!</p>
              <p className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
                {(function() {
                  const scores = Array.isArray(championMatch.scores) ? championMatch.scores : [];
                  let wa = 0, wb = 0;
                  scores.forEach(s => { const [a, b] = s.split("-").map(Number); if (a > b) wa++; else if (b > a) wb++; });
                  return cleanName(wa >= wb ? championMatch.a : championMatch.b);
                })()}
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto pb-12 scrollbar-none">
          <div className="flex gap-12 min-w-max px-4 items-start">
            {rounds.map((round, roundIdx) => (
              <div key={roundIdx} className="flex flex-col h-full" style={{ minWidth: 260 }}>
                <div className="mb-6 px-1 flex items-center justify-between">
                  <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500 border-b-2 border-[#13ec5b] pb-1">
                    {roundLabel(roundIdx, totalRounds)}
                  </p>
                  <span className="text-[9px] font-bold text-slate-300">{round.length} Partidos</span>
                </div>
                <div className="flex flex-col justify-around flex-1" style={{ gap: `${Math.pow(2, roundIdx) * 32}px`, marginTop: `${(Math.pow(2, roundIdx) - 1) * 16}px` }}>
                  {round.map((match, matchIdx) => (
                    <MatchCard
                      key={matchIdx}
                      match={match}
                      matchKey={`R${roundIdx + 1}-M${matchIdx + 1}`}
                      currentUser={currentUser}
                      isAdmin={isAdmin}
                      isFirstRound={roundIdx === 0}
                      availablePlayers={availablePlayers}
                      availablePairs={availablePairs}
                      isManual={isManual}
                      onPlayerSelect={(updated) => handlePlayerSelect(roundIdx, matchIdx, updated)}
                      onUpdate={(updated) => updateMatch(roundIdx, matchIdx, updated)}
                      isFinal={roundIdx === totalRounds - 1}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-8 rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">En validación</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-[#13ec5b] shadow-[0_0_10px_rgba(19,236,91,0.5)]" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Confirmado</span>
          </div>
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pendiente / BYE</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-slate-400 font-bold bg-slate-50 px-3 py-1.5 rounded-lg">
             <Info className="size-3.5" /> Automático: Al confirmar rivales avanzan al siguiente cuadro.
          </div>
        </div>
      </div>
    </div>
  );
}
