"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Shield, Users, Trophy, Plus, Pencil, Trash2, Check, X,
    Search, BarChart3, Calendar, ChevronRight, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
    Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import { usePlayers, useLeague, useTournaments, useIsAdmin, useSession, useMounted } from "@/lib/store";

function initials(name) {
    return name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function generatePassword(length = 10) {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}


function PlayersTab() {
    const [players, setPlayers] = usePlayers();
    const [sessionData] = useSession();
    const currentSession = sessionData; 
    const [search, setSearch] = useState("");
    const [editTarget, setEditTarget] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const defaultForm = () => ({
        fullname: "", username: "", email: "",
        password: generatePassword(), role: "player",
    });
    const [form, setForm] = useState(defaultForm);

    const openAdd = () => {
        setForm(defaultForm());
        setAddOpen(true);
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return players.filter((p) =>
            p.fullname.toLowerCase().includes(q) ||
            p.username.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        );
    }, [players, search]);

    const addPlayer = () => {
        if (!form.fullname || !form.email || !form.password) return;
        setPlayers((prev) => [
            ...prev,
            { id: `p${Date.now()}`, ...form, matches: 0, wins: 0, losses: 0 },
        ]);
        setAddOpen(false);
    };

    const saveEdit = () => {
        setPlayers((prev) => prev.map((p) => (p.id === editTarget.id ? editTarget : p)));
        setEditTarget(null);
    };

    const deletePlayer = (id) => {
        setPlayers((prev) => prev.filter((p) => p.id !== id));
        setDeleteTarget(null);
    };

    const ROLES = ["admin", "player"];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input className="pl-9" placeholder="Buscar jugador…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Dialog open={addOpen} onOpenChange={(v) => { if (v) openAdd(); else setAddOpen(false); }}>
                    <DialogTrigger asChild>
                        <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={openAdd}>
                            <Plus className="size-4 mr-1" /> Nuevo jugador
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Añadir jugador</DialogTitle>
                            <DialogDescription>Crea una nueva cuenta de jugador en la liga.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 mt-2">
                            {[
                                { label: "Nombre completo", key: "fullname", placeholder: "Ej. Ana López" },
                                { label: "Username", key: "username", placeholder: "analopez" },
                                { label: "Email", key: "email", placeholder: "ana@elitepadel.app", type: "email" },
                            ].map(({ label, key, placeholder, type = "text" }) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600">{label}</label>
                                    <Input type={type} placeholder={placeholder} value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                                </div>
                            ))}
                            
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Contraseña (generada automáticamente)</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={form.password}
                                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                        className="font-mono text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="shrink-0"
                                        onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
                                        title="Generar nueva contraseña"
                                    >
                                        <RefreshCw className="size-4" />
                                    </Button>
                                </div>
                                <p className="text-[11px] text-slate-400">Puedes editarla o regenerarla con el botón.</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Rol</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={form.role}
                                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                                >
                                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
                            <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={addPlayer}>Crear jugador</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="rounded-2xl border-slate-100">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Jugador</TableHead>
                                <TableHead className="text-center hidden sm:table-cell">Partidos</TableHead>
                                <TableHead className="text-center hidden md:table-cell">Victorias</TableHead>
                                <TableHead className="text-center hidden md:table-cell">% Vic.</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((p) => {
                                const wr = p.matches > 0 ? Math.round((p.wins / p.matches) * 100) : 0;
                                return (
                                    <TableRow key={p.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8 bg-slate-200">
                                                    <AvatarFallback className="text-xs font-semibold text-slate-600">{initials(p.fullname)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{p.fullname}</p>
                                                    <p className="text-xs text-slate-400">@{p.username} · {p.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center hidden sm:table-cell">{p.matches}</TableCell>
                                        <TableCell className="text-center hidden md:table-cell text-emerald-600 font-semibold">{p.wins}</TableCell>
                                        <TableCell className="text-center hidden md:table-cell font-semibold">{wr}%</TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs border-0 ${p.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                                                {p.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditTarget({ ...p })}>
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    {editTarget?.id === p.id && (
                                                        <DialogContent className="max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Editar jugador</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="space-y-3 mt-2">
                                                                {[
                                                                    { label: "Nombre completo", key: "fullname" },
                                                                    { label: "Username", key: "username" },
                                                                    { label: "Email", key: "email" },
                                                                ].map(({ label, key }) => (
                                                                    <div key={key} className="space-y-1">
                                                                        <label className="text-xs font-medium text-slate-600">{label}</label>
                                                                        <Input value={editTarget[key]} onChange={(e) => setEditTarget((t) => ({ ...t, [key]: e.target.value }))} />
                                                                    </div>
                                                                ))}
                                                                <div className="space-y-1">
                                                                    <label className="text-xs font-medium text-slate-600">Rol</label>
                                                                    <select
                                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                        value={editTarget.role}
                                                                        onChange={(e) => setEditTarget((t) => ({ ...t, role: e.target.value }))}
                                                                    >
                                                                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <DialogFooter>
                                                                <Button variant="outline" onClick={() => setEditTarget(null)}>Cancelar</Button>
                                                                <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={saveEdit}>Guardar</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    )}
                                                </Dialog>
                                                
                                                {currentSession?.id === p.id ? (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 cursor-not-allowed" disabled title="No puedes eliminarte a ti mismo">
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="ghost" size="icon"
                                                        className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                                        onClick={() => setDeleteTarget(p)}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            
            <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-3 mx-auto">
                            <Trash2 className="size-5 text-rose-600" />
                        </div>
                        <DialogTitle className="text-center">¿Eliminar jugador?</DialogTitle>
                        <DialogDescription className="text-center">
                            Se eliminarán todos los datos de{" "}
                            <strong>{deleteTarget?.fullname}</strong>. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-2 mt-2">
                        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" className="flex-1 rounded-full" onClick={() => deletePlayer(deleteTarget?.id)}>
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}




function LeagueTab() {
    const [league, setLeague] = useLeague();
    const [players] = usePlayers();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(league);

    
    useEffect(() => { if (!editing) setDraft(league); }, [league, editing]);

    const save = () => { setLeague(draft); setEditing(false); };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-slate-100">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-base">Configuración de la liga</CardTitle>
                        <CardDescription>Nombre, fechas y estadísticas generales.</CardDescription>
                    </div>
                    {!editing ? (
                        <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setDraft(league); setEditing(true); }}>
                            <Pencil className="size-3.5 mr-1" /> Editar
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setEditing(false)}><X className="size-4" /></Button>
                            <Button size="icon" className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] rounded-full" onClick={save}><Check className="size-4" /></Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {editing ? (
                        <>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Nombre</label>
                                <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[["startDate", "Fecha inicio"], ["endDate", "Fecha fin"]].map(([k, l]) => (
                                    <div key={k} className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">{l}</label>
                                        <Input value={draft[k]} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600">Jugadores activos</label>
                                    <Input type="number" value={draft.totalPlayers} onChange={(e) => setDraft((d) => ({ ...d, totalPlayers: Number(e.target.value) }))} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600">Partidos jugados</label>
                                    <Input type="number" value={draft.matchesPlayed} onChange={(e) => setDraft((d) => ({ ...d, matchesPlayed: Number(e.target.value) }))} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-2 text-sm text-slate-700">
                            <div className="flex justify-between"><span className="text-slate-500">Nombre</span><span className="font-medium text-right max-w-[180px] truncate">{league.name}</span></div>
                            <Separator />
                            <div className="flex justify-between"><span className="text-slate-500">Inicio</span><span>{league.startDate}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Fin</span><span>{league.endDate}</span></div>
                            <Separator />
                            <div className="flex justify-between"><span className="text-slate-500">Jugadores activos</span><span className="font-semibold text-emerald-600">{league.totalPlayers}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Partidos jugados</span><span className="font-semibold">{league.matchesPlayed}</span></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="size-4 text-emerald-500" /> Resumen de jugadores
                    </CardTitle>
                    <CardDescription>Estadísticas rápidas del plantel actual.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Total jugadores</span><span className="font-semibold">{players.length}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Admins</span><span>{players.filter((p) => p.role === "admin").length}</span></div>
                    <Separator />
                    <div className="flex justify-between"><span className="text-slate-500">Total partidos (suma)</span><span className="font-semibold">{players.reduce((s, p) => s + p.matches, 0)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Total victorias (suma)</span><span className="font-semibold text-emerald-600">{players.reduce((s, p) => s + p.wins, 0)}</span></div>
                </CardContent>
            </Card>
        </div>
    );
}




function TournamentsTab() {
    const [tournaments, setTournaments] = useTournaments();
    const router = useRouter();
    const [deleteTournamentTarget, setDeleteTournamentTarget] = React.useState(null);
    const deleteTournament = (id) => {
        setTournaments((prev) => prev.filter((t) => t.id !== id));
        setDeleteTournamentTarget(null);
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{tournaments.length} torneo(s) registrados</p>
                <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={() => router.push("/tournaments")}>
                    <Plus className="size-4 mr-1" /> Crear torneo
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.map((t) => (
                    <Card key={t.id} className="rounded-2xl border-slate-100">
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                            <div className="min-w-0">
                                <CardTitle className="text-base truncate">{t.name}</CardTitle>
                                <CardDescription className="flex items-center gap-1 mt-1">
                                    <Calendar className="size-3.5" />{t.startDate} – {t.endDate}
                                </CardDescription>
                            </div>
                            <Badge className={`shrink-0 border-0 ${t.statusColor}`}>{t.status}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between gap-2 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                    <Users className="size-4 text-slate-400" />{t.teams} / {t.maxTeams} parejas
                                </span>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => router.push(`/tournaments/${t.id}`)}>
                                        Ver bracket <ChevronRight className="size-3.5 ml-1" />
                                    </Button>
                                    <Button
                                        variant="ghost" size="icon"
                                        className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                                        onClick={() => setDeleteTournamentTarget(t)}
                                    >
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            <Dialog open={!!deleteTournamentTarget} onOpenChange={(v) => { if (!v) setDeleteTournamentTarget(null); }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 mb-3 mx-auto">
                            <Trash2 className="size-5 text-rose-600" />
                        </div>
                        <DialogTitle className="text-center">¿Eliminar torneo?</DialogTitle>
                        <DialogDescription className="text-center">
                            Se eliminará <strong>{deleteTournamentTarget?.name}</strong>. Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex gap-2 sm:gap-2 mt-2">
                        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteTournamentTarget(null)}>Cancelar</Button>
                        <Button variant="destructive" className="flex-1 rounded-full" onClick={() => deleteTournament(deleteTournamentTarget?.id)}>
                            Sí, eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}




export default function AdminPage() {
    const router = useRouter();
    const mounted = useMounted();
    const isAdmin = useIsAdmin();
    const [session, { logout }] = useSession();

    
    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
                <div className="animate-pulse text-slate-400 text-sm">Cargando…</div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
                <Card className="rounded-2xl border-slate-100 max-w-sm w-full text-center">
                    <CardContent className="py-12">
                        <Shield className="size-12 text-slate-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Acceso restringido</h2>
                        <p className="text-sm text-slate-500 mb-6">Debes iniciar sesión para acceder al panel de administración.</p>
                        <Button className="rounded-full bg-[#13ec5b] text-slate-900" onClick={() => router.push("/")}>
                            Ir al login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
                <Card className="rounded-2xl border-slate-100 max-w-sm w-full text-center">
                    <CardContent className="py-12">
                        <Shield className="size-12 text-rose-300 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Sin permisos de admin</h2>
                        <p className="text-sm text-slate-500 mb-6">Tu cuenta no tiene acceso al panel de administración.</p>
                        <Button variant="outline" className="rounded-full" onClick={() => router.push("/home")}>
                            Volver al dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] pb-20 font-sans">
            <div className="px-6 pt-6 pb-8 max-w-7xl mx-auto">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="size-5 text-purple-500" />
                            <span className="text-xs font-semibold uppercase tracking-widest text-purple-500">Admin Panel</span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel de Administración</h1>
                        <p className="text-slate-500 font-medium mt-1">Gestiona jugadores, liga y torneos de Elite padel.</p>
                    </div>
                </div>

                <Tabs defaultValue="players">
                    <TabsList className="mb-6 rounded-xl">
                        <TabsTrigger value="players" className="rounded-lg">
                            <Users className="size-4 mr-1.5" /> Jugadores
                        </TabsTrigger>
                        <TabsTrigger value="league" className="rounded-lg">
                            <BarChart3 className="size-4 mr-1.5" /> Liga
                        </TabsTrigger>
                        <TabsTrigger value="tournaments" className="rounded-lg">
                            <Trophy className="size-4 mr-1.5" /> Torneos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="players"><PlayersTab /></TabsContent>
                    <TabsContent value="league"><LeagueTab /></TabsContent>
                    <TabsContent value="tournaments"><TournamentsTab /></TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
