// CreatureGet.ts

import axiosTokenInstance from "./AxiosTokenInstance";
import type {SpellAction, WeaponAction, MonsterAction} from "./ActionsGet.ts";

type StatArray = {
  STR: number | string;
  DEX: number | string;
  CON: number | string;
  INT: number | string;
  WIS: number | string;
  CHA: number | string;
};

type SaveProfs = {
  STR: number | string;
  DEX: number | string;
  CON: number | string;
  INT: number | string;
  WIS: number | string;
  CHA: number | string;
};

type SpellInfoDetails =
  | {
      name: string;
      spellData?: SpellAction;
      charges: string;
    }
  | {
      name: string;
      spellData?: SpellAction;
      charges?: never;
    };

export type SpellInfo =
  | {
      type: string;
      DC: number;
      attackRoll: number;
      spells: Extract<SpellInfoDetails, { charges: string }>[];
      spellSlots?: never;
    }
  | {
      type: string;
      DC: number;
      attackRoll: number;
      spells: Extract<SpellInfoDetails, { charges?: never }>[];
      spellSlots: number[][];
    };

type MultiAttackSplit = {
  name : string;
  number : number;
}
export type MultiAttack = {
  name : string;
  total : number;
  split : MultiAttackSplit[];
}

export type PlayerStats = {
  statArray: StatArray;
  saveProfs: SaveProfs;
  damResists: string[];
  damImmunes: string[];
  damVulns: string[];
  conImmunes: string[];
  activeConditions: string[];
  activeStatusEffects: unknown[];
  hp: number | string;
  maxhp: number | string;
  position: number[][];
  cid: string;
  name: string;
  level: number | string;
  ac: number | string;
  characterClass: string;
  spellSlots: Array<[number, number]> | number[][];
  modifiers?: Record<string, number | string>;
};

export type PlayerCreature = {
  stats: PlayerStats;
  spells: SpellAction[];
  weapons: WeaponAction[];
  [key: string]: unknown;
};

export type MonsterCreature = {
  statArray: StatArray;
  saveProfs: SaveProfs;
  damResists: string[];
  damImmunes: string[];
  damVulns: string[];
  conImmunes: string[];
  activeConditions: string[];
  activeStatusEffects: unknown[];
  hp: number | string;
  maxhp: number | string;
  position: number[][];
  cid: string;
  name: string;
  cr: number | string;
  creatureType: string;
  ac: number | string;
  lResists: number | string;
  magicResist: boolean;
  lairAction: boolean;
  enemy: boolean;
  size: string;
  movement: number | string;
  actions: MonsterAction[];
  legActions: unknown[];
  spellInfo: SpellInfo | Record<string, never>;
  multiattack: MultiAttack | Record<string, never>;
  modifiers?: Record<string, number | string>;
  [key: string]: unknown;
};

export type Creature = PlayerCreature | MonsterCreature;

export function isPlayerCreature(creature: Creature): creature is PlayerCreature {
  return "stats" in creature;
}

export default async function creatureGet(
  eid: string,
  cid: string
): Promise<Creature | null> {
  try {
    const response = await axiosTokenInstance.get(`/encounter/${eid}/creature/${cid}`);
    return response.data as Creature;
  } catch (error) {
    console.error("Failed to fetch creature", error);
    return null;
  }
}