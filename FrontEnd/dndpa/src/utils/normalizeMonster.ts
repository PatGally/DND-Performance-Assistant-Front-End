import { fetchUUID } from "../api/UUIDGet.ts";

function getSizeFootprint(size: string): [number, number][] {
    const normalized = size?.trim().toLowerCase();

    let dim: number;
    switch (normalized) {
        case "large":      dim = 2; break;
        case "huge":       dim = 3; break;
        case "gargantuan": dim = 4; break;
        // tiny, small, medium — all 1×1
        default:           dim = 1; break;
    }

    const cells: [number, number][] = [];
    for (let row = 0; row < dim; row++) {
        for (let col = 0; col < dim; col++) {
            cells.push([row, col]);
        }
    }
    return cells;
}

export async function normalizeMonster(monster: any) {
    const cid = monster.cid ?? await fetchUUID();
    return {
        ...monster,
        cid,
        maxhp: monster.hp,
        position: monster.position ?? getSizeFootprint(monster.size),
    };
}
