import type {MonsterCreature, PlayerCreature} from "./creature.ts";

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
export interface PreTurnEffect {
    "name" : string;
    "effect" : {
        "spellName" : string;
        "resultID": string;
    }
}
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
  targets: string[];
  conditions: string[];
  statusEffects: Record<string, unknown>[];
  outcome: OutcomeDraft;
  extraOutcome: ExtraOutcomeDraft;
  timestamp: string; // "HH:MM:SS"
    token? : any;
};
export type ActionExecutionSession = {
  action: NormalizedAction;
  requiredInputs: string[];
  draft: ActionRequestDraft;
  error: string | null;
};