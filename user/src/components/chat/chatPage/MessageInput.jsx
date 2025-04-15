import React, { useState } from 'react';
import { Send } from 'lucide-react';

const MessageInput = () => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      console.log('Send:', message);
      setMessage('');
    }
  };

  return (
    <div className="p-4 border-t flex items-center gap-3 bg-white">
      <input
        type="text"
        placeholder="Nhập tin nhắn..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
      />
      <button
        onClick={handleSend}
        className="bg-pink-500 text-white p-2 rounded-full hover:bg-pink-600"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default MessageInput;
