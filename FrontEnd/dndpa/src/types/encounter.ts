import type {InitiativeEntry} from "./SimulationTypes.ts";
import type {MonsterCreature, PlayerCreature} from "./creature.ts";

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

export interface EncounterFull {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    mapdata: any;
    initiative : InitiativeEntry[];
    players : PlayerCreature[];
    monsters: MonsterCreature[];
}

export interface EncounterWithPacket extends EncounterDash {
    packet?: EncounterPacket;
    mapLink?: string;
}