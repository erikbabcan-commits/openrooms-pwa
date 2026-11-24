import '../styles/PresenceBar.css';

interface PresenceBarProps {
  presence: string[];
}

export default function PresenceBar({ presence }: PresenceBarProps) {
  const userCount = presence.length;

  return (
    <div className="presence-bar">
      <div className="presence-info">
        <span className="presence-count">
          {userCount} {userCount === 1 ? 'person' : 'people'} online
        </span>
        {userCount > 0 && (
          <div className="presence-nicknames">
            {presence.slice(0, 5).map((nickname, index) => (
              <span key={nickname} className="presence-nickname">
                {nickname}
                {index < presence.slice(0, 5).length - 1 ? ', ' : ''}
              </span>
            ))}
            {userCount > 5 && (
              <span className="presence-more"> +{userCount - 5} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
