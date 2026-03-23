export function normalizeMonster(monster: any) {
    return {
        ...monster,
        position: monster.position ?? [[0, 0]],
    };
}