// CreatureGet.ts

import axiosTokenInstance from "./AxiosTokenInstance";
import type {SpellAction, WeaponAction, MonsterAction} from "./ActionsGet.ts";

export type StatArray = {
  STR: number | string;
  DEX: number | string;
  CON: number | string;
  INT: number | string;
  WIS: number | string;
  CHA: number | string;
};

export type SaveProfs = {
  STR: number | string;
  DEX: number | string;
  CON: number | string;
  INT: number | string;
  WIS: number | string;
  CHA: number | string;
};

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
  spellSlots: Array<[string, string]> | string[][];
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
  activeConditions?: string[];
  activeCons?: string[];
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
  spellInfo?: Record<string, unknown>;
  multiattack?: Record<string, unknown>;
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