import axiosTokenInstance from "./AxiosTokenInstance.ts";

export const fetchUUID = async (): Promise<string> => {
    try {
        const response = await axiosTokenInstance.get<string>(`/uuid`);
        console.log("Response for uuid", response);
        return response.data;
    } catch (error) {
        console.error("Error fetching UUID:", error);
        return "null";
    }
};