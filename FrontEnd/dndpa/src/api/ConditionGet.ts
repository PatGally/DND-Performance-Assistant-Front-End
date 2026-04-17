import axiosTokenInstance from "./AxiosTokenInstance";

export async function getConditions(): Promise<string[]> {
    try {
        const res = await axiosTokenInstance.get("/conditions");

        if (!Array.isArray(res.data)) {
            console.error("Invalid conditions data", res.data);
            return [];
        }

        return res.data
            .map((c: any) => c?.name)
            .filter((name: unknown): name is string => typeof name === "string");

    } catch (err) {
        console.error("Failed to fetch conditions", err);
        return [];
    }
}