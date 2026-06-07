import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Wand2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { EditorToolbar } from './EditorToolbar';
import { uploadToR2 } from '../../../api/use-r2-upload';
import { countWords } from '../../../lib/utils';

export interface BaseArticleEditorRef {
  setContent: (html: string) => void;
  getHTML: () => string;
  getPlainText: () => string;
  replaceSelection: (text: string) => void;
}

interface BaseArticleEditorProps {
  initialContent?: string;
  onUpdate?: (html: string, plainText: string, wordCount: number) => void;
  onPartialRegenerate?: (selectedText: string, fullText: string) => void;
  projectId?: string;
  placeholder?: string;
}

export const BaseArticleEditor = forwardRef<BaseArticleEditorRef, BaseArticleEditorProps>(
  function BaseArticleEditor(
    { initialContent, onUpdate, onPartialRegenerate, projectId, placeholder },
    ref
  ) {
    const onUpdateRef = useRef(onUpdate);
    const onPartialRegenerateRef = useRef(onPartialRegenerate);

    useEffect(() => {
      onUpdateRef.current = onUpdate;
    }, [onUpdate]);
    useEffect(() => {
      onPartialRegenerateRef.current = onPartialRegenerate;
    }, [onPartialRegenerate]);

    const editor = useEditor({
      extensions: [
        StarterKit,
        Image.configure({ inline: false }),
        Placeholder.configure({
          placeholder: placeholder ?? '기본 글을 작성하거나 AI로 생성하세요.',
        }),
      ],
      content: initialContent ?? '',
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML();
        const plain = e.getText();
        const wc = countWords(plain);
        onUpdateRef.current?.(html, plain, wc);
      },
      editorProps: {
        handleDrop: (view, event, _slice, moved) => {
          if (!moved && event.dataTransfer?.files.length && projectId) {
            const file = event.dataTransfer.files[0];
            if (!file.type.startsWith('image/')) return false;
            event.preventDefault();
            uploadToR2(file, {
              projectId,
              category: 'images',
              fileName: file.name,
              contentType: file.type,
            })
              .then(({ publicUrl }) => {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src: publicUrl });
                const tr = view.state.tr.replaceSelectionWith(node);
                view.dispatch(tr);
              })
              .catch(console.error);
            return true;
          }
          return false;
        },
        handlePaste: (_view, event) => {
          const items = event.clipboardData?.items;
          if (!items || !projectId) return false;
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (!file) continue;
              uploadToR2(file, {
                projectId,
                category: 'images',
                fileName: `paste-${Date.now()}.${file.type.split('/')[1] ?? 'png'}`,
                contentType: file.type,
              })
                .then(({ publicUrl }) => {
                  editor?.chain().focus().setImage({ src: publicUrl }).run();
                })
                .catch(console.error);
              return true;
            }
          }
          return false;
        },
      },
    });

    // Sync initialContent changes without triggering onUpdate feedback loop
    const lastInitialRef = useRef<string | undefined>(undefined);
    useEffect(() => {
      if (!editor || initialContent === undefined) return;
      if (initialContent === lastInitialRef.current) return;
      lastInitialRef.current = initialContent;
      // Use setContent to avoid triggering onUpdate
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }, [editor, initialContent]);

    useImperativeHandle(ref, () => ({
      setContent: (html: string) => {
        editor?.commands.setContent(html, { emitUpdate: false });
      },
      getHTML: () => editor?.getHTML() ?? '',
      getPlainText: () => editor?.getText() ?? '',
      replaceSelection: (text: string) => {
        if (!editor) return;
        const { from, to } = editor.state.selection;
        editor.chain().focus().deleteRange({ from, to }).insertContent(text).run();
      },
    }));

    const handlePartialRegenerate = () => {
      if (!editor || !onPartialRegenerateRef.current) return;
      const { from, to } = editor.state.selection;
      if (from === to) return; // no selection
      const selectedText = editor.state.doc.textBetween(from, to, ' ');
      const fullText = editor.getText();
      onPartialRegenerateRef.current(selectedText, fullText);
    };

    return (
      <div className="marketing-scope flex flex-col h-full">
        <EditorToolbar editor={editor} projectId={projectId} />
        {editor && onPartialRegenerate && (
          <BubbleMenu editor={editor}>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 bg-background shadow-md"
              onClick={handlePartialRegenerate}
            >
              <Wand2 size={13} />이 부분 다시 쓰기
            </Button>
          </BubbleMenu>
        )}
        <div className="tiptap flex-1 overflow-y-auto px-4 py-3">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    );
  }
);
