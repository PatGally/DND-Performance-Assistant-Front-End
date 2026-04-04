import axiosTokenInstance from "./AxiosTokenInstance.ts";

export interface MonsterRoll {
    rollType: string;
    saveType: string;
    halfSave: boolean;
    saveDC: string;
    damage: string;
    attackBonus: number;
    damMod: number;
}

export interface ExtraEffect {
    rollType?: string;
    saveType?: string;
    halfSave?: boolean;
    saveDC?: string;
    damage?: string;
    attackBonus?: number;
    damMod?: number;
    damType?: string[];
    extraDamage?: any[];
    conditions?: string[];
}

export interface ExtraDamage {
    dice: string;
    mod: number;
    type: string;
}

export interface MonsterAction {
    name: string;
    desc: string;
    actionRange: string;
    numTarget: number;
    shape: string;
    rolls: MonsterRoll;
    damType: string[];
    conditions: string[];
    statusEffect: string[];
    lingEffect: Record<string, any>;
    extraEffect: ExtraEffect;
    lingSave: Record<string, any>;
    actionCost: string;
    recharge: string;
    specialNotes: string[];
    extraDamage: ExtraDamage[];
}

export interface LegendaryAction {
    name: string;
    desc: string;
    cost: number;
    action?: MonsterAction;
}

export interface Multiattack {
    name: string;
    total: number;
    split: any[];
}

export interface Monster {
    name: string;
    cr: string;
    creatureType: string;
    statArray: Record<string, number>;
    hp: number;
    ac: number;
    saveProfs: Record<string, number>;
    lResists: string;
    damResists: string;
    damImmunes: string;
    damVulns: string;
    conImmunes: string;
    magicResist: boolean;
    lairAction: boolean;
    actions: MonsterAction[];
    legActions: LegendaryAction[];
    spellInfo: Record<string, any>;
    multiattack: Multiattack;
    size: string;
    movement: number;
}

export const getMonsters = async (): Promise<Monster[]> => {
    try {
        const response = await axiosTokenInstance.get(`dashboard/monsters`);

        if (!Array.isArray(response.data)) {
            console.error("Unexpected response format:", response.data);
            return [];
        }

        return response.data as Monster[];
    } catch (error) {
        console.error("Failed to fetch monsters:", error);
        return [];
    }
};