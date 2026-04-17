import axiosTokenInstance from "./AxiosTokenInstance";

export const fetchUUID = async (): Promise<string> => {
    try {
        const response = await axiosTokenInstance.get<string>(`/uuid`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
            },
            params: { _: Date.now() + Math.random() },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching UUID:", error);
        throw error;
    }
};