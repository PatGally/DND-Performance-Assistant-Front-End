export type SpellAction = {
  spellname: string;
  level: string;
  targeting: Array<{
    self: boolean;
    number: string;
    shape: string;
    actionRange: string;
    radius: string;
    rolls: {
      rollType: string;
      saveType: string;
      halfSave: boolean;
      damage: string;
      damageMod: string;
    };
    damType: string[];
    conditions: string[];
    statusEffect: unknown[];
    lingEffect: any;
    extraEffect: any;
    lingSave: any;
    scaling: string;
    actionCost: string;
    specialNotes: string[];
  }>;
};
export type WeaponAction = {
  name: string;
  properties: {
    damage: string;
    damageType: string;
    weaponStat: string;
  };
};
export type MonsterAction = {
  name: string;
  desc: string;
  number: string;
  actionRange: string;
  shape: string;
  rolls: {
    rollType: string;
    saveType: string;
    halfSave: boolean;
    saveDC: string | number;
    damage: string;
    attackBonus: string;
    damageMod: string;
  };
  extraDamage: any[];
  damType: string[];
  conditions: string[];
  statusEffect: any[];
  lingEffect: any;
  extraEffect: any;
  lingSave: any;
  recharge: string;
  actionCost: string;
  specialNotes: string[];
};
export type CreatureAction = SpellAction | WeaponAction | MonsterAction;