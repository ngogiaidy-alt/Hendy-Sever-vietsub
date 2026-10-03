import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, GitHubUser } from '../api/client.ts';

interface AuthContextType {
  user: GitHubUser | null;
  loading: boolean;
  environment: 'production' | 'staging' | 'worker-node';
  setEnvironment: (env: 'production' | 'staging' | 'worker-node') => void;
  loginWithToken: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  notification: { message: string; type: 'info' | 'success' | 'error' } | null;
  showNotification: (message: string, type?: 'info' | 'success' | 'error') => void;
  openQuickBuild: boolean;
  setOpenQuickBuild: (open: boolean) => void;
  openAuthModal: boolean;
  setOpenAuthModal: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'worker-node'>('production');
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [openQuickBuild, setOpenQuickBuild] = useState(false);
  const [openAuthModal, setOpenAuthModal] = useState(false);

  const showNotification = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(prev => (prev?.message === message ? null : prev));
    }, 4000);
  };

  const refreshUser = async () => {
    try {
      const data = await api.getUser();
      setUser(data.user);
    } catch (err) {
      console.error('Failed to load user', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginWithToken = async (token: string): Promise<boolean> => {
    try {
      const res = await api.connectToken(token);
      if (res.success) {
        setUser(res.user);
        showNotification(`Đã kết nối tài khoản GitHub: @${res.user.login}`, 'success');
        return true;
      }
      return false;
    } catch (err: any) {
      showNotification(err.message || 'Xác thực GitHub thất bại', 'error');
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      showNotification('Đã ngắt kết nối tài khoản GitHub', 'info');
    } catch (err: any) {
      showNotification(err.message || 'Lỗi đăng xuất', 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        environment,
        setEnvironment,
        loginWithToken,
        logout,
        refreshUser,
        notification,
        showNotification,
        openQuickBuild,
        setOpenQuickBuild,
        openAuthModal,
        setOpenAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
