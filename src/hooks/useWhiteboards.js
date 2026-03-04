import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whiteboardApi } from '@/lib/api';
import { toast } from 'sonner';

/**
 * 白板操作 Hook - 使用 MySQL API
 */

// 本地存储最后查看的白板 ID
const LAST_WHITEBOARD_KEY = 'todo_last_whiteboard';

export const useWhiteboards = () => {
  const queryClient = useQueryClient();

  // 获取所有白板
  const { data: whiteboards = [], isLoading } = useQuery({
    queryKey: ['whiteboards'],
    queryFn: () => whiteboardApi.getAll(),
    staleTime: 0,
  });

  // 创建白板
  const createWhiteboardMutation = useMutation({
    mutationFn: async (data) => {
      return await whiteboardApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] });
      toast.success('新建白板成功');
    },
    onError: (error) => {
      console.error('创建白板失败:', error);
      toast.error('创建白板失败');
    },
  });

  // 更新白板
  const updateWhiteboardMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await whiteboardApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] });
    },
    onError: (error) => {
      console.error('更新白板失败:', error);
      toast.error('保存白板失败');
    },
  });

  // 删除白板
  const deleteWhiteboardMutation = useMutation({
    mutationFn: async (id) => {
      await whiteboardApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboards'] });
      toast.success('白板已删除');
    },
    onError: (error) => {
      console.error('删除白板失败:', error);
      toast.error('删除白板失败');
    },
  });

  // 最后查看的白板 ID（仍用 localStorage）
  const getLastViewedId = () => {
    return localStorage.getItem(LAST_WHITEBOARD_KEY);
  };

  const setLastViewedId = (id) => {
    localStorage.setItem(LAST_WHITEBOARD_KEY, id);
  };

  return {
    whiteboards,
    isLoading,
    createWhiteboard: createWhiteboardMutation.mutate,
    updateWhiteboard: updateWhiteboardMutation.mutate,
    deleteWhiteboard: deleteWhiteboardMutation.mutate,
    getLastViewedId,
    setLastViewedId,
  };
};

export default useWhiteboards;
