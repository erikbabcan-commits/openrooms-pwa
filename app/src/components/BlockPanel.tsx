import { useState } from 'react';
import '../styles/BlockPanel.css';

interface BlockPanelProps {
  blockedUsers: string[];
  onUnblock: (nickname: string) => void;
  onClose: () => void;
}

export default function BlockPanel({ blockedUsers, onUnblock, onClose }: BlockPanelProps) {
  const [confirmUnblock, setConfirmUnblock] = useState<string | null>(null);

  const handleUnblock = (nickname: string) => {
    setConfirmUnblock(nickname);
  };

  const confirmUnblockAction = () => {
    if (confirmUnblock) {
      onUnblock(confirmUnblock);
      setConfirmUnblock(null);
    }
  };

  const cancelUnblock = () => {
    setConfirmUnblock(null);
  };

  if (blockedUsers.length === 0) {
    return (
      <div className="block-panel">
        <div className="block-panel-header">
          <h3>Blocked Users</h3>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="block-panel-content">
          <p className="empty-state">No blocked users</p>
        </div>
      </div>
    );
  }

  return (
    <div className="block-panel">
      <div className="block-panel-header">
        <h3>Blocked Users ({blockedUsers.length})</h3>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
      
      <div className="block-panel-content">
        <p className="info-text">
          These users' messages are hidden. They won't know they're blocked.
        </p>
        
        <ul className="blocked-list">
          {blockedUsers.map((nickname) => (
            <li key={nickname} className="blocked-item">
              <span className="nickname">{nickname}</span>
              <button
                className="unblock-button"
                onClick={() => handleUnblock(nickname)}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmation dialog */}
      {confirmUnblock && (
        <div className="confirm-dialog">
          <p>Unblock <strong>{confirmUnblock}</strong>?</p>
          <div className="confirm-actions">
            <button className="confirm-cancel" onClick={cancelUnblock}>
              Cancel
            </button>
            <button className="confirm-yes" onClick={confirmUnblockAction}>
              Yes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
