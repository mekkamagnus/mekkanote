'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface ObsidianMarkdownEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
}

export default function ObsidianMarkdownEditor({
  initialContent = '',
  onSave,
  onCancel,
  placeholder = '# Start writing...',
}: ObsidianMarkdownEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);

    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleBold = () => insertMarkdown('**', '**');
  const handleItalic = () => insertMarkdown('*', '*');
  const handleH1 = () => insertMarkdown('# ');
  const handleH2 = () => insertMarkdown('## ');
  const handleList = () => insertMarkdown('- ');
  const handleCheckbox = () => insertMarkdown('- [ ] ');
  const handleQuote = () => insertMarkdown('> ');
  const handleLink = () => insertMarkdown('[[');

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave(content);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div className="mobile-full-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Minimal Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border)',
      }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel || (() => router.back())}
          style={{ color: 'var(--text-primary)' }}
        >
          ←
        </Button>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span style={{ fontSize: '1.25rem', cursor: 'pointer' }}>⋯</span>
        </div>
      </div>

      {/* Editor Area */}
      <div className="mobile-content-area" style={{ flex: 1, padding: '1rem' }}>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: '600px',
            border: 'none',
            background: 'transparent',
            padding: 0,
            fontSize: '1rem',
            lineHeight: '1.8',
            fontFamily: "'SF Mono', 'Monaco', 'Menlo', monospace",
            resize: 'none',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Markdown Toolbar */}
      <div className="markdown-toolbar">
        <button onClick={handleBold} type="button" style={{ fontSize: '1.1rem' }}>
          B
        </button>
        <button onClick={handleItalic} type="button" style={{ fontSize: '1.1rem', fontStyle: 'italic' }}>
          I
        </button>
        <button onClick={handleH1} type="button" style={{ fontSize: '0.9rem' }}>
          H1
        </button>
        <button onClick={handleH2} type="button" style={{ fontSize: '0.9rem' }}>
          H2
        </button>
        <button onClick={handleList} type="button">
          ☰
        </button>
        <button onClick={handleCheckbox} type="button">
          ✓
        </button>
        <button onClick={handleQuote} type="button">
          »
        </button>
        <div style={{ flex: 1 }}></div>
        <button onClick={handleLink} type="button">
          [[ ]]
        </button>
      </div>
    </div>
  );
}
