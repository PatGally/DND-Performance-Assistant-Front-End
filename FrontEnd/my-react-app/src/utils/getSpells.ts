// getSpells.ts

// =====================
// Spell progression tables
// =====================

const FULL = [0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,9,9];
const HALF = [0,0,1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5];
const THIRD = [0,0,0,1,1,1,2,2,2,3,3,3,3,4,4,4,4,4,4,4,4];
const WARLOCK = [0,1,1,2,2,3,3,4,4,5,5,5,5,5,5,5,5,5,5,5,5];

// =====================
// Class → progression mapping
// =====================

const MAX_SPELL_LEVEL: Record<string, number[]> = {
    WIZARD: FULL,
    CLERIC: FULL,
    DRUID: FULL,
    BARD: FULL,
    SORCERER: FULL,

    PALADIN: HALF,
    RANGER: HALF,

    ELDRITCH_KNIGHT: THIRD,
    ARCANE_TRICKSTER: THIRD,

    WARLOCK: WARLOCK,
};

// =====================
// Frontend spell list (stub data)
// =====================

const SPELLS_BY_CLASS: Record<string, { name: string; level: number }[]> = {
    WIZARD: [
        { name: 'Fire Bolt', level: 0 },
        { name: 'Mage Hand', level: 0 },
        { name: 'Magic Missile', level: 1 },
        { name: 'Shield', level: 1 },
        { name: 'Fireball', level: 3 },
    ],

    CLERIC: [
        { name: 'Guidance', level: 0 },
        { name: 'Cure Wounds', level: 1 },
        { name: 'Bless', level: 1 },
    ],

    DRUID: [{ name: 'Entangle', level: 1 }],
    BARD: [{ name: 'Healing Word', level: 1 }],
    SORCERER: [{ name: 'Chromatic Orb', level: 1 }],
    PALADIN: [{ name: 'Divine Favor', level: 1 }],
    RANGER: [{ name: 'Hunter’s Mark', level: 1 }],
    ELDRITCH_KNIGHT: [{ name: 'Shield', level: 1 }],
    ARCANE_TRICKSTER: [{ name: 'Disguise Self', level: 1 }],
    WARLOCK: [
        { name: 'Eldritch Blast', level: 0 },
        { name: 'Hex', level: 1 },
    ],
};

// =====================
// Main function (frontend guardrail)
// =====================

function getSpells(
    level: number,
    characterClass: string
): string[] {
    if (level < 1 || level > 20) return [];

    const normalizedClass = characterClass.toUpperCase();

    const progression = MAX_SPELL_LEVEL[normalizedClass];
    const spells = SPELLS_BY_CLASS[normalizedClass];

    if (!progression || !spells) return [];

    const maxSpellLevel = progression[level] ?? 0;

    return spells
        .filter(spell => spell.level <= maxSpellLevel)
        .map(spell => spell.name);
}

export default getSpells;
