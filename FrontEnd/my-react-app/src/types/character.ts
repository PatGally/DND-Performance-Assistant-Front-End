// export type CharacterStats = {
//     name: string;
//     cid: string;
//     level: number;
//     ac: number;
//     hp: number;
//     characterClass: string;
//     position: [number, number];
//     conImmunities: string[];
//     activeStatusEffects: string[];
//     activeConditions: string[];
//     saveProfs: number[];
//     damImmunes: string;
//     damResists: string;
//     damVulns: string;
//     statArray: number[];
//     spellSlots: number[];
// };
//
// export type CharacterPayload = {
//     stats: CharacterStats;
//     spells: string[];
//     weapons: string[];
// };
// export type CharacterStats = {
//     name: string;
//     cid: string;
//     level: number;
//     ac: number;
//     hp: number;
//     maxhp: number;
//     position: [number, number] ;
//     characterClass: string;
//     conImmunities: string[];
//     activeStatusEffects: string[];
//     activeConditions: string[];
//     saveProfs: {
//         STR: number;
//         DEX: number;
//         CON: number;
//         INT: number;
//         WIS: number;
//         CHA: number;
//     };
//     damImmunes: string[];
//     damResists: string[];
//     damVulns: string[];
//     statArray: {
//         STR: number;
//         DEX: number;
//         CON: number;
//         INT: number;
//         WIS: number;
//         CHA: number;
//     };
//     spellSlots: [number, number][]; // Array of [current, max] slots per level
// };
//
// export type CharacterPayload = {
//     stats: CharacterStats;
//     spells: string[];
//     weapons: string[];
//     sorceryPoints: number;
//     chosenMetaMagics: string[];
// };

export type CharacterStats = {
    name: string;
    level: string;
    ac: string;
    hp: string;
    maxhp: string;
    cid: `${string}-${string}-${string}-${string}-${string}`;
    position: number[]; // loose array, not strict tuple
    characterClass: string;
    conImmunities: any[]; // allow empty or flexible content
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
    spellSlots: string[][]; // 2D array for [current,max] per level
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
    sorceryPoints: string;
    chosenMetaMagics: any[];
};