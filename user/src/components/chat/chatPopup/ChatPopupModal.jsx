import React, { useEffect, useRef } from 'react';
import ChatPreviewItem from './ChatPreviewItem';
import { Link } from 'react-router-dom';

const ChatPopupModal = ({ onClose, chatList = [], onSelectChat }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="absolute right-4 top-16 z-50 w-96 rounded-md shadow-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700" ref={modalRef}>
      <div className="p-4 border-b dark:border-zinc-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">Tin nhắn</h2>
        {/* Tuỳ chọn lọc */}
        <div className="space-x-2">
          <button className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">Tất cả</button>
          <button className="text-xs px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700">Đang chờ</button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-700">
        {chatList.map((chat) => (
          <ChatPreviewItem key={chat.id} chat={chat} onClick={() => onSelectChat(chat)}/>
        ))}
      </div>

      <div className="p-3 border-t dark:border-zinc-700 text-right">
        <Link
            to='/messages'
          onClick={onClose}
          className="text-sm text-primary hover:underline"
        >
          Đến trang tin nhắn
        </Link>
      </div>
    </div>
  );
};

export default ChatPopupModal;
