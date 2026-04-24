import { useEffect, useMemo, useState } from "react";

import creatureGet, { isPlayerCreature } from "../../api/CreatureGet";
import { getConditions } from "../../api/ConditionGet";
import { getStatusEffects } from "../../api/StatusEffectsGet";
import "../../css/ManualEntry.css";

import type {
    Creature,
    MonsterCreature,
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

type MonsterSpellCharge = string | number | null | undefined;

type MonsterSpellInfoSpell = {
    name: string;
    charges?: MonsterSpellCharge;
    [key: string]: unknown;
};

type MonsterSpellInfoDraft = {
    type?: string;
    DC?: number;
    attackRoll?: number;
    spells?: MonsterSpellInfoSpell[];
    spellSlots?: Array<[number, number]> | number[][];
    slots?: Array<[number, number]> | number[][];
    [key: string]: unknown;
};

type NatSpellChargeDraft = {
    name: string;
    charges: string;
};

type ManualAffectedCreatureWithCharges = ManualAffectedCreature & {
    charges?: NatSpellChargeDraft[];
};

type ManualDraftKey = keyof ManualAffectedCreatureWithCharges;

type MonsterChargeSpellEntry = MonsterSpellInfoSpell & {
    spellIndex: number;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getMonsterSpellInfo(sourceCreature: Creature): MonsterSpellInfoDraft | undefined {
    if (isPlayerCreature(sourceCreature)) {
        return undefined;
    }

    const monster = sourceCreature as MonsterCreature;

    if (!isObjectRecord(monster.spellInfo) || Object.keys(monster.spellInfo).length === 0) {
        return undefined;
    }

    return monster.spellInfo as MonsterSpellInfoDraft;
}

function getMonsterSpellSlots(sourceCreature: Creature) {
    if (isPlayerCreature(sourceCreature)) {
        return undefined;
    }

    const monster = sourceCreature as MonsterCreature & {
        spellSlots?: Array<[number, number]> | number[][];
    };

    const spellInfo = getMonsterSpellInfo(sourceCreature);

    return (
        monster.spellSlots ??
        spellInfo?.spellSlots ??
        spellInfo?.slots
    );
}

function normalizeChargeValue(value: MonsterSpellCharge): string {
    if (value === null || value === undefined) return "";
    return String(value).trim();
}

function isAtWillCharge(value: MonsterSpellCharge): boolean {
    return normalizeChargeValue(value).toLowerCase() === "at will";
}

function getMonsterChargeSpellEntries(
    spellInfo: MonsterSpellInfoDraft | undefined
): MonsterChargeSpellEntry[] {
    if (!spellInfo || !Array.isArray(spellInfo.spells)) {
        return [];
    }

    return spellInfo.spells
        .map((spell, spellIndex) => ({
            ...spell,
            spellIndex,
        }))
        .filter((spell) => spell.charges !== undefined && spell.charges !== null);
}

function getSpellChargeByIndex(
    spellInfo: MonsterSpellInfoDraft | undefined,
    spellIndex: number
): string {
    if (!spellInfo || !Array.isArray(spellInfo.spells)) {
        return "";
    }

    return normalizeChargeValue(spellInfo.spells[spellIndex]?.charges);
}

function getNumericChargeFallback(value: MonsterSpellCharge): string {
    const normalized = normalizeChargeValue(value);

    if (!normalized || isAtWillCharge(normalized)) {
        return "0";
    }

    return normalized.replace(/[^\d]/g, "") || "0";
}

function spellInfoToCharges(
    spellInfo: MonsterSpellInfoDraft | undefined
): NatSpellChargeDraft[] {
    return getMonsterChargeSpellEntries(spellInfo).map((spell) => ({
        name: spell.name,
        charges: normalizeChargeValue(spell.charges),
    }));
}

function applyChargesToSpellInfo(
    spellInfo: MonsterSpellInfoDraft | undefined,
    charges: NatSpellChargeDraft[] | undefined
): MonsterSpellInfoDraft | undefined {
    if (!spellInfo || !Array.isArray(spellInfo.spells) || !charges) {
        return spellInfo;
    }

    const chargeLookup = new Map(
        charges.map((spell) => [spell.name, spell.charges])
    );

    return {
        ...spellInfo,
        spells: spellInfo.spells.map((spell) => {
            const nextCharge = chargeLookup.get(spell.name);

            if (nextCharge === undefined) {
                return spell;
            }

            return {
                ...spell,
                charges: nextCharge,
            };
        }),
    };
}

function ComplexManualEntryMonsterChargesEditor({
    currentSpellInfo,
    baselineSpellInfo,
    onChargeChange,
}: {
    currentSpellInfo: MonsterSpellInfoDraft;
    baselineSpellInfo: MonsterSpellInfoDraft;
    onChargeChange: (spellIndex: number, nextCharge: string) => void;
}) {
    const chargeSpells = getMonsterChargeSpellEntries(currentSpellInfo);

    if (chargeSpells.length === 0) {
        return null;
    }

    return (
        <ComplexManualEntrySection title="Spell Charges">
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    width: "100%",
                    maxWidth: "100%",
                    minWidth: 0,
                    overflow: "hidden",
                    boxSizing: "border-box",
                }}
            >
                {chargeSpells.map((spell) => {
                    const baselineCharge = getSpellChargeByIndex(
                        baselineSpellInfo,
                        spell.spellIndex
                    );

                    const currentCharge = getSpellChargeByIndex(
                        currentSpellInfo,
                        spell.spellIndex
                    );

                    const atWillChecked = isAtWillCharge(currentCharge);
                    const chargeChanged = !deepEqual(currentCharge, baselineCharge);

                    const inputValue =
                        chargeChanged && !atWillChecked
                            ? currentCharge
                            : "";

                    const inputPlaceholder =
                        atWillChecked
                            ? "At Will"
                            : currentCharge || baselineCharge || "0";

                    return (
                        <div
                            key={`${spell.name}-${spell.spellIndex}`}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0, 1fr) max-content 52px",
                                alignItems: "center",
                                columnGap: "6px",
                                width: "100%",
                                maxWidth: "100%",
                                minWidth: 0,
                                boxSizing: "border-box",
                                overflow: "hidden",
                            }}
                        >
                            <span
                                title={spell.name}
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    minWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {spell.name}
                            </span>

                            <label
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    whiteSpace: "nowrap",
                                    fontSize: "11px",
                                    minWidth: "fit-content",
                                }}
                            >
                                At Will
                                <input
                                    type="checkbox"
                                    checked={atWillChecked}
                                    onChange={(event) => {
                                        const nextCharge = event.target.checked
                                            ? "At Will"
                                            : getNumericChargeFallback(baselineCharge);

                                        onChargeChange(spell.spellIndex, nextCharge);
                                    }}
                                    style={{
                                        width: "13px",
                                        height: "13px",
                                        margin: 0,
                                    }}
                                />
                            </label>

                            <input
                                type="text"
                                inputMode="numeric"
                                disabled={atWillChecked}
                                value={inputValue}
                                placeholder={inputPlaceholder}
                                onChange={(event) => {
                                    const numericValue = event.target.value.replace(/[^\d]/g, "");
                                    const nextCharge =
                                        numericValue === ""
                                            ? getNumericChargeFallback(baselineCharge)
                                            : numericValue;

                                    onChargeChange(spell.spellIndex, nextCharge);
                                }}
                                style={{
                                    width: "52px",
                                    minWidth: 0,
                                    maxWidth: "52px",
                                    boxSizing: "border-box",
                                    padding: "3px 4px",
                                    borderRadius: "4px",
                                    border: "1px solid #8b1a1a",
                                    backgroundColor: atWillChecked ? "#ead8bd" : "#fff8ea",
                                    color: "#3b1a1a",
                                    fontSize: "11px",
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </ComplexManualEntrySection>
    );
}

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
        key: ManualDraftKey,
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

    if (!creature || !baseline) {
        return <div className="manual-entry-loading">Loading...</div>;
    }

    const draftWithCharges = draftValue as ManualAffectedCreatureWithCharges | undefined;

    const baselineMonsterSpellInfo = getMonsterSpellInfo(creature);
    const baselineMonsterCharges = spellInfoToCharges(baselineMonsterSpellInfo);

    const currentMonsterSpellInfo = applyChargesToSpellInfo(
        baselineMonsterSpellInfo,
        draftWithCharges?.charges
    );

    const monsterHasCharges =
        !isPlayerCreature(creature) &&
        getMonsterChargeSpellEntries(currentMonsterSpellInfo).length > 0;

    function updateMonsterSpellCharge(spellIndex: number, nextCharge: string) {
        if (!currentMonsterSpellInfo || !Array.isArray(currentMonsterSpellInfo.spells)) {
            return;
        }

        const nextCharges = getMonsterChargeSpellEntries(currentMonsterSpellInfo).map((spell) => ({
            name: spell.name,
            charges:
                spell.spellIndex === spellIndex
                    ? nextCharge
                    : normalizeChargeValue(spell.charges),
        }));

        update("charges", nextCharges, baselineMonsterCharges);
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
        !monsterHasCharges &&
        (Object.keys(baselineSpellSlots).length > 0 ||
            Object.keys(currentSpellSlots).length > 0);

    const showSpellSlotEditor =
        isPlayerCreature(creature) || monsterHasSpellSlots;

    const showMonsterChargesEditor =
        !isPlayerCreature(creature) &&
        monsterHasCharges &&
        currentMonsterSpellInfo !== undefined &&
        baselineMonsterSpellInfo !== undefined;

    return (
        <div className="manual-entry-wrap">
            <div className="manual-entry-header">
                <span className="manual-entry-title">{initiativeEntry.name}</span>
                {onToggle && (
                    <button
                        type="button"
                        onClick={onToggle}
                        className="manual-entry-btn manual-entry-btn-small"
                    >
                        Close
                    </button>
                )}
            </div>

            <hr className="manual-entry-red-rule" />

            <ComplexManualEntryCreatureSummary creature={creature} />

            <hr className="manual-entry-thin-rule" />

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

            {showMonsterChargesEditor && (
                <ComplexManualEntryMonsterChargesEditor
                    currentSpellInfo={currentMonsterSpellInfo}
                    baselineSpellInfo={baselineMonsterSpellInfo}
                    onChargeChange={updateMonsterSpellCharge}
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