import React from 'react';

const ChatPreviewItem = ({ chat, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="flex items-center px-4 py-3 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
    >
      <img
        src={chat.avatar}
        alt={chat.name}
        className="w-10 h-10 rounded-full object-cover mr-3"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-zinc-900 dark:text-white">
          {chat.name}
        </div>
        <div className="text-xs text-zinc-500 truncate dark:text-zinc-400">
          {chat.lastMessage}
        </div>
      </div>
      {chat.unreadCount > 0 && (
        <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
          {chat.unreadCount}
        </span>
      )}
    </div>
  );
};

export default ChatPreviewItem;
