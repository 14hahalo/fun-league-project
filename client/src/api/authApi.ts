import apiClient from './axiosConfig';
import type { LoginDto, ChangePasswordDto, AuthResponse, User } from '../types/auth.types';

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    return response.data.data;
  },

  async changePassword(data: ChangePasswordDto): Promise<void> {
    // The token is automatically added by the axios interceptor in axiosConfig
    await apiClient.post('/auth/change-password', data);
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await apiClient.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data;
  },

  async logout(): Promise<void> {
    // The token is automatically added by the axios interceptor in axiosConfig
    await apiClient.post('/auth/logout', {});
  },

  async getCurrentUser(): Promise<User> {
    // The token is automatically added by the axios interceptor in axiosConfig
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  },
};

export default authService;
