import { ScrollArea } from '@/components/ui/scroll-area';
import { Color } from '@tiptap/extension-color';
import { toast } from 'sonner';
import StarterKit from '@tiptap/starter-kit';
import { PopoverContent, Popover, PopoverTrigger } from '@/components/ui/popover';
import { useCallback, useEffect, useRef, useState } from 'react';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { Input } from '@/components/ui/input';
import { whiteboardApi } from '@/lib/api';
import { AlertDialog, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { SelectItem, Select, SelectContent, SelectValue, SelectTrigger } from '@/components/ui/select';
import { Palette, Underline as UnderlineIcon, AlignCenter, Check, Undo, Code, Heading1, AlignLeft, Quote, Trash2, Italic, Heading2, Heading3, Edit2, Strikethrough, Redo, X, Bold, List, AlignRight, Plus, ListOrdered, Highlighter } from 'lucide-react';
import Highlight from '@tiptap/extension-highlight';
import { useEditor, EditorContent } from '@tiptap/react';
import { TextStyle } from '@tiptap/extension-text-style';
import { Button } from '@/components/ui/button';

const LAST_WHITEBOARD_KEY = 'todo_last_whiteboard';

const Whiteboard = ({ onClose }) => {
  const [currentWhiteboardId, setCurrentWhiteboardId] = useState(null);
  const [whiteboards, setWhiteboards] = useState([]);
  const [whiteboardTitle, setWhiteboardTitle] = useState('新建灵感白板');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strike: false,
    heading1: false, heading2: false, heading3: false,
    bulletList: false, orderedList: false,
    alignLeft: false, alignCenter: false, alignRight: false,
    blockquote: false, codeBlock: false,
  });

  const currentWhiteboardIdRef = useRef(null);
  const currentContentRef = useRef('');
  const saveTimeoutRef = useRef(null);
  const isLoadingRef = useRef(false);
  const isSwitchingRef = useRef(false);
  const titleInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: '开始记录你的想法...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none p-8 min-h-full',
      },
    },
    onUpdate: ({ editor }) => {
      if (isLoadingRef.current || isSwitchingRef.current) return;
      const newContent = editor.getHTML();
      currentContentRef.current = newContent;
      updateFormatStates(editor);
      debouncedSave();
    },
    onSelectionUpdate: ({ editor }) => {
      updateFormatStates(editor);
    },
  });

  const updateFormatStates = useCallback((editor) => {
    if (!editor) return;
    setActiveFormats({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strike: editor.isActive('strike'),
      heading1: editor.isActive('heading', { level: 1 }),
      heading2: editor.isActive('heading', { level: 2 }),
      heading3: editor.isActive('heading', { level: 3 }),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      alignLeft: editor.isActive({ textAlign: 'left' }),
      alignCenter: editor.isActive({ textAlign: 'center' }),
      alignRight: editor.isActive({ textAlign: 'right' }),
      blockquote: editor.isActive('blockquote'),
      codeBlock: editor.isActive('codeBlock'),
    });
  }, []);

  const toggleFormat = useCallback((formatType, command) => {
    if (!editor) return;
    editor.chain().focus()[command]().run();
    setTimeout(() => updateFormatStates(editor), 0);
  }, [editor, updateFormatStates]);

  const loadWhiteboards = useCallback(async () => {
    try {
      const boards = await whiteboardApi.getAll();
      setWhiteboards(boards);
      return boards;
    } catch (error) {
      console.error('加载白板列表失败:', error);
      return [];
    }
  }, []);

  const saveWhiteboardToDatabase = useCallback(async (id, title, content) => {
    if (!id) return false;
    try {
      await whiteboardApi.update(id, { title, content });
      return true;
    } catch (error) {
      console.error('保存白板失败:', error);
      return false;
    }
  }, []);

  const saveCurrentWhiteboard = useCallback(async () => {
    const whiteboardId = currentWhiteboardIdRef.current;
    if (!editor || !whiteboardId || isSaving || isLoadingRef.current) return;
    setIsSaving(true);
    try {
      await saveWhiteboardToDatabase(whiteboardId, whiteboardTitle, currentContentRef.current);
    } finally {
      setIsSaving(false);
    }
  }, [editor, whiteboardTitle, saveWhiteboardToDatabase, isSaving]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveCurrentWhiteboard(), 1000);
  }, [saveCurrentWhiteboard]);

  const loadWhiteboard = useCallback(async (whiteboardId) => {
    if (!editor || !whiteboardId || isLoadingRef.current) return;
    isLoadingRef.current = true;
    isSwitchingRef.current = true;
    try {
      const data = await whiteboardApi.getById(whiteboardId);
      if (!data) throw new Error('Whiteboard not found');
      setCurrentWhiteboardId(data.id);
      currentWhiteboardIdRef.current = data.id;
      setWhiteboardTitle(data.title || '新建灵感白板');
      localStorage.setItem(LAST_WHITEBOARD_KEY, data.id);
      const content = data.content || '';
      editor.commands.setContent(content);
      currentContentRef.current = content;
      updateFormatStates(editor);
    } catch (error) {
      console.error('加载白板失败:', error);
      toast.error('加载白板失败');
    } finally {
      isLoadingRef.current = false;
      setTimeout(() => { isSwitchingRef.current = false; }, 200);
    }
  }, [editor, updateFormatStates]);

  const switchWhiteboard = useCallback(async (whiteboardId) => {
    if (whiteboardId === currentWhiteboardId) return;
    isSwitchingRef.current = true;
    if (currentWhiteboardId) await saveCurrentWhiteboard();
    await loadWhiteboard(whiteboardId);
  }, [currentWhiteboardId, saveCurrentWhiteboard, loadWhiteboard]);

  const createNewWhiteboard = useCallback(async () => {
    if (!editor) return;
    isSwitchingRef.current = true;
    if (currentWhiteboardId) await saveCurrentWhiteboard();
    try {
      const data = await whiteboardApi.create({ title: '新建灵感白板', content: '' });
      setCurrentWhiteboardId(data.id);
      currentWhiteboardIdRef.current = data.id;
      setWhiteboardTitle('新建灵感白板');
      localStorage.setItem(LAST_WHITEBOARD_KEY, data.id);
      editor.commands.setContent('');
      currentContentRef.current = '';
      setActiveFormats({
        bold: false, italic: false, underline: false, strike: false,
        heading1: false, heading2: false, heading3: false,
        bulletList: false, orderedList: false,
        alignLeft: false, alignCenter: false, alignRight: false,
        blockquote: false, codeBlock: false,
      });
      await loadWhiteboards();
      toast.success('新建白板成功');
      setTimeout(() => { isSwitchingRef.current = false; }, 200);
    } catch (error) {
      console.error('新建白板失败:', error);
      toast.error('新建白板失败');
      isSwitchingRef.current = false;
    }
  }, [editor, currentWhiteboardId, saveCurrentWhiteboard, loadWhiteboards]);

  const deleteWhiteboard = useCallback(async () => {
    if (!currentWhiteboardId || whiteboards.length <= 1) {
      toast.error('至少需要保留一个白板');
      setDeleteDialogOpen(false);
      return;
    }
    try {
      await whiteboardApi.delete(currentWhiteboardId);
      toast.success('白板已删除');
      setDeleteDialogOpen(false);
      const boards = await loadWhiteboards();
      if (boards && boards.length > 0) await loadWhiteboard(boards[0].id);
    } catch (error) {
      console.error('删除白板失败:', error);
      toast.error('删除白板失败');
    }
  }, [currentWhiteboardId, whiteboards.length, loadWhiteboards, loadWhiteboard]);

  const closeWhiteboard = useCallback(async () => {
    if (currentWhiteboardId) {
      await saveCurrentWhiteboard();
      localStorage.setItem(LAST_WHITEBOARD_KEY, currentWhiteboardId);
    }
    if (onClose) onClose();
  }, [currentWhiteboardId, saveCurrentWhiteboard, onClose]);

  const startEditTitle = useCallback(() => {
    setTempTitle(whiteboardTitle);
    setIsEditingTitle(true);
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
        titleInputRef.current.select();
      }
    }, 50);
  }, [whiteboardTitle]);

  const saveTitle = useCallback(async () => {
    const trimmedTitle = tempTitle.trim();
    if (!trimmedTitle) {
      toast.error('白板名称不能为空');
      return;
    }
    setWhiteboardTitle(trimmedTitle);
    setIsEditingTitle(false);
    if (currentWhiteboardId) {
      const success = await saveWhiteboardToDatabase(currentWhiteboardId, trimmedTitle, currentContentRef.current);
      if (success) {
        toast.success('白板名称已更新');
        await loadWhiteboards();
      }
    }
  }, [tempTitle, currentWhiteboardId, saveWhiteboardToDatabase, loadWhiteboards]);

  const cancelEditTitle = useCallback(() => {
    setIsEditingTitle(false);
    setTempTitle('');
  }, []);

  useEffect(() => {
    if (!editor) return;
    const initWhiteboards = async () => {
      const boards = await loadWhiteboards();
      if (boards && boards.length > 0) {
        const lastViewedId = localStorage.getItem(LAST_WHITEBOARD_KEY);
        const lastViewedWhiteboard = lastViewedId ? boards.find(b => b.id === lastViewedId) : null;
        if (lastViewedWhiteboard) {
          await loadWhiteboard(lastViewedWhiteboard.id);
        } else {
          await loadWhiteboard(boards[0].id);
        }
      } else {
        await createNewWhiteboard();
      }
    };
    initWhiteboards();
  }, [editor]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (currentWhiteboardId) saveCurrentWhiteboard();
    };
  }, [currentWhiteboardId, saveCurrentWhiteboard]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">正在加载编辑器...</p>
        </div>
      </div>
    );
  }

  const textColors = [
    { name: '黑色', value: '#000000' },
    { name: '红色', value: '#ef4444' },
    { name: '橙色', value: '#f97316' },
    { name: '黄色', value: '#eab308' },
    { name: '绿色', value: '#22c55e' },
    { name: '蓝色', value: '#3b82f6' },
    { name: '紫色', value: '#a855f7' },
    { name: '粉色', value: '#ec4899' },
  ];

  const highlightColors = [
    { name: '黄色', value: '#fef08a' },
    { name: '绿色', value: '#bbf7d0' },
    { name: '蓝色', value: '#bfdbfe' },
    { name: '紫色', value: '#e9d5ff' },
    { name: '粉色', value: '#fbcfe8' },
    { name: '橙色', value: '#fed7aa' },
  ];

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-sm rounded-xl border border-blue-100/50 shadow-md overflow-hidden">
      <div className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 flex-shrink-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100/30">
          <div className="flex items-center gap-2 w-[120px] flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              灵感白板
            </h2>
          </div>

          <div className="flex-1 flex items-center justify-center px-4">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-md w-full">
                <Input
                  ref={titleInputRef}
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    else if (e.key === 'Escape') cancelEditTitle();
                  }}
                  onBlur={saveTitle}
                  className="h-8 text-center border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  placeholder="输入白板名称"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={saveTitle} title="保存">
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelEditTitle} title="取消">
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Select value={currentWhiteboardId?.toString()} onValueChange={(value) => switchWhiteboard(value)}>
                  <SelectTrigger className="max-w-md h-8 border-0 shadow-none bg-transparent hover:bg-blue-50/50 transition-colors focus:ring-0 focus:ring-offset-0">
                    <SelectValue>
                      <span className="font-medium text-blue-600">{whiteboardTitle}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {whiteboards.map((wb) => (
                      <SelectItem key={wb.id} value={wb.id.toString()}>{wb.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 transition-colors duration-150" onClick={startEditTitle} title="编辑白板名称">
                  <Edit2 className="h-3.5 w-3.5 text-blue-600" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-[120px] flex-shrink-0 justify-end">
            <Button variant="outline" size="icon" onClick={createNewWhiteboard} className="h-8 w-8 rounded-full border-blue-300 hover:bg-blue-50 hover:border-blue-400 transition-all duration-150" title="新建白板">
              <Plus className="h-4 w-4 text-blue-600" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setDeleteDialogOpen(true)} disabled={whiteboards.length <= 1} className="h-8 w-8 rounded-full border-red-300 hover:bg-red-50 hover:border-red-400 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed" title={whiteboards.length <= 1 ? "至少需要保留一个白板" : "删除白板"}>
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
            <Button variant="outline" size="icon" onClick={closeWhiteboard} className="h-8 w-8 rounded-full border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-150" title="关闭白板">
              <X className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>

        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 px-4 pb-3 min-w-max">
            <div className="flex items-center gap-1">
              <Button variant={activeFormats.bold ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('bold', 'toggleBold')} className="h-8 w-8 p-0 transition-all duration-150" title="粗体">
                <Bold className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.italic ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('italic', 'toggleItalic')} className="h-8 w-8 p-0 transition-all duration-150" title="斜体">
                <Italic className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.underline ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('underline', 'toggleUnderline')} className="h-8 w-8 p-0 transition-all duration-150" title="下划线">
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.strike ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('strike', 'toggleStrike')} className="h-8 w-8 p-0 transition-all duration-150" title="删除线">
                <Strikethrough className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-blue-200"></div>

            <div className="flex items-center gap-1">
              <Button variant={activeFormats.heading1 ? 'default' : 'ghost'} size="sm" onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setTimeout(() => updateFormatStates(editor), 0); }} className="h-8 w-8 p-0 transition-all duration-150" title="标题1">
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.heading2 ? 'default' : 'ghost'} size="sm" onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setTimeout(() => updateFormatStates(editor), 0); }} className="h-8 w-8 p-0 transition-all duration-150" title="标题2">
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.heading3 ? 'default' : 'ghost'} size="sm" onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setTimeout(() => updateFormatStates(editor), 0); }} className="h-8 w-8 p-0 transition-all duration-150" title="标题3">
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-blue-200"></div>

            <div className="flex items-center gap-1">
              <Button variant={activeFormats.bulletList ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('bulletList', 'toggleBulletList')} className="h-8 w-8 p-0 transition-all duration-150" title="无序列表">
                <List className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.orderedList ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('orderedList', 'toggleOrderedList')} className="h-8 w-8 p-0 transition-all duration-150" title="有序列表">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-blue-200"></div>

            <div className="flex items-center gap-1">
              <Button variant={activeFormats.alignLeft ? 'default' : 'ghost'} size="sm" onClick={() => { editor.chain().focus().setTextAlign('left').run(); setTimeout(() => updateFormatStates(editor), 0); }} className="h-8 w-8 p-0 transition-all duration-150" title="左对齐">
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.alignCenter ? 'default' : 'ghost'} size="sm" onClick={() => { editor.chain().focus().setTextAlign('center').run(); setTimeout(() => updateFormatStates(editor), 0); }} className="h-8 w-8 p-0 transition-all duration-150" title="居中对齐">
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.alignRight ? 'default' : 'ghost'} size="sm" onClick={() => { editor.chain().focus().setTextAlign('right').run(); setTimeout(() => updateFormatStates(editor), 0); }} className="h-8 w-8 p-0 transition-all duration-150" title="右对齐">
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-blue-200"></div>

            <div className="flex items-center gap-1">
              <Button variant={activeFormats.blockquote ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('blockquote', 'toggleBlockquote')} className="h-8 w-8 p-0 transition-all duration-150" title="引用">
                <Quote className="h-4 w-4" />
              </Button>
              <Button variant={activeFormats.codeBlock ? 'default' : 'ghost'} size="sm" onClick={() => toggleFormat('codeBlock', 'toggleCodeBlock')} className="h-8 w-8 p-0 transition-all duration-150" title="代码块">
                <Code className="h-4 w-4" />
              </Button>
            </div>

            <div className="h-6 w-px bg-blue-200"></div>

            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 transition-all duration-150" title="文字颜色">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">文字颜色</p>
                    <div className="grid grid-cols-4 gap-1">
                      {textColors.map(color => (
                        <button key={color.value} className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-150" style={{ backgroundColor: color.value }} onClick={() => editor.chain().focus().setColor(color.value).run()} title={color.name} />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 transition-all duration-150" title="高亮颜色">
                    <Highlighter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">高亮颜色</p>
                    <div className="grid grid-cols-3 gap-1">
                      {highlightColors.map(color => (
                        <button key={color.value} className="w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 transition-all duration-150" style={{ backgroundColor: color.value }} onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()} title={color.name} />
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => editor.chain().focus().unsetHighlight().run()}>
                      清除高亮
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="h-6 w-px bg-blue-200"></div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="h-8 w-8 p-0 transition-all duration-150" title="撤销">
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="h-8 w-8 p-0 transition-all duration-150" title="重做">
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        <EditorContent editor={editor} className="h-full" />
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除白板</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除白板「{whiteboardTitle}」吗？此操作无法撤销，白板的所有内容都将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={deleteWhiteboard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Whiteboard;
