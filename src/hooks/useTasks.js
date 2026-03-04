import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/lib/api';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { toast } from 'sonner';

/**
 * 任务操作 Hook
 * 提供任务的 CRUD 操作，基于 TanStack Query + MySQL API
 */

// 计算下一个重复任务的截止时间
const calculateNextDeadline = (currentDeadline, recurringType, recurringInterval) => {
  if (!currentDeadline) return null;

  const deadline = new Date(currentDeadline);

  switch (recurringType) {
    case 'daily':
      return addDays(deadline, recurringInterval);
    case 'weekly':
      return addWeeks(deadline, recurringInterval);
    case 'monthly':
      return addMonths(deadline, recurringInterval);
    case 'yearly':
      return addYears(deadline, recurringInterval);
    default:
      return addWeeks(deadline, recurringInterval);
  }
};

export const useTasks = () => {
  const queryClient = useQueryClient();

  // 获取所有任务
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getAll(),
    staleTime: 0,
  });

  // 创建任务
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await taskApi.create({
        ...taskData,
        current_cycle_number: taskData.is_recurring ? 1 : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务创建成功');
    },
    onError: (error) => {
      console.error('创建任务失败:', error);
      toast.error('创建任务失败');
    },
  });

  // 更新任务
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      return await taskApi.update(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务已更新');
    },
    onError: (error) => {
      console.error('更新任务失败:', error);
      toast.error('更新任务失败');
    },
  });

  // 删除任务
  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      await taskApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('任务已删除');
    },
    onError: (error) => {
      console.error('删除任务失败:', error);
      toast.error('删除任务失败');
    },
  });

  // 切换任务完成状态
  const toggleTaskMutation = useMutation({
    mutationFn: async (task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed';
      await taskApi.update(task.id, { status: newStatus });

      // 如果标记为完成且是重复任务，创建下一个周期
      if (newStatus === 'completed' && task.is_recurring) {
        const nextDeadline = calculateNextDeadline(
          task.deadline,
          task.recurring_type,
          task.recurring_interval
        );

        // 检查是否超过结束日期
        if (task.recurring_end_date) {
          const endDate = new Date(task.recurring_end_date);
          if (nextDeadline && nextDeadline > endDate) {
            toast.info('重复任务已达到结束日期，不再创建新周期');
            return;
          }
        }

        const nextCycleNumber = (task.current_cycle_number || 1) + 1;

        await taskApi.create({
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: 'pending',
          deadline: nextDeadline,
          tags: task.tags,
          attachments: task.attachments,
          is_recurring: true,
          recurring_type: task.recurring_type,
          recurring_interval: task.recurring_interval,
          recurring_end_date: task.recurring_end_date,
          parent_recurring_task_id: task.parent_recurring_task_id || task.id,
          current_cycle_number: nextCycleNumber,
        });

        toast.success(`已自动创建第 ${nextCycleNumber} 次重复任务`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('更新任务状态失败:', error);
      toast.error('更新状态失败');
    },
  });

  // 更新进度
  const updateProgressMutation = useMutation({
    mutationFn: async ({ taskId, progressData }) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('任务不存在');

      const newProgressEntry = {
        content: progressData.content,
        attachments: progressData.attachments || [],
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [
        ...(task.progress_history || []),
        newProgressEntry,
      ];

      return await taskApi.update(taskId, {
        progress_history: updatedHistory,
        current_progress: progressData.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('进度已更新');
    },
    onError: (error) => {
      console.error('更新进度失败:', error);
      toast.error('更新进度失败');
    },
  });

  // 编辑历史进度
  const editProgressMutation = useMutation({
    mutationFn: async ({ taskId, progressIndex, newContent, newAttachments }) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('任务不存在');

      const updatedHistory = [...(task.progress_history || [])];
      updatedHistory[progressIndex] = {
        ...updatedHistory[progressIndex],
        content: newContent,
        attachments: newAttachments || [],
      };

      // 重新计算当前进度（最新的）
      const sortedHistory = [...updatedHistory].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      const currentProgress = sortedHistory[0]?.content || '';

      return await taskApi.update(taskId, {
        progress_history: updatedHistory,
        current_progress: currentProgress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('进度已更新');
    },
    onError: (error) => {
      console.error('编辑进度失败:', error);
      toast.error('编辑进度失败');
    },
  });

  // 删除历史进度
  const deleteProgressMutation = useMutation({
    mutationFn: async ({ taskId, progressIndex }) => {
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('任务不存在');

      const updatedHistory = [...(task.progress_history || [])];
      updatedHistory.splice(progressIndex, 1);

      // 重新计算当前进度
      const sortedHistory = [...updatedHistory].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      const currentProgress = sortedHistory[0]?.content || '';

      return await taskApi.update(taskId, {
        progress_history: updatedHistory,
        current_progress: currentProgress,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('进度已删除');
    },
    onError: (error) => {
      console.error('删除进度失败:', error);
      toast.error('删除进度失败');
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createTaskMutation.mutate,
    updateTask: updateTaskMutation.mutate,
    deleteTask: deleteTaskMutation.mutate,
    toggleTask: toggleTaskMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    editProgress: editProgressMutation.mutate,
    deleteProgress: deleteProgressMutation.mutate,
    isCreating: createTaskMutation.isPending,
    isUpdating: updateTaskMutation.isPending,
    isDeleting: deleteTaskMutation.isPending,
  };
};

export default useTasks;
