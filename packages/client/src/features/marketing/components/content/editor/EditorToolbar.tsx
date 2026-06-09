import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Image,
  Heading1,
  Heading2,
  Heading3,
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { uploadToR2 } from '../../../api/use-r2-upload';
import { cn } from '../../../lib/utils';

interface EditorToolbarProps {
  editor: Editor | null;
  projectId?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-7 w-7 p-0 text-muted-foreground hover:text-foreground',
        active && 'bg-muted text-foreground'
      )}
    >
      {children}
    </Button>
  );
}

export function EditorToolbar({ editor, projectId }: EditorToolbarProps) {
  if (!editor) return null;

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !projectId) return;
      try {
        const { publicUrl } = await uploadToR2(file, {
          projectId,
          category: 'images',
          fileName: file.name,
          contentType: file.type,
        });
        editor.chain().focus().setImage({ src: publicUrl }).run();
      } catch (err) {
        console.error('이미지 업로드 실패:', err);
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="제목 1"
      >
        <Heading1 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="제목 2"
      >
        <Heading2 size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="제목 3"
      >
        <Heading3 size={14} />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="굵게"
      >
        <Bold size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="기울임"
      >
        <Italic size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="취소선"
      >
        <Strikethrough size={14} />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="글머리 목록"
      >
        <List size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="번호 목록"
      >
        <ListOrdered size={14} />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-border" />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="인용구"
      >
        <Quote size={14} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="구분선"
      >
        <Minus size={14} />
      </ToolbarButton>

      {projectId && (
        <>
          <div className="mx-1 h-4 w-px bg-border" />
          <ToolbarButton onClick={handleImageUpload} title="이미지 삽입">
            <Image size={14} />
          </ToolbarButton>
        </>
      )}
    </div>
  );
}
