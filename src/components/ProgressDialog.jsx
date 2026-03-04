import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TrendingUp } from 'lucide-react';
import FileUpload from './FileUpload';
import ProgressTimeline from './ProgressTimeline';

const ProgressDialog = ({
  open,
  onOpenChange,
  onSubmit,
  onEdit,
  onDelete,
  task,
}) => {
  const [progressContent, setProgressContent] = useState('');
  const [progressAttachments, setProgressAttachments] = useState([]);

  useEffect(() => {
    if (!open) {
      setProgressContent('');
      setProgressAttachments([]);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!progressContent.trim()) return;

    onSubmit({
      content: progressContent.trim(),
      attachments: progressAttachments,
    });

    setProgressContent('');
    setProgressAttachments([]);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            更新进度 - {task.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* 新进度输入 */}
          <div className="space-y-3">
            <Label>添加新进度</Label>
            <Textarea
              placeholder="输入进度更新内容..."
              value={progressContent}
              onChange={(e) => setProgressContent(e.target.value)}
              rows={3}
            />
            <FileUpload
              files={progressAttachments}
              onFilesChange={setProgressAttachments}
              maxFiles={5}
              maxSize={5 * 1024 * 1024}
            />
            <Button
              onClick={handleSubmit}
              disabled={!progressContent.trim()}
              className="w-full"
            >
              添加进度
            </Button>
          </div>

          {/* 历史进度 */}
          {task.progress_history && task.progress_history.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Label className="mb-2">历史进度</Label>
              <ScrollArea className="flex-1">
                <ProgressTimeline
                  progressHistory={task.progress_history}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </ScrollArea>
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
  );
};

export default ProgressDialog;
