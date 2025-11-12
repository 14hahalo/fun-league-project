import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../api/authApi';
import type { User, AuthContextType } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from sessionStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = sessionStorage.getItem(USER_KEY);
        const accessToken = sessionStorage.getItem(TOKEN_KEY);

        if (storedUser && accessToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const clearAuth = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const login = async (nickname: string, password: string): Promise<boolean> => {
    try {
      const response = await authService.login({ nickname, password });

      // Store tokens and user in sessionStorage
      sessionStorage.setItem(TOKEN_KEY, response.accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
      sessionStorage.setItem(USER_KEY, JSON.stringify(response.player));

      setUser(response.player);

      // Return true if password needs to be changed
      return response.needsPasswordChange;
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const accessToken = sessionStorage.getItem(TOKEN_KEY);
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      await authService.changePassword({ newPassword });

      // Update user to reflect password change
      if (user) {
        const updatedUser = { ...user, needsPasswordChange: false };
        sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Password change failed');
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
    }
  };

  const refreshAuth = async () => {
    try {
      const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(refreshToken);

      // Update tokens in sessionStorage
      sessionStorage.setItem(TOKEN_KEY, response.accessToken);
      sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    } catch (error) {
      console.error('Token refresh failed:', error);
      clearAuth();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    changePassword,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get access token
export const getAccessToken = (): string | null => {
  return sessionStorage.getItem(TOKEN_KEY);
};

// Helper function to get refresh token
export const getRefreshToken = (): string | null => {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
};
