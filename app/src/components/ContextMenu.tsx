import { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/ContextMenu.css';

interface ContextMenuProps {
  onClose: () => void;
  onBlock?: () => void;
  onReport?: () => void;
  position: { x: number; y: number };
  isOwnMessage?: boolean;
}

export default function ContextMenu({
  onClose,
  onBlock,
  onReport,
  position,
  isOwnMessage = false,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Close on touch end (for mobile)
  useEffect(() => {
    const handleTouchEnd = () => {
      onClose();
    };

    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onClose]);

  const handleBlock = useCallback(() => {
    onBlock?.();
    onClose();
  }, [onBlock, onClose]);

  const handleReport = useCallback(() => {
    onReport?.();
    onClose();
  }, [onReport, onClose]);

  // Don't show block for own messages
  const showBlock = onBlock && !isOwnMessage;
  const showReport = onReport && !isOwnMessage;

  if (!showBlock && !showReport) {
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      {showBlock && (
        <button className="context-menu-item block" onClick={handleBlock}>
          <span className="icon">🚫</span>
          <span>Block User</span>
        </button>
      )}
      {showReport && (
        <button className="context-menu-item report" onClick={handleReport}>
          <span className="icon">⚠️</span>
          <span>Report Message</span>
        </button>
      )}
    </div>
  );
}
