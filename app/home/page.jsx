"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, MoreHorizontal, MapPin, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  useRanking,
  usePastMatches,
  useUpcomingMatches,
  useCurrentUser,
  useLeague,
} from "@/lib/store";

export default function Home() {
  const topPlayers = useRanking().slice(0, 3);
  const [upcomingMatches] = useUpcomingMatches();
  const [pastMatches] = usePastMatches();
  const currentUser = useCurrentUser();
  const [league] = useLeague();
  const [fichaMatch, setFichaMatch] = useState(null);

  const recentResults = pastMatches.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32 font-sans">

      <header className="px-6 pt-4 pb-6 md:flex md:justify-between md:items-center max-w-7xl mx-auto">
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{league?.name || "Panel de Liga"}</h1>
          <p className="text-slate-500 font-medium">
            ¡Hola {currentUser?.fullname?.split(" ")[0]}! ¿Listo para romperla hoy?
          </p>
        </div>
      </header>

      <main className="px-6 flex flex-col gap-6 max-w-7xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <Card className="lg:col-span-2 bg-white rounded-[24px] shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-[#13ec5b]" />
                <CardTitle className="text-lg font-bold text-slate-800">Top jugadores</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-[#13ec5b] hover:text-[#0eb846]"
                asChild
              >
                <Link href="/players">Ver ranking</Link>
              </Button>
            </CardHeader>

            <div className="flex flex-col gap-4 p-6">
              <div className="flex text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">
                <div className="w-8 text-center">#</div>
                <div className="flex-1">Jugador</div>
                <div className="w-20 text-center">Victorias</div>
                <div className="w-24 text-right hidden sm:block">Win Rate</div>
              </div>

              {topPlayers.map((player) => {
                const winRate = player.matches > 0 ? Math.round((player.wins / player.matches) * 100) : 0;
                const rankColors = ["bg-yellow-100 text-yellow-700", "bg-slate-100 text-slate-600", "bg-orange-100 text-orange-700"];
                return (
                  <div key={player.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${rankColors[player.position - 1] ?? "bg-slate-50 text-slate-500"}`}>
                      {player.position}
                    </div>
                    <div className="flex flex-1 items-center gap-3">
                      <Avatar className="bg-slate-200">
                        <AvatarFallback className="text-xs font-semibold text-slate-600">
                          {player.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{player.fullname}</p>
                      </div>
                    </div>
                    <div className="w-20 text-center text-sm font-semibold text-slate-700">{player.wins}</div>
                    <div className="hidden w-24 sm:block">
                      <div className="mb-1 text-[10px] font-bold text-slate-500 text-right">{winRate}%</div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full bg-[#13ec5b]" style={{ width: `${winRate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>


          <Card className="bg-white rounded-[24px] shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold text-slate-800">Resultados recientes</CardTitle>
              <CardDescription>Tus últimos partidos jugados en la liga.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {recentResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 mb-3">
                    <Trophy className="size-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">Aún no hay resultados</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Los últimos partidos aparecerán aquí.</p>
                </div>
              ) : (
                <>
                  {recentResults.map((match) => (
                    <div key={match.id} className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">
                          {match.team1.join(" / ")}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          vs {match.team2.join(" / ")}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{match.date} · {match.court}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {match.scores.map((set, i) => (
                          <p key={i} className="font-bold text-slate-900 text-sm tracking-widest">{set}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button asChild variant="outline" className="w-full mt-2 rounded-xl border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Link href="/matches">Ver historial completo</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>


        <h3 className="text-xl font-bold text-slate-900 mt-2">Próximos encuentros</h3>

        {upcomingMatches.length === 0 ? (
          <Card className="bg-white rounded-[24px] shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 mb-4">
              <Calendar className="size-6 text-slate-300" />
            </div>
            <h4 className="text-lg font-bold text-slate-900 mb-2">No hay próximos encuentros</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
              Actualmente no hay partidos programados. ¡Organiza un nuevo partido desde la sección correspondiente!
            </p>
            <Button asChild className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] font-semibold px-6">
              <Link href="/matches">Ir a partidos</Link>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  onClick={() => setFichaMatch(match)}
                  className="bg-white rounded-[24px] p-5 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 relative overflow-hidden group hover:border-[#13ec5b]/50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Badge className={`${match.typeColor} border-0 font-bold text-[10px] uppercase tracking-wider`}>
                      {match.type}
                    </Badge>
                    <MoreHorizontal className="size-4 text-slate-300" />
                  </div>
                  <div className="flex justify-center items-center gap-4 mb-4">
                    <div className="text-center">
                      <AvatarGroup className="-space-x-3 justify-center mb-1">
                        <Avatar className="w-9 h-9 bg-slate-200 border-2 border-white">
                          <AvatarFallback className="text-xs">{match.team1[0]?.[0]}</AvatarFallback>
                        </Avatar>
                        <Avatar className="w-9 h-9 bg-slate-300 border-2 border-white">
                          <AvatarFallback className="text-xs">{match.team1[1]?.[0]}</AvatarFallback>
                        </Avatar>
                      </AvatarGroup>
                      <p className="text-xs text-slate-600 font-medium">{match.team1.map(n => n.split(" ")[0]).join(" / ")}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">VS</span>
                    <div className="text-center">
                      <AvatarGroup className="-space-x-3 justify-center mb-1">
                        <Avatar className="w-9 h-9 bg-slate-200 border-2 border-white">
                          <AvatarFallback className="text-xs">{match.team2[0]?.[0]}</AvatarFallback>
                        </Avatar>
                        <Avatar className="w-9 h-9 bg-slate-300 border-2 border-white">
                          <AvatarFallback className="text-xs">{match.team2[1]?.[0]}</AvatarFallback>
                        </Avatar>
                      </AvatarGroup>
                      <p className="text-xs text-slate-600 font-medium">{match.team2.map(n => n.split(" ")[0]).join(" / ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="size-4 shrink-0" />
                      <span className="text-xs font-medium">{match.date} • {match.time}</span>
                    </div>
                    <span className="text-xs font-bold text-[#13ec5b] group-hover:translate-x-1 transition-transform">Ver ficha</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>


      <Dialog open={!!fichaMatch} onOpenChange={(v) => { if (!v) setFichaMatch(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <Badge className={`w-fit mb-2 border-0 ${fichaMatch?.typeColor ?? "bg-slate-100 text-slate-600"}`}>
              {fichaMatch?.type ?? "Partido"}
            </Badge>
            <DialogTitle>Ficha del partido</DialogTitle>
            <DialogDescription>
              Detalles completos del encuentro.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">

            <div className="flex items-center justify-center gap-3">
              <div className="text-center flex-1">
                <AvatarGroup className="justify-center -space-x-2 mb-1.5">
                  <Avatar className="size-9 border-2 border-white bg-slate-200">
                    <AvatarFallback className="text-xs">{fichaMatch?.team1?.[0]?.[0]}</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-9 border-2 border-white bg-slate-300">
                    <AvatarFallback className="text-xs">{fichaMatch?.team1?.[1]?.[0]}</AvatarFallback>
                  </Avatar>
                </AvatarGroup>
                <p className="text-xs font-semibold text-slate-800">
                  {fichaMatch?.team1?.map(n => n.split(" ")[0]).join(" / ")}
                </p>
              </div>
              <span className="text-sm font-bold text-slate-300 shrink-0">VS</span>
              <div className="text-center flex-1">
                <AvatarGroup className="justify-center -space-x-2 mb-1.5">
                  <Avatar className="size-9 border-2 border-white bg-slate-200">
                    <AvatarFallback className="text-xs">{fichaMatch?.team2?.[0]?.[0]}</AvatarFallback>
                  </Avatar>
                  <Avatar className="size-9 border-2 border-white bg-slate-300">
                    <AvatarFallback className="text-xs">{fichaMatch?.team2?.[1]?.[0]}</AvatarFallback>
                  </Avatar>
                </AvatarGroup>
                <p className="text-xs font-semibold text-slate-800">
                  {fichaMatch?.team2?.map(n => n.split(" ")[0]).join(" / ")}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 divide-y divide-slate-100">
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <Calendar className="size-3.5" /> Fecha
                </span>
                <span className="font-medium text-slate-800">{fichaMatch?.date || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <Clock className="size-3.5" /> Hora
                </span>
                <span className="font-medium text-slate-800">{fichaMatch?.time || "—"}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-slate-500">
                  <MapPin className="size-3.5" /> Pista
                </span>
                <span className="font-medium text-slate-800">{fichaMatch?.court || "—"}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}