import { actionsGet } from './ActionsGet';
import axiosTokenInstance from './AxiosTokenInstance';
import type { CreatureAction } from '../types/action';

const mockGet = jest.fn();

jest.mock('axios', () => {
    const mockAxiosInstance = {
        get: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    };
    return {
        create: jest.fn(() => mockAxiosInstance),
        post: jest.fn(),
    };
});

beforeAll(() => {
    (axiosTokenInstance.get as jest.Mock).mockImplementation(mockGet);
});

const mockActions = [
    { name: 'Slash', desc: 'A melee attack' },
    { spellname: 'Fireball', level: '3' },
] as unknown as CreatureAction[];

describe('actionsGet', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns actions on a successful response', async () => {
        mockGet.mockResolvedValueOnce({ data: mockActions });
        const result = await actionsGet('enc-1', 'cre-1');
        expect(mockGet).toHaveBeenCalledWith('/encounter/enc-1/creature/cre-1/actions');
        expect(result).toEqual(mockActions);
    });

    it('builds the URL correctly from eid and cid', async () => {
        mockGet.mockResolvedValueOnce({ data: [] });
        await actionsGet('encounter-abc', 'creature-xyz');
        expect(mockGet).toHaveBeenCalledWith('/encounter/encounter-abc/creature/creature-xyz/actions');
    });

    it('returns an empty array when response.data is null', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockGet.mockResolvedValueOnce({ data: null });
        const result = await actionsGet('enc-1', 'cre-1');
        expect(result).toEqual([]);
        consoleSpy.mockRestore();
    });

    it('returns an empty array when the request throws', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockGet.mockRejectedValueOnce(new Error('Network error'));
        const result = await actionsGet('enc-1', 'cre-1');
        expect(result).toEqual([]);
        consoleSpy.mockRestore();
    });

    it('logs an error when the request throws', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        mockGet.mockRejectedValueOnce(new Error('Network error'));
        await actionsGet('enc-1', 'cre-1');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch actions', expect.any(Error));
        consoleSpy.mockRestore();
    });
});