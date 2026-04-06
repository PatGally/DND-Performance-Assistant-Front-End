import type {MonsterAction, SpellAction, WeaponAction} from "./action.ts";

export type CharacterStats = {
    name: string;
    level: string;
    ac: string;
    hp: string;
    maxhp: string;
    cid: string;
    position: any[];
    characterClass: string;
    conImmunes: any[];
    activeStatusEffects: any[];
    activeConditions: any[];
    saveProfs: {
        STR: string;
        DEX: string;
        CON: string;
        INT: string;
        WIS: string;
        CHA: string;
    };
    spellSlots: string[][];
    damImmunes: any[];
    damResists: any[];
    damVulns: any[];
    statArray: {
        STR: string;
        DEX: string;
        CON: string;
        INT: string;
        WIS: string;
        CHA: string;
    };
};

export type CharacterPayload = {
    stats: CharacterStats;
    spells: string[];
    weapons: string[];
};

export type GridCoord = [number, number];
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
  position: GridCoord[];
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
  position: GridCoord[];
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
  movement: number;
  actions: MonsterAction[];
  legActions: unknown[];
  spellInfo: SpellInfo | Record<string, never>;
  multiattack: MultiAttack | Record<string, never>;
  modifiers?: Record<string, number | string>;
  [key: string]: unknown;
};

export type Creature = PlayerCreature | MonsterCreature;