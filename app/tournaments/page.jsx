"use client";

import React, { useState } from "react";
import { Trophy, Plus, Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import CreateTournamentForm from "@/components/CreateTournamentForm";
import { usePlayers, useTournaments, useLeague } from "@/lib/store";

export default function TournamentsPage() {
  const [league] = useLeague();
  const [players] = usePlayers(league?.id);
  const [tournaments, , refetchTournaments] = useTournaments();
  const [createOpen, setCreateOpen] = useState(false);

  const handleTournamentCreated = () => {
    refetchTournaments();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
      <div className="px-6 pt-6 pb-8 max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Torneos</h1>
            <p className="text-slate-500 font-medium">Gestiona los torneos de la temporada.</p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] shrink-0 flex items-center gap-2"
          >
            <Plus className="size-4" />
            Crear torneo
          </Button>
        </header>

        <CreateTournamentForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={handleTournamentCreated}
          players={players}
        />

        {tournaments.length === 0 ? (
          <Card className="rounded-2xl border-slate-100 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="inline-flex p-4 rounded-full bg-slate-100 text-slate-400 mb-4">
                <Trophy className="size-10" />
              </div>
              <CardTitle className="text-xl mb-2">No hay torneos todavía</CardTitle>
              <CardDescription className="max-w-sm mx-auto mb-6">
                Crea tu primer torneo para empezar a organizar partidos y clasificaciones.
              </CardDescription>
              <Button
                onClick={() => setCreateOpen(true)}
                className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]"
              >
                <Plus className="size-4 mr-2" />
                Crear torneo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tournaments.map((t) => (
              <Card
                key={t.id}
                className="rounded-2xl border-slate-100 hover:border-[#13ec5b]/30 transition-colors"
              >
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">{t.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="size-3.5 shrink-0" />
                      {t.startDate} – {t.endDate}
                    </CardDescription>
                  </div>
                  <Badge className={`shrink-0 ${t.statusColor} border-0`}>{t.status}</Badge>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-4 text-slate-400" />
                      {t.teams} / {t.maxTeams} parejas
                    </span>

                    <div className="flex-1 max-w-[120px]">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-[#13ec5b]"
                          style={{ width: `${Math.min((t.teams / t.maxTeams) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-lg">
                    <Link href={`/tournaments/${t.id}`}>Ver torneo</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
