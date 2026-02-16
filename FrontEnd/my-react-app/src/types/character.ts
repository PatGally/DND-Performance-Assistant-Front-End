export type CharacterStats = {
    name: string;
    cid: string;
    level: number;
    ac: number;
    hp: number;
    characterClass: string;
    position: [number, number];
    conImmunities: string[];
    activeStatusEffects: string[];
    activeConditions: string[];
    saveProfs: number[];
    damImmunes: string;
    damResists: string;
    damVulns: string;
    statArray: number[];
    spellSlots: number[];
};

export type CharacterPayload = {
    stats: CharacterStats;
    spells: string[];
    weapons: string[];
};