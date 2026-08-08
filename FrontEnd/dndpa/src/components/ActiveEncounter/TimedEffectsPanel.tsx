import type {
    ActiveCondition,
    ActiveStatusEffect,
    ResultID,
} from "../../types/creature.ts";
import type { EncounterResult } from "../../types/encounter.ts";
import { CleanActiveStatusData } from "../../utils/ActiveSimUtils/CleanActiveStatusData";

export type EffectRemovalKind = "condition" | "status-effect";

type TimedEffectsPanelProps = {
    cid: string;
    conditions?: Array<ActiveCondition | string>;
    statusEffects?: ActiveStatusEffect[];
    results?: EncounterResult[];
    busyKey?: string | null;
    onRemoveEffect: (
        kind: EffectRemovalKind,
        effectName: string
    ) => Promise<void>;
    onRemoveResult: (resultID: ResultID) => Promise<void>;
};

type DisplayEffect = {
    key: string;
    kind: EffectRemovalKind;
    name: string;
    description?: string;
    resultIDs: ResultID[];
};

function titleCase(value: string): string {
    return value
        .replace(/[_-]/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeResultIDs(value: unknown): ResultID[] {
    const raw = Array.isArray(value) ? value : value == null ? [] : [value];

    const normalized: ResultID[] = [];
    for (const entry of raw) {
        if (typeof entry !== "string" && typeof entry !== "number") continue;
        if (String(entry).trim() === "" || String(entry) === "-1") continue;
        if (!normalized.some((current) => String(current) === String(entry))) {
            normalized.push(entry);
        }
    }

    return normalized;
}

function parseConditionString(value: string): {
    name: string;
    resultIDs: ResultID[];
} {
    const conditionMatch = value.match(
        /['"]?(?:cond|name)['"]?\s*:\s*['"]([^'"]+)['"]/i
    );

    const resultMatch = value.match(
        /['"]?resultid['"]?\s*:\s*\[([^\]]*)\]/i
    );

    const resultIDs = resultMatch
        ? Array.from(
            resultMatch[1].matchAll(/['"]([^'"]+)['"]|(-?\d+(?:\.\d+)?)/g)
        ).map((match) => match[1] ?? Number(match[2]))
        : [];

    return {
        name: conditionMatch?.[1] ?? value,
        resultIDs: normalizeResultIDs(resultIDs),
    };
}

function conditionToDisplay(
    condition: ActiveCondition | string,
    index: number
): DisplayEffect {
    if (typeof condition === "string") {
        const parsed = parseConditionString(condition);
        return {
            key: `condition:${parsed.name}:${index}`,
            kind: "condition",
            name: parsed.name,
            resultIDs: parsed.resultIDs,
        };
    }

    const name = condition.cond ?? condition.name ?? "Unknown condition";
    return {
        key: `condition:${name}:${index}`,
        kind: "condition",
        name,
        resultIDs: normalizeResultIDs(
            condition.resultID ?? condition.resultid
        ),
    };
}

function statusToDisplay(
    status: ActiveStatusEffect,
    index: number
): DisplayEffect {
    type CleanStatusInput = NonNullable<
        Parameters<typeof CleanActiveStatusData>[0]
    >[number];

    const cleanableStatus = {
        ...status,
        effect: status.effect ?? {},
    } as CleanStatusInput;

    const cleaned = CleanActiveStatusData([cleanableStatus]);
    const cleanedEntry = cleaned[0];

    return {
        key: `status:${status.name ?? "unknown"}:${index}`,
        kind: "status-effect",
        name: status.name ?? cleanedEntry?.label ?? "Unknown status effect",
        description:
            cleanedEntry?.description ??
            (status.effect ? JSON.stringify(status.effect) : undefined),
        resultIDs: normalizeResultIDs(status.effect?.resultID),
    };
}

function getTimerText(
    result: EncounterResult | undefined,
    cid: string
): string | null {
    if (!result) return null;

    const turnCap = Number(result.turnCap);
    if (!Number.isFinite(turnCap) || turnCap <= 0) return null;

    let elapsed = 0;

    if (
        result.turnCounts &&
        typeof result.turnCounts === "object" &&
        !Array.isArray(result.turnCounts)
    ) {
        const perCreatureCount = Number(result.turnCounts[cid] ?? 0);
        elapsed = Number.isFinite(perCreatureCount) ? perCreatureCount : 0;
    } else {
        const legacyCount = Number(result.turnCount ?? 0);
        elapsed = Number.isFinite(legacyCount) ? legacyCount : 0;
    }

    const remaining = Math.max(turnCap - elapsed, 0);
    const noun = remaining === 1 ? "turn" : "turns";

    return `${remaining} ${noun} left`;
}

function EffectRow({
                       effect,
                       cid,
                       resultByID,
                       busyKey,
                       onRemoveEffect,
                       onRemoveResult,
                   }: {
    effect: DisplayEffect;
    cid: string;
    resultByID: Map<string, EncounterResult>;
    busyKey?: string | null;
    onRemoveEffect: TimedEffectsPanelProps["onRemoveEffect"];
    onRemoveResult: TimedEffectsPanelProps["onRemoveResult"];
}) {
    const removeEffectKey = `${effect.kind}:${effect.name}`;

    return (
        <div
            style={{
                border: "1px solid rgba(139, 26, 26, 0.35)",
                borderRadius: "3px",
                padding: "5px 7px",
                marginTop: "4px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "8px",
                    alignItems: "flex-start",
                }}
            >
                <div>
                    <strong>{titleCase(effect.name)}</strong>
                    {effect.description && (
                        <div style={{ fontSize: "11px", opacity: 0.85 }}>
                            {effect.description}
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    disabled={busyKey !== null && busyKey !== undefined}
                    onClick={() => void onRemoveEffect(effect.kind, effect.name)}
                    style={{
                        border: "1px solid #8b1a1a",
                        borderRadius: "3px",
                        background: "transparent",
                        color: "#8b1a1a",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "10px",
                        padding: "2px 5px",
                        whiteSpace: "nowrap",
                    }}
                >
                    {busyKey === removeEffectKey ? "Removing…" : "Remove only"}
                </button>
            </div>

            {effect.resultIDs.length > 0 && (
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "4px",
                        marginTop: "5px",
                    }}
                >
                    {effect.resultIDs.map((resultID, index) => {
                        const resultKey = String(resultID);
                        const timerText = getTimerText(resultByID.get(resultKey), cid);
                        const busyResultKey = `result:${resultKey}`;

                        return (
                            <span
                                key={`${effect.key}:${resultKey}:${index}`}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    border: "1px solid rgba(139, 26, 26, 0.25)",
                                    borderRadius: "999px",
                                    padding: "2px 5px",
                                    fontSize: "10px",
                                }}
                            >
                <span>
                  {timerText ??
                      (effect.resultIDs.length === 1
                          ? "Linked source"
                          : `Source ${index + 1}`)}
                </span>
                <button
                    type="button"
                    disabled={busyKey !== null && busyKey !== undefined}
                    onClick={() => void onRemoveResult(resultID)}
                    title="Remove every condition and status effect created by this action result"
                    style={{
                        border: "none",
                        background: "#8b1a1a",
                        color: "#fdf1dc",
                        borderRadius: "999px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "9px",
                        padding: "1px 5px",
                    }}
                >
                  {busyKey === busyResultKey
                      ? "Ending…"
                      : effect.resultIDs.length === 1
                          ? "End linked effects"
                          : "End source"}
                </button>
              </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function EffectGroup({
                         title,
                         effects,
                         ...rowProps
                     }: {
    title: string;
    effects: DisplayEffect[];
} & Omit<Parameters<typeof EffectRow>[0], "effect">) {
    return (
        <div style={{ marginTop: "4px" }}>
            <strong>{title}:</strong>
            {effects.length === 0 ? (
                <span> None</span>
            ) : (
                effects.map((effect) => (
                    <EffectRow key={effect.key} effect={effect} {...rowProps} />
                ))
            )}
        </div>
    );
}

export default function TimedEffectsPanel({
                                              cid,
                                              conditions = [],
                                              statusEffects = [],
                                              results = [],
                                              busyKey = null,
                                              onRemoveEffect,
                                              onRemoveResult,
                                          }: TimedEffectsPanelProps) {
    const conditionRows = conditions.map(conditionToDisplay);
    const statusRows = statusEffects.map(statusToDisplay);
    const resultByID = new Map(
        results
            .filter((result) => result?.resultID !== undefined)
            .map((result) => [String(result.resultID), result])
    );

    const sharedProps = {
        cid,
        resultByID,
        busyKey,
        onRemoveEffect,
        onRemoveResult,
    };

    return (
        <>
            <EffectGroup
                title="Active Conditions"
                effects={conditionRows}
                {...sharedProps}
            />
            <EffectGroup
                title="Active Status Effects"
                effects={statusRows}
                {...sharedProps}
            />
        </>
    );
}