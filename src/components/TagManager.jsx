import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tag, Edit2, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const TagManager = ({ open, onOpenChange, tasks, onUpdateTasks }) => {
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [deleteConfirmTag, setDeleteConfirmTag] = useState(null);

  // 统计所有标签及其使用次数
  const tagStats = useMemo(() => {
    const stats = {};
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
          if (!stats[tag]) {
            stats[tag] = { name: tag, count: 0, taskIds: [] };
          }
          stats[tag].count++;
          stats[tag].taskIds.push(task.id);
        });
      }
    });
    // 按使用次数排序
    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [tasks]);

  // 开始编辑标签
  const startEdit = (tag) => {
    setEditingTag(tag.name);
    setNewTagName(tag.name);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTag(null);
    setNewTagName('');
  };

  // 保存标签重命名
  const saveRename = async () => {
    if (!newTagName.trim()) {
      toast.error('标签名称不能为空');
      return;
    }

    if (newTagName === editingTag) {
      cancelEdit();
      return;
    }

    // 检查是否重名
    if (tagStats.some(t => t.name === newTagName.trim() && t.name !== editingTag)) {
      toast.error('标签名称已存在');
      return;
    }

    try {
      // 找出所有包含该标签的任务，更新标签名
      const tasksToUpdate = tasks.filter(task =>
        task.tags && task.tags.includes(editingTag)
      );

      for (const task of tasksToUpdate) {
        const updatedTags = task.tags.map(t =>
          t === editingTag ? newTagName.trim() : t
        );
        await onUpdateTasks(task.id, { tags: updatedTags });
      }

      toast.success(`已将 "${editingTag}" 重命名为 "${newTagName.trim()}"`);
      cancelEdit();
    } catch (error) {
      console.error('重命名标签失败:', error);
      toast.error('重命名失败');
    }
  };

  // 删除标签
  const confirmDelete = async () => {
    if (!deleteConfirmTag) return;

    try {
      // 找出所有包含该标签的任务，移除标签
      const tasksToUpdate = tasks.filter(task =>
        task.tags && task.tags.includes(deleteConfirmTag)
      );

      for (const task of tasksToUpdate) {
        const updatedTags = task.tags.filter(t => t !== deleteConfirmTag);
        await onUpdateTasks(task.id, { tags: updatedTags });
      }

      toast.success(`已删除标签 "${deleteConfirmTag}"`);
      setDeleteConfirmTag(null);
    } catch (error) {
      console.error('删除标签失败:', error);
      toast.error('删除失败');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              标签管理
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {tagStats.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {tagStats.map(tag => (
                    <div
                      key={tag.name}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      {editingTag === tag.name ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="h-8"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={saveRename}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">{tag.name}</Badge>
                            <span className="text-sm text-muted-foreground">
                              {tag.count} 个任务
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => startEdit(tag)}
                              title="重命名"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteConfirmTag(tag.name)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无标签</p>
                <p className="text-sm mt-1">在任务中添加标签后会显示在这里</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={!!deleteConfirmTag} onOpenChange={() => setDeleteConfirmTag(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除标签 "{deleteConfirmTag}" 吗？该标签将从所有任务中移除，此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TagManager;
