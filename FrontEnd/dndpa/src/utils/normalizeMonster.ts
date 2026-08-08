import { fetchUUID } from "../api/UUIDGet.ts";

function normalizeMultiattack(value: unknown) {
    if (typeof value !== "object" || value === null) return undefined;

    const record = value as Record<string, unknown>;
    if (!Array.isArray(record.split)) return undefined;

    const split = record.split.flatMap((item) => {
        if (typeof item !== "object" || item === null) return [];
        const entry = item as Record<string, unknown>;
        const name = String(entry.name ?? "").trim();
        const number = Math.trunc(Number(entry.number));
        return name && Number.isFinite(number) && number > 0
            ? [{ name, number }]
            : [];
    });
    if (split.length === 0) return undefined;

    return {
        name: String(record.name ?? "Multiattack").trim() || "Multiattack",
        total: split.reduce((sum, item) => sum + item.number, 0),
        split,
    };
}

function getSizeFootprint(size: string): [number, number][] {
    const normalized = size?.trim().toLowerCase();

    let dim: number;
    switch (normalized) {
        case "large":      dim = 2; break;
        case "huge":       dim = 3; break;
        case "gargantuan": dim = 4; break;
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
    const existingCid = typeof monster.cid === "string" ? monster.cid.trim() : "";
    const cid = existingCid || await fetchUUID();
    const multiattack = normalizeMultiattack(
        monster.multiattack ?? monster.multiAttack
    );
    return {
        ...monster,
        cid,
        maxhp: monster.hp,
        position: monster.position ?? getSizeFootprint(monster.size),
        ...(multiattack ? { multiattack } : {}),
    };
}