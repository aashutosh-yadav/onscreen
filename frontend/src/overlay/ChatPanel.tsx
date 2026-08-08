import React from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
}

export default function ChatPanel({ messages, isLoading }: ChatPanelProps) {
  return (
    <div style={{
      flex: 1,
      overflowY: 'auto',
      marginBottom: '12px',
      paddingRight: '4px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {messages.map((msg) => (
        <div
          key={msg.id}
          style={{
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            backgroundColor: msg.role === 'user' ? '#89b4fa' : '#313244',
            color: msg.role === 'user' ? '#11111b' : '#cdd6f4',
            padding: '8px 12px',
            borderRadius: '12px',
            maxWidth: '85%',
            fontSize: '14px',
            lineHeight: '1.4',
            wordBreak: 'break-word'
          }}
        >
          {msg.content}
        </div>
      ))}

      {isLoading && (
        <div style={{
          alignSelf: 'flex-start',
          backgroundColor: '#313244',
          color: '#585b70',
          padding: '8px 12px',
          borderRadius: '12px',
          fontSize: '14px',
        }}>
          Thinking...
        </div>
      )}
    </div>
  );
}
