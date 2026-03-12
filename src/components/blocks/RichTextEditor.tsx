import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link as LinkIcon, Undo, Redo, Code2,
  RemoveFormatting,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

const EDITOR_CLASSES = [
  // Base
  'focus:outline-none min-h-[160px] px-4 py-3 text-sm leading-relaxed',
  // Typography
  'font-serif',
  // Headings
  '[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:font-serif [&_h1]:text-text [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:tracking-tight [&_h1]:leading-tight',
  '[&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-serif [&_h2]:text-text [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:tracking-tight [&_h2]:leading-tight',
  '[&_h3]:text-lg [&_h3]:font-bold [&_h3]:font-serif [&_h3]:text-text [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:tracking-tight',
  // Paragraph
  '[&_p]:text-text/80 [&_p]:leading-relaxed [&_p]:mb-3 [&_p]:last:mb-0',
  // Bold / Italic / Underline / Strike
  '[&_strong]:text-text [&_strong]:font-bold',
  '[&_em]:italic',
  '[&_u]:underline [&_u]:decoration-gold/40 [&_u]:underline-offset-2',
  '[&_s]:line-through [&_s]:text-warm-gray/50',
  // Links
  '[&_a]:text-gold [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-gold/40 hover:[&_a]:decoration-gold',
  // Lists
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_ol]:space-y-1',
  '[&_li]:text-text/80 [&_li]:leading-relaxed',
  '[&_li_p]:mb-0',
  // Blockquote
  '[&_blockquote]:border-l-2 [&_blockquote]:border-gold/30 [&_blockquote]:pl-4 [&_blockquote]:py-1 [&_blockquote]:my-4 [&_blockquote]:italic [&_blockquote]:text-text/60',
  // Inline code
  '[&_code]:text-gold/80 [&_code]:bg-surface [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
  // Code block
  '[&_pre]:bg-surface [&_pre]:border [&_pre]:border-line [&_pre]:rounded-sm [&_pre]:px-4 [&_pre]:py-3 [&_pre]:my-4 [&_pre]:overflow-x-auto',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-text/70 [&_pre_code]:text-xs [&_pre_code]:font-mono [&_pre_code]:leading-relaxed',
  // Horizontal rule
  '[&_hr]:border-line [&_hr]:my-6',
  // Placeholder
  '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child::before]:text-warm-gray/30 [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:italic',
].join(' ');

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [showSource, setShowSource] = useState(false);
  const [sourceHtml, setSourceHtml] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Comece a escrever...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setSourceHtml(html);
    },
    editorProps: {
      attributes: {
        class: EDITOR_CLASSES,
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
      setSourceHtml(value);
    }
  }, [value, editor]);

  const handleSourceChange = useCallback(
    (html: string) => {
      setSourceHtml(html);
      onChange(html);
      if (editor) {
        editor.commands.setContent(html, false);
      }
    },
    [editor, onChange]
  );

  const toggleSource = () => {
    if (showSource && editor) {
      editor.commands.setContent(sourceHtml, false);
    } else if (editor) {
      setSourceHtml(editor.getHTML());
    }
    setShowSource(!showSource);
  };

  const addLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL do link:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-line rounded-sm overflow-hidden bg-bg">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-line/50 bg-surface/50">
        <ToolbarButton
          active={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Negrito (Ctrl+B)"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italico (Ctrl+I)"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('underline')}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Sublinhado (Ctrl+U)"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('strike')}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Riscado"
        >
          <Strikethrough size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive('heading', { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Titulo 1"
        >
          <Heading1 size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Titulo 2"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('heading', { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Titulo 3"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Lista"
        >
          <List size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Lista numerada"
        >
          <ListOrdered size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('blockquote')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Citacao"
        >
          <Quote size={14} />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive('codeBlock')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Bloco de codigo"
        >
          <Code size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          active={editor.isActive('link')}
          onClick={addLink}
          title="Link"
        >
          <LinkIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={clearFormatting}
          title="Limpar formatacao"
        >
          <RemoveFormatting size={14} />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Refazer (Ctrl+Shift+Z)"
        >
          <Redo size={14} />
        </ToolbarButton>

        {/* Source toggle */}
        <div className="ml-auto">
          <ToolbarButton
            active={showSource}
            onClick={toggleSource}
            title={showSource ? 'Modo visual' : 'Codigo HTML'}
          >
            <Code2 size={14} />
            <span className="text-[10px] ml-1">{showSource ? 'Visual' : 'HTML'}</span>
          </ToolbarButton>
        </div>
      </div>

      {/* Editor / Source */}
      {showSource ? (
        <textarea
          value={sourceHtml}
          onChange={(e) => handleSourceChange(e.target.value)}
          className="w-full min-h-[160px] px-4 py-3 bg-bg text-xs font-mono text-text/80 focus:outline-none resize-y border-0"
          spellCheck={false}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
}

/* ─── Toolbar helpers ─── */

function ToolbarButton({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center px-1.5 py-1 rounded-sm transition-all',
        active
          ? 'bg-gold/15 text-gold'
          : 'text-warm-gray/60 hover:text-text hover:bg-white/5',
        disabled && 'opacity-30 pointer-events-none'
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-line/50 mx-1" />;
}
