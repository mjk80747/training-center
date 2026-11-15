import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type RefreshedTokens = { access: string; refresh?: string };

let refreshRequest: Promise<RefreshedTokens> | null = null;

apiClient.interceptors.request.use((config) => {
  const requestPath = config.url?.split('?')[0] ?? '';
  const isPublicAuthRequest = [
    '/auth/register/',
    '/auth/verify-email/',
    '/auth/resend-verification/',
    '/auth/login/',
    '/auth/password/forgot/',
    '/auth/password/reset/',
  ].includes(requestPath);

  if (isPublicAuthRequest) {
    delete config.headers.Authorization;
    return config;
  }

  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as RetryableRequestConfig | undefined;
    const requestPath = request?.url?.split('?')[0] ?? '';
    const isTokenEndpoint = ['/auth/login/', '/auth/refresh/', '/auth/logout/'].includes(requestPath);

    if (error.response?.status !== 401 || !request || request._retry || isTokenEndpoint) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      expireSession();
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      if (!refreshRequest) {
        refreshRequest = axios.post<RefreshedTokens>(
          `${apiClient.defaults.baseURL}/auth/refresh/`,
          { refresh: refreshToken },
          { timeout: apiClient.defaults.timeout },
        ).then(({ data }) => data).finally(() => {
          refreshRequest = null;
        });
      }

      const tokens = await refreshRequest;
      localStorage.setItem('access_token', tokens.access);
      if (tokens.refresh) localStorage.setItem('refresh_token', tokens.refresh);
      request.headers.Authorization = `Bearer ${tokens.access}`;
      return await apiClient(request);
    } catch (refreshError: unknown) {
      if (
        axios.isAxiosError(refreshError)
        && [400, 401, 403].includes(refreshError.response?.status ?? 0)
      ) {
        expireSession();
      }
      return Promise.reject(refreshError);
    }
  },
);

function expireSession() {
  localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.dispatchEvent(new Event('auth:session-expired'));
}

export default apiClient;
