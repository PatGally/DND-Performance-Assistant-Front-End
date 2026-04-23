export type RawAction = {
    spellname?: string;
    spellName?: string;
    level?: string;
    actionCost?: string;
};

export type RawStatusEffect = {
    roll?: string;
    damage?: string;
    attribute?: string | string[];
    resultID?: string | string[];
    spellName?: string | string[];
    action?: RawAction[];
    type?: string;
    monsterName?: string;
    crCap?: string;
    numSummons?: string;
    value?: string;
};

export type RawActiveStatus = {
    name: string;
    effect: RawStatusEffect;
};


export type CleanActiveStatus = {
    key: string;
    name: string;
    label: string;
    description: string;
    details: { label: string; value: string }[];
};


const toText = (v: unknown): string => {
    if (v === undefined || v === null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) {
        return v
            .map(item => {
                if (item === null || item === undefined) return "";
                if (typeof item === "string") return item;
                if (typeof item === "object") {
                    const a = item as RawAction;
                    return a.spellname || a.spellName || "";
                }
                return String(item);
            })
            .filter(Boolean)
            .join(", ");
    }
    if (typeof v === "object") {
        const a = v as RawAction;
        return a.spellname || a.spellName || "";
    }
    return String(v);
};


const actionSpellNames = (actions: RawAction[] | undefined): string => {
    if (!Array.isArray(actions) || actions.length === 0) return "";
    return actions
        .map(a => a.spellname || a.spellName || "")
        .filter(Boolean)
        .join(", ");
};


const normalizeName = (name: string): string => {
    const n = (name || "").toLowerCase();
    const aliases: Record<string, string> = {
        lingeffect: "lingEffect",
        lingsave: "lingSave",
        switchsides: "SwitchSides",
        autofail: "Autofail",
        autocrit: "autocrit",
        "time stop": "Time Stop",
        advantage: "Advantage",
        disadvantage: "Disadvantage",
        buff: "Buff",
        debuff: "Debuff",
        resistance: "Resistance",
        immunity: "Immunity",
        vulnerability: "Vulnerability",
        concentration: "Concentration",
        summon: "Summon",
    };
    return aliases[n] ?? name;
};


const HIDDEN_FIELDS = new Set(["resultID"]);

const prettify = (name: string): string => {
    const map: Record<string, string> = {
        autocrit: "Auto-Crit",
        Autofail: "Auto-Fail",
        lingEffect: "Lingering Effect",
        lingSave: "Lingering Save",
        SwitchSides: "Switch Sides",
    };
    return map[name] ?? name;
};

function formatOne(status: RawActiveStatus, index: number): CleanActiveStatus {
    const { name, effect = {} } = status;
    const normalized = normalizeName(name);
    const label = prettify(normalized);
    const details: { label: string; value: string }[] = [];
    let description = "";

    switch (normalized) {
        case "Advantage":
        case "Disadvantage": {
            description = `${label} (roll ${effect.roll ?? "?"})`;
            if (effect.roll) details.push({ label: "Roll", value: effect.roll });
            break;
        }

        case "Buff":
        case "Debuff": {
            const attrs = toText(effect.attribute);
            description = attrs
                ? `${effect.roll ?? "?"} to ${attrs}`
                : `${effect.roll ?? "?"}`;
            if (effect.roll) details.push({ label: "Roll", value: effect.roll });
            if (attrs) details.push({ label: "Applies to", value: attrs });
            break;
        }

        case "Resistance": {
            const attr = toText(effect.attribute);
            description = attr ? `Resistant to ${attr}` : "Resistant (½ damage)";
            if (attr) details.push({ label: "Damage type", value: attr });
            if (effect.damage) details.push({ label: "Modifier", value: effect.damage });
            break;
        }

        case "Immunity": {
            const attr = toText(effect.attribute);
            description = attr ? `Immune to ${attr}` : "Immune (no damage)";
            if (attr) details.push({ label: "Damage type", value: attr });
            break;
        }

        case "Vulnerability": {
            const attr = toText(effect.attribute);
            description = attr ? `Vulnerable to ${attr}` : "Vulnerable (×2 damage)";
            if (attr) details.push({ label: "Damage type", value: attr });
            break;
        }

        case "autocrit": {
            description = "Attacks automatically crit";
            break;
        }

        case "Autofail": {
            description = "Rolls automatically fail";
            if (effect.roll) details.push({ label: "Roll modifier", value: effect.roll });
            break;
        }

        case "Concentration": {
            const spell = toText(effect.spellName);
            description = spell ? `Concentrating on ${spell}` : "Concentrating";
            if (spell) details.push({ label: "Spell", value: spell });
            break;
        }

        case "lingEffect": {
            const spell = toText(effect.spellName) || actionSpellNames(effect.action);
            description = spell || "Active";
            if (spell) details.push({ label: "Source", value: spell });
            break;
        }

        case "lingSave": {
            const spell = toText(effect.spellName) || actionSpellNames(effect.action);
            description = spell ? `Save from ${spell}` : "Save required";
            if (spell) details.push({ label: "Source", value: spell });
            break;
        }

        case "Summon": {
            const count = effect.numSummons || "?";
            const what = effect.monsterName || effect.type || "creature";
            const cr = effect.crCap ? ` (CR ≤ ${effect.crCap})` : "";
            description = `${count}× ${what}${cr}`;
            if (effect.type) details.push({ label: "Type", value: effect.type });
            if (effect.monsterName) details.push({ label: "Name", value: effect.monsterName });
            if (effect.crCap) details.push({ label: "CR cap", value: effect.crCap });
            if (effect.numSummons) details.push({ label: "Count", value: effect.numSummons });
            break;
        }

        case "SwitchSides": {
            const flipped = effect.value === "T" || effect.value === "true";
            description = flipped ? "Fighting for the enemy" : "Normal allegiance";
            break;
        }

        case "Time Stop": {
            const turns = toText(effect.attribute) || "Turns";
            description = `${effect.roll ?? "?"} ${turns}`;
            if (effect.roll) details.push({ label: "Duration roll", value: effect.roll });
            break;
        }

        default: {
            const fallback = Object.entries(effect)
                .filter(([k, v]) => {
                    if (HIDDEN_FIELDS.has(k)) return false;
                    if (v === "" || v === undefined) return false;
                    if (Array.isArray(v) && v.length === 0) return false;
                    return true;
                })
                .map(([k, v]) => `${k}: ${toText(v)}`)
                .join(", ");
            description = fallback || "Active";
            break;
        }
    }

    return {
        key: `${name}-${index}`,
        name,
        label,
        description,
        details,
    };
}

export function CleanActiveStatusData(
    statuses: RawActiveStatus[] | null | undefined
): CleanActiveStatus[] {
    if (!Array.isArray(statuses)) return [];
    return statuses.map(formatOne);
}