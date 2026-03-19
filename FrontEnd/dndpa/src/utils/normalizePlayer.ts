export function normalizePlayer(character: any) {
    const s = character.stats;
    return {
        stats: {
            name: s.name,
            level: Number(s.level),
            position: [[0,0]],
            ac: Number(s.ac),
            hp: Number(s.hp),
            maxhp: Number(s.maxhp),
            characterClass: s.characterClass,
            spellSlots: (s.spellSlots ?? []).map((slot: any[]) =>
                slot.map((v) => Number(v))
            ),
            // Stats base model fields — coerce to int
            statArray: Object.fromEntries(
                Object.entries(s.statArray).map(([k, v]) => [k, Number(v)])
            ),
            saveProfs: Object.fromEntries(
                Object.entries(s.saveProfs).map(([k, v]) => [k, Number(v)])
            ),
        },
        spells: character.spells ?? [],
        weapons: character.weapons ?? [],
    };
}