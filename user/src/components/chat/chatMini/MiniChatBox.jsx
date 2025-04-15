import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, Dot } from 'lucide-react';
import MiniChatIcon from './MiniChatIcon';
import clsx from 'clsx';

const MiniChatBox = ({ chat, index, onClose, onMinimize }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { from: 'them', text: chat?.lastMessage },
    { from: 'me', text: 'Cảm ơn bạn nhé!' },
    { from: 'them', text: chat?.lastMessage },
    { from: 'me', text: 'Cảm ơn bạn nhé!' },
    { from: 'them', text: chat?.lastMessage },
    { from: 'me', text: 'Cảm ơn bạn nhé!' },
    { from: 'them', text: chat?.lastMessage },
    { from: 'me', text: 'Cảm ơn bạn nhé!' },
  ]);

  const boxRef = useRef(null);
  const rightOffset = 80 + index * 330;

  // Auto scroll to bottom
  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { from: 'me', text: input }]);
      setInput('');
    }
  };

  if (isMinimized) {
    return (
      <MiniChatIcon
        avatar={chat.avatar}
        index={index} // ✅ Truyền index để sắp hàng dọc
        onClick={() => setIsMinimized(false)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'fixed bottom-4 w-80 shadow-xl rounded-lg border z-[60] flex flex-col transition-all duration-300 ease-in-out',
        'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'
      )}
      style={{ right: `${rightOffset}px` }}
    >
      {/* Header */}
      <div className="p-3 border-b flex justify-between items-center bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-t-lg">
        <div className="flex items-center gap-2">
          <img src={chat?.avatar} alt={chat?.name} className="w-6 h-6 rounded-full" />
          <div className="text-sm font-semibold text-zinc-800 dark:text-white">
            {chat?.name}
          </div>
          <Dot className="text-green-500 w-5 h-5" />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
          >
            <ChevronDown size={16} />
          </button>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-red-500"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Chat content */}
        <div
            className="h-[175px] flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700"
            ref={boxRef}
        >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`px-3 py-2 rounded-lg max-w-[70%] ${
                msg.from === 'me'
                  ? 'bg-pink-500 text-white rounded-br-none'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-2 border-t flex gap-2 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 rounded-b-lg">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aa..."
          className="flex-1 text-sm px-3 py-2 border rounded-full outline-none focus:ring-2 focus:ring-pink-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
        />
        <button
          type="submit"
          className="text-sm px-3 py-1 bg-pink-500 text-white rounded-full hover:bg-pink-600"
        >
          Gửi
        </button>
      </form>
    </div>
  );
};

export default MiniChatBox;
