import axios from "axios";
import BASE_URL from "./BASE_URL";

const axiosTokenInstance = axios.create({ baseURL: BASE_URL, withCredentials: true });

axiosTokenInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

axiosTokenInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            const refreshRes = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
            localStorage.setItem("token", refreshRes.data.access_token);
            error.config.headers.Authorization = `Bearer ${refreshRes.data.access_token}`;
            return axiosTokenInstance(error.config); // retry original request
        }
        return Promise.reject(error);
    }
);

export default axiosTokenInstance;