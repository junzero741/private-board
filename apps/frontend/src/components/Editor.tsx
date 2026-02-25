'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef } from 'react';

interface EditorProps {
  onChange: (html: string) => void;
}

export default function Editor({ onChange }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    immediatelyRender: false,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  function handleImageInsert(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    const blobUrl = URL.createObjectURL(file);
    editor.chain().focus().setImage({ src: blobUrl }).run();
    e.target.value = '';
  }

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded">
      <div className="flex gap-2 border-b border-gray-300 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded italic ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        >
          ・목록
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-2 py-1 text-sm rounded"
        >
          이미지
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageInsert}
        />
      </div>
      <EditorContent
        editor={editor}
        className="p-3 min-h-64 prose max-w-none focus:outline-none"
      />
    </div>
  );
}
