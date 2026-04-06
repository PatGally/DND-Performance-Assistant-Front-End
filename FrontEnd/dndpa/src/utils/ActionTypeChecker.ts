import type {CreatureAction, MonsterAction, SpellAction, WeaponAction} from "../types/action.ts";

export function isSpellAction(action: CreatureAction): action is SpellAction {
  return "spellname" in action;
}
export function isWeaponAction(action: CreatureAction): action is WeaponAction {
  return "properties" in action;
}
export function isMonsterAction(action: CreatureAction): action is MonsterAction {
  return "desc" in action;
}