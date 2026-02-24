import axios from "axios";
import BASE_URL from "./BASE_URL";

export const fetchUUID = async (): Promise<string | null> => {
    try {
        const response = await axios.get<string>(`${BASE_URL}/uuid`);
        console.log("Response for uuid", response);
        return response.data; // :white_check_mark: data is the UUID string
    } catch (error) {
        console.error("Error fetching UUID:", error);
        return null;
    }
};