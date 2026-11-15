import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from './client';

describe('API authorization handling', () => {
  let requestConfig: InternalAxiosRequestConfig | undefined;

  const captureRequest: AxiosAdapter = async (config) => {
    requestConfig = config;
    return {
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    };
  };

  beforeEach(() => {
    localStorage.setItem('access_token', 'stale-access-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');
    localStorage.setItem('user', JSON.stringify({ id: 1, role: 'ADMIN' }));
    requestConfig = undefined;
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('does not send a stored access token to student registration', async () => {
    await apiClient.post('/auth/register/', {}, { adapter: captureRequest });

    expect(requestConfig?.headers.Authorization).toBeUndefined();
  });

  it('sends the stored access token to protected API endpoints', async () => {
    await apiClient.get('/students/', { adapter: captureRequest });

    expect(requestConfig?.headers.Authorization).toBe(['Bearer', 'stale-access-token'].join(' '));
  });

  it('refreshes an expired access token and retries the protected request', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({
      data: { access: 'new-access-token', refresh: 'rotated-refresh-token' },
    } as never);
    const adapter: AxiosAdapter = async (config) => {
      if (config.headers.Authorization === ['Bearer', 'stale-access-token'].join(' ')) {
        throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
          data: { detail: 'Given token not valid for any token type' },
        });
      }
      requestConfig = config;
      return {
        data: { count: 0, results: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await apiClient.get('/students/', { adapter });

    expect(axios.post).toHaveBeenCalledWith(
      `${apiClient.defaults.baseURL}/auth/refresh/`,
      { refresh: 'valid-refresh-token' },
      { timeout: apiClient.defaults.timeout },
    );
    expect(requestConfig?.headers.Authorization).toBe(['Bearer', 'new-access-token'].join(' '));
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('rotated-refresh-token');
  });

  it('clears invalid credentials and signals the app to return to sign-in', async () => {
    const refreshError = new AxiosError('Invalid refresh token');
    refreshError.response = {
      status: 401,
      statusText: 'Unauthorized',
      headers: {},
      config: {} as InternalAxiosRequestConfig,
      data: { detail: 'Given token not valid for any token type' },
    };
    vi.spyOn(axios, 'post').mockRejectedValue(refreshError);
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
        data: { detail: 'Given token not valid for any token type' },
      });
    };
    const onExpired = vi.fn();
    window.addEventListener('auth:session-expired', onExpired);

    await expect(apiClient.get('/students/', { adapter })).rejects.toThrow('Invalid refresh token');

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(onExpired).toHaveBeenCalledOnce();
    window.removeEventListener('auth:session-expired', onExpired);
  });

  it('keeps session credentials when refresh fails due to a network error', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network unavailable'));
    const adapter: AxiosAdapter = async (config) => {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
        data: { detail: 'Given token not valid for any token type' },
      });
    };

    await expect(apiClient.get('/students/', { adapter })).rejects.toThrow('Network unavailable');

    expect(localStorage.getItem('access_token')).toBe('stale-access-token');
    expect(localStorage.getItem('refresh_token')).toBe('valid-refresh-token');
  });
});
