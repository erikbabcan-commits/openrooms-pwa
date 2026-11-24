import { useState, useCallback, useRef, useEffect } from 'react';
import '../styles/Composer.css';

interface ComposerProps {
  onSend: (text: string) => Promise<string | null>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function Composer({ onSend, onTyping, disabled, placeholder }: ComposerProps) {
  const [text, setText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-resize textarea
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Trigger typing indicator
    if (onTyping && e.target.value.length > 0) {
      onTyping();
    }
    
    // Auto-resize
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [onTyping]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim() || disabled || isSending) return;

    setIsSending(true);
    
    try {
      await onSend(text.trim());
      setText('');
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Focus back on textarea
      textareaRef.current?.focus();
    } finally {
      setIsSending(false);
    }
  }, [text, disabled, isSending, onSend]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }, []);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle paste
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Basic paste handling - could add more validation here
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, pastedText);
  }, []);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="composer">
      <div className="composer-input-container">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder || 'Type a message...'}
          disabled={disabled || isSending}
          maxLength={1000}
          rows={1}
          className="composer-input"
        />
        <button
          type="submit"
          disabled={!text.trim() || disabled || isSending}
          className="composer-send"
        >
          {isSending ? '...' : '→'}
        </button>
      </div>
    </form>
  );
}
