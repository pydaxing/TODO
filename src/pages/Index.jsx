import { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useTasks } from '@/hooks/useTasks';
import { useApp } from '@/contexts/AppContext';
import { taskApi } from '@/lib/api';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// Components
import TaskItem from '@/components/TaskItem';
import TaskDialog from '@/components/TaskDialog';
import ProgressDialog from '@/components/ProgressDialog';
import StatsCard from '@/components/StatsCard';
import Whiteboard from '@/components/Whiteboard';
import TaskCalendar from '@/components/TaskCalendar';
import TaskCalendarView from '@/components/TaskCalendarView';
import TagManager from '@/components/TagManager';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  Palette, Filter, Search, X, ListTodo, Tag, AlertCircle, Plus,
  ChevronRight, ChevronLeft, ChevronDown, User, Settings, Calendar, ImagePlus, Link, List
} from 'lucide-react';

const Index = () => {
  const { user, updateUser, isLoading: isUserLoading } = useApp();
  const {
    tasks,
    isLoading: isTasksLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    updateProgress,
    editProgress,
    deleteProgress,
  } = useTasks();

  // Dialog states
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [updatingProgressTaskId, setUpdatingProgressTaskId] = useState(null);

  // 从最新的 tasks 中获取正在更新进度的任务（确保数据是最新的）
  const updatingProgressTask = useMemo(() => {
    if (!updatingProgressTaskId) return null;
    return tasks.find(t => t.id === updatingProgressTaskId) || null;
  }, [updatingProgressTaskId, tasks]);

  // Filter states
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 10;

  // Whiteboard
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // Calendar and Tag Manager
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tagManagerOpen, setTagManagerOpen] = useState(false);

  // View mode
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'calendar'

  // Settings form
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [avatarInputMode, setAvatarInputMode] = useState('upload'); // 'upload' | 'url'
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarInputRef = useRef(null);

  // Initialize settings form
  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserAvatar(user.avatar_url || '');
      setAvatarUrl(user.avatar_url?.startsWith('http') ? user.avatar_url : '');
    }
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending' || t.status === 'paused').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  }), [tasks]);

  // Get all unique tags
  const allTags = useMemo(() =>
    [...new Set(tasks.flatMap(task => task.tags || []))].sort(),
    [tasks]
  );

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const searchMatch = !searchQuery.trim() ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));

      const tagMatch = selectedTags.length === 0 ||
        selectedTags.every(tag => (task.tags || []).includes(tag));

      const statusMatch = selectedStatuses.length === 0 ||
        selectedStatuses.includes(task.status);

      const priorityMatch = selectedPriorities.length === 0 ||
        selectedPriorities.includes(task.priority);

      return searchMatch && tagMatch && statusMatch && priorityMatch;
    });
  }, [tasks, searchQuery, selectedTags, selectedStatuses, selectedPriorities]);

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * tasksPerPage,
    currentPage * tasksPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTags, selectedStatuses, selectedPriorities, searchQuery]);

  // Priority options
  const priorityOptions = [
    { value: 'low', label: '低' },
    { value: 'medium', label: '中' },
    { value: 'high', label: '高' },
    { value: 'urgent', label: '紧急' },
  ];

  // Filter handlers
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const toggleStatus = (status) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        return [];
      }
      if (status === 'pending') {
        return ['pending', 'paused'];
      }
      return [status];
    });
  };

  const togglePriority = (priority) => {
    setSelectedPriorities(prev =>
      prev.includes(priority)
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
    setSelectedStatuses([]);
    setSelectedPriorities([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedTags.length > 0 ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    searchQuery.trim() !== '';

  // Task handlers
  const handleSaveTask = (taskData) => {
    if (editingTask) {
      updateTask({ id: editingTask.id, updates: taskData });
    } else {
      createTask(taskData);
    }
    setTaskDialogOpen(false);
    setEditingTask(null);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleUpdateProgress = (task) => {
    setUpdatingProgressTaskId(task.id);
    setProgressDialogOpen(true);
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    try {
      const updates = {};
      if (userName.trim()) {
        updates.name = userName.trim();
      }
      // 确定最终的头像值
      const finalAvatar = avatarInputMode === 'url' ? avatarUrl : userAvatar;
      updates.avatar_url = finalAvatar;

      await updateUser(updates);
      toast.success('设置已保存');
      setSettingsDialogOpen(false);
    } catch (error) {
      toast.error('保存失败');
    }
  };

  // 处理头像上传
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserAvatar(event.target.result);
      setAvatarInputMode('upload');
    };
    reader.readAsDataURL(file);
  };

  // 处理头像 URL 输入
  const handleAvatarUrlChange = (url) => {
    setAvatarUrl(url);
    if (url.trim()) {
      setUserAvatar(url);
    }
  };

  // 更新标签（用于标签管理组件）
  const handleUpdateTaskTags = async (taskId, updates) => {
    await taskApi.update(taskId, updates);
    // 刷新任务列表
    window.location.reload();
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading state
  if (isUserLoading || isTasksLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-6">
          <div className={`${whiteboardOpen ? '' : 'max-w-[1400px] mx-auto'}`}>
            <div className="flex items-start justify-between mb-6">
              <div className="relative">
                <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                  TODO
                </h1>
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full opacity-50"></div>
              </div>

              {/* User Profile */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-auto p-2 hover:bg-accent">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar_url} alt={user?.name} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium text-sm">{user?.name || '我'}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          {viewMode === 'list' ? '列表视角' : '日历视角'}
                          <ChevronDown className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-1">
                    {/* 视角切换 */}
                    <div className="pb-2 mb-2 border-b space-y-1">
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4 mr-2" />
                        列表视角
                      </Button>
                      <Button
                        variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                        className="w-full justify-start"
                        onClick={() => setViewMode('calendar')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        日历视角
                      </Button>
                    </div>
                    {/* 原有菜单 */}
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setSettingsDialogOpen(true)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      个人设置
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setTagManagerOpen(true)}
                    >
                      <Tag className="h-4 w-4 mr-2" />
                      标签管理
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'list' ? (
          <div className={`flex-1 flex ${whiteboardOpen ? 'gap-4' : 'justify-center'} px-4 pb-4 overflow-hidden`}>
            <div className={`flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
              whiteboardOpen ? 'w-1/2' : 'w-full max-w-[1400px]'
            }`}>
              {/* Stats Cards */}
            <div className={`grid gap-3 mb-4 flex-shrink-0 ${whiteboardOpen ? 'grid-cols-5' : 'grid-cols-1 md:grid-cols-5 gap-4'}`}>
              <StatsCard
                title="全部任务"
                value={stats.total}
                icon={ListTodo}
                color="primary"
                isSelected={selectedStatuses.length === 0}
                onClick={() => setSelectedStatuses([])}
                compact={whiteboardOpen}
              />
              <StatsCard
                title="待办/暂停"
                value={stats.pending}
                icon={ListTodo}
                color="secondary"
                isSelected={selectedStatuses.includes('pending') || selectedStatuses.includes('paused')}
                onClick={() => toggleStatus('pending')}
                compact={whiteboardOpen}
              />
              <StatsCard
                title="进行中"
                value={stats.in_progress}
                icon={ListTodo}
                color="info"
                isSelected={selectedStatuses.includes('in_progress')}
                onClick={() => toggleStatus('in_progress')}
                compact={whiteboardOpen}
              />
              <StatsCard
                title="已完成"
                value={stats.completed}
                icon={ListTodo}
                color="cyan"
                isSelected={selectedStatuses.includes('completed')}
                onClick={() => toggleStatus('completed')}
                compact={whiteboardOpen}
              />
              <StatsCard
                title="已延期"
                value={stats.overdue}
                icon={ListTodo}
                color="destructive"
                isSelected={selectedStatuses.includes('overdue')}
                onClick={() => toggleStatus('overdue')}
                compact={whiteboardOpen}
              />
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {/* Filter Panel */}
                <div className="p-5 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-blue-100/50 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Filter className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-lg text-blue-500">筛选</h3>
                    </div>

                    {hasActiveFilters && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-sm text-muted-foreground font-medium">
                          {filteredTasks.length} 个任务
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="h-8 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <X className="h-4 w-4 mr-1" />
                          清除筛选
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Priority Filter */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 w-20 flex-shrink-0">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">优先级</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {priorityOptions.map(priority => (
                        <Badge
                          key={priority.value}
                          variant={selectedPriorities.includes(priority.value) ? "default" : "outline"}
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                          onClick={() => togglePriority(priority.value)}
                        >
                          {priority.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Tags Filter */}
                  {allTags.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-20 flex-shrink-0">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">标签</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allTags.map(tag => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-105"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Task List Header */}
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-blue-500">
                    {hasActiveFilters ? '筛选结果' : '全部'}
                    {filteredTasks.length > tasksPerPage && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (第 {currentPage} 页，共 {totalPages} 页)
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索任务标题、描述或标签..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-white border-blue-100/50 focus:border-blue-300 transition-colors"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <Button
                      onClick={() => {
                        setEditingTask(null);
                        setTaskDialogOpen(true);
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新建TODO
                    </Button>
                    <Button
                      onClick={() => setWhiteboardOpen(!whiteboardOpen)}
                      variant={whiteboardOpen ? "default" : "outline"}
                      className={`font-semibold shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap ${
                        whiteboardOpen
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      <Palette className="h-4 w-4 mr-2" />
                      {whiteboardOpen ? '关闭白板' : '打开白板'}
                    </Button>
                  </div>
                </div>

                {/* Task Items */}
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground bg-white/50 backdrop-blur-sm rounded-xl border border-blue-100/50">
                      <ListTodo className="h-16 w-16 mx-auto mb-4 opacity-30 text-blue-500" />
                      <p className="text-lg">
                        {hasActiveFilters
                          ? '没有符合筛选条件的任务'
                          : '暂无任务，点击上方按钮创建第一个任务'
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      {paginatedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onToggle={toggleTask}
                          onEdit={handleEditTask}
                          onDelete={deleteTask}
                          onUpdateProgress={handleUpdateProgress}
                        />
                      ))}
                    </>
                  )}
                </div>

                {/* Pagination */}
                {filteredTasks.length > tasksPerPage && (
                  <div className="flex items-center justify-center gap-2 mt-6 pb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-9"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      上一页
                    </Button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        const showPage =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);

                        const showEllipsis =
                          (page === currentPage - 2 && currentPage > 3) ||
                          (page === currentPage + 2 && currentPage < totalPages - 2);

                        if (showEllipsis) {
                          return (
                            <span key={page} className="px-2 text-muted-foreground">
                              ...
                            </span>
                          );
                        }

                        if (!showPage) return null;

                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className="h-9 w-9"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-9"
                    >
                      下一页
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

            {/* Whiteboard Panel */}
            {whiteboardOpen && (
              <div
                className="flex flex-col overflow-hidden transition-all duration-500 ease-in-out w-1/2"
                style={{ animation: 'slideIn 0.5s ease-in-out' }}
              >
                <Whiteboard onClose={() => setWhiteboardOpen(false)} />
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="flex-1 px-4 pb-4 overflow-hidden">
            <div className="h-full max-w-[1400px] mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-blue-100/50">
              <TaskCalendarView tasks={tasks} onTaskClick={handleEditTask} />
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        task={editingTask}
        allTags={allTags}
      />

      <ProgressDialog
        open={progressDialogOpen}
        onOpenChange={(open) => {
          setProgressDialogOpen(open);
          if (!open) setUpdatingProgressTaskId(null);
        }}
        onSubmit={(progressData) => {
          updateProgress({
            taskId: updatingProgressTask.id,
            progressData,
          });
        }}
        onEdit={(progressIndex, newContent, newAttachments) => {
          editProgress({
            taskId: updatingProgressTask.id,
            progressIndex,
            newContent,
            newAttachments,
          });
        }}
        onDelete={(progressIndex) => {
          deleteProgress({
            taskId: updatingProgressTask.id,
            progressIndex,
          });
        }}
        task={updatingProgressTask}
      />

      {/* Settings Dialog */}
      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>个人设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 头像设置 */}
            <div className="space-y-3">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userAvatar} alt={userName} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Tabs value={avatarInputMode} onValueChange={setAvatarInputMode} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="upload" className="text-xs">
                        <ImagePlus className="h-3 w-3 mr-1" />
                        上传图片
                      </TabsTrigger>
                      <TabsTrigger value="url" className="text-xs">
                        <Link className="h-3 w-3 mr-1" />
                        图片链接
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {avatarInputMode === 'upload' ? (
                    <div>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        选择图片
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">支持 JPG、PNG，最大 2MB</p>
                    </div>
                  ) : (
                    <Input
                      placeholder="输入图片 URL"
                      value={avatarUrl}
                      onChange={(e) => handleAvatarUrlChange(e.target.value)}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 用户名 */}
            <div className="space-y-2">
              <Label htmlFor="userName">用户名称</Label>
              <Input
                id="userName"
                placeholder="输入您的名称"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSettings}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Calendar */}
      <TaskCalendar
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        tasks={tasks}
        onTaskClick={(task) => handleEditTask(task)}
      />

      {/* Tag Manager */}
      <TagManager
        open={tagManagerOpen}
        onOpenChange={setTagManagerOpen}
        tasks={tasks}
        onUpdateTasks={handleUpdateTaskTags}
      />
    </div>
  );
};

export default Index;
