import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Edit, Trash2, TrendingUp, Repeat, Clock, Timer, ChevronDown, ChevronUp, File } from 'lucide-react';
import { format, isPast, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { renderTextWithLinks } from '@/lib/linkUtils';

const TaskItem = ({ task, onToggle, onEdit, onDelete, onUpdateProgress }) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const priorityColors = {
    low: 'bg-info/10 text-info border-info/20',
    medium: 'bg-primary/10 text-primary border-primary/20',
    high: 'bg-warning/10 text-warning border-warning/20',
    urgent: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const statusLabels = {
    pending: '待办',
    in_progress: '进行中',
    paused: '暂停',
    completed: '完成',
    overdue: '延期',
  };

  const statusColors = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-600',
    paused: 'bg-gray-100 text-gray-600',
    completed: 'bg-cyan-100 text-cyan-600',
    overdue: 'bg-red-100 text-red-600',
  };

  const statusBorderColors = {
    pending: 'border-l-gray-300',
    paused: 'border-l-gray-300',
    in_progress: 'border-l-blue-300',
    completed: 'border-l-cyan-300',
    overdue: 'border-l-red-300',
  };

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };

  const recurringTypeLabels = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
  };

  const handleDoubleClick = () => {
    onEdit(task);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(task.id);
    setDeleteDialogOpen(false);
  };

  const isImage = (type) => {
    return type && type.startsWith('image/');
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mr-2">
        {attachments.map((file, index) => (
          <TooltipProvider key={index} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {isImage(file.type) || file.isExternal ? (
                  <div
                    className="w-6 h-6 rounded border border-muted hover:border-primary cursor-pointer overflow-hidden transition-all flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImage(file.url);
                    }}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><rect width="24" height="24"/></svg>';
                      }}
                    />
                  </div>
                ) : (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded border border-muted hover:border-primary flex items-center justify-center bg-muted/50 transition-all flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <File className="h-3 w-3 text-muted-foreground" />
                  </a>
                )}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{file.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  };

  const renderTextContent = (text, isExpanded) => {
    if (!text) return null;

    const parts = renderTextWithLinks(text);

    return (
      <span className={!isExpanded ? 'truncate' : 'whitespace-pre-wrap break-words'}>
        {parts.map((part, index) => {
          if (typeof part === 'string') {
            return <span key={index}>{part}</span>;
          }
          if (part.type === 'link') {
            return (
              <a
                key={index}
                href={part.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-900 hover:text-gray-700 underline hover:no-underline transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {part.text}
              </a>
            );
          }
          return null;
        })}
      </span>
    );
  };

  function getLatestProgressTime() {
    if (!task.progress_history || task.progress_history.length === 0) {
      return null;
    }
    const sortedHistory = [...task.progress_history].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    return sortedHistory[0].timestamp;
  }

  function getCountdownText(deadline, status) {
    if (!deadline) return null;

    if (status === 'completed') {
      return '结束';
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (isPast(deadlineDate)) {
      const days = Math.abs(differenceInDays(deadlineDate, now));
      const hours = Math.abs(differenceInHours(deadlineDate, now));

      if (days > 0) {
        return `已逾期 ${days} 天`;
      } else if (hours > 0) {
        return `已逾期 ${hours} 小时`;
      } else {
        const minutes = Math.abs(differenceInMinutes(deadlineDate, now));
        return `已逾期 ${minutes} 分钟`;
      }
    }

    const days = differenceInDays(deadlineDate, now);
    const hours = differenceInHours(deadlineDate, now);
    const minutes = differenceInMinutes(deadlineDate, now);

    if (days > 0) {
      return `剩余 ${days} 天`;
    } else if (hours > 0) {
      return `剩余 ${hours} 小时`;
    } else if (minutes > 0) {
      return `剩余 ${minutes} 分钟`;
    } else {
      return '即将到期';
    }
  }

  function getCountdownStyles(deadline, status) {
    if (!deadline) return {
      bgColor: 'bg-muted',
      textColor: 'text-muted-foreground',
      borderColor: 'border-muted-foreground/20'
    };

    if (status === 'completed') {
      return {
        bgColor: 'bg-success/10',
        textColor: 'text-success',
        borderColor: 'border-success/30'
      };
    }

    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (isPast(deadlineDate)) {
      return {
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive/30'
      };
    }

    const hours = differenceInHours(deadlineDate, now);

    if (hours <= 24) {
      return {
        bgColor: 'bg-destructive/10',
        textColor: 'text-destructive',
        borderColor: 'border-destructive/30'
      };
    } else if (hours <= 72) {
      return {
        bgColor: 'bg-warning/10',
        textColor: 'text-warning',
        borderColor: 'border-warning/30'
      };
    } else {
      return {
        bgColor: 'bg-muted',
        textColor: 'text-muted-foreground',
        borderColor: 'border-muted-foreground/20'
      };
    }
  }

  const latestProgressTime = getLatestProgressTime();
  const countdownText = getCountdownText(task.deadline, task.status);
  const countdownStyles = getCountdownStyles(task.deadline, task.status);

  const getRecurringDescription = () => {
    if (!task.is_recurring) return null;

    const interval = task.recurring_interval || 1;
    const type = recurringTypeLabels[task.recurring_type] || task.recurring_type;
    const cycleNumber = task.current_cycle_number || 1;

    let description = `第 ${cycleNumber} 次 · 每`;
    if (interval > 1) {
      description += ` ${interval} `;
    }
    description += type;

    if (task.recurring_end_date) {
      description += ` · 至 ${format(new Date(task.recurring_end_date), 'yyyy/MM/dd', { locale: zhCN })}`;
    }

    return description;
  };

  return (
    <>
      <Card className={`hover:shadow-md transition-shadow border-l-4 ${statusBorderColors[task.status]}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={() => onToggle(task)}
              className="mt-1 flex-shrink-0"
            />
            <div
              className="flex-1 min-w-0 cursor-pointer overflow-hidden"
              onDoubleClick={handleDoubleClick}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3
                    className={`font-medium break-words ${
                      task.status === 'completed' ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {task.is_recurring && (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                              <Repeat className="h-3 w-3" />
                              <span className="text-xs font-medium">{task.current_cycle_number || 1}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="text-sm">{getRecurringDescription()}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateProgress(task)}
                        >
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-sm">更新进度</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(task)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-sm">编辑</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleDeleteClick}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-sm">删除</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className={`flex ${task.description || (task.attachments && task.attachments.length > 0) ? 'items-start justify-between' : 'items-center justify-end'} gap-4 mt-3`}>
                {(task.description || (task.attachments && task.attachments.length > 0)) && (
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div
                      className="cursor-pointer group"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      <div className="flex items-start gap-1">
                        {task.attachments && task.attachments.length > 0 && renderAttachments(task.attachments)}
                        {task.description && (
                          <p className="text-sm text-muted-foreground flex-1 min-w-0 break-words overflow-hidden">
                            {renderTextContent(task.description, isDescriptionExpanded)}
                          </p>
                        )}
                        {isDescriptionExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center flex-wrap gap-2 flex-shrink-0">
                  <Badge className={`${statusColors[task.status]} pointer-events-none`}>
                    {statusLabels[task.status]}
                  </Badge>
                  <Badge className={`${priorityColors[task.priority]} pointer-events-none`}>
                    {priorityLabels[task.priority]}
                  </Badge>
                  {task.tags && task.tags.length > 0 && (
                    <>
                      {task.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </>
                  )}
                  {task.deadline && countdownText && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`
                            flex items-center gap-1.5 px-2.5 py-1 rounded-md border
                            ${countdownStyles.bgColor}
                            ${countdownStyles.textColor}
                            ${countdownStyles.borderColor}
                            cursor-help transition-all hover:shadow-sm
                          `}>
                            <Timer className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">{countdownText}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="font-medium">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>截止时间：{format(new Date(task.deadline), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>

              {task.current_progress && (
                <div className="mt-4 flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="w-0.5 flex-1 bg-primary/20 mt-1" style={{ minHeight: '20px' }} />
                  </div>
                  <div className="flex-1 pb-2 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">当前进度</span>
                      {latestProgressTime && (
                        <>
                          <Clock className="h-3 w-3 text-muted-foreground ml-1" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(latestProgressTime), 'MM月dd日 HH:mm', { locale: zhCN })}
                          </span>
                        </>
                      )}
                    </div>
                    <div
                      className="cursor-pointer group"
                      onClick={() => setIsProgressExpanded(!isProgressExpanded)}
                    >
                      <div className="flex items-start gap-1">
                        {task.progress_history && task.progress_history.length > 0 &&
                         task.progress_history[task.progress_history.length - 1].attachments &&
                         task.progress_history[task.progress_history.length - 1].attachments.length > 0 &&
                         renderAttachments(task.progress_history[task.progress_history.length - 1].attachments)}
                        <p className="text-sm text-foreground flex-1 min-w-0 break-words overflow-hidden">
                          {renderTextContent(task.current_progress, isProgressExpanded)}
                        </p>
                        {isProgressExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除任务</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除任务「{task.title}」吗？此操作无法撤销，任务的所有数据（包括进度记录）都将被永久删除。
              {task.is_recurring && (
                <span className="block mt-2 text-purple-600 font-medium">
                  注意：这是一个重复任务，删除后将不会再自动创建新的周期任务。
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <img
            src={previewImage}
            alt="预览"
            className="w-full h-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TaskItem;
