import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Edit, Trash2, Check, X, File, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import FileUpload from './FileUpload';

const ProgressTimeline = ({ progressHistory = [], onEdit, onDelete }) => {
  const [editingIndex, setEditingIndex] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editAttachments, setEditAttachments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  if (!progressHistory || progressHistory.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        暂无进度记录
      </div>
    );
  }

  const progressWithIndex = progressHistory.map((progress, index) => ({
    ...progress,
    originalIndex: index,
  }));

  const sortedHistory = [...progressWithIndex].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );

  const handleStartEdit = (progress) => {
    setEditingIndex(progress.originalIndex);
    setEditContent(progress.content);
    setEditAttachments(progress.attachments || []);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditContent('');
    setEditAttachments([]);
  };

  const handleConfirmEdit = (originalIndex) => {
    if (editContent.trim() || editAttachments.length > 0) {
      onEdit(originalIndex, editContent.trim(), editAttachments);
      setEditingIndex(null);
      setEditContent('');
      setEditAttachments([]);
    }
  };

  const isImage = (type) => {
    return type && type.startsWith('image/');
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-1 mb-2">
        {attachments.map((file, index) => (
          <TooltipProvider key={index} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {isImage(file.type) ? (
                  <div
                    className="w-6 h-6 rounded border border-muted hover:border-primary cursor-pointer overflow-hidden transition-all"
                    onClick={() => setPreviewImage(file.url)}
                  >
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded border border-muted hover:border-primary flex items-center justify-center bg-muted/50 transition-all"
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

  return (
    <>
      <div className="space-y-3">
        {sortedHistory.map((progress, displayIndex) => {
          const isEditing = editingIndex === progress.originalIndex;
          
          return (
            <div key={progress.originalIndex} className="flex gap-3 group">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  displayIndex === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                }`} />
                {displayIndex < sortedHistory.length - 1 && (
                  <div className="w-0.5 h-full bg-muted-foreground/20 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(progress.timestamp), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                    </span>
                    {displayIndex === 0 && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        最新
                      </span>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleStartEdit(progress)}
                        title="编辑进度"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onDelete(progress.originalIndex)}
                        title="删除进度"
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>进度内容</Label>
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] resize-none"
                        autoFocus
                        placeholder="输入进度内容..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>附件（可选）</Label>
                      <FileUpload
                        files={editAttachments}
                        onFilesChange={setEditAttachments}
                        maxFiles={10}
                        maxSize={20 * 1024 * 1024}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleConfirmEdit(progress.originalIndex)}
                        disabled={!editContent.trim() && editAttachments.length === 0}
                        className="h-7"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        确认
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-7"
                      >
                        <X className="h-3 w-3 mr-1" />
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {progress.attachments && progress.attachments.length > 0 && renderAttachments(progress.attachments)}
                    <p className="text-sm">{progress.content}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

export default ProgressTimeline;
