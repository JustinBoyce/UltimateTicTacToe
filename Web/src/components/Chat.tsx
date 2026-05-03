import { useState, useEffect, useRef } from 'react';
import { SendMessagePayload, Message } from '../types';

interface ChatProps {
  room: string;
  onSendMessage: (payload: SendMessagePayload) => void;
  messages: Message[];
  disabled?: boolean;
}

// TODO: Test the functionality of this after the BE has implemented it
export default function Chat({ room, onSendMessage, messages, disabled }: ChatProps) {
  const [inputMessage, setInputMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputMessage.trim()) {
      onSendMessage({
        type: 'CLIENT',
        room,
        message: inputMessage.trim()
      });
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <h3>Chat</h3>
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="chat-empty">No messages yet</p>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className="chat-message">
              <span className="chat-message-text">{msg.message}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-group">
        <input
          type="text"
          placeholder="Type a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          className="chat-input"
        />
        <button 
          onClick={handleSend} 
          disabled={disabled || !inputMessage.trim()}
          className="chat-send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

