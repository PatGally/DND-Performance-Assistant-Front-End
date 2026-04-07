import { deletePlayer } from './DeletePlayer';
import axiosTokenInstance from './AxiosTokenInstance';

const mockDelete = jest.fn();

jest.mock('axios', () => {
    const mockAxiosInstance = {
        delete: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() },
        },
    };
    return {
        create: jest.fn(() => mockAxiosInstance),
    };
});

beforeAll(() => {
    (axiosTokenInstance.delete as jest.Mock).mockImplementation(mockDelete);
});

describe('deletePlayer', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns response data on success', async () => {
        const mockData = { message: 'Player deleted' };
        mockDelete.mockResolvedValueOnce({ data: mockData });

        const result = await deletePlayer('player-1');

        expect(mockDelete).toHaveBeenCalledWith('/dashboard/players/player-1');
        expect(result).toEqual(mockData);
    });

    it('throws the backend detail message when available', async () => {
        mockDelete.mockRejectedValueOnce({
            response: { data: { detail: 'Player not found' } },
        });

        await expect(deletePlayer('player-1')).rejects.toThrow('Player not found');
    });

    it('throws a fallback message when no detail is present', async () => {
        mockDelete.mockRejectedValueOnce(new Error('Network error'));

        await expect(deletePlayer('player-1')).rejects.toThrow('Failed to delete encounter');
    });

    it('uses the cid in the url', async () => {
        mockDelete.mockResolvedValueOnce({ data: {} });

        await deletePlayer('abc-123');

        expect(mockDelete).toHaveBeenCalledWith('/dashboard/players/abc-123');
    });
});