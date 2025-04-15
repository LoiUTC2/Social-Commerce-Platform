import React from 'react';
import ChatList from '../../components/chat/chatPage/ChatList';
import ChatWindow from '../../components/chat/chatPage/ChatWindow';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ChatPage = () => {
  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Sidebar Tin nhắn */}
      <aside className="w-[25%] border-r overflow-y-auto">
        <div className="p-4 border-b flex items-center gap-2">
          <ArrowLeft size={20} />
          <Link to="/" className="text-sm font-medium text-pink-600 hover:underline">
            Trở về trang chủ
          </Link>
        </div>
        <ChatList />
      </aside>

      {/* Khung chat chính */}
      <main className="flex-1 flex flex-col">
        <ChatWindow />
      </main>
    </div>
  );
};

export default ChatPage;
