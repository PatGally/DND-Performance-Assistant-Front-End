import { useEffect, useMemo, useState } from "react";

import creatureGet, { isPlayerCreature } from "../../api/CreatureGet";
import { getConditions } from "../../api/ConditionGet";
import { getStatusEffects } from "../../api/StatusEffectsGet";

import type {
    Creature,
} from "../../types/creature";

import type {
    InitiativeEntry,
    ManualAffectedCreature,
    ManualStatBlock,
} from "../../types/SimulationTypes";

import {
    BLOCKED_CONDITIONS,
    BLOCKED_STATUS_EFFECTS,
    DAMAGE_TYPES,
} from "../../types/ManualEntryTypes.ts";

import {
    creatureToBaseline,
    deepEqual,
    expandStatBlock,
    getBooleanValue,
    getNumberValue,
    getStatusEffectAttributes,
    getStatusEffectResultIDs,
    getStatusEffectRoll,
    isStatusEffectRecord,
    normalizeSpellSlots,
    normalizeValue,
} from "../../utils/ActiveSimUtils/ManualEntryHelpers.ts";

import type { StatusEffectRecord } from "../../types/ManualEntryTypes.ts";

import ComplexManualEntrySection from "./ComplexManualEntries/ComplexManualEntrySection.tsx";
import ComplexManualEntryNumberInputField from "./ComplexManualEntries/ComplexManualEntryNumberInputField";
import ComplexManualEntryCheckboxField from "./ComplexManualEntries/ComplexManualEntryCheckboxField";
import ComplexManualEntryStatBlockEditor from "./ComplexManualEntries/ComplexManualEntryStatBlockEditor.tsx";
import ComplexManualEntryMultiSelectSearch from "./ComplexManualEntries/ComplexManualEntryMultiSelectSearch";
import ComplexManualEntryStatusEffectEditor from "./ComplexManualEntries/ComplexManualEntryStatusEffectEditor";
import ComplexManualEntrySpellSlotsEditor from "./ComplexManualEntries/ComplexManualEntrySpellSlotsEditor";
import ComplexManualEntryCreatureSummary from "./ComplexManualEntries/ComplexManualEntryCreatureSummary";

export default function ComplexManualEntry({
                                               eid,
                                               cid,
                                               initiativeEntry,
                                               draftValue,
                                               onDraftChange,
                                               onToggle,
                                           }: {
    eid: string;
    cid: string;
    initiativeEntry: InitiativeEntry;
    onToggle?: () => void;
    draftValue?: ManualAffectedCreature;
    onDraftChange: (next: ManualAffectedCreature) => void;
}) {
    const [creature, setCreature] = useState<Creature | null>(null);
    const [conditions, setConditions] = useState<string[]>([]);
    const [statusEffects, setStatusEffects] = useState<string[]>([]);

    useEffect(() => {
        let isMounted = true;

        async function loadData() {
            try {
                const [c, conds, stats] = await Promise.all([
                    creatureGet(eid, cid),
                    getConditions(),
                    getStatusEffects(),
                ]);

                if (!isMounted) return;

                setCreature(c);
                setConditions(conds);
                setStatusEffects(stats);
            } catch (err) {
                console.error(err);
            }
        }

        loadData();

        return () => {
            isMounted = false;
        };
    }, [eid, cid]);

    const filteredConditions = useMemo(() => {
        return conditions.filter(
            (condition) => !BLOCKED_CONDITIONS.has(normalizeValue(condition))
        );
    }, [conditions]);

    const filteredStatusEffects = useMemo(() => {
        return statusEffects.filter(
            (effect) => !BLOCKED_STATUS_EFFECTS.has(normalizeValue(effect))
        );
    }, [statusEffects]);

    const baseline = useMemo(
        () => (creature ? creatureToBaseline(creature, cid) : undefined),
        [creature, cid]
    );

    function update(
        key: keyof ManualAffectedCreature,
        val: unknown,
        base: unknown
    ) {
        const next = {
            ...(draftValue ?? { cid }),
            cid,
        } as Record<string, unknown>;

        if (deepEqual(val, base)) {
            delete next[key];
        } else {
            next[key] = val;
        }

        onDraftChange(next as ManualAffectedCreature);
    }

    function val(key: keyof ManualAffectedCreature) {
        return draftValue?.[key] ?? baseline?.[key];
    }

    function getMonsterSpellSlots(sourceCreature: Creature) {
        if (isPlayerCreature(sourceCreature)) {
            return undefined;
        }

        const monster = sourceCreature as Record<string, unknown>;
        const spellInfo =
            monster.spellInfo && typeof monster.spellInfo === "object"
                ? (monster.spellInfo as Record<string, unknown>)
                : undefined;

        return (
            monster.spellSlots ??
            spellInfo?.spellSlots ??
            spellInfo?.slots
        );
    }

    if (!creature || !baseline) {
        return <div>Loading...</div>;
    }

    const currentStatusEffects = Array.isArray(val("activeStatusEffects"))
        ? (val("activeStatusEffects") as unknown[]).filter(isStatusEffectRecord)
        : [];

    const normalizedCurrentStatusEffects: StatusEffectRecord[] = currentStatusEffects.map((record) => {
        const recordObj = record as Record<string, unknown>;

        return {
            name: String((record as { name: unknown }).name),
            effect: {
                roll: getStatusEffectRoll(recordObj),
                attribute: getStatusEffectAttributes(recordObj),
                resultID: getStatusEffectResultIDs(recordObj),
            },
        };
    });

    const baselineHp = getNumberValue(baseline.hp, 0);
    const baselineAc = getNumberValue(baseline.ac, 0);
    const baselineLResists = getNumberValue(baseline.lResists, 0);
    const baselineEnemy = getBooleanValue(baseline.enemy, false);

    const currentHp = getNumberValue(val("hp"), baselineHp);
    const currentAc = getNumberValue(val("ac"), baselineAc);
    const currentLResists = getNumberValue(val("lResists"), baselineLResists);
    const currentEnemy = getBooleanValue(val("enemy"), baselineEnemy);

    const baselineStatArray = expandStatBlock(baseline.statArray);
    const currentStatArray = expandStatBlock(
        val("statArray") as ManualStatBlock | undefined
    );

    const baselineSaveProfs = expandStatBlock(baseline.saveProfs);
    const currentSaveProfs = expandStatBlock(
        val("saveProfs") as ManualStatBlock | undefined
    );

    const monsterSpellSlots = getMonsterSpellSlots(creature);

    const currentSpellSlots = normalizeSpellSlots(
        val("spellSlots") ?? monsterSpellSlots
    );

    const baselineSpellSlots = normalizeSpellSlots(
        baseline.spellSlots ?? monsterSpellSlots
    );

    const monsterHasSpellSlots =
        !isPlayerCreature(creature) &&
        (Object.keys(baselineSpellSlots).length > 0 ||
            Object.keys(currentSpellSlots).length > 0);

    const showSpellSlotEditor =
        isPlayerCreature(creature) || monsterHasSpellSlots;

    return (
        <div style={{ border: "1px solid #ccc", padding: 10 }}>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 12,
                }}
            >
                <strong>{initiativeEntry.name}</strong>

                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        style={{ cursor: "pointer" }}
                    >
                        Close
                    </button>
                )}
            </div>

            <ComplexManualEntryCreatureSummary creature={creature} />

            <ComplexManualEntrySection title="Core">
                <ComplexManualEntryNumberInputField
                    label="HP"
                    value={currentHp}
                    onChange={(next) => update("hp", next, baselineHp)}
                />

                <ComplexManualEntryNumberInputField
                    label="AC"
                    value={currentAc}
                    onChange={(next) => update("ac", next, baselineAc)}
                />

                <ComplexManualEntryNumberInputField
                    label="Legendary Resists"
                    value={currentLResists}
                    onChange={(next) => update("lResists", next, baselineLResists)}
                />

                <ComplexManualEntryCheckboxField
                    label="Switch Side"
                    checked={currentEnemy}
                    onChange={(next) => update("enemy", next, baselineEnemy)}
                />
            </ComplexManualEntrySection>

            <ComplexManualEntryStatBlockEditor
                title="Stat Array"
                value={currentStatArray}
                onChange={(next) => update("statArray", next, baselineStatArray)}
            />

            <ComplexManualEntryStatBlockEditor
                title="Save Proficiencies"
                value={currentSaveProfs}
                onChange={(next) => update("saveProfs", next, baselineSaveProfs)}
            />

            {showSpellSlotEditor && (
                <ComplexManualEntrySpellSlotsEditor
                    value={currentSpellSlots}
                    maxSlots={baselineSpellSlots}
                    onChange={(next) =>
                        update(
                            "spellSlots",
                            next as ManualAffectedCreature["spellSlots"],
                            baselineSpellSlots
                        )
                    }
                />
            )}

            <ComplexManualEntryMultiSelectSearch
                label="Condition Immunities"
                options={filteredConditions}
                value={val("conImmunes") as string[]}
                onChange={(v) => update("conImmunes", v, baseline.conImmunes)}
            />

            <ComplexManualEntryMultiSelectSearch
                label="Active Conditions"
                options={filteredConditions}
                value={val("activeConditions") as string[]}
                onChange={(v) => update("activeConditions", v, baseline.activeConditions)}
            />

            <ComplexManualEntryStatusEffectEditor
                options={filteredStatusEffects}
                value={normalizedCurrentStatusEffects}
                onChange={(next) =>
                    update("activeStatusEffects", next, baseline.activeStatusEffects)
                }
            />

            <ComplexManualEntryMultiSelectSearch
                label="Damage Resistances"
                options={[...DAMAGE_TYPES]}
                value={val("damResists") as string[]}
                onChange={(v) => update("damResists", v, baseline.damResists)}
            />

            <ComplexManualEntryMultiSelectSearch
                label="Damage Immunities"
                options={[...DAMAGE_TYPES]}
                value={val("damImmunes") as string[]}
                onChange={(v) => update("damImmunes", v, baseline.damImmunes)}
            />

            <ComplexManualEntryMultiSelectSearch
                label="Damage Vulnerabilities"
                options={[...DAMAGE_TYPES]}
                value={val("damVulns") as string[]}
                onChange={(v) => update("damVulns", v, baseline.damVulns)}
            />
        </div>
    );
}