import React, { useState, useRef, useEffect } from 'react';
import ChatPanel from './overlay/ChatPanel';
import InputBar from './overlay/InputBar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMessages([]);
        window.close();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Build history for backend — exclude current message
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history
        }),
      });

      const data = await response.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Could not reach backend. Make sure Python server is running on port 8000.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      padding: '12px',
      boxSizing: 'border-box',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #313244',
        paddingBottom: '8px'
      }}>
        <span style={{
          color: '#f5c2e7',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          Onscreen
        </span>
        <span style={{
          color: '#585b70',
          fontSize: '11px',
          cursor: 'pointer'
        }}
          onClick={() => {
            setMessages([]);
            window.close();
          }}
        >
          ESC to close
        </span>
      </div>

      {/* Empty state */}
      {messages.length === 0 && (
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#585b70',
          fontSize: '13px',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          Screenshot captured.<br />
          Ask me anything about your screen.
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <ChatPanel messages={messages} isLoading={isLoading} />
      )}

      <div ref={bottomRef} />

      {/* Input bar */}
      <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
