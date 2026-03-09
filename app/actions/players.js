"use server";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { sendWelcomeEmail } from "@/app/actions/email";


export async function createPlayer({ fullname, username, email, password, role, leagueId }) {
    const admin = getSupabaseAdmin();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, 
        user_metadata: { fullname, username, role },
    });

    if (authError) {
        return { ok: false, error: authError.message };
    }

    const userId = authData.user.id;
    const { error: profileError } = await admin
        .from("profiles")
        .update({ fullname, username, email, role })
        .eq("id", userId);

    if (profileError) {
        await admin.auth.admin.deleteUser(userId);
        return { ok: false, error: profileError.message };
    }
    let targetLeagueId = leagueId;
    if (!targetLeagueId) {
        const { data: activeLeague } = await admin.from("leagues").select("id").eq("is_active", true).single();
        if (activeLeague) targetLeagueId = activeLeague.id;
    }

    if (targetLeagueId) {
        await admin.from("league_players").insert({
            league_id: targetLeagueId,
            profile_id: userId,
            matches: 0,
            wins: 0,
            losses: 0,
        });
    }
    await sendWelcomeEmail({ fullname, email, password }).catch((e) =>
        console.error("[createPlayer] Email send failed:", e)
    );

    revalidatePath("/admin");
    return { ok: true, id: userId };
}


export async function updatePlayer({ id, fullname, username, role }) {
    const admin = getSupabaseAdmin();

    const { error } = await admin
        .from("profiles")
        .update({ fullname, username, role })
        .eq("id", id);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    return { ok: true };
}


export async function deletePlayer(id) {
    const admin = getSupabaseAdmin();
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return { ok: false, error: error.message };

    revalidatePath("/admin");
    return { ok: true };
}
