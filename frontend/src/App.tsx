import React, { useState, useRef, useEffect } from 'react';
import ChatPanel from './overlay/ChatPanel';
import InputBar from './overlay/InputBar';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: 'Hello! I am Onscreen. I can see your screen and help you with anything. Type your question below.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    // Add user message immediately
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Call the real FastAPI backend
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      const data = await response.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.response
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      // Show error in chat if backend is not reachable
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Could not reach the backend. Make sure the Python server is running on port 8000.'
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      boxSizing: 'border-box',
      padding: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid #313244',
        paddingBottom: '6px'
      }}>
        <span style={{ color: '#f5c2e7', fontWeight: 'bold', fontSize: '14px' }}>
          Onscreen
        </span>
        <span style={{ color: '#585b70', fontSize: '11px' }}>ESC to hide</span>
      </div>

      {/* Chat messages */}
      <ChatPanel messages={messages} isLoading={isLoading} />

      {/* Scroll anchor */}
      <div ref={bottomRef} />

      {/* Input bar */}
      <InputBar onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}
