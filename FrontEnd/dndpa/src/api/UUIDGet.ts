import axiosTokenInstance from "./AxiosTokenInstance";

export const fetchUUID = async (): Promise<string> => {
    try {
        const response = await axiosTokenInstance.get<string>(`/uuid`);
        return response.data;
    } catch (error) {
        console.error("Error fetching UUID:", error);
        return "null";
    }
};