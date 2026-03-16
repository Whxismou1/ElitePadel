"use client";

import React from "react";
import { Users, Calendar, Trophy, Award } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useRanking, useLeague, useCurrentUser, usePastMatches } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LeaguesPage() {
  const ranking = useRanking();
  const [league] = useLeague();
  const [pastMatches] = usePastMatches();
  const currentUser = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    console.log("Current User:", currentUser);
    if (currentUser === null) {
      router.push("/");
    }
    console.log("League Data:", league);

  }, [currentUser, router]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
      <div className="px-6 pt-6 pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
              Detalles de la liga
            </h1>
            <p className="text-slate-500 font-medium">
              {league?.name || "Cargando..."} · {league?.startDate} – {league?.endDate}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              <Users className="size-3.5" />
              {ranking.length} jugadores activos
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium">
              <Calendar className="size-3.5" />
              {pastMatches.length} partidos jugados
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-6 items-start">
          <Card className="rounded-2xl border-slate-100">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="size-5 text-[#13ec5b]" />
                Ranking de la liga
              </CardTitle>
              <CardDescription>
                Tabla dinámica basada en todos los partidos jugados hasta ahora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-transparent shadow-none">
                    <TableHead className="w-10 text-center">Pos</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">Partidos</TableHead>
                    <TableHead className="text-center text-emerald-600">Ganados</TableHead>
                    <TableHead className="text-center text-slate-500">Perdidos</TableHead>
                    <TableHead className="text-center">% Vic.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((row) => {
                    const winRate = row.matches > 0 ? Math.round((row.wins / row.matches) * 100) : 0;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-center font-semibold text-slate-500">
                          {row.position}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{row.fullname}</div>
                          <div className="text-[11px] text-slate-400">@{row.username}</div>
                        </TableCell>
                        <TableCell className="text-center">{row.matches}</TableCell>
                        <TableCell className="text-center font-semibold text-emerald-600">{row.wins}</TableCell>
                        <TableCell className="text-center text-slate-500">{row.losses}</TableCell>
                        <TableCell className="text-center font-semibold">{winRate}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="size-5 text-amber-500" />
                Cómo funciona esta liga
              </CardTitle>
              <CardDescription>
                Liga flexible basada en disponibilidad y parejas dinámicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Los partidos no están prefijados por jornadas. Cada vez que haya
                disponibilidad, se define un nuevo partido y se asignan parejas
                sobre la marcha.
              </p>
              <p>
                El ranking se calcula sumando todas las victorias de cada jugador,
                independientemente de con quién haya jugado.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
