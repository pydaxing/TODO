import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, User, Database, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { userStorage, dataExport } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

const UserSettings = ({ open, onOpenChange, onUserUpdate }) => {
  const { toast } = useToast();
  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('');
  const [importData, setImportData] = useState('');
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const user = userStorage.get();
      setUserName(user.name);
      setUserAvatar(user.avatar);
    }
  }, [open]);

  const handleSaveUser = () => {
    const updatedUser = userStorage.update({
      name: userName.trim() || '用户',
      avatar: userAvatar.trim(),
    });
    onUserUpdate?.(updatedUser);
    toast({
      title: '保存成功',
      description: '用户设置已更新',
    });
  };

  const handleExport = () => {
    const data = dataExport.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: '导出成功',
      description: '数据已导出为 JSON 文件',
    });
  };

  const handleImport = () => {
    if (!importData.trim()) {
      toast({
        title: '导入失败',
        description: '请粘贴要导入的 JSON 数据',
        variant: 'destructive',
      });
      return;
    }

    const success = dataExport.importAll(importData);
    if (success) {
      toast({
        title: '导入成功',
        description: '数据已导入，页面将刷新',
      });
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast({
        title: '导入失败',
        description: '数据格式无效，请检查 JSON 格式',
        variant: 'destructive',
      });
    }
  };

  const handleClearAll = () => {
    dataExport.clearAll();
    toast({
      title: '清除成功',
      description: '所有数据已清除，页面将刷新',
    });
    setClearDialogOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              设置
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="user" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                用户设置
              </TabsTrigger>
              <TabsTrigger value="data" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                数据管理
              </TabsTrigger>
            </TabsList>

            <TabsContent value="user" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="userName">用户名</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="输入你的名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userAvatar">头像 URL（可选）</Label>
                <Input
                  id="userAvatar"
                  value={userAvatar}
                  onChange={(e) => setUserAvatar(e.target.value)}
                  placeholder="输入头像图片链接"
                />
                {userAvatar && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground">预览：</span>
                    <img
                      src={userAvatar}
                      alt="头像预览"
                      className="w-10 h-10 rounded-full object-cover border"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><circle cx="12" cy="12" r="12"/></svg>';
                      }}
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleSaveUser} className="w-full">
                保存用户设置
              </Button>
            </TabsContent>

            <TabsContent value="data" className="space-y-6 mt-4">
              {/* 导出数据 */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">导出数据</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  将所有任务和白板数据导出为 JSON 文件，用于备份或迁移到其他设备。
                </p>
                <Button onClick={handleExport} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  导出所有数据
                </Button>
              </div>

              {/* 导入数据 */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">导入数据</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  从之前导出的 JSON 文件中恢复数据。注意：导入会覆盖现有数据！
                </p>
                <Textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="粘贴 JSON 数据到这里..."
                  rows={4}
                />
                <Button onClick={handleImport} variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  导入数据
                </Button>
              </div>

              {/* 清除数据 */}
              <div className="space-y-3 p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <h3 className="font-semibold text-destructive">危险操作</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  清除所有本地数据，包括任务、白板和用户设置。此操作不可撤销！
                </p>
                <Button
                  onClick={() => setClearDialogOpen(true)}
                  variant="destructive"
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  清除所有数据
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认清除所有数据？
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除所有任务、白板和用户设置。建议先导出数据进行备份。
              <br />
              <strong className="text-destructive">此操作不可撤销！</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserSettings;
