import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
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
import { Lunar, HolidayUtil } from 'lunar-javascript';

const TaskCalendarView = ({ tasks, onTaskClick, onCreateTask }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // 常见公历节日（月-日 -> 节日名称）
  const solarFestivals = {
    '1-1': '元旦',
    '2-14': '情人节',
    '3-8': '妇女节',
    '4-1': '愚人节',
    '5-1': '劳动节',
    '5-4': '青年节',
    '6-1': '儿童节',
    '10-1': '国庆节',
    '12-24': '平安夜',
    '12-25': '圣诞节',
  };

  // 常见农历节日（农历月-日 -> 节日名称）
  const lunarFestivals = {
    '1-1': '春节',
    '1-15': '元宵节',
    '5-5': '端午节',
    '7-7': '七夕',
    '8-15': '中秋节',
    '9-9': '重阳节',
    '12-30': '除夕',
    '12-29': '除夕', // 小月时腊月二十九是除夕
  };

  // 获取农历信息
  const getLunarInfo = (date) => {
    const lunar = Lunar.fromDate(date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // 获取法定节假日调休信息
    const holiday = HolidayUtil.getHoliday(year, month, day);

    let festival = ''; // 节日
    let lunarText = ''; // 农历日期
    let isHoliday = false;
    let isWorkday = false;

    if (holiday) {
      isHoliday = !holiday.isWork();
      isWorkday = holiday.isWork();
    }

    // 农历日期（始终计算）
    const lunarMonth = lunar.getMonth();
    const lunarDay = lunar.getDay();
    if (lunarDay === 1) {
      lunarText = lunar.getMonthInChinese() + '月';
    } else {
      lunarText = lunar.getDayInChinese();
    }

    // 检查公历节日
    const solarKey = `${month}-${day}`;
    if (solarFestivals[solarKey]) {
      festival = solarFestivals[solarKey];
    }

    // 检查农历节日（优先级更高）
    const lunarKey = `${lunarMonth}-${lunarDay}`;

    // 特殊处理除夕：检查是否是腊月最后一天
    if (lunarMonth === 12) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextLunar = Lunar.fromDate(nextDay);
      if (nextLunar.getMonth() === 1 && nextLunar.getDay() === 1) {
        festival = '除夕';
      }
    }

    if (lunarFestivals[lunarKey] && !festival) {
      festival = lunarFestivals[lunarKey];
    }

    return {
      lunarText,  // 农历日期
      festival,   // 节日（可能为空）
      isHoliday,
      isWorkday,
    };
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

  // 获取状态边框颜色
  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'completed': return 'border-l-cyan-500';
      case 'in_progress': return 'border-l-blue-500';
      case 'overdue': return 'border-l-red-500';
      case 'paused': return 'border-l-gray-400';
      default: return 'border-l-gray-300';
    }
  };

  // 选中日期的任务，按时间排序
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    const tasks = getTasksForDate(selectedDate);
    return [...tasks].sort((a, b) => {
      const timeA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const timeB = b.deadline ? new Date(b.deadline).getTime() : 0;
      return timeA - timeB;
    });
  }, [selectedDate, tasksByDate]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex gap-6 flex-1 overflow-hidden p-4">
        {/* 日历部分 */}
        <div className="flex-1 flex flex-col">
          {/* 月份导航 */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h3 className="text-xl font-semibold">
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
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((day, index) => (
              <div
                key={day}
                className={`text-center text-base font-medium py-2 ${
                  index === 0 || index === 6 ? 'text-red-400' : 'text-muted-foreground'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-1 flex-1">
            {calendarDays.map((day, index) => {
              const dayTasks = getTasksForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);
              const lunarInfo = getLunarInfo(day);
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-1.5 min-h-[80px] rounded-lg border transition-all flex flex-col items-center
                    ${isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}
                    ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-100'}
                    ${isDayToday ? 'bg-blue-50' : ''}
                    hover:border-primary/50
                  `}
                >
                  {/* 休/班标记 */}
                  {(lunarInfo.isHoliday || lunarInfo.isWorkday) && (
                    <span className={`absolute top-1 right-1 text-xs font-semibold ${
                      lunarInfo.isHoliday ? 'text-green-500' : 'text-orange-500'
                    }`}>
                      {lunarInfo.isHoliday ? '休' : '班'}
                    </span>
                  )}

                  {/* 公历日期 */}
                  <span className={`
                    text-base font-semibold leading-tight
                    ${!isCurrentMonth ? 'text-gray-300' : ''}
                    ${isDayToday ? 'text-primary font-bold' : ''}
                    ${isWeekend && isCurrentMonth && !isDayToday ? 'text-red-400' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>

                  {/* 农历日期 */}
                  <span className={`
                    text-xs leading-tight mt-0.5
                    ${!isCurrentMonth ? 'text-gray-200' : 'text-muted-foreground'}
                  `}>
                    {lunarInfo.lunarText}
                  </span>

                  {/* 节日（如有） */}
                  {lunarInfo.festival && (
                    <span className="text-xs leading-tight text-red-500 font-medium">
                      {lunarInfo.festival}
                    </span>
                  )}

                  {/* 任务指示器 */}
                  {dayTasks.length > 0 && (
                    <div className="mt-auto flex flex-wrap gap-0.5 justify-center">
                      {dayTasks.slice(0, 3).map((task, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}
                        />
                      ))}
                      {dayTasks.length > 3 && (
                        <span className="text-xs text-muted-foreground">+{dayTasks.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 图例 */}
          <div className="flex items-center gap-4 pt-3 mt-3 border-t text-xs">
            <span className="text-muted-foreground">状态:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              <span>待办</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>进行中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span>已完成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span>已延期</span>
            </div>
            <span className="text-green-500 ml-2">休</span>
            <span className="text-muted-foreground">休息日</span>
            <span className="text-orange-500">班</span>
            <span className="text-muted-foreground">调休</span>
          </div>
        </div>

        {/* 右侧：时间轴任务列表 */}
        <div className="w-80 border-l pl-6 flex flex-col">
          {/* 标题和新建按钮 */}
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-lg">
              {selectedDate
                ? format(selectedDate, 'M月d日 EEEE', { locale: zhCN })
                : '选择日期'}
            </h4>
            {selectedDate && onCreateTask && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateTask(selectedDate)}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                新建
              </Button>
            )}
          </div>

          {/* 农历信息 */}
          {selectedDate && (
            <p className="text-sm text-muted-foreground mb-4">
              {(() => {
                const lunar = Lunar.fromDate(selectedDate);
                return `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
              })()}
            </p>
          )}

          {/* 任务列表 */}
          {selectedDate ? (
            selectedDateTasks.length > 0 ? (
              <ScrollArea className="flex-1">
                <div className="space-y-2 pr-2">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-l-4 bg-white border border-gray-100 hover:shadow-sm transition-all cursor-pointer ${getStatusBorderColor(task.status)}`}
                      onClick={() => onTaskClick?.(task)}
                    >
                      {/* 时间 */}
                      {task.deadline && (
                        <div className="flex items-center gap-1 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(task.deadline), 'HH:mm')}
                          </span>
                        </div>
                      )}

                      {/* 标题和状态 */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium text-sm line-clamp-2">{task.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 px-1.5 py-0 ${
                            task.status === 'completed' ? 'border-cyan-500 text-cyan-600' :
                            task.status === 'in_progress' ? 'border-blue-500 text-blue-600' :
                            task.status === 'overdue' ? 'border-red-500 text-red-600' :
                            'border-gray-400 text-gray-600'
                          }`}
                        >
                          {getStatusLabel(task.status)}
                        </Badge>
                      </div>

                      {/* 标签 */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="text-[10px] text-muted-foreground">+{task.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm mb-3">该日期没有任务</p>
                {onCreateTask && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCreateTask(selectedDate)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    创建任务
                  </Button>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">点击日历上的日期查看任务</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCalendarView;
