

function calcAttributes(level: number, characterClass: string) {
    const CharAttributeList: Record<string, Record<string, any>> = {
        Barbarian: { rageCharges: 0, isRaging: false },

        Bard: {
            bardicCharges: 0,
            bardicDieType: 0,
            magicalSecrets: []
        },
        Cleric: {
            turnUndeadCharges: 0,
            destroyUndeadCap: 0
        },
        Druid: {
            monster: [],
            wildShaped: false,
            wildShapeCharges: 0
        },
        Fighter: {
            secondWindCharges: 0,
            actionSurgeCharges: 0,
            extraAttackAmt: 0,
        },

        Paladin: { layOnHandsPool: 0 },

        Sorcerer: {
            sorceryPoints: level,
            chosenMetaMagics: []
        },
    };

    const attribute = CharAttributeList[characterClass];

    console.log("Massive test here",attribute);
    return {...attribute};

}

export default calcAttributes;