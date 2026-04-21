import type {MonsterCreature, PlayerCreature} from "./creature.ts";
import type {GridCoord} from "./creature.ts";
import type {CreatureAction} from "./action.ts";

export type InitiativeEntry = {
    name: string;
    iValue: number;
    turnType: string;
    currentTurn: boolean;
    actionResource?: number;
    bonusActionResource?: number;
    movementResource?: number;
};
export type InitiativeEntryDisplay = {
  name: string;
  iValue: number;
  turnType: string;
  currentTurn: boolean;
  actionResource: number;
  bonusActionResource: number;
  movementResource: number;
  hp: number;
  maxhp: number;
  ac: number;
  cid: string;
};
export type Encounter = {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    mapdata: any;
    initiative : InitiativeEntry[];
    players : PlayerCreature[];
    monsters: MonsterCreature[];
};
export type ActionKind = "spell" | "weapon" | "monster";
export type TargetMode = "none" | "self" | "single" | "multi" | "aoe";
export type RollMode = "none" | "toHit" | "save" | "autohit" | "onHit";
export type NormalizedAction = {
  kind: ActionKind;
  name: string;
  targetMode: TargetMode;
  targetCount: number | null;
  range: string;
  shape: string;
  radius: string;
  rollMode: RollMode;
  saveType: string;
  halfSave: boolean;
  hasDamage: boolean;
  actionCost: string;
  damage?: string;
  damageType?: string;
  damageMod?: string;
  weaponStat?: string;
};
export type OutcomeDraft = {
  rollResults: string[];
  diceResults: number[];
};
export type ExtraOutcomeDraft = {
  extraRollResults: string[];
  extraDiceResults: number[];
};
export type ActionRequestDraft = {
  resultID: string;
  actor: string;
  action: string;
  actionType: string;
  actionProb: number;
  actionEDam: number;
  actionImpact: number;
  actionRanking : number,
    base_weight: number,
    ml_weight: number,
    useML: boolean,
    final_weight: number,
    candidateCount: number,
  targets: string[];
  conditions: string[];
  statusEffects: Record<string, any>[];
  outcome: OutcomeDraft;
  extraOutcome: ExtraOutcomeDraft;
  timestamp: string; // "HH:MM:SS"
    token? : AoeToken | null;
};
export type ActionExecutionSession = {
  action: NormalizedAction;
  requiredInputs: string[];
  draft: ActionRequestDraft;
  error: string | null;
};

export type StatKey = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";
export type ManualStatBlock = Partial<Record<StatKey, number>>;
export type ManualAffectedCreature = {
  cid: string;
  statArray?: ManualStatBlock;
  saveProfs?: ManualStatBlock;
  modifiers?: ManualStatBlock;
  damResists?: string[];
  damImmunes?: string[];
  damVulns?: string[];
  conImmunes?: string[];
  activeConditions?: string[];
  activeStatusEffects?: Record<string, unknown>[];
  hp?: number;
  position?: number[][];
  ac?: number;
  lResists?: number;
  enemy?: boolean;
  spellSlots?: number[][];
};
export type ManualDraftState = {
  affectedCreatures: ManualAffectedCreature[];
};

export type Recommendation = {
    name : string;
    prob : number;
    eDam : number;
    impact: number;
    target : string[] | {targetsHit : string[]; positioning : GridCoord[]};
    "probDisplay": number;
    "probInit": number;
    "probParts": unknown[];
    "pareto": boolean;
    "topsis": number;
    "overallRank": number;
    "base_weight": number;
    "ml_weight" : number;
    "useML" : boolean;
    "final_weight" : number;
}

export type RecommendationAoeTarget = {
  targetsHit: string[];
  positioning: GridCoord[];
};

export type RecommendationTarget = Recommendation["target"];

export type AoeToken = {
  name: string;
  positioning: GridCoord[];
  token_image: string;
  resultID: string;
  cid: string;
  anchor: GridCoord;
  timing: string;
  shape: string;
};

type ManualAoePlacementStage = "pick_anchor" | "pick_direction" | "ready";

export type ManualAoePlacement = {
  resultID: string;
  name: string;
  cid: string;
  shape: "circle" | "square" | "cone" | "line";
  radiusCells: number;
  rangeCells: number;
  timing: string;
  token_image: string;
  selfOrigin: boolean;
  anchor: GridCoord | null;
  stage: ManualAoePlacementStage;
};

export type PendingPreTurnResolution = {
  effectName: "lingeffect" | "lingsave";
  spell: CreatureAction;
  resultID: string;
  actor: string;
};