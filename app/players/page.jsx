"use client";

import React from "react";
import { BarChart3 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRanking } from "@/lib/store";

export default function PlayersPage() {
  const players = useRanking();

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
      <div className="px-6 pt-6 pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
              Jugadores
            </h1>
            <p className="text-slate-500 font-medium">
              Vista rápida de posiciones, partidos y rendimiento.
            </p>
          </div>
          <span className="text-sm text-slate-500 font-medium">{players.length} jugadores activos</span>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => {
            const winRate =
              player.matches > 0
                ? Math.round((player.wins / player.matches) * 100)
                : 0;
            return (
              <Card
                key={player.id}
                className="rounded-2xl border-slate-100 shadow-[0_4px_18px_rgba(15,23,42,0.06)]"
              >
                <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="relative">
                      <Avatar className="bg-slate-200 mt-0.5">
                        <AvatarFallback className="text-xs font-semibold text-slate-700">
                          {player.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {player.position <= 3 && (
                        <span className={`absolute -top-1 -right-1 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center ${player.position === 1 ? "bg-yellow-400 text-yellow-900" :
                          player.position === 2 ? "bg-slate-300 text-slate-700" :
                            "bg-orange-300 text-orange-900"
                          }`}>{player.position}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-400">
                        Posición #{player.position}
                      </div>
                      <CardTitle className="text-base mt-1 truncate">
                        @{player.username}
                      </CardTitle>
                      <CardDescription className="text-[12px] text-slate-500 mt-0.5 truncate">
                        {player.fullname}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <BarChart3 className="size-4 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent className="pt-1 text-sm text-slate-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Partidos jugados</span>
                    <span className="font-semibold text-slate-900">{player.matches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ganados</span>
                    <span className="font-semibold text-emerald-600">{player.wins}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perdidos</span>
                    <span className="text-slate-500">{player.losses}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100 mt-1">
                    <span className="text-xs text-slate-500">% Victorias</span>
                    <span className="text-sm font-semibold">{winRate}%</span>
                  </div>
                  
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full bg-[#13ec5b] transition-all" style={{ width: `${winRate}%` }} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
