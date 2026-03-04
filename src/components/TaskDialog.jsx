import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, X, Plus, Clock, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import FileUpload from './FileUpload';

const TaskDialog = ({ open, onOpenChange, onSubmit, task, allTags = [], initialDeadline = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    deadline: null,
    tags: [],
    attachments: [],
    is_recurring: false,
    recurring_type: 'weekly',
    recurring_interval: 1,
    recurring_end_date: null,
  });
  const [newTag, setNewTag] = useState('');
  const [deadlineHour, setDeadlineHour] = useState('23');
  const [deadlineMinute, setDeadlineMinute] = useState('59');
  const [deadlineSecond, setDeadlineSecond] = useState('00');
  const [recurringEndHour, setRecurringEndHour] = useState('23');
  const [recurringEndMinute, setRecurringEndMinute] = useState('59');
  const [recurringEndSecond, setRecurringEndSecond] = useState('00');

  useEffect(() => {
    if (task) {
      const deadline = task.deadline ? new Date(task.deadline) : null;
      const recurringEndDate = task.recurring_end_date ? new Date(task.recurring_end_date) : null;

      setFormData({
        title: task.title || '',
        description: task.description || '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        deadline: deadline,
        tags: task.tags || [],
        attachments: task.attachments || [],
        is_recurring: task.is_recurring || false,
        recurring_type: task.recurring_type || 'weekly',
        recurring_interval: task.recurring_interval || 1,
        recurring_end_date: recurringEndDate,
      });

      if (deadline) {
        setDeadlineHour(deadline.getHours().toString().padStart(2, '0'));
        setDeadlineMinute(deadline.getMinutes().toString().padStart(2, '0'));
        setDeadlineSecond(deadline.getSeconds().toString().padStart(2, '0'));
      } else {
        setDeadlineHour('23');
        setDeadlineMinute('59');
        setDeadlineSecond('00');
      }

      if (recurringEndDate) {
        setRecurringEndHour(recurringEndDate.getHours().toString().padStart(2, '0'));
        setRecurringEndMinute(recurringEndDate.getMinutes().toString().padStart(2, '0'));
        setRecurringEndSecond(recurringEndDate.getSeconds().toString().padStart(2, '0'));
      } else {
        setRecurringEndHour('23');
        setRecurringEndMinute('59');
        setRecurringEndSecond('00');
      }
    } else {
      // 如果有 initialDeadline，使用它作为默认截止日期
      const defaultDeadline = initialDeadline ? new Date(initialDeadline) : null;
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        deadline: defaultDeadline,
        tags: [],
        attachments: [],
        is_recurring: false,
        recurring_type: 'weekly',
        recurring_interval: 1,
        recurring_end_date: null,
      });
      if (defaultDeadline) {
        setDeadlineHour(defaultDeadline.getHours().toString().padStart(2, '0'));
        setDeadlineMinute(defaultDeadline.getMinutes().toString().padStart(2, '0'));
        setDeadlineSecond(defaultDeadline.getSeconds().toString().padStart(2, '0'));
      } else {
        setDeadlineHour('23');
        setDeadlineMinute('59');
        setDeadlineSecond('00');
      }
      setRecurringEndHour('23');
      setRecurringEndMinute('59');
      setRecurringEndSecond('00');
    }
  }, [task, open, initialDeadline]);

  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    let finalDeadline = formData.deadline;
    if (finalDeadline) {
      const newDeadline = new Date(finalDeadline);
      newDeadline.setHours(parseInt(deadlineHour, 10));
      newDeadline.setMinutes(parseInt(deadlineMinute, 10));
      newDeadline.setSeconds(parseInt(deadlineSecond, 10));
      finalDeadline = newDeadline;
    }

    let finalRecurringEndDate = formData.recurring_end_date;
    if (finalRecurringEndDate) {
      const newEndDate = new Date(finalRecurringEndDate);
      newEndDate.setHours(parseInt(recurringEndHour, 10));
      newEndDate.setMinutes(parseInt(recurringEndMinute, 10));
      newEndDate.setSeconds(parseInt(recurringEndSecond, 10));
      finalRecurringEndDate = newEndDate;
    }

    onSubmit({
      ...formData,
      deadline: finalDeadline,
      recurring_end_date: finalRecurringEndDate,
    });
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(newTag);
    }
  };

  const handleDateSelect = (date) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(deadlineHour, 10));
      newDate.setMinutes(parseInt(deadlineMinute, 10));
      newDate.setSeconds(parseInt(deadlineSecond, 10));
      setFormData({ ...formData, deadline: newDate });
    } else {
      setFormData({ ...formData, deadline: null });
    }
  };

  const handleRecurringEndDateSelect = (date) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setHours(parseInt(recurringEndHour, 10));
      newDate.setMinutes(parseInt(recurringEndMinute, 10));
      newDate.setSeconds(parseInt(recurringEndSecond, 10));
      setFormData({ ...formData, recurring_end_date: newDate });
    } else {
      setFormData({ ...formData, recurring_end_date: null });
    }
  };

  const handleTimeChange = (type, value) => {
    if (type === 'hour') {
      setDeadlineHour(value);
    } else if (type === 'minute') {
      setDeadlineMinute(value);
    } else if (type === 'second') {
      setDeadlineSecond(value);
    }

    if (formData.deadline) {
      const newDeadline = new Date(formData.deadline);
      if (type === 'hour') {
        newDeadline.setHours(parseInt(value, 10));
      } else if (type === 'minute') {
        newDeadline.setMinutes(parseInt(value, 10));
      } else if (type === 'second') {
        newDeadline.setSeconds(parseInt(value, 10));
      }
      setFormData({ ...formData, deadline: newDeadline });
    }
  };

  const handleRecurringEndTimeChange = (type, value) => {
    if (type === 'hour') {
      setRecurringEndHour(value);
    } else if (type === 'minute') {
      setRecurringEndMinute(value);
    } else if (type === 'second') {
      setRecurringEndSecond(value);
    }

    if (formData.recurring_end_date) {
      const newEndDate = new Date(formData.recurring_end_date);
      if (type === 'hour') {
        newEndDate.setHours(parseInt(value, 10));
      } else if (type === 'minute') {
        newEndDate.setMinutes(parseInt(value, 10));
      } else if (type === 'second') {
        newEndDate.setSeconds(parseInt(value, 10));
      }
      setFormData({ ...formData, recurring_end_date: newEndDate });
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteSecondOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const recurringTypeLabels = {
    daily: '每天',
    weekly: '每周',
    monthly: '每月',
    yearly: '每年',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? '编辑任务' : '创建新任务'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              placeholder="输入任务标题"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">任务描述（可选）</Label>
            <Textarea
              id="description"
              placeholder="输入任务描述"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>附件（可选）</Label>
            <FileUpload
              files={formData.attachments}
              onFilesChange={(files) => setFormData({ ...formData, attachments: files })}
              maxFiles={10}
              maxSize={5 * 1024 * 1024}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>优先级</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">低</SelectItem>
                  <SelectItem value="medium">中</SelectItem>
                  <SelectItem value="high">高</SelectItem>
                  <SelectItem value="urgent">紧急</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">待办</SelectItem>
                  <SelectItem value="in_progress">进行中</SelectItem>
                  <SelectItem value="paused">暂停</SelectItem>
                  <SelectItem value="completed">完成</SelectItem>
                  <SelectItem value="overdue">延期</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>截止时间（可选）</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? (
                      format(formData.deadline, 'yyyy年MM月dd日', { locale: zhCN })
                    ) : (
                      <span className="text-muted-foreground">选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={handleDateSelect}
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={deadlineHour} onValueChange={(value) => handleTimeChange('hour', value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hourOptions.map((hour) => (
                      <SelectItem key={hour} value={hour}>
                        {hour}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select value={deadlineMinute} onValueChange={(value) => handleTimeChange('minute', value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteSecondOptions.map((minute) => (
                      <SelectItem key={minute} value={minute}>
                        {minute}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select value={deadlineSecond} onValueChange={(value) => handleTimeChange('second', value)}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minuteSecondOptions.map((second) => (
                      <SelectItem key={second} value={second}>
                        {second}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formData.deadline && (
              <p className="text-xs text-muted-foreground">
                完整截止时间：{format(formData.deadline, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
              </p>
            )}
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-purple-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="h-5 w-5 text-purple-600" />
                <Label htmlFor="is-recurring" className="text-base font-semibold text-purple-700">
                  重复任务
                </Label>
              </div>
              <Switch
                id="is-recurring"
                checked={formData.is_recurring}
                onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
              />
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 pl-7">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>重复周期</Label>
                    <Select
                      value={formData.recurring_type}
                      onValueChange={(value) => setFormData({ ...formData, recurring_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">每天</SelectItem>
                        <SelectItem value="weekly">每周</SelectItem>
                        <SelectItem value="monthly">每月</SelectItem>
                        <SelectItem value="yearly">每年</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>重复间隔</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.recurring_interval}
                      onChange={(e) => setFormData({ ...formData, recurring_interval: parseInt(e.target.value) || 1 })}
                      placeholder="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      每 {formData.recurring_interval} {recurringTypeLabels[formData.recurring_type]}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>重复结束日期（可选，留空表示无限重复）</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.recurring_end_date ? (
                            format(formData.recurring_end_date, 'yyyy年MM月dd日', { locale: zhCN })
                          ) : (
                            <span className="text-muted-foreground">选择结束日期</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.recurring_end_date}
                          onSelect={handleRecurringEndDateSelect}
                          locale={zhCN}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Select value={recurringEndHour} onValueChange={(value) => handleRecurringEndTimeChange('hour', value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {hourOptions.map((hour) => (
                            <SelectItem key={hour} value={hour}>
                              {hour}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">:</span>
                      <Select value={recurringEndMinute} onValueChange={(value) => handleRecurringEndTimeChange('minute', value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteSecondOptions.map((minute) => (
                            <SelectItem key={minute} value={minute}>
                              {minute}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground">:</span>
                      <Select value={recurringEndSecond} onValueChange={(value) => handleRecurringEndTimeChange('second', value)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {minuteSecondOptions.map((second) => (
                            <SelectItem key={second} value={second}>
                              {second}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {formData.recurring_end_date && (
                    <p className="text-xs text-muted-foreground">
                      重复结束时间：{format(formData.recurring_end_date, 'yyyy年MM月dd日 HH:mm:ss', { locale: zhCN })}
                    </p>
                  )}
                </div>

                <div className="p-3 bg-purple-100/50 rounded-md">
                  <p className="text-sm text-purple-700">
                    <strong>提示：</strong>完成当前周期的任务后，系统会自动创建下一个周期的任务。
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>标签</Label>
            <div className="flex gap-2">
              <Input
                placeholder="输入标签名称后按回车"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleTagKeyPress}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {allTags.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">常用标签：</p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 p-3 bg-muted rounded-md">
                {formData.tags.map(tag => (
                  <Badge key={tag} className="gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.title.trim()}>
            {task ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDialog;
