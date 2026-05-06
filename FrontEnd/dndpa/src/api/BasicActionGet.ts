import axiosTokenInstance from "./AxiosTokenInstance.ts";
import type {SpellAction} from "../types/action.ts";

export async function basicActionGet(name : string) {
        if (["dodge", "shove", "grapple", "hide"].includes(name.toLowerCase())) {
            const response = await axiosTokenInstance.get("basic-actions");
            const basicActions = response.data as SpellAction[];
            return basicActions.find(basic => basic.spellname.toLowerCase() === name.toLowerCase());
        }
        return;
}

