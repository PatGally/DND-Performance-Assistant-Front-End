import type {InitiativeEntry} from "./SimulationTypes";
import type {MonsterCreature, PlayerCreature, ResultID} from "./creature";

interface PacketPlayer {
    name: string;
    level: number;
    characterClass: string;
    location?: string;
}
interface PacketMonster {
    name: string;
    cr: number;
    size: string;
    location?: string;
}

export interface EncounterPacket {
    players: PacketPlayer[];
    monsters: PacketMonster[];
}

export interface EncounterDash {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    mapdata: any;
}


export interface EncounterResult {
    resultID: ResultID;
    action?: string;
    actor?: string;
    targets?: string[];
    turnCount?: number;
    turnCap?: number;
    turnCounts?: Record<string, number>;
    expiredCreatures?: Record<string, boolean>;
    [key: string]: unknown;
}

export interface EncounterFull {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    mapdata: any;
    initiative : InitiativeEntry[];
    players : PlayerCreature[];
    monsters: MonsterCreature[];
    results?: EncounterResult[];
}

export interface EncounterWithPacket extends EncounterDash {
    packet?: EncounterPacket;
    mapLink?: string;
}