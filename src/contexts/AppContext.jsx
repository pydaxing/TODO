import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { settingsApi } from '@/lib/api';

/**
 * 应用上下文
 * 提供用户信息和全局状态管理，数据存储到 MySQL
 */

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 'local_user',
    name: '我',
    avatar_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // 初始化用户信息
  useEffect(() => {
    const loadUser = async () => {
      try {
        const settings = await settingsApi.getAll();
        setUser({
          id: 'local_user',
          name: settings.user_name || '我',
          avatar_url: settings.user_avatar || '',
        });
      } catch (error) {
        console.error('加载用户设置失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // 更新用户信息
  const updateUser = useCallback(async (updates) => {
    try {
      const settingsToUpdate = {};

      if (updates.name !== undefined) {
        settingsToUpdate.user_name = updates.name;
      }
      if (updates.avatar_url !== undefined) {
        settingsToUpdate.user_avatar = updates.avatar_url;
      }

      if (Object.keys(settingsToUpdate).length > 0) {
        await settingsApi.update(settingsToUpdate);
      }

      setUser(prev => ({
        ...prev,
        ...updates,
      }));

      return { ...user, ...updates };
    } catch (error) {
      console.error('更新用户设置失败:', error);
      throw error;
    }
  }, [user]);

  // 检查用户是否已初始化（设置过名称）
  const isUserInitialized = useCallback(() => {
    return user && user.name && user.name !== '我';
  }, [user]);

  const value = {
    user,
    isLoading,
    updateUser,
    isUserInitialized,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
