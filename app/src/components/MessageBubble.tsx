import { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { formatTime, isEmojiOnly } from '../lib/groupMessages';
import '../styles/MessageBubble.css';

interface MessageBubbleProps {
  messages: Message[];
  nickname: string;
  isOwn: boolean;
  showTimestamp: boolean;
  ts: number;
  isLastInGroup?: boolean;
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
}: MessageBubbleProps) {
  const [showTimestampOnHover, setShowTimestampOnHover] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Check if all messages are emoji-only
  const allEmoji = messages.every((msg) => isEmojiOnly(msg.text));

  return (
    <div
      ref={bubbleRef}
      className={`message-bubble ${isOwn ? 'own' : 'other'} ${messages.length > 1 ? 'grouped' : ''}`}
      onMouseEnter={() => setShowTimestampOnHover(true)}
      onMouseLeave={() => setShowTimestampOnHover(false)}
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
  );
}
