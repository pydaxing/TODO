/**
 * API 存储层 - 与后端 PHP 接口通信
 */

// API 基础路径（生产环境）
const API_BASE = '/api';

// 通用请求方法
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// 任务 API
export const taskApi = {
  getAll: async () => {
    return await request('/tasks.php');
  },

  getById: async (id) => {
    return await request(`/tasks.php?id=${id}`);
  },

  create: async (taskData) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    await request('/tasks.php', {
      method: 'POST',
      body: JSON.stringify({ ...taskData, id }),
    });
    return { ...taskData, id, created_at: new Date().toISOString() };
  },

  update: async (id, updates) => {
    await request(`/tasks.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return { id, ...updates };
  },

  delete: async (id) => {
    await request(`/tasks.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// 白板 API
export const whiteboardApi = {
  getAll: async () => {
    return await request('/whiteboards.php');
  },

  getById: async (id) => {
    return await request(`/whiteboards.php?id=${id}`);
  },

  create: async (data) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    await request('/whiteboards.php', {
      method: 'POST',
      body: JSON.stringify({ ...data, id }),
    });
    return { ...data, id, created_at: new Date().toISOString() };
  },

  update: async (id, updates) => {
    await request(`/whiteboards.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return { id, ...updates };
  },

  delete: async (id) => {
    await request(`/whiteboards.php?id=${id}`, {
      method: 'DELETE',
    });
  },
};

// 设置 API
export const settingsApi = {
  getAll: async () => {
    return await request('/settings.php');
  },

  update: async (settings) => {
    await request('/settings.php', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    return settings;
  },

  delete: async (key) => {
    await request(`/settings.php?key=${key}`, {
      method: 'DELETE',
    });
  },
};

// 初始化数据库
export const initDatabase = async () => {
  return await request('/init.php');
};

export default { taskApi, whiteboardApi, settingsApi, initDatabase };
