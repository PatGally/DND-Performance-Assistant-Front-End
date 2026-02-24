export type CharacterStats = {
    name: string;
    level: string;
    ac: string;
    hp: string;
    maxhp: string;
    // cid: `${string}-${string}-${string}-${string}-${string}`;
    cid: string;
    position: number[];
    characterClass: string;
    conImmunities: any[];
    activeStatusEffects: any[];
    activeConditions: any[];
    saveProfs: {
        STR: string;
        DEX: string;
        CON: string;
        INT: string;
        WIS: string;
        CHA: string;
    };
    spellSlots: string[][];
    damImmunes: any[];
    damResists: any[];
    damVulns: any[];
    statArray: {
        STR: string;
        DEX: string;
        CON: string;
        INT: string;
        WIS: string;
        CHA: string;
    };
};

export type CharacterPayload = {
    stats: CharacterStats;
    spells: any[];
    weapons: {
        name: string;
        properties: {
            damage: string;
            damageType: string;
            weaponStat: any;
        };
    }[];
};