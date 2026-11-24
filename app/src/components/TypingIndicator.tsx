import '../styles/TypingIndicator.css';

interface TypingIndicatorProps {
  users: string[];
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">
        {users.length === 1 ? `${users[0]} is typing` : `${users.join(', ')} are typing`}
      </span>
    </div>
  );
}
