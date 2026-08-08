import axios from "axios";
import axiosTokenInstance from "./AxiosTokenInstance";

export type RemovableEffectKind = "condition" | "status-effect";

type EffectMutationResponse = {
    verification: string;
    removed: boolean;
    resultID?: string;
    effectName?: string;
    effectType?: RemovableEffectKind;
};

function mutationErrorMessage(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        if (typeof detail === "string" && detail.trim() !== "") {
            return detail;
        }
    }

    if (error instanceof Error && error.message.trim() !== "") {
        return error.message;
    }

    return fallback;
}

export async function removeEffectResult(
    eid: string,
    cid: string,
    resultID: string | number
): Promise<EffectMutationResponse> {
    try {
        const response = await axiosTokenInstance.delete(
            `/encounter/${encodeURIComponent(eid)}/creature/${encodeURIComponent(
                cid
            )}/effect-result/${encodeURIComponent(String(resultID))}`
        );

        return response.data;
    } catch (error) {
        throw new Error(
            mutationErrorMessage(error, "Failed to end the linked effects.")
        );
    }
}

export async function removeSingleCreatureEffect(
    eid: string,
    cid: string,
    effectType: RemovableEffectKind,
    effectName: string
): Promise<EffectMutationResponse> {
    try {
        const response = await axiosTokenInstance.delete(
            `/encounter/${encodeURIComponent(eid)}/creature/${encodeURIComponent(
                cid
            )}/${effectType}/${encodeURIComponent(effectName)}`
        );

        return response.data;
    } catch (error) {
        throw new Error(
            mutationErrorMessage(error, `Failed to remove ${effectName}.`)
        );
    }
}