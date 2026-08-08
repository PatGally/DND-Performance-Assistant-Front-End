import axios from "axios";
import axiosTokenInstance from "./AxiosTokenInstance";
import {
    removeEffectResult,
    removeSingleCreatureEffect,
} from "./EffectRemoval";

jest.mock("./AxiosTokenInstance", () => ({
    __esModule: true,
    default: {
        delete: jest.fn(),
    },
}));

jest.mock("axios", () => ({
    __esModule: true,
    default: {
        isAxiosError: jest.fn(),
    },
}));

const mockedDelete = axiosTokenInstance.delete as jest.Mock;
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("EffectRemoval API", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("ends every effect linked to a result", async () => {
        mockedDelete.mockResolvedValueOnce({
            data: { verification: "true", removed: true, resultID: "result 1" },
        });

        const response = await removeEffectResult("enc 1", "creature/1", "result 1");

        expect(mockedDelete).toHaveBeenCalledWith(
            "/encounter/enc%201/creature/creature%2F1/effect-result/result%201"
        );
        expect(response.removed).toBe(true);
    });

    it("removes only the selected condition", async () => {
        mockedDelete.mockResolvedValueOnce({
            data: {
                verification: "true",
                removed: true,
                effectType: "condition",
                effectName: "Hold Person",
            },
        });

        await removeSingleCreatureEffect(
            "enc-1",
            "creature-1",
            "condition",
            "Hold Person"
        );

        expect(mockedDelete).toHaveBeenCalledWith(
            "/encounter/enc-1/creature/creature-1/condition/Hold%20Person"
        );
    });

    it("uses the backend detail when a mutation fails", async () => {
        mockedAxios.isAxiosError.mockReturnValueOnce(true);
        mockedDelete.mockRejectedValueOnce({
            response: { data: { detail: "Effect is not active." } },
        });

        await expect(
            removeSingleCreatureEffect(
                "enc-1",
                "creature-1",
                "status-effect",
                "Disadvantage"
            )
        ).rejects.toThrow("Effect is not active.");
    });
});