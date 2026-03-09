

export interface Player {
    id: string;
    username: string;
    fullname: string;
    email: string;
    password?: string;
    role: "admin" | "player";
    matches: number;
    wins: number;
    losses: number;
}

export interface UpcomingMatch {
    id: string;
    type: string;
    typeColor: string;
    team1: string[];
    team2: string[];
    date: string;
    time: string;
    court: string;
}

export interface Validation {
    status: "validating" | "confirmed";
    proposedBy?: "team1" | "team2";
    lastEditedBy?: "team1" | "team2";
}

export interface PastMatch {
    id: string;
    team1: string[];
    team2: string[];
    scores: string[];
    winner?: "team1" | "team2" | null;
    date: string;
    court: string;
    validation?: Validation | null;
}

export interface Tournament {
    id: string;
    name: string;
    status: string;
    statusColor: string;
    startDate: string;
    endDate: string;
    teams: number;
    maxTeams: number;
}

export interface League {
    name: string;
    startDate: string;
    endDate: string;
    totalPlayers: number;
    matchesPlayed: number;
}

export interface SessionData {
    userId: string;
    email?: string;
    role: "admin" | "player";
    username?: string;
    fullname?: string;
}

export interface SessionActions {
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
}

export function usePlayers(): [Player[], (updater: Player[] | ((prev: Player[]) => Player[])) => void];
export function useUpcomingMatches(): [UpcomingMatch[], (updater: UpcomingMatch[] | ((prev: UpcomingMatch[]) => UpcomingMatch[])) => void];
export function usePastMatches(): [PastMatch[], (updater: PastMatch[] | ((prev: PastMatch[]) => PastMatch[])) => void];
export function useTournaments(): [Tournament[], (updater: Tournament[] | ((prev: Tournament[]) => Tournament[])) => void];
export function useLeague(): [League, (updater: League | ((prev: League) => League)) => void];

export function useSession(): [SessionData | null, SessionActions];
export function useCurrentUser(): Player;
export function useRanking(): (Player & { position: number })[];
export function useIsAdmin(): boolean;
export function useMounted(): boolean;

export function resetStore(): void;
export const MOCK_PLAYERS: Player[];
export const MOCK_UPCOMING_MATCHES: UpcomingMatch[];
export const MOCK_PAST_MATCHES: PastMatch[];
export const MOCK_TOURNAMENTS: Tournament[];
export const MOCK_LEAGUE: League;
