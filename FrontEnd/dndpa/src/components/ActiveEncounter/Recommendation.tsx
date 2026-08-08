import {
    useEffect,
    useState,
    type Dispatch,
    type SetStateAction,
} from "react";
import { recommendationGet } from "../../api/ActionRecommend";
import type {
    Recommendation as RecommendationType,
    RecommendationAoeTarget,
    RecommendationTarget,
    AoeToken,
    Encounter,
} from "../../types/SimulationTypes.ts";
import type {
    MultiattackDefinition,
    MultiattackSequenceItem,
} from "../../types/multiattack.ts";
import { hasMultiattackDefinition } from "../../types/multiattack.ts";
import {
    getCreatureCid,
    getCreatureName,
    getCreatureNameByCid,
    getEncounterCreatures,
} from "../../utils/ActiveSimUtils/CreatureHelpers.ts";
import { normalizeGridCoords } from "../../utils/ActiveSimUtils/aoeHelpers.ts";
import '../../css/Recommendation.css';
import type {GridCoord} from "../../types/creature.ts";

type RecommendationProps = {
    eid: string;
    cid: string;
    encounter: Encounter;
    setAoeTokens: Dispatch<SetStateAction<AoeToken[]>>;
    buildRecommendationAoeToken: (
        recommendation: RecommendationType,
        previewResultID: string
    ) => AoeToken | null;
    onMovementRecommendationChange: (cells: GridCoord[]) => void;
    handlePASubmission: (
        name: string,
        prob: number,
        eDam: number,
        impact: number,
        overallRank : number,
        base_weight : number,
        ml_weight : number,
        useML : boolean,
        final_weight : number,
        candidateCount : number,
        targets: RecommendationTarget,
        previewResultID?: string,
        multiattack?: MultiattackDefinition,
        movementRecc?: GridCoord[]
    ) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeSequence(value: unknown): MultiattackSequenceItem[] {
    if (!Array.isArray(value)) return [];

    return value.filter((item): item is MultiattackSequenceItem => (
        isRecord(item) &&
        typeof item.name === "string" &&
        item.name.trim() !== "" &&
        isRecord(item.action)
    ));
}

function expandedSplitNames(split: unknown): string[] {
    if (!Array.isArray(split)) return [];

    return split.flatMap((item) => {
        if (!isRecord(item)) return [];

        const name = String(item.name ?? "").trim();
        const parsedCount = Number(item.number ?? 1);
        const count = Number.isFinite(parsedCount)
            ? Math.max(0, Math.trunc(parsedCount))
            : 1;

        return name ? Array.from({ length: count }, () => name) : [];
    });
}

function recommendationTargets(target: RecommendationTarget): string[] {
    if (Array.isArray(target)) {
        return target.filter((value): value is string => typeof value === "string");
    }

    return Array.isArray(target?.targetsHit)
        ? target.targetsHit.filter((value): value is string => typeof value === "string")
        : [];
}

function finiteNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function buildLocalMultiattackRecommendation(
    recommendations: RecommendationType[],
    encounter: Encounter,
    cid: string
): RecommendationType | undefined {
    const encounterCreatures = getEncounterCreatures(encounter);
    const actor = encounterCreatures.find(
        (creature) => getCreatureCid(creature) === cid
    );
    if (!actor || !isRecord(actor) || !isRecord(actor.multiattack)) {
        return undefined;
    }

    const definition = actor.multiattack;
    const expectedNames = expandedSplitNames(definition.split);
    if (expectedNames.length === 0) return undefined;

    const actorActions = Array.isArray(actor.actions)
        ? actor.actions.filter(isRecord)
        : [];
    const actionsByName = new Map<string, Record<string, unknown>>();
    for (const action of actorActions) {
        const name = String(action.name ?? "").trim().toLowerCase();
        if (name && !actionsByName.has(name)) actionsByName.set(name, action);
    }

    const recommendationsByName = new Map<string, RecommendationType>();
    for (const recommendation of recommendations) {
        const name = String(recommendation.name ?? "").trim().toLowerCase();
        if (name && !recommendationsByName.has(name)) {
            recommendationsByName.set(name, recommendation);
        }
    }

    const sequence = expectedNames.map((expectedName, index) => {
        const key = expectedName.toLowerCase();
        const action = actionsByName.get(key);
        const childRecommendation = recommendationsByName.get(key);
        if (!action || !childRecommendation) return undefined;

        return {
            index,
            name: String(action.name ?? expectedName),
            action: action as unknown as MultiattackSequenceItem["action"],
            target: recommendationTargets(childRecommendation.target).map(
                (targetCid) => getCreatureNameByCid(encounter, targetCid)
            ),
            prob: finiteNumber(childRecommendation.prob),
            eDam: finiteNumber(childRecommendation.eDam),
            impact: finiteNumber(childRecommendation.impact),
        } as MultiattackSequenceItem;
    });

    if (!sequence.every((item): item is MultiattackSequenceItem => Boolean(item))) {
        // Preserve the backend viability rule: every configured child must be
        // present on the stat block and viable before Multiattack is recommended.
        return undefined;
    }

    const probability = sequence.reduce(
        (sum, item) => sum + finiteNumber(item.prob),
        0
    ) / sequence.length;
    const expectedDamage = sequence.reduce(
        (sum, item) => sum + finiteNumber(item.eDam),
        0
    );
    const impact = sequence.reduce(
        (sum, item) => sum + finiteNumber(item.impact),
        0
    );
    const targetNames = Array.from(new Set(
        sequence.flatMap((item) =>
            Array.isArray(item.target)
                ? item.target.filter((value): value is string => typeof value === "string")
                : []
        )
    ));
    const targetCids = targetNames.map((targetName) => {
        const creature = encounterCreatures.find(
            (candidate) => getCreatureName(candidate).toLowerCase() === targetName.toLowerCase()
        );
        return creature ? getCreatureCid(creature) : targetName;
    });
    const name = String(definition.name ?? "Multiattack").trim() || "Multiattack";

    return {
        name,
        type: "Multiattack",
        prob: probability,
        eDam: expectedDamage,
        impact,
        target: targetCids,
        movementRecc: [],
        probDisplay: probability,
        probInit: probability,
        probParts: [],
        pareto: false,
        topsis: 0,
        overallRank: recommendations.length + 1,
        base_weight: 0,
        ml_weight: 0,
        useML: false,
        final_weight: 0,
        multiattack: {
            ...definition,
            name,
            total: expectedNames.length,
            split: Array.isArray(definition.split) ? definition.split : [],
            sequence,
        },
    } as unknown as RecommendationType;
}

function ensureMultiattackRecommendation(
    recommendations: RecommendationType[],
    encounter: Encounter,
    cid: string
): RecommendationType[] {
    const existingIndex = recommendations.findIndex(hasMultiattackDefinition);
    const localMultiattack = buildLocalMultiattackRecommendation(
        recommendations,
        encounter,
        cid
    );

    if (existingIndex < 0) {
        return localMultiattack
            ? [...recommendations, localMultiattack]
            : recommendations;
    }
    if (!localMultiattack) return recommendations;

    const existing = recommendations[existingIndex] as unknown as Record<string, unknown>;
    const existingDefinition = isRecord(existing.multiattack)
        ? existing.multiattack
        : {};
    const local = localMultiattack as unknown as Record<string, unknown>;
    const localDefinition = isRecord(local.multiattack) ? local.multiattack : {};
    const expectedCount = expandedSplitNames(
        existingDefinition.split ?? localDefinition.split
    ).length;
    const existingSequence = normalizeSequence(existingDefinition.sequence);
    const localSequence = normalizeSequence(localDefinition.sequence);

    if (
        (expectedCount > 0 && existingSequence.length === expectedCount) ||
        localSequence.length === 0
    ) return recommendations;

    const hydrated = {
        ...existing,
        type: "Multiattack",
        multiattack: {
            ...localDefinition,
            ...existingDefinition,
            sequence: localSequence,
        },
    } as unknown as RecommendationType;

    return recommendations.map((recommendation, index) =>
        index === existingIndex ? hydrated : recommendation
    );
}

function isAoeTarget(
    target: RecommendationTarget
): target is RecommendationAoeTarget {
    return (
        !Array.isArray(target) &&
        typeof target === "object" &&
        target !== null &&
        Array.isArray((target as RecommendationAoeTarget).targetsHit) &&
        Array.isArray((target as RecommendationAoeTarget).positioning)
    );
}

export default function Recommendation({
                                           eid,
                                           cid,
                                           encounter,
                                           setAoeTokens,
                                           buildRecommendationAoeToken,
                                           onMovementRecommendationChange,
                                           handlePASubmission,
                                       }: RecommendationProps) {
    const [recommendations, setRecommendations] = useState<RecommendationType[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const previewPrefix = `preview:recommendation:${cid}:`;

    const hasRecommendations = recommendations.length > 0;
    const isPassTurnView = hasRecommendations && currentIndex === recommendations.length;
    const currentRecommendation =
        hasRecommendations && !isPassTurnView
            ? recommendations[currentIndex]
            : undefined;

    const activePreviewResultID = currentRecommendation
        ? `${previewPrefix}${currentIndex}`
        : "";

    const canGoLeft = hasRecommendations && currentIndex > 0;
    const canGoRight = hasRecommendations && currentIndex < recommendations.length;
    const canAccept = !!currentRecommendation;
    const currentMultiattack = (() => {
        if (!currentRecommendation || !hasMultiattackDefinition(currentRecommendation)) {
            return undefined;
        }

        const recommendationRecord = currentRecommendation as unknown as Record<string, unknown>;
        const definition = currentRecommendation.multiattack;
        const sequence = normalizeSequence(definition.sequence);
        const fallbackSequence = normalizeSequence(recommendationRecord.sequence);

        return {
            ...definition,
            split: Array.isArray(definition.split) ? definition.split : [],
            sequence: sequence.length > 0 ? sequence : fallbackSequence,
        };
    })();
    const currentMultiattackSequence = currentMultiattack?.sequence ?? [];

    useEffect(() => {
        async function loadRecommendations() {
            try {
                setLoading(true);
                setError("");
                setCurrentIndex(0);

                const data = await recommendationGet(eid, cid);
                const serverRecommendations = Array.isArray(data) ? data : [];
                setRecommendations(
                    ensureMultiattackRecommendation(serverRecommendations, encounter, cid)
                );
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Failed to load recommendations.");
                }
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        }

        loadRecommendations();
    }, [eid, cid, encounter]);

    useEffect(() => {
        onMovementRecommendationChange(
            normalizeGridCoords(currentRecommendation?.movementRecc)
        );

        return () => onMovementRecommendationChange([]);
    }, [currentRecommendation, onMovementRecommendationChange]);

    useEffect(() => {
        const clearRecommendationPreviews = () => {
            setAoeTokens((prev) => {
                const filtered = prev.filter(
                    (token) => !token.resultID.startsWith(previewPrefix)
                );
                return filtered.length === prev.length ? prev : filtered;
            });
        };

        if (!currentRecommendation || !isAoeTarget(currentRecommendation.target)) {
            clearRecommendationPreviews();
            return;
        }

        const previewToken = buildRecommendationAoeToken(
            currentRecommendation,
            activePreviewResultID
        );

        if (!previewToken) {
            clearRecommendationPreviews();
            return;
        }

        setAoeTokens((prev) => {
            const withoutOldRecommendationPreviews = prev.filter(
                (token) => !token.resultID.startsWith(previewPrefix)
            );
            return [...withoutOldRecommendationPreviews, previewToken];
        });

        return () => {
            setAoeTokens((prev) => {
                const filtered = prev.filter(
                    (token) => token.resultID !== activePreviewResultID
                );
                return filtered.length === prev.length ? prev : filtered;
            });
        };
    }, [
        currentRecommendation,
        activePreviewResultID,
        buildRecommendationAoeToken,
        previewPrefix,
        setAoeTokens,
    ]);

    function handleBack() {
        if (!canGoLeft) return;
        setCurrentIndex((prev) => prev - 1);
    }

    function handleForward() {
        if (!canGoRight) return;
        setCurrentIndex((prev) => prev + 1);
    }

    function handleAccept() {
        if (!currentRecommendation) return;

        const movementRecc = normalizeGridCoords(
            currentRecommendation.movementRecc
        );

        handlePASubmission(
            currentRecommendation.name,
            currentRecommendation.prob,
            currentRecommendation.eDam,
            currentRecommendation.impact,
            currentRecommendation.overallRank,
            currentRecommendation.base_weight,
            currentRecommendation.ml_weight,
            currentRecommendation.useML === true &&
            currentRecommendation.ml_weight !== null &&
            currentRecommendation.ml_weight !== undefined,
            currentRecommendation.final_weight,
            recommendations.length,
            currentRecommendation.target,
            isAoeTarget(currentRecommendation.target) ? activePreviewResultID : undefined,
            currentMultiattack,
            movementRecc
        );
    }


    if (loading) {
        return <div className="pa-recommendation__status">Loading recommendations...</div>;
    }

    if (error) {
        return <div className="pa-recommendation__status pa-recommendation__status--error">Error: {error}</div>;
    }

    let targetDisplay = '';

    if (currentRecommendation) {
        try {
            targetDisplay = Array.isArray(currentRecommendation.target)
                ? currentRecommendation.target.length > 0
                    ? currentRecommendation.target
                        .map((targetCid) => getCreatureNameByCid(encounter, targetCid))
                        .join(', ')
                    : 'None'
                : currentRecommendation.target.targetsHit.length > 0
                    ? currentRecommendation.target.targetsHit
                        .map((targetCid) => getCreatureNameByCid(encounter, targetCid))
                        .join(', ')
                    : 'AOE placement';
        } catch (e) {
            console.error('Recommendation targetDisplay error', e);
            targetDisplay = 'None';
        }
    }

    return (
        <div className="pa-recommendation">
            <div className="pa-recommendation__body">
                <div className="pa-recommendation__name">
                    {currentRecommendation
                        ? currentRecommendation.name
                        : 'No Viable Actions - Pass Turn'}
                </div>

                <div className="pa-recommendation__target">
                    Target: {targetDisplay}
                </div>

                {currentMultiattack && (
                    <div className="pa-recommendation__target">
                        {currentMultiattackSequence.length > 0
                            ? `Sequence: ${currentMultiattackSequence
                                .map((item) => item.name)
                                .join(" → ")}`
                            : "Multiattack sequence unavailable. Refresh recommendations before accepting."}
                    </div>
                )}
            </div>

            <div className="pa-recommendation__actions">
                {canGoLeft && (
                    <button
                        type="button"
                        className="pa-recommendation__btn"
                        onClick={handleBack}
                        aria-label="Previous recommendation"
                    >
                        ◀
                    </button>
                )}

                {canAccept && (
                    <button
                        type="button"
                        className="pa-recommendation__btn pa-recommendation__btn--accept"
                        onClick={handleAccept}
                        aria-label="Accept recommendation"
                    >
                        ✓
                    </button>
                )}

                {canGoRight && (
                    <button
                        type="button"
                        className="pa-recommendation__btn"
                        onClick={handleForward}
                        aria-label="Next recommendation"
                    >
                        ▶
                    </button>
                )}
            </div>
        </div>
    );
}