/**
 * localStorage 存储层封装
 * 提供任务、用户、白板数据的持久化存储
 */

const STORAGE_KEYS = {
  TASKS: 'todo_tasks',
  USER: 'todo_user',
  WHITEBOARDS: 'todo_whiteboards',
  SETTINGS: 'todo_settings',
  LAST_WHITEBOARD: 'todo_last_whiteboard',
};

// 生成唯一 ID
const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

// 通用存储操作
const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Failed to get ${key} from localStorage:`, error);
      return null;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set ${key} in localStorage:`, error);
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
      return false;
    }
  },
};

// 任务存储操作
export const taskStorage = {
  getAll: () => {
    return storage.get(STORAGE_KEYS.TASKS) || [];
  },

  getById: (id) => {
    const tasks = taskStorage.getAll();
    return tasks.find(t => t.id === id) || null;
  },

  create: (taskData) => {
    const tasks = taskStorage.getAll();
    const newTask = {
      ...taskData,
      id: generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress_history: taskData.progress_history || [],
      current_progress: taskData.current_progress || '',
      tags: taskData.tags || [],
      attachments: taskData.attachments || [],
    };
    tasks.unshift(newTask);
    storage.set(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  update: (id, updates) => {
    const tasks = taskStorage.getAll();
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Task not found');
    }
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.TASKS, tasks);
    return tasks[index];
  },

  delete: (id) => {
    const tasks = taskStorage.getAll();
    const filtered = tasks.filter(t => t.id !== id);
    storage.set(STORAGE_KEYS.TASKS, filtered);
  },

  // 批量操作
  importTasks: (tasks) => {
    storage.set(STORAGE_KEYS.TASKS, tasks);
  },

  exportTasks: () => {
    return taskStorage.getAll();
  },

  clear: () => {
    storage.set(STORAGE_KEYS.TASKS, []);
  },
};

// 用户存储操作
export const userStorage = {
  get: () => {
    return storage.get(STORAGE_KEYS.USER) || {
      id: 'local_user',
      name: '我',
      avatar_url: '',
    };
  },

  set: (userData) => {
    const current = userStorage.get();
    const updated = { ...current, ...userData };
    storage.set(STORAGE_KEYS.USER, updated);
    return updated;
  },

  isInitialized: () => {
    const user = storage.get(STORAGE_KEYS.USER);
    return user && user.name && user.name !== '我';
  },
};

// 白板存储操作
export const whiteboardStorage = {
  getAll: () => {
    return storage.get(STORAGE_KEYS.WHITEBOARDS) || [];
  },

  getById: (id) => {
    const whiteboards = whiteboardStorage.getAll();
    return whiteboards.find(w => w.id === id) || null;
  },

  create: (data) => {
    const whiteboards = whiteboardStorage.getAll();
    const newWhiteboard = {
      id: generateId(),
      title: data.title || '新建灵感白板',
      content: data.content || { html: '' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    whiteboards.unshift(newWhiteboard);
    storage.set(STORAGE_KEYS.WHITEBOARDS, whiteboards);
    return newWhiteboard;
  },

  update: (id, updates) => {
    const whiteboards = whiteboardStorage.getAll();
    const index = whiteboards.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error('Whiteboard not found');
    }
    whiteboards[index] = {
      ...whiteboards[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    storage.set(STORAGE_KEYS.WHITEBOARDS, whiteboards);
    return whiteboards[index];
  },

  delete: (id) => {
    const whiteboards = whiteboardStorage.getAll();
    const filtered = whiteboards.filter(w => w.id !== id);
    storage.set(STORAGE_KEYS.WHITEBOARDS, filtered);
  },

  getLastViewedId: () => {
    return storage.get(STORAGE_KEYS.LAST_WHITEBOARD);
  },

  setLastViewedId: (id) => {
    storage.set(STORAGE_KEYS.LAST_WHITEBOARD, id);
  },
};

// 设置存储操作
export const settingsStorage = {
  get: () => {
    return storage.get(STORAGE_KEYS.SETTINGS) || {
      theme: 'light',
    };
  },

  set: (settings) => {
    const current = settingsStorage.get();
    const updated = { ...current, ...settings };
    storage.set(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  },
};

// 数据导入导出
export const dataExport = {
  exportAll: () => {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: taskStorage.getAll(),
      user: userStorage.get(),
      whiteboards: whiteboardStorage.getAll(),
      settings: settingsStorage.get(),
    };
  },

  importAll: (data) => {
    if (data.tasks) {
      taskStorage.importTasks(data.tasks);
    }
    if (data.user) {
      userStorage.set(data.user);
    }
    if (data.whiteboards) {
      storage.set(STORAGE_KEYS.WHITEBOARDS, data.whiteboards);
    }
    if (data.settings) {
      settingsStorage.set(data.settings);
    }
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      storage.remove(key);
    });
  },
};

export default storage;
