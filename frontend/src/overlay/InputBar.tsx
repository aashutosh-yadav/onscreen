import React, { useState } from 'react';

interface InputBarProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export default function InputBar({ onSendMessage, isLoading }: InputBarProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  // Allow sending with Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>

      {/* + attachment button */}
      <button
        style={{
          backgroundColor: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: '8px',
          padding: '0 12px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        +
      </button>

      {/* Text input */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isLoading ? 'Waiting for response...' : 'Ask Onscreen anything...'}
        disabled={isLoading}
        style={{
          flex: 1,
          backgroundColor: '#313244',
          border: '1px solid #45475a',
          borderRadius: '8px',
          padding: '10px 12px',
          color: '#cdd6f4',
          fontSize: '14px',
          outline: 'none',
          opacity: isLoading ? 0.6 : 1
        }}
        autoFocus
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        style={{
          backgroundColor: isLoading ? '#585b70' : '#b4befe',
          color: '#11111b',
          border: 'none',
          borderRadius: '8px',
          padding: '0 16px',
          fontWeight: 'bold',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontSize: '14px'
        }}
      >
        {isLoading ? '...' : 'Send'}
      </button>
    </div>
  );
}
