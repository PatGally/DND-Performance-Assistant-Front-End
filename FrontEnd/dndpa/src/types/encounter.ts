export interface Player {
    name: string;
    level: number;
    characterClass: string;
    location?: string;
}
export interface PacketMonster {
    name: string;
    cr: number;
    size: string;
    location?: string;
}


export interface EncounterPacket {
    players: Player[];
    monsters: PacketMonster[];
}

export interface Encounter {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    maplink: string;
}

export interface EncounterWithPacket extends Encounter {
    packet?: EncounterPacket;
}