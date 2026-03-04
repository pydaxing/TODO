import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';

const TaskCalendar = ({ open, onOpenChange, tasks, onTaskClick }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const grouped = {};
    tasks.forEach(task => {
      if (task.deadline) {
        const dateKey = format(new Date(task.deadline), 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // 生成日历天数
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // 获取某天的任务
  const getTasksForDate = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate[dateKey] || [];
  };

  // 获取状态颜色
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-cyan-500';
      case 'in_progress': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      case 'paused': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  // 获取状态标签
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return '已完成';
      case 'in_progress': return '进行中';
      case 'overdue': return '已延期';
      case 'paused': return '暂停';
      default: return '待办';
    }
  };

  // 选中日期的任务
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            任务日历
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* 日历部分 */}
          <div className="flex-1">
            {/* 月份导航 */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="text-lg font-semibold">
                {format(currentMonth, 'yyyy年M月', { locale: zhCN })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日历格子 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayTasks = getTasksForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isDayToday = isToday(day);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative p-2 h-20 rounded-lg border transition-all
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                      ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}
                      ${isDayToday ? 'bg-blue-50' : ''}
                      hover:border-primary/50
                    `}
                  >
                    <span className={`
                      text-sm font-medium
                      ${isDayToday ? 'text-primary font-bold' : ''}
                    `}>
                      {format(day, 'd')}
                    </span>

                    {/* 任务指示器 */}
                    {dayTasks.length > 0 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                        {dayTasks.slice(0, 4).map((task, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}
                            title={task.title}
                          />
                        ))}
                        {dayTasks.length > 4 && (
                          <span className="text-xs text-muted-foreground">+{dayTasks.length - 4}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 任务列表部分 */}
          <div className="w-72 border-l pl-4">
            <h4 className="font-medium mb-3">
              {selectedDate
                ? format(selectedDate, 'M月d日 EEEE', { locale: zhCN })
                : '选择日期查看任务'}
            </h4>

            {selectedDate ? (
              selectedDateTasks.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-2">
                    {selectedDateTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onTaskClick?.(task);
                          onOpenChange(false);
                        }}
                        className="p-3 rounded-lg border border-gray-100 hover:border-primary/50 cursor-pointer transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm line-clamp-2">{task.title}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs shrink-0 ${
                              task.status === 'completed' ? 'border-cyan-500 text-cyan-600' :
                              task.status === 'in_progress' ? 'border-blue-500 text-blue-600' :
                              task.status === 'overdue' ? 'border-red-500 text-red-600' :
                              'border-gray-400 text-gray-600'
                            }`}
                          >
                            {getStatusLabel(task.status)}
                          </Badge>
                        </div>
                        {task.deadline && (
                          <p className="text-xs text-muted-foreground mt-1">
                            截止: {format(new Date(task.deadline), 'HH:mm')}
                          </p>
                        )}
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">该日期没有任务</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">点击日历上的日期查看任务详情</p>
            )}
          </div>
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-4 pt-4 border-t mt-4">
          <span className="text-sm text-muted-foreground">状态图例:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span className="text-xs">待办</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs">进行中</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-xs">已完成</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs">已延期</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskCalendar;
