"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Search, RefreshCw, X, Check, Eye, EyeOff, ChevronRight } from "lucide-react";
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
import { usePlayers, useLeague, useTournaments, useIsAdmin, useSession, useMounted, useCurrentUser, useAllLeagues, useAllGlobalPlayers } from "@/lib/store";
import { createPlayer, updatePlayer, deletePlayer as deletePlayerAction } from "@/app/actions/players";
import { deleteTournament as deleteTournamentAction } from "@/app/actions/tournaments";
import { updateLeague as updateLeagueAction, createLeague, setActiveLeague, deleteLeague as deleteLeagueAction, addPlayerToLeague, removePlayerFromLeague } from "@/app/actions/tournaments";
import CreateTournamentForm from "@/components/CreateTournamentForm";
import { Shield } from "lucide-react";
import { Users } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Trophy } from "lucide-react";
import { Calendar } from "lucide-react";

function initials(name) {
    return name.split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function generatePassword(length = 10) {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#";
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}


function PlayersTab() {
    const [players, refetchPlayers] = useAllGlobalPlayers();
    const currentUser = useCurrentUser();
    const [search, setSearch] = useState("");
    const [editTarget, setEditTarget] = useState(null);
    const [addOpen, setAddOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [actionError, setActionError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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
            (p.email ?? "").toLowerCase().includes(q)
        );
    }, [players, search]);

    const addPlayer = async () => {
        if (!form.fullname || !form.email || !form.password) return;
        setSaving(true); setActionError("");
        const res = await createPlayer(form);
        setSaving(false);
        if (!res.ok) { setActionError(res.error); return; }
        setAddOpen(false);
        refetchPlayers();
    };

    const saveEdit = async () => {
        if (!editTarget) return;
        setSaving(true); setActionError("");
        const res = await updatePlayer(editTarget);
        setSaving(false);
        if (!res.ok) { setActionError(res.error); return; }
        setEditTarget(null);
        refetchPlayers();
    };

    const handleDelete = async (id) => {
        setSaving(true); setActionError("");
        const res = await deletePlayerAction(id);
        setSaving(false);
        if (!res.ok) { setActionError(res.error); }
        setDeleteTarget(null);
        refetchPlayers();
    };

    const ROLES = ["admin", "player"];

    return (
        <div className="space-y-4">

            {actionError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-700">
                    <X className="size-4 shrink-0" />
                    <span>{actionError}</span>
                    <button className="ml-auto text-rose-400 hover:text-rose-600" onClick={() => setActionError("")}>✕</button>
                </div>
            )}
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
                                    <div className="relative flex-1">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={form.password}
                                            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                            className="font-mono text-sm pr-10"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            onClick={() => setShowPassword((v) => !v)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
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
                            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancelar</Button>
                            <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={addPlayer} disabled={saving}>
                                {saving ? "Creando…" : "Crear jugador"}
                            </Button>
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
                                <TableHead className="hidden md:table-cell">Ligas Participando</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((p) => {
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
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {p.leagues?.length > 0 ? p.leagues.map(l => (
                                                    <Badge key={l.id} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 font-normal px-1.5 py-0 h-5">
                                                        {l.name}
                                                    </Badge>
                                                )) : <span className="text-xs text-slate-400">Ninguna</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs border-0 ${p.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"}`}>
                                                {p.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">

                                                <Button
                                                    variant="ghost" size="icon" className="h-8 w-8"
                                                    onClick={() => setEditTarget({ ...p })}
                                                >
                                                    <Pencil className="size-3.5" />
                                                </Button>

                                                {currentUser?.id === p.id ? (
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


            <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar jugador</DialogTitle>
                    </DialogHeader>
                    {editTarget && (
                        <div className="space-y-3 mt-2">
                            {[
                                { label: "Nombre completo", key: "fullname" },
                                { label: "Username", key: "username" },
                            ].map(({ label, key }) => (
                                <div key={key} className="space-y-1">
                                    <label className="text-xs font-medium text-slate-600">{label}</label>
                                    <Input value={editTarget[key] ?? ""} onChange={(e) => setEditTarget((t) => ({ ...t, [key]: e.target.value }))} />
                                </div>
                            ))}
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Email</label>
                                <Input value={editTarget.email ?? ""} disabled className="opacity-60" title="El email se cambia desde Supabase Auth" />
                            </div>
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
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>Cancelar</Button>
                        <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={saveEdit} disabled={saving}>
                            {saving ? "Guardando…" : "Guardar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                        <Button variant="destructive" className="flex-1 rounded-full" disabled={saving} onClick={() => handleDelete(deleteTarget?.id)}>
                            {saving ? "Eliminando…" : "Sí, eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}




function LeagueTab() {

    const [activeLeague] = useLeague();
    const [allLeagues, refetchLeagues] = useAllLeagues();
    const [allPlayers, , refetchPlayers] = usePlayers();

    const [globalPlayers, setGlobalPlayers] = useState([]);

    useEffect(() => {
        const fetchAll = async () => {
            const { getSupabase } = await import("@/lib/supabase");
            const supabase = getSupabase();
            const { data } = await supabase.from("profiles").select("id, fullname, email").order("fullname");
            if (data) setGlobalPlayers(data);
        };
        fetchAll();
    }, []);

    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState({});
    const [saving, setSaving] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [createDraft, setCreateDraft] = useState({ name: "", startDate: "", endDate: "" });

    const [managePlayersOpen, setManagePlayersOpen] = useState(null);
    const [leaguePlayersDetails, setLeaguePlayersDetails] = useState([]);
    const [playerToAdd, setPlayerToAdd] = useState("");

    const [rankingOpen, setRankingOpen] = useState(null);
    const [leagueRanking, setLeagueRanking] = useState([]);

    const loadLeaguePlayers = async (leagueId) => {
        const { getSupabase } = await import("@/lib/supabase");
        const supabase = getSupabase();
        const { data } = await supabase.from("league_players")
            .select("profile_id, matches, wins, losses, profiles(fullname, email)")
            .eq("league_id", leagueId);
        if (data) setLeaguePlayersDetails(data);
    };

    const loadLeagueRanking = async (leagueId) => {
        const { getSupabase } = await import("@/lib/supabase");
        const supabase = getSupabase();
        const { data } = await supabase.from("league_players")
            .select("profile_id, matches, wins, losses, profiles(fullname, email)")
            .eq("league_id", leagueId)
            .order("wins", { ascending: false })
            .order("matches", { ascending: false });
        if (data) setLeagueRanking(data);
    };

    const openManagePlayers = (league) => {
        setManagePlayersOpen(league.id);
        loadLeaguePlayers(league.id);
    };

    const openRanking = (league) => {
        setRankingOpen(league.id);
        loadLeagueRanking(league.id);
    };

    const handleAddPlayerToLeague = async (leagueId) => {
        if (!playerToAdd) return;
        setSaving(true);
        await addPlayerToLeague(leagueId, playerToAdd);
        setPlayerToAdd("");
        await loadLeaguePlayers(leagueId);
        setSaving(false);
    };

    const handleRemovePlayerFromLeague = async (leagueId, profileId) => {
        setSaving(true);
        await removePlayerFromLeague(leagueId, profileId);
        await loadLeaguePlayers(leagueId);
        setSaving(false);
    };

    const openEdit = (league) => {
        setDraft({ ...league });
        setEditing(league.id);
    };

    const saveEdit = async () => {
        setSaving(true);
        await updateLeagueAction(draft);
        setSaving(false);
        setEditing(null);
        refetchLeagues();
    };

    const handleCreate = async () => {
        if (!createDraft.name) return;
        setSaving(true);
        await createLeague(createDraft);
        setSaving(false);
        setCreateOpen(false);
        refetchLeagues();
    };

    const handleSetActive = async (id) => {
        setSaving(true);
        await setActiveLeague(id);
        setSaving(false);
        refetchLeagues();
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Seguro que quieres eliminar esta liga? Se borrarán todos sus partidos asociados.")) return;
        setSaving(true);
        await deleteLeagueAction(id);
        setSaving(false);
        refetchLeagues();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Gestión de Ligas / Temporadas</h3>
                    <p className="text-sm text-slate-500">Crea o edita temporadas y elige cuál es la liga en curso.</p>
                </div>
                <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={() => { setCreateDraft({ name: "", startDate: "", endDate: "" }); setCreateOpen(true); }}>
                    <Plus className="size-4 mr-1" /> Nueva Liga
                </Button>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Añadir nueva liga</DialogTitle>
                        <DialogDescription>Crea una nueva temporada o edición.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Nombre de la liga</label>
                            <Input value={createDraft.name} onChange={(e) => setCreateDraft(d => ({ ...d, name: e.target.value }))} placeholder="Ej. Liga Verano 2025" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Fecha Inicio</label>
                                <Input value={createDraft.startDate} onChange={(e) => setCreateDraft(d => ({ ...d, startDate: e.target.value }))} placeholder="01 Jun 2025" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-600">Fecha Fin</label>
                                <Input value={createDraft.endDate} onChange={(e) => setCreateDraft(d => ({ ...d, endDate: e.target.value }))} placeholder="31 Ago 2025" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Cancelar</Button>
                        <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={handleCreate} disabled={saving || !createDraft.name}>
                            {saving ? "Creando…" : "Crear Liga"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {allLeagues.map((l) => (
                    <Card key={l.id} className={`rounded-2xl border-slate-100 ${l.isActive ? 'ring-2 ring-emerald-400' : ''}`}>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                    {l.name}
                                    {l.isActive && <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0 border-0">Activa</Badge>}
                                </CardTitle>
                                <CardDescription>{l.startDate || "Sin inicio"} – {l.endDate || "Sin fin"}</CardDescription>
                            </div>
                            <div className="flex gap-1">
                                {editing === l.id ? (
                                    <>
                                        <Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X className="size-4" /></Button>
                                        <Button size="icon" className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846] rounded-full" onClick={saveEdit} disabled={saving}><Check className="size-4" /></Button>
                                    </>
                                ) : (
                                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(l)}>
                                        <Pencil className="size-3.5 mr-1" /> Editar
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {editing === l.id ? (
                                <div className="space-y-3 pb-2 pt-1 border-t border-slate-100 mt-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-slate-600">Nombre</label>
                                        <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Inicio</label>
                                            <Input value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-slate-600">Fin</label>
                                            <Input value={draft.endDate} onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))} />
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="flex flex-wrap items-center gap-2 mt-2 pt-4 border-t border-slate-100">
                                <Button variant="outline" size="sm" className="text-slate-700 rounded-full" onClick={() => openRanking(l)}>
                                    <Trophy className="size-3.5 mr-1 text-amber-500" /> Clasificación
                                </Button>
                                <Button variant="outline" size="sm" className="text-slate-700 rounded-full" onClick={() => openManagePlayers(l)}>
                                    <Users className="size-3.5 mr-1" /> Jugadores
                                </Button>
                                {!l.isActive && (
                                    <Button variant="secondary" size="sm" className="bg-slate-100 hover:bg-slate-200 text-slate-700" onClick={() => handleSetActive(l.id)} disabled={saving}>
                                        <RefreshCw className="size-3 mr-1" /> Marcar como activa
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 ml-auto" onClick={() => handleDelete(l.id)} disabled={saving || l.isActive}>
                                    <Trash2 className="size-3.5 mr-1" /> Eliminar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>


            <Dialog open={!!managePlayersOpen} onOpenChange={(v) => { if (!v) setManagePlayersOpen(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Gestionar Jugadores</DialogTitle>
                        <DialogDescription>Añade o elimina jugadores de esta liga.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="flex gap-2">
                            <select
                                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={playerToAdd}
                                onChange={(e) => setPlayerToAdd(e.target.value)}
                            >
                                <option value="">Selecciona un jugador...</option>
                                {globalPlayers
                                    .filter(p => !leaguePlayersDetails.some(lp => lp.profile_id === p.id))
                                    .map(p => (
                                        <option key={p.id} value={p.id}>{p.fullname} ({p.email})</option>
                                    ))
                                }
                            </select>
                            <Button className="bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" disabled={!playerToAdd || saving} onClick={() => handleAddPlayerToLeague(managePlayersOpen)}>
                                Añadir
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            {leaguePlayersDetails.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-4">No hay jugadores en esta liga.</p>
                            ) : (
                                leaguePlayersDetails.map((lp) => (
                                    <div key={lp.profile_id} className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">{lp.profiles?.fullname}</p>
                                            <p className="text-xs text-slate-500 truncate">{lp.profiles?.email}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-100 shrink-0" onClick={() => handleRemovePlayerFromLeague(managePlayersOpen, lp.profile_id)} disabled={saving}>
                                            <Trash2 className="size-3.5" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>


            <Dialog open={!!rankingOpen} onOpenChange={(v) => { if (!v) setRankingOpen(null); }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Clasificación de Liga</DialogTitle>
                        <DialogDescription>Posiciones actuales de los jugadores en esta liga.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[400px] overflow-y-auto pr-2">
                        {leagueRanking.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">No hay jugadores registrados.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">Pos</TableHead>
                                        <TableHead>Jugador</TableHead>
                                        <TableHead className="text-center">PTS (Vic)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leagueRanking.map((lp, i) => (
                                        <TableRow key={lp.profile_id}>
                                            <TableCell className="font-semibold">{i + 1}</TableCell>
                                            <TableCell>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-900 truncate">{lp.profiles?.fullname}</p>
                                                    <p className="text-xs text-slate-500 truncate">{lp.profiles?.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-emerald-600">{lp.wins}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {allLeagues.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm">No hay ligas creadas.</div>
            )}
        </div>
    );
}




function TournamentsTab() {
    const router = useRouter();
    const [league] = useLeague();
    const [tournaments, , refetchTournaments] = useTournaments();
    const [players] = usePlayers(league?.id);
    const [deleteTournamentTarget, setDeleteTournamentTarget] = React.useState(null);
    const [createOpen, setCreateOpen] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [actionError, setActionError] = React.useState("");

    const handleDeleteTournament = async (id) => {
        setSaving(true); setActionError("");
        const res = await deleteTournamentAction(id);
        setSaving(false);
        if (!res.ok) { setActionError(res.error); }
        setDeleteTournamentTarget(null);
        refetchTournaments();
    };
    return (
        <div className="space-y-4">

            <CreateTournamentForm
                open={createOpen}
                onOpenChange={setCreateOpen}
                players={players}
                onSuccess={() => refetchTournaments()}
            />

            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{tournaments.length} torneo(s) registrados</p>
                <Button className="rounded-full bg-[#13ec5b] text-slate-900 hover:bg-[#0eb846]" onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4 mr-1" /> Crear torneo
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournaments.length === 0 ? (
                    <div className="col-span-full py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                        <Trophy className="size-10 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-sm font-medium text-slate-900">Sin torneos activos</h3>
                        <p className="text-xs text-slate-500 mt-1">Todavía no hay torneos creados para esta liga.</p>
                    </div>
                ) : (
                    tournaments.map((t) => (
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
                    ))
                )}
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
                        <Button variant="outline" className="flex-1 rounded-full" onClick={() => setDeleteTournamentTarget(null)} disabled={saving}>Cancelar</Button>
                        <Button variant="destructive" className="flex-1 rounded-full" disabled={saving} onClick={() => handleDeleteTournament(deleteTournamentTarget?.id)}>
                            {saving ? "Eliminando…" : "Sí, eliminar"}
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
    const [session] = useSession();
    const isAdmin = useIsAdmin();


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
                <div className="animate-pulse text-slate-400 text-sm">Cargando…</div>
            </div>
        );
    }

    if (session && !isAdmin) {
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
