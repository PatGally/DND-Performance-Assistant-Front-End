export function normalizePlayer(character: any) {
    return {
        ...character,
        position: character.position ?? [[0,0]]
    };
}