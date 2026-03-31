import axiosTokenInstance from "./AxiosTokenInstance.ts";

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
    lingEffect: unknown;
    extraEffect: unknown;
    lingSave: unknown;
    scaling: unknown;
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
  extraDamage: unknown[];
  damType: string[];
  conditions: string[];
  statusEffect: unknown[];
  lingEffect: unknown;
  extraEffect: unknown;
  lingSave: unknown;
  recharge: unknown;
  actionCost: string;
  specialNotes: string[];
};
export type CreatureAction = SpellAction | WeaponAction | MonsterAction;

export async function actionsGet(
  eid: string,
  cid: string
): Promise<CreatureAction[]> {
    try{
        console.log(`/encounter/${eid}/creature/${cid}/actions`);
         const response = await axiosTokenInstance.get(`/encounter/${eid}/creature/${cid}/actions`);
    if( !response.data ) {
        console.error("Data not found in call", response.data);
    }
    return response.data as CreatureAction[];
    }
    catch (error) {
        console.error("Failed to fetch actions", error);
        return [];
    }
}