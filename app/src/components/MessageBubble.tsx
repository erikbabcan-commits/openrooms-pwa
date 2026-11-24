import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '../types';
import { formatTime, isEmojiOnly } from '../lib/groupMessages';
import ContextMenu from './ContextMenu';
import '../styles/MessageBubble.css';

interface MessageBubbleProps {
  messages: Message[];
  nickname: string;
  isOwn: boolean;
  showTimestamp: boolean;
  ts: number;
  isLastInGroup?: boolean;
  onBlock?: (nickname: string) => void;
  onReport?: (messageId: string, reportedNickname: string) => void;
}

// Tooltip component for nickname
function NicknameTooltip({ nickname }: { nickname: string }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => setShowTooltip(true);
    const handleMouseLeave = () => setShowTooltip(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Truncate long nicknames
  const displayName = nickname.length > 20 ? `${nickname.slice(0, 18)}..` : nickname;

  return (
    <span ref={ref} className="nickname" data-tooltip={nickname}>
      {displayName}
      {showTooltip && (
        <span className="nickname-tooltip">{nickname}</span>
      )}
    </span>
  );
}

// Individual message within a group
function MessageText({ text, isEmoji }: { text: string; isEmoji: boolean }) {
  return (
    <span className={`message-text ${isEmoji ? 'emoji-large' : ''}`}>
      {text}
    </span>
  );
}

export default function MessageBubble({
  messages,
  nickname,
  isOwn,
  showTimestamp,
  ts,
  isLastInGroup = true,
  onBlock,
  onReport,
}: MessageBubbleProps) {
  const [showTimestampOnHover, setShowTimestampOnHover] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Get the first message's nickname for blocking/reporting
  const reportedNickname = messages[0]?.nickname || nickname;
  const messageId = messages[0]?.id || '';

  // Handle context menu (right click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!onBlock && !onReport) return;
    
    // Don't show for own messages
    if (isOwn) return;
    
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  }, [isOwn, onBlock, onReport]);

  // Handle long tap (touch)
  const touchTimerRef = useRef<number | null>(null);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!onBlock && !onReport) return;
    if (isOwn) return;
    
    touchTimerRef.current = window.setTimeout(() => {
      const touch = e.touches[0];
      setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowContextMenu(true);
    }, 500); // 500ms long tap
  }, [isOwn, onBlock, onReport]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  }, []);

  // Close context menu
  const handleCloseContextMenu = useCallback(() => {
    setShowContextMenu(false);
  }, []);

  // Handle block
  const handleBlock = useCallback(() => {
    onBlock?.(reportedNickname);
    setShowContextMenu(false);
  }, [onBlock, reportedNickname]);

  // Handle report
  const handleReport = useCallback(() => {
    onReport?.(messageId, reportedNickname);
    setShowContextMenu(false);
  }, [onReport, messageId, reportedNickname]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  // Check if all messages are emoji-only
  const allEmoji = messages.every((msg) => isEmojiOnly(msg.text));

  return (
    <>
      <div
        ref={bubbleRef}
        className={`message-bubble ${isOwn ? 'own' : 'other'} ${messages.length > 1 ? 'grouped' : ''}`}
        onMouseEnter={() => setShowTimestampOnHover(true)}
        onMouseLeave={() => setShowTimestampOnHover(false)}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {/* Header with nickname and timestamp */}
        {(showTimestamp || showTimestampOnHover) && (
          <div className="message-header">
            {!isOwn && <NicknameTooltip nickname={nickname} />}
            <span className="timestamp">{formatTime(ts)}</span>
          </div>
        )}

        {/* Message content */}
        <div className="message-content">
          {messages.map((msg, index) => (
            <MessageText
              key={msg.id}
              text={msg.text}
              isEmoji={isEmojiOnly(msg.text)}
            />
          ))}
        </div>
      </div>

      {/* Context menu */}
      {showContextMenu && (
        <ContextMenu
          onClose={handleCloseContextMenu}
          onBlock={onBlock ? handleBlock : undefined}
          onReport={onReport ? handleReport : undefined}
          position={contextMenuPosition}
          isOwnMessage={isOwn}
        />
      )}
    </>
  );
}
