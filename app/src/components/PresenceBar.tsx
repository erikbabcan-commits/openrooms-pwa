import React from 'react';
import '../styles/PresenceBar.css';

interface PresenceBarProps {
  presence: string[];
}

// Tooltip for long nicknames
function NicknameWithTooltip({ nickname }: { nickname: string }) {
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
  const displayName = nickname.length > 15 ? `${nickname.slice(0, 13)}..` : nickname;

  return (
    <span ref={ref} className="presence-nickname" data-tooltip={nickname}>
      {displayName}
      {showTooltip && nickname.length > 15 && (
        <span className="nickname-tooltip">{nickname}</span>
      )}
    </span>
  );
}

export default function PresenceBar({ presence }: PresenceBarProps) {
  const userCount = presence.length;

  if (userCount === 0) {
    return (
      <div className="presence-bar">
        <div className="presence-info">
          <span className="presence-count">Empty room</span>
        </div>
      </div>
    );
  }

  return (
    <div className="presence-bar">
      <div className="presence-info">
        <span className="presence-count">
          {userCount} {userCount === 1 ? 'person' : 'people'} online
        </span>
        {userCount > 0 && (
          <div className="presence-nicknames">
            {presence.slice(0, 3).map((nickname, index) => (
              <React.Fragment key={nickname}>
                <NicknameWithTooltip nickname={nickname} />
                {index < presence.slice(0, 3).length - 1 ? ', ' : ''}
              </React.Fragment>
            ))}
            {userCount > 3 && (
              <span className="presence-more"> +{userCount - 3} more</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
