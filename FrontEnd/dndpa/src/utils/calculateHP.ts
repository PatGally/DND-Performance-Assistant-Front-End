const hitDieList: Record<string, number> = {
    Barbarian: 12,
    Fighter: 10,
    Paladin: 10,
    Ranger: 10,
    Rogue: 8,
    Cleric: 8,
    Druid: 8,
    Monk: 8,
    Bard: 8,
    Sorcerer: 6,
    Wizard: 6,
    Warlock: 8
};

function calculateHP(level: number, characterClass: string, constitution: number): number {
    const hitDie = hitDieList[characterClass];
    const conMod = Math.floor((constitution - 10) / 2);

    const firstLevelHP = hitDie + conMod;
    const avgHitDie = Math.ceil((hitDie + 1) / 2);
    const additionalHP = (level - 1) * (avgHitDie + conMod);
    const hp = firstLevelHP + additionalHP //45 + 13

    return hp; //changed to return a number not a string
}

export default calculateHP;