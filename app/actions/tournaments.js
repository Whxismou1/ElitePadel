"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function createTournament(t) {
    const admin = getSupabaseAdmin();
    let leagueId = t.leagueId;
    if (!leagueId) {
        const { data: activeLeague } = await admin.from("leagues").select("id").eq("is_active", true).single();
        if (activeLeague) leagueId = activeLeague.id;
    }

    const { error, data } = await admin.from("tournaments").insert({
        league_id: leagueId,
        name: t.name,
        status: t.status ?? "Próximamente",
        status_color: t.statusColor ?? "bg-amber-100 text-amber-700",
        start_date: t.startDate ?? "",
        end_date: t.endDate ?? "",
        teams: t.teams ?? 0,
        max_teams: t.maxTeams ?? 8,
    }).select("id").single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/tournaments");
    revalidatePath("/admin");
    return { ok: true, id: data.id };
}

export async function updateTournament({ id, name, status, statusColor, startDate, endDate, teams, maxTeams }) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("tournaments").update({
        name,
        status,
        status_color: statusColor,
        start_date: startDate,
        end_date: endDate,
        teams,
        max_teams: maxTeams,
    }).eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/tournaments");
    revalidatePath("/admin");
    return { ok: true };
}

export async function deleteTournament(id) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("tournaments").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/tournaments");
    revalidatePath("/admin");
    return { ok: true };
}

export async function createLeague({ name, startDate, endDate }) {
    const admin = getSupabaseAdmin();
    const { count } = await admin.from("leagues").select("id", { count: "exact", head: true });
    const isActive = count === 0;

    const { error } = await admin.from("leagues").insert({
        name,
        start_date: startDate,
        end_date: endDate,
        is_active: isActive,
    });

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
}

export async function updateLeague({ id, name, startDate, endDate }) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("leagues").update({
        name,
        start_date: startDate,
        end_date: endDate,
    }).eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
}

export async function setActiveLeague(id) {
    const admin = getSupabaseAdmin();
    await admin.from("leagues").update({ is_active: false }).neq("id", id);
    const { error } = await admin.from("leagues").update({ is_active: true }).eq("id", id);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    revalidatePath("/home");
    revalidatePath("/profile");
    revalidatePath("/matches");
    revalidatePath("/tournaments");
    revalidatePath("/players");
    return { ok: true };
}

export async function deleteLeague(id) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("leagues").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
}

export async function addPlayerToLeague(leagueId, profileId) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("league_players").insert({
        league_id: leagueId,
        profile_id: profileId,
        matches: 0,
        wins: 0,
        losses: 0,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
}

export async function removePlayerFromLeague(leagueId, profileId) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.from("league_players")
        .delete()
        .eq("league_id", leagueId)
        .eq("profile_id", profileId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin");
    return { ok: true };
}
