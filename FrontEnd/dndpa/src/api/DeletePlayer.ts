import axiosTokenInstance from "./AxiosTokenInstance";

export async function deletePlayer(cid: string) {
    try {
        const response = await axiosTokenInstance.delete(`/dashboard/players/${cid}`);
        return response.data;
    } catch (error: any) {
        throw new Error(
            error?.response?.data?.detail || "Failed to delete encounter"
        );
    }
}