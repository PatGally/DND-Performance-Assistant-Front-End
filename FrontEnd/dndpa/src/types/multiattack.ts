import type { MonsterAction } from "./action.ts";
import type { RecommendationTarget } from "./SimulationTypes.ts";

export type MultiattackSplit = {
    name: string;
    number: number;
};

export type MultiattackSequenceItem = {
    index: number;
    name: string;
    action: MonsterAction;
    target?: string[];
    prob?: number;
    eDam?: number;
    impact?: number;
};

export type MultiattackDefinition = {
    name: string;
    total: number;
    split: MultiattackSplit[];
    sequence: MultiattackSequenceItem[];
};

export type MultiattackRecommendation = {
    definition: MultiattackDefinition;
    prob: number;
    eDam: number;
    impact: number;
    overallRank: number;
    baseWeight: number;
    mlWeight: number | null;
    finalWeight: number;
    candidateCount: number;
    target: RecommendationTarget;
};

export type MultiattackActionLike = {
    name: string;
    multiattack: MultiattackDefinition;
};

export function hasMultiattackDefinition(
    value: unknown
): value is { multiattack: MultiattackDefinition } {
    if (!value || typeof value !== "object") return false;

    const multiattack = (value as { multiattack?: unknown }).multiattack;
    if (!multiattack || typeof multiattack !== "object") return false;

    const candidate = multiattack as Partial<MultiattackDefinition>;
    return (
        typeof candidate.name === "string" &&
        Array.isArray(candidate.split) &&
        Array.isArray(candidate.sequence) &&
        candidate.sequence.length > 0
    );
}