import type {CreatureAction, MonsterAction, SpellAction, WeaponAction} from "../../types/action.ts";

export function isSpellAction(action: CreatureAction): action is SpellAction {
  return "spellname" in action;
}
export function isWeaponAction(action: CreatureAction): action is WeaponAction {
  return "properties" in action;
}
export function isMonsterAction(action: CreatureAction): action is MonsterAction {
  return "desc" in action;
}

export function isBasicAction(action: CreatureAction): action is SpellAction {
  return "spellname" in action && ["Dodge", "Grapple", "Hide", "Shove"].includes(action.spellname);
}