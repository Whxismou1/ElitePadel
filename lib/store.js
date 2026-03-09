"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";




export const MOCK_PLAYERS = [
    { id: "p1", username: "alex", fullname: "Alex Martín", email: "alex@elitepadel.app", role: "admin", league_players: { matches: 14, wins: 10, losses: 4 } },
];

export const MOCK_UPCOMING_MATCHES = [
    { id: "um1", type: "Liga", typeColor: "bg-purple-100 text-purple-600", team1: ["Alex Martín", "Sarah Johnson"], team2: ["Mike Thompson", "Luis Rodríguez"], date: "Hoy", time: "18:00", court: "Pista Central" },
    { id: "um2", type: "Amistoso", typeColor: "bg-blue-100 text-blue-600", team1: ["Helen García", "Pablo Ruiz"], team2: ["Ana López", "Carlos Pérez"], date: "Mañana", time: "20:00", court: "Pista 2" },
    { id: "um3", type: "Liga", typeColor: "bg-purple-100 text-purple-600", team1: ["Marta Fernández", "Jorge Sánchez"], team2: ["Alex Martín", "Luis Rodríguez"], date: "01 Mar", time: "17:30", court: "Pista 3" },
];

export const MOCK_PAST_MATCHES = [
    { id: "pm1", team1: ["Alex Martín", "Sarah Johnson"], team2: ["Mike Thompson", "Luis Rodríguez"], scores: ["6-4", "6-2"], winner: "team1", date: "Ayer, 14:00", court: "Pista Central", validation: { status: "confirmed" } },
    { id: "pm2", team1: ["Helen García", "Pablo Ruiz"], team2: ["Ana López", "Carlos Pérez"], scores: ["3-6", "6-7"], winner: "team2", date: "24 Feb, 09:00", court: "Pista 3", validation: { status: "confirmed" } },
    { id: "pm3", team1: ["Alex Martín", "Mike Thompson"], team2: ["Sarah Johnson", "Luis Rodríguez"], scores: ["6-3", "7-5"], winner: "team1", date: "22 Feb, 18:00", court: "Pista Central", validation: { status: "confirmed" } },
    { id: "pm4", team1: ["Marta Fernández", "Jorge Sánchez"], team2: ["Helen García", "Ana López"], scores: ["4-6", "6-4", "10-8"], winner: "team1", date: "20 Feb, 11:00", court: "Pista 2", validation: { status: "validating", proposedBy: "team1", lastEditedBy: "team1" } },
    { id: "pm5", team1: ["Carlos Pérez", "Pablo Ruiz"], team2: ["Jorge Sánchez", "Luis Rodríguez"], scores: ["7-5", "6-3"], winner: "team1", date: "18 Feb, 20:00", court: "Pista Central", validation: { status: "confirmed" } },
];

export const MOCK_TOURNAMENTS = [
    { id: "t1", name: "Winter Cup 2024", status: "Inscripción abierta", statusColor: "bg-emerald-100 text-emerald-700", startDate: "15 Dic 2024", endDate: "20 Ene 2025", teams: 12, maxTeams: 16 },
    { id: "t2", name: "Liga Elite Invierno", status: "En curso", statusColor: "bg-blue-100 text-blue-700", startDate: "1 Nov 2024", endDate: "28 Feb 2025", teams: 32, maxTeams: 32 },
    { id: "t3", name: "Spring Open 2025", status: "Próximamente", statusColor: "bg-amber-100 text-amber-700", startDate: "15 Mar 2025", endDate: "30 Mar 2025", teams: 0, maxTeams: 8 },
];

export const MOCK_LEAGUE = {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Liga Elite",
    startDate: "1 Nov 2024",
    endDate: "28 Feb 2025",
    isActive: true,
};




export function usePlayers(leagueId) {
    const [players, setPlayers] = useState([]);

    const fetchPlayers = useCallback(async () => {
        if (!leagueId) {
            setPlayers([]);
            return;
        }

        const supabase = getSupabase();

        const { data, error } = await supabase
            .from("profiles")
            .select(`
                id, username, fullname, email, role,
                league_players (
                    league_id, matches, wins, losses
                )
            `);

        if (error || !data) return;

        const leaguePlayers = data
            .map(p => {
                const lp = p.league_players?.find(stat => stat.league_id === leagueId);
                if (!lp) return null;
                return {
                    id: p.id,
                    username: p.username,
                    fullname: p.fullname,
                    email: p.email,
                    role: p.role,
                    matches: lp.matches ?? 0,
                    wins: lp.wins ?? 0,
                    losses: lp.losses ?? 0,
                };
            })
            .filter(Boolean)
            .sort((a, b) => b.wins - a.wins || b.matches - a.matches);

        setPlayers(leaguePlayers);
    }, [leagueId]);

    useEffect(() => {
        fetchPlayers();

        const supabase = getSupabase();

        const channel1 = supabase
            .channel("profiles-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchPlayers)
            .subscribe();

        const channel2 = supabase
            .channel("league-players-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "league_players" }, fetchPlayers)
            .subscribe();

        return () => {
            supabase.removeChannel(channel1);
            supabase.removeChannel(channel2);
        };
    }, [fetchPlayers]);

    const update = useCallback((updater) => {
        setPlayers((prev) => typeof updater === "function" ? updater(prev) : updater);
    }, []);

    return [players, update, fetchPlayers];
}

export function useAllGlobalPlayers() {
    const [players, setPlayers] = useState([]);

    const fetchPlayers = useCallback(async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("profiles")
            .select(`
                id, username, fullname, email, role,
                league_players (
                    leagues (id, name)
                )
            `)
            .order("fullname");

        if (error || !data) return;

        const globalPlayers = data.map(p => {
            const playerLeagues = p.league_players
                ?.map(lp => lp.leagues)
                ?.filter(Boolean) || [];

            return {
                id: p.id,
                username: p.username,
                fullname: p.fullname,
                email: p.email,
                role: p.role,
                leagues: playerLeagues
            };
        });

        setPlayers(globalPlayers);
    }, []);

    useEffect(() => {
        fetchPlayers();
        const supabase = getSupabase();

        const channel1 = supabase
            .channel("global-profiles-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchPlayers)
            .subscribe();

        const channel2 = supabase
            .channel("global-league-players-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "league_players" }, fetchPlayers)
            .subscribe();

        return () => {
            supabase.removeChannel(channel1);
            supabase.removeChannel(channel2);
        };
    }, [fetchPlayers]);

    return [players, fetchPlayers];
}




function rowToMatch(row) {
    return {
        id: row.id,
        type: row.type,
        typeColor: row.type_color,
        team1: row.team1_names ?? [],
        team2: row.team2_names ?? [],
        team1Ids: row.team1_ids ?? [],
        team2Ids: row.team2_ids ?? [],
        date: row.date,
        time: row.time,
        court: row.court,
        scores: row.scores ?? [],
        winner: row.winner ?? null,
        validation: row.validation ?? null,
        isPast: row.is_past,
    };
}

function useMatchesSlice(isPast, leagueId) {
    const [matches, setMatches] = useState([]);

    const fetchMatches = useCallback(async () => {
        if (!leagueId) {
            setMatches([]);
            return;
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("matches")
            .select("*")
            .eq("is_past", isPast)
            .eq("league_id", leagueId)
            .order("created_at", { ascending: false });
        if (error || !data) return;
        setMatches(data.map(rowToMatch));
    }, [isPast, leagueId]);

    useEffect(() => {
        fetchMatches();
        const supabase = getSupabase();
        const channel = supabase
            .channel(`matches-${isPast ? "past" : "upcoming"}`)
            .on("postgres_changes", { event: "*", schema: "public", table: "matches" }, fetchMatches)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchMatches, isPast]);

    const update = useCallback((updater) => {
        setMatches((prev) => typeof updater === "function" ? updater(prev) : updater);
    }, []);

    return [matches, update];
}

export function useUpcomingMatches() {
    const [league] = useLeague();
    return useMatchesSlice(false, league?.id);
}

export function usePastMatches() {
    const [league] = useLeague();
    return useMatchesSlice(true, league?.id);
}




function rowToTournament(row) {
    return {
        id: row.id,
        name: row.name,
        status: row.status,
        statusColor: row.status_color,
        startDate: row.start_date,
        endDate: row.end_date,
        teams: row.teams,
        maxTeams: row.max_teams,
    };
}

export function useTournaments() {
    const [tournaments, setTournaments] = useState([]);
    const [league] = useLeague();

    const fetchTournaments = useCallback(async () => {
        if (!league?.id) {
            setTournaments([]);
            return;
        }

        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("tournaments")
            .select("*")
            .eq("league_id", league.id)
            .order("created_at", { ascending: false });
        if (error || !data) return;
        setTournaments(data.map(rowToTournament));
    }, [league?.id]);

    useEffect(() => {
        fetchTournaments();
        const supabase = getSupabase();
        const channel = supabase
            .channel("tournaments-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "tournaments" }, fetchTournaments)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchTournaments]);

    const update = useCallback((updater) => {
        setTournaments((prev) => typeof updater === "function" ? updater(prev) : updater);
    }, []);

    return [tournaments, update, fetchTournaments];
}




function rowToLeague(row) {
    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        startDate: row.start_date,
        endDate: row.end_date,
        isActive: row.is_active,
    };
}

export function useLeague() {
    const [league, setLeague] = useState(MOCK_LEAGUE);
    const [mounted, setMounted] = useState(false);

    const fetchLeague = useCallback(async () => {
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from("leagues")
            .select("*")
            .eq("is_active", true)
            .limit(1)
            .maybeSingle();

        if (error) return;
        setLeague(rowToLeague(data));
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchLeague();
        const supabase = getSupabase();
        const channel = supabase
            .channel("league-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "leagues" }, fetchLeague)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchLeague]);

    const update = useCallback((updater) => {
        setLeague((prev) => typeof updater === "function" ? updater(prev) : updater);
    }, []);

    return [mounted ? (league || MOCK_LEAGUE) : MOCK_LEAGUE, update, fetchLeague];
}

export function useAllLeagues() {
    const [leagues, setLeagues] = useState([]);

    const fetchLeagues = useCallback(async () => {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from("leagues")
            .select("*")
            .order("created_at", { ascending: false });
        if (error || !data) return;
        setLeagues(data.map(rowToLeague));
    }, []);

    useEffect(() => {
        fetchLeagues();
        const supabase = getSupabase();
        const channel = supabase
            .channel("all-leagues-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "leagues" }, fetchLeagues)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchLeagues]);

    return [leagues, fetchLeagues];
}





export function useSession() {
    const [session, setSession] = useState(null);
    const [mounted, setMounted] = useState(false);

    const buildSession = useCallback(async (authSession) => {
        if (!authSession?.user) { setSession(null); return; }
        const supabase = getSupabase();
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, username, fullname")
            .eq("id", authSession.user.id)
            .single();
        setSession({
            userId: authSession.user.id,
            email: authSession.user.email,
            role: profile?.role ?? "player",
            username: profile?.username ?? authSession.user.email?.split("@")[0] ?? "",
            fullname: profile?.fullname ?? "",
        });
    }, []);

    useEffect(() => {
        const supabase = getSupabase();
        setMounted(true);
        supabase.auth.getSession().then(({ data }) => buildSession(data.session));
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
            buildSession(s);
        });
        return () => subscription.unsubscribe();
    }, [buildSession]);

    const login = useCallback(async (email, password) => {
        const supabase = getSupabase();
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { ok: false, error: error.message };
        return { ok: true };
    }, []);

    const logout = useCallback(async () => {
        const supabase = getSupabase();
        await supabase.auth.signOut();
        setSession(null);
    }, []);


    const actions = { login, logout };
    return (
        [mounted ? session : null, actions]
    );
}




export function useCurrentUser() {
    const [session] = useSession();
    const [league] = useLeague();
    const [players] = usePlayers(league?.id);

    if (!session) return MOCK_PLAYERS[0];
    const found = players.find((p) => p.id === session.userId);
    if (found) return found;
    return {
        id: session.userId,
        email: session.email,
        username: session.username ?? session.email?.split("@")[0] ?? "me",
        fullname: session.fullname ?? session.email ?? "Usuario",
        role: session.role ?? "player",
        matches: 0, wins: 0, losses: 0,
    };
}

export function useRanking() {
    const [league] = useLeague();
    const [players] = usePlayers(league?.id);
    return [...players]
        .sort((a, b) => b.wins - a.wins || b.matches - a.matches)
        .map((p, i) => ({ ...p, position: i + 1 }));
}

export function useIsAdmin() {
    const [session] = useSession();
    return session?.role === "admin";
}

export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
