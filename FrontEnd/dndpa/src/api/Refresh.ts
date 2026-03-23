import BASE_URL from "./BASE_URL.ts";

export const refreshToken = async (): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.access_token);
            return true;
        }

        localStorage.removeItem('token');
        return false;
    } catch {
        return false;
    }
};