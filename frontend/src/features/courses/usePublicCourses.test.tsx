import { act, renderHook, waitFor } from '@testing-library/react';
import axios, { type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listCourses } from '../../api/courses';
import { usePublicCourses } from './usePublicCourses';

vi.mock('../../api/courses', () => ({
  listCourses: vi.fn(),
}));

describe('usePublicCourses', () => {
  beforeEach(() => vi.clearAllMocks());

  it('orders public courses in the requested display order', async () => {
    vi.mocked(listCourses).mockResolvedValue({
      data: {
        count: 6,
        results: ['DA', 'FED', 'JCORE', 'JFS', 'PFS', 'PYCORE'].map((code, index) => ({
          id: index + 1,
          code,
        })),
      },
    } as AxiosResponse);

    const { result } = renderHook(() => usePublicCourses());

    await waitFor(() => {
      expect(result.current.courses.map((course) => course.code)).toEqual([
        'PYCORE',
        'JCORE',
        'FED',
        'PFS',
        'JFS',
        'DA',
      ]);
    });
  });

  it('reports an unavailable backend and retries the course request', async () => {
    vi.mocked(listCourses)
      .mockRejectedValueOnce(new axios.AxiosError('Network Error', 'ERR_NETWORK'))
      .mockResolvedValueOnce({
        data: { count: 0, results: [] },
      } as AxiosResponse);

    const { result } = renderHook(() => usePublicCourses());

    expect(result.current.loading).toBe(true);
    await waitFor(() => {
      expect(result.current.error).toContain('Check that the backend is running');
    });
    expect(result.current.loading).toBe(false);

    act(() => result.current.retry());

    await waitFor(() => {
      expect(result.current.error).toBe('');
      expect(result.current.loading).toBe(false);
    });
    expect(listCourses).toHaveBeenCalledTimes(2);
    expect(listCourses).toHaveBeenLastCalledWith({ signal: expect.any(AbortSignal) });
  });
});
