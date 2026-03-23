
import calcConMod from './calcConMod.ts';

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
    const conMod = calcConMod(constitution);

    const firstLevelHP = hitDie + conMod;
    const avgHitDie = Math.ceil((hitDie + 1) / 2);
    const additionalHP = (level - 1) * (avgHitDie + conMod);
    let HP = firstLevelHP + additionalHP //45 + 13

    return HP; //changed to return a number not a string
}

export default calculateHP;