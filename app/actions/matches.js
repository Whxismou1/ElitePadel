"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";


export async function createMatch(match) {
    const admin = getSupabaseAdmin();

    let leagueId = match.leagueId;
    if (!leagueId) {
        const { data: activeLeague } = await admin.from("leagues").select("id").eq("is_active", true).single();
        if (activeLeague) leagueId = activeLeague.id;
    }

    const { error, data } = await admin.from("matches").insert({
        league_id: leagueId,
        type: match.type ?? "Liga",
        type_color: match.typeColor ?? "bg-purple-100 text-purple-600",
        team1_names: match.teamA,
        team2_names: match.teamB,
        team1_ids: match.teamAIds ?? [],
        team2_ids: match.teamBIds ?? [],
        date: match.date ?? "",
        time: match.time ?? "",
        court: match.court ?? "",
        scores: match.scores ?? [],
        validation: match.scores?.length
            ? { status: "validating", proposedBy: "team1", lastEditedBy: "team1" }
            : null,
        is_past: match.isPast ?? false,
    }).select("id").single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/matches");
    return { ok: true, id: data.id };
}


export async function proposeResult(matchId, scores, proposedBy) {
    const admin = getSupabaseAdmin();

    const { error } = await admin.from("matches").update({
        scores,
        is_past: true,
        validation: { status: "validating", proposedBy, lastEditedBy: proposedBy },
    }).eq("id", matchId);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/matches");
    return { ok: true };
}


export async function confirmResult(matchId) {
    const admin = getSupabaseAdmin();

    const { data: match, error: readError } = await admin
        .from("matches")
        .select("validation, team1_ids, team2_ids, scores, league_id")
        .eq("id", matchId)
        .single();

    if (readError) return { ok: false, error: readError.message };
    if (!match.league_id) return { ok: false, error: `El partido #${matchId} no tiene una liga asociada. Borra el partido y créalo de nuevo.` };

    // Guard: prevent double-counting if already confirmed
    if (match.validation?.status === "confirmed") {
        return { ok: true };
    }








    let team1Sets = 0;
    let team2Sets = 0;
    match.scores.forEach(score => {
        const [s1, s2] = score.split("-").map(Number);
        if (s1 > s2) team1Sets++;
        else if (s2 > s1) team2Sets++;
    });
    const winner = team1Sets > team2Sets ? "team1" : team2Sets > team1Sets ? "team2" : null;

    const { error } = await admin.from("matches").update({
        validation: { ...match.validation, status: "confirmed" },
        winner: winner,
    }).eq("id", matchId);

    if (error) return { ok: false, error: error.message };

    if (winner) {
        const winnerIds = winner === "team1" ? match.team1_ids : match.team2_ids;
        const loserIds = winner === "team1" ? match.team2_ids : match.team1_ids;


        const allIds = [...winnerIds, ...loserIds];
        const { data: stats } = await admin.from("league_players")
            .select("*")
            .eq("league_id", match.league_id)
            .in("profile_id", allIds);

        if (stats) {
            for (const stat of stats) {
                const isWinner = winnerIds.includes(stat.profile_id);
                await admin.from("league_players")
                    .update({
                        matches: stat.matches + 1,
                        wins: stat.wins + (isWinner ? 1 : 0),
                        losses: stat.losses + (isWinner ? 0 : 1),
                    })
                    .eq("league_id", match.league_id)
                    .eq("profile_id", stat.profile_id);
            }
        }
    }

    revalidatePath("/matches");
    return { ok: true };
}


export async function deleteMatch(matchId) {
    const admin = getSupabaseAdmin();

    
    const { data: match, error: readError } = await admin
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .single();

    if (readError) return { ok: false, error: readError.message };

    
    if (match.validation?.status === "confirmed" && match.winner && match.league_id) {
        const winnerIds = match.winner === "team1" ? match.team1_ids : match.team2_ids;
        const loserIds = match.winner === "team1" ? match.team2_ids : match.team1_ids;
        const allIds = [...winnerIds, ...loserIds];

        const { data: stats } = await admin.from("league_players")
            .select("*")
            .eq("league_id", match.league_id)
            .in("profile_id", allIds);

        if (stats) {
            for (const stat of stats) {
                const isWinner = winnerIds.includes(stat.profile_id);
                await admin.from("league_players")
                    .update({
                        matches: Math.max(0, stat.matches - 1),
                        wins: Math.max(0, stat.wins - (isWinner ? 1 : 0)),
                        losses: Math.max(0, stat.losses - (isWinner ? 0 : 1)),
                    })
                    .eq("league_id", match.league_id)
                    .eq("profile_id", stat.profile_id);
            }
        }
    }

    
    const { error } = await admin.from("matches").delete().eq("id", matchId);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/matches");
    revalidatePath("/home");
    return { ok: true };
}
