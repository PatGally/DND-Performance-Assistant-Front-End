import axiosTokenInstance from "./AxiosTokenInstance";

export async function getStatusEffects(): Promise<string[]> {
    try {
        const res = await axiosTokenInstance.get("/status-effects");

        if (!Array.isArray(res.data)) {
            console.error("Invalid status effects data", res.data);
            return [];
        }

        return res.data
            .map((s: any) => s?.name)
            .filter((name: unknown): name is string => typeof name === "string");

    } catch (err) {
        console.error("Failed to fetch status effects", err);
        return [];
    }
}