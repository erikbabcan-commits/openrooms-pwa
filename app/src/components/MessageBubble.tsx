import { Message } from '../types';
import '../styles/MessageBubble.css';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-header">
        {!isOwn && <span className="nickname">{message.nickname}</span>}
        <span className="timestamp">{formatTime(message.ts)}</span>
      </div>
      <div className="message-text">{message.text}</div>
    </div>
  );
}
