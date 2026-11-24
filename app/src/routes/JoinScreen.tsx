import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorageNickname } from '../hooks/useLocalStorageNickname';
import { validateNickname, validateRoomName } from '../lib/escape';
import '../styles/JoinScreen.css';

export default function JoinScreen() {
  const navigate = useNavigate();
  const { nickname: storedNickname, saveNickname } = useLocalStorageNickname();
  const [nickname, setNickname] = useState<string>(storedNickname || '');
  const [roomName, setRoomName] = useState<string>('general');
  const [nicknameError, setNicknameError] = useState<string>('');
  const [roomError, setRoomError] = useState<string>('');

  useEffect(() => {
    if (storedNickname) {
      setNickname(storedNickname);
    }
  }, [storedNickname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    let valid = true;
    
    if (!validateNickname(nickname)) {
      setNicknameError('Please enter a valid nickname (1-50 alphanumeric characters, underscores, or hyphens)');
      valid = false;
    } else {
      setNicknameError('');
    }

    if (!validateRoomName(roomName)) {
      setRoomError('Please enter a valid room name (1-50 alphanumeric characters, underscores, or hyphens)');
      valid = false;
    } else {
      setRoomError('');
    }

    if (!valid) return;

    // Save nickname to localStorage
    saveNickname(nickname);
    
    // Navigate to room
    navigate(`/room/${roomName}`);
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (nicknameError) setNicknameError('');
  };

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoomName(e.target.value);
    if (roomError) setRoomError('');
  };

  return (
    <div className="join-screen">
      <div className="join-container">
        <h1 className="join-title">OpenRooms</h1>
        <p className="join-subtitle">Join a public chat room</p>
        
        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="nickname">Nickname</label>
            <input
              type="text"
              id="nickname"
              value={nickname}
              onChange={handleNicknameChange}
              placeholder="Enter your nickname"
              maxLength={50}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
            {nicknameError && <p className="error-message">{nicknameError}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="room">Room Name</label>
            <input
              type="text"
              id="room"
              value={roomName}
              onChange={handleRoomChange}
              placeholder="Enter room name"
              maxLength={50}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
            />
            {roomError && <p className="error-message">{roomError}</p>}
          </div>

          <button type="submit" className="join-button">
            Join Room
          </button>
        </form>

        <div className="quick-join">
          <p>Quick join:</p>
          <div className="quick-rooms">
            {['general', 'random', 'help', 'chat'].map((room) => (
              <button
                key={room}
                onClick={() => {
                  if (validateNickname(nickname) || storedNickname) {
                    const finalNickname = validateNickname(nickname) ? nickname : storedNickname;
                    if (finalNickname) {
                      saveNickname(finalNickname);
                      navigate(`/room/${room}`);
                    }
                  }
                }}
                className="quick-room"
              >
                #{room}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
