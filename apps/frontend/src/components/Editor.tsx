'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
import { useRef, useState, useCallback } from 'react';

interface EditorProps {
  onChange: (html: string) => void;
  initialContent?: string;
}

function ToolbarButton({
  onClick,
  active = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        active
          ? 'bg-brand-100 text-brand-700'
          : 'text-text-secondary hover:bg-brand-50 hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-5 w-px bg-border" />;
}

export default function Editor({ onChange, initialContent }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Placeholder.configure({ placeholder: '내용을 입력하세요...' }),
      TextStyle,
      FontSize,
    ],
    content: initialContent || '',
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const imageFile = Array.from(files).find((f) => f.type.startsWith('image/'));
        if (!imageFile) return false;

        event.preventDefault();
        const blobUrl = URL.createObjectURL(imageFile);
        const { schema } = view.state;
        const node = schema.nodes.image.create({ src: blobUrl });
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (pos) {
          const tr = view.state.tr.insert(pos.pos, node);
          view.dispatch(tr);
        }
        return true;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'));
        if (!imageItem) return false;

        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return false;

        const blobUrl = URL.createObjectURL(file);
        const { schema } = view.state;
        const node = schema.nodes.image.create({ src: blobUrl });
        const tr = view.state.tr.replaceSelectionWith(node);
        view.dispatch(tr);
        return true;
      },
    },
  });

  function handleImageInsert(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const blobUrl = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: blobUrl }).run();
    e.target.value = '';
  }

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only leave if actually leaving the container
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    setIsDragOver(false);
  }, []);

  function getCurrentFontSize(): string {
    if (!editor) return '';
    const attrs = editor.getAttributes('textStyle');
    return attrs.fontSize || '';
  }

  function handleFontSizeChange(value: string) {
    if (!editor) return;
    if (value === '') {
      // "보통" — remove inline font-size
      editor.chain().focus().unsetMark('textStyle').run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: value }).run();
    }
  }

  if (!editor) return null;

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-surface-card shadow-sm transition-colors ${
        isDragOver ? 'editor-drag-over border-brand-600' : 'border-border'
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border bg-brand-50/50 px-2 py-1.5">
        {/* Font size dropdown */}
        <div className="relative">
          <select
            value={getCurrentFontSize()}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            title="글자 크기"
            className="h-8 appearance-none rounded-md border-none bg-transparent pl-2 pr-6 text-xs text-text-secondary transition-colors hover:bg-brand-50 hover:text-text-primary focus:outline-none"
          >
            <option value="14px">작게</option>
            <option value="">보통</option>
            <option value="20px">크게</option>
            <option value="24px">아주 크게</option>
          </select>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2 text-text-muted">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <ToolbarDivider />

        {/* Formatting group */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="굵게"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="기울임"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="19" x2="10" y1="4" y2="4" />
            <line x1="14" x2="5" y1="20" y2="20" />
            <line x1="15" x2="9" y1="4" y2="20" />
          </svg>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Block group */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="제목"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="M4 12h8" />
            <path d="M4 18V6" />
            <path d="M12 18V6" />
            <path d="M17 12a2 2 0 0 0 0 4h1a2 2 0 0 1 0 4h-1" />
            <path d="M21 12v1" />
            <path d="M17 20v-1" />
          </svg>
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="목록"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
          </svg>
        </ToolbarButton>

        <ToolbarDivider />

        {/* Content group */}
        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          title="이미지 삽입"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageInsert}
        />
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-64 [&_.tiptap]:outline-none"
      />
    </div>
  );
}
