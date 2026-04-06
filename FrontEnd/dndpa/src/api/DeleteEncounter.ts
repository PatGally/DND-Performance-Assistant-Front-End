import axiosTokenInstance from "./AxiosTokenInstance.ts";

export async function deleteEncounter(eid: string) {
    try {
        const response = await axiosTokenInstance.delete(`/encounter/${eid}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.detail || "Failed to delete encounter"
        );
    }
}