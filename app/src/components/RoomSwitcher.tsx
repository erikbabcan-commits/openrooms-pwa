import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorageNickname } from '../hooks/useLocalStorageNickname';
import '../styles/RoomSwitcher.css';

interface RoomSwitcherProps {
  currentRoom: string;
}

export default function RoomSwitcher({ currentRoom }: RoomSwitcherProps) {
  const navigate = useNavigate();
  const { nickname } = useLocalStorageNickname();
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const handleSwitchRoom = (roomName: string) => {
    if (roomName !== currentRoom) {
      navigate(`/room/${roomName}`);
      setShowMenu(false);
    }
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="room-switcher">
      <button onClick={() => setShowMenu(!showMenu)} className="room-switcher-button">
        <span className="current-room">#{currentRoom}</span>
        <span className="switcher-icon">{showMenu ? '▲' : '▼'}</span>
      </button>

      {showMenu && (
        <div className="room-menu">
          <div className="menu-section">
            <p className="menu-label">Switch Room</p>
            {['general', 'random', 'help', 'chat'].map((room) => (
              <button
                key={room}
                onClick={() => handleSwitchRoom(room)}
                className={`menu-item ${room === currentRoom ? 'active' : ''}`}
              >
                #{room}
              </button>
            ))}
          </div>
          
          <div className="menu-divider"></div>
          
          <button onClick={handleLeaveRoom} className="menu-item leave">
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
}
