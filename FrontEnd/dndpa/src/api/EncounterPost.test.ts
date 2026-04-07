import { EncounterPost } from './EncounterPost';
import axiosTokenInstance from './AxiosTokenInstance';
import axios from 'axios';
import type { EncounterFull } from '../types/encounter';

const mockPost = jest.fn();

jest.mock('axios', () => {
    const mockAxiosInstance = {
        post: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    };
    return {
        create: jest.fn(() => mockAxiosInstance),
        post: jest.fn(),
        isAxiosError: jest.fn(),
    };
});

const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(() => {
    (axiosTokenInstance.post as jest.Mock).mockImplementation(mockPost);
});

const mockEncounter = {
    id: 'enc-1',
    name: 'Test Encounter',
} as unknown as EncounterFull;

describe('EncounterPost', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns response data on success', async () => {
        const mockData = { id: 'enc-1', name: 'Test Encounter' };
        mockPost.mockResolvedValueOnce({ data: mockData });

        const result = await EncounterPost(mockEncounter);

        expect(mockPost).toHaveBeenCalledWith('/encounter', mockEncounter);
        expect(result).toEqual(mockData);
    });

    it('throws an error when the request fails', async () => {
        mockPost.mockRejectedValueOnce(new Error('Network error'));

        await expect(EncounterPost(mockEncounter)).rejects.toThrow('Encounter creation failed');
    });

    it('logs backend error when axios error occurs', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const axiosError = { response: { data: 'Bad Request' }, isAxiosError: true };

        mockedAxios.isAxiosError.mockReturnValueOnce(true);
        mockPost.mockRejectedValueOnce(axiosError);

        await expect(EncounterPost(mockEncounter)).rejects.toThrow('Encounter creation failed');
        expect(consoleSpy).toHaveBeenCalledWith('BACKEND ERROR:', 'Bad Request');
        consoleSpy.mockRestore();
    });

    it('still throws even when error is not an axios error', async () => {
        mockedAxios.isAxiosError.mockReturnValueOnce(false);
        mockPost.mockRejectedValueOnce(new Error('Unknown error'));

        await expect(EncounterPost(mockEncounter)).rejects.toThrow('Encounter creation failed');
    });
});