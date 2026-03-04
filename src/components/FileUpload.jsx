import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Upload, X, Image as ImageIcon, Link, File, Plus } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 文件上传组件
 * 支持本地图片上传（Base64）和外部 URL
 */
const FileUpload = ({ files = [], onFilesChange, maxFiles = 10, maxSize = 5 * 1024 * 1024 }) => {
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  // 处理本地文件上传
  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`最多只能上传 ${maxFiles} 个文件`);
      return;
    }

    const newFiles = [];

    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        toast.error(`文件 ${file.name} 超过大小限制 (${Math.round(maxSize / 1024 / 1024)}MB)`);
        continue;
      }

      // 只允许图片
      if (!file.type.startsWith('image/')) {
        toast.error(`只支持上传图片文件`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        newFiles.push({
          name: file.name,
          type: file.type,
          size: file.size,
          url: base64,
          isLocal: true,
        });
      } catch (error) {
        console.error('读取文件失败:', error);
        toast.error(`读取文件 ${file.name} 失败`);
      }
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles]);
      toast.success(`成功添加 ${newFiles.length} 个文件`);
    }

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 文件转 Base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // 添加外部 URL
  const handleAddUrl = () => {
    const url = urlInput.trim();

    if (!url) {
      toast.error('请输入图片 URL');
      return;
    }

    // 简单验证 URL 格式
    try {
      new URL(url);
    } catch {
      toast.error('请输入有效的 URL');
      return;
    }

    if (files.length >= maxFiles) {
      toast.error(`最多只能添加 ${maxFiles} 个文件`);
      return;
    }

    // 从 URL 提取文件名
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1].split('?')[0] || 'image';

    const newFile = {
      name: fileName,
      type: 'image/unknown',
      size: 0,
      url: url,
      isExternal: true,
    };

    onFilesChange([...files, newFile]);
    setUrlInput('');
    setUrlDialogOpen(false);
    toast.success('图片已添加');
  };

  // 删除文件
  const handleRemove = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  // 判断是否是图片
  const isImage = (file) => {
    return file.type?.startsWith('image/') || file.isExternal;
  };

  return (
    <div className="space-y-3">
      {/* 上传按钮区域 */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={files.length >= maxFiles}
        >
          <Upload className="h-4 w-4 mr-2" />
          上传图片
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUrlDialogOpen(true)}
          disabled={files.length >= maxFiles}
        >
          <Link className="h-4 w-4 mr-2" />
          添加 URL
        </Button>

        <span className="text-xs text-muted-foreground self-center">
          {files.length}/{maxFiles}
        </span>
      </div>

      {/* 文件预览列表 */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative group w-16 h-16 rounded-md border overflow-hidden bg-muted"
            >
              {isImage(file) ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewImage(file.url)}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray"><rect width="24" height="24"/><text x="12" y="16" text-anchor="middle" font-size="8" fill="white">Error</text></svg>';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <File className="h-6 w-6 text-muted-foreground" />
                </div>
              )}

              {/* 删除按钮 */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>

              {/* 外部链接标识 */}
              {file.isExternal && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  URL
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 添加 URL 对话框 */}
      <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>添加图片 URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="输入图片 URL，如 https://example.com/image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              支持 jpg、png、gif、webp 等常见图片格式
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUrlDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddUrl}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 图片预览对话框 */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl">
          <img
            src={previewImage}
            alt="预览"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileUpload;
