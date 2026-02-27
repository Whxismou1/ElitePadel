import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const players = [
  {
    name: "Mou",
    id: "1",
  },

  {
    name: "Luis",
    id: "2",
  },

  {
    name: "Helen",
    id: "3",
  },
];

export default function PlayerStats({ params }) {
  const player = players.find((p) => p.id === params.id);

  if (!player) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-slate-500">Jugador no encontrado.</p>
      </main>
    );
  }

  return (
    <main className="px-6 py-10">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Ficha de jugador</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="bg-slate-200">
            <AvatarFallback>
              {player.name
                .split(" ")
                .map((word) => word[0])
                .join("")
                .slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {player.name}
            </p>
            <p className="text-xs text-slate-500">ID #{player.id}</p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
