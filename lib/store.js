

"use client";

import { useState, useEffect, useCallback } from "react";





export const CURRENT_USER_ID = "p1";

export const MOCK_PLAYERS = [
    { id: "p1", username: "alex", fullname: "Alex Martín", email: "alex@elitepadel.app", password: "alex123", role: "admin", matches: 14, wins: 10, losses: 4 },
    { id: "p2", username: "sarah", fullname: "Sarah Johnson", email: "sarah@elitepadel.app", password: "sarah123", role: "player", matches: 12, wins: 8, losses: 4 },
    { id: "p3", username: "mike", fullname: "Mike Thompson", email: "mike@elitepadel.app", password: "mike123", role: "player", matches: 11, wins: 7, losses: 4 },
    { id: "p4", username: "luis", fullname: "Luis Rodríguez", email: "luis@elitepadel.app", password: "luis123", role: "player", matches: 9, wins: 5, losses: 4 },
    { id: "p5", username: "helen", fullname: "Helen García", email: "helen@elitepadel.app", password: "helen123", role: "player", matches: 8, wins: 4, losses: 4 },
    { id: "p6", username: "pablo", fullname: "Pablo Ruiz", email: "pablo@elitepadel.app", password: "pablo123", role: "player", matches: 7, wins: 4, losses: 3 },
    { id: "p7", username: "ana", fullname: "Ana López", email: "ana@elitepadel.app", password: "ana123", role: "player", matches: 6, wins: 3, losses: 3 },
    { id: "p8", username: "carlos", fullname: "Carlos Pérez", email: "carlos@elitepadel.app", password: "carlos123", role: "player", matches: 5, wins: 2, losses: 3 },
    { id: "p9", username: "marta", fullname: "Marta Fernández", email: "marta@elitepadel.app", password: "marta123", role: "player", matches: 4, wins: 2, losses: 2 },
    { id: "p10", username: "jorge", fullname: "Jorge Sánchez", email: "jorge@elitepadel.app", password: "jorge123", role: "player", matches: 3, wins: 1, losses: 2 },
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
    name: "Liga Elite Invierno 2024",
    startDate: "1 Nov 2024",
    endDate: "28 Feb 2025",
    totalPlayers: 10,
    matchesPlayed: 5,
};





export const STORE_KEYS = {
    players: "ep:players",
    upcomingMatches: "ep:upcoming_matches",
    pastMatches: "ep:past_matches",
    tournaments: "ep:tournaments",
    league: "ep:league",
    session: "ep:session",
};

const DEFAULTS = {
    players: MOCK_PLAYERS,
    upcomingMatches: MOCK_UPCOMING_MATCHES,
    pastMatches: MOCK_PAST_MATCHES,
    tournaments: MOCK_TOURNAMENTS,
    league: MOCK_LEAGUE,
    session: null,
};


const CHANGE_EVENT = "ep:store:change";

function readLS(key, fallback) {
    if (typeof window === "undefined") return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
}

function writeLS(key, value) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
        
        queueMicrotask(() => {
            window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }));
        });
    } catch { }
}

export function resetStore() {
    if (typeof window === "undefined") return;
    Object.entries(STORE_KEYS).forEach(([slice, key]) => {
        localStorage.setItem(key, JSON.stringify(DEFAULTS[slice]));
    });
    queueMicrotask(() => {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key: "*" } }));
    });
}

function useStoreSlice(key, fallback) {
    
    const [data, setData] = useState(fallback);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        
        setData(readLS(key, fallback));
        setMounted(true);
    }, []); 

    useEffect(() => {
        if (!mounted) return;

        const sync = (e) => {
            
            if (e.type === CHANGE_EVENT) {
                if (e.detail?.key === key || e.detail?.key === "*") {
                    setData(readLS(key, fallback));
                }
                return;
            }
            
            if (e.key === key || e.key === null) {
                setData(readLS(key, fallback));
            }
        };

        window.addEventListener(CHANGE_EVENT, sync);
        window.addEventListener("storage", sync);
        return () => {
            window.removeEventListener(CHANGE_EVENT, sync);
            window.removeEventListener("storage", sync);
        };
    }, [key, fallback, mounted]);

    const update = useCallback((updater) => {
        setData((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            writeLS(key, next);
            return next;
        });
    }, [key]);

    return [data, update];
}





export function usePlayers() { return useStoreSlice(STORE_KEYS.players, MOCK_PLAYERS); }
export function useUpcomingMatches() { return useStoreSlice(STORE_KEYS.upcomingMatches, MOCK_UPCOMING_MATCHES); }
export function usePastMatches() { return useStoreSlice(STORE_KEYS.pastMatches, MOCK_PAST_MATCHES); }
export function useTournaments() { return useStoreSlice(STORE_KEYS.tournaments, MOCK_TOURNAMENTS); }
export function useLeague() { return useStoreSlice(STORE_KEYS.league, MOCK_LEAGUE); }





function useSessionSlice() {
    return useStoreSlice(STORE_KEYS.session, null);
}

export function useSession() {
    const [session, setSession] = useSessionSlice();
    const [players] = usePlayers();

    const login = useCallback((email, password) => {
        const user = players.find(
            (p) => p.email.toLowerCase() === email.trim().toLowerCase() && p.password === password
        );
        if (!user) return { ok: false, error: "Email o contraseña incorrectos." };
        setSession({ userId: user.id, role: user.role });
        return { ok: true };
    }, [players, setSession]);

    const logout = useCallback(() => {
        setSession(null);
    }, [setSession]);

    return [session, { login, logout }];
}





export function useCurrentUser() {
    const [players] = usePlayers();
    const [session] = useSessionSlice();
    const targetId = session?.userId ?? CURRENT_USER_ID;
    return players.find((p) => p.id === targetId) ?? MOCK_PLAYERS[0];
}

export function useRanking() {
    const [players] = usePlayers();
    return [...players]
        .sort((a, b) => b.wins - a.wins || b.matches - a.matches)
        .map((p, i) => ({ ...p, position: i + 1 }));
}

export function useIsAdmin() {
    const [session] = useSessionSlice();
    const [players] = usePlayers();
    if (!session) return false;
    const user = players.find((p) => p.id === session.userId);
    return user?.role === "admin";
}


export function useMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
