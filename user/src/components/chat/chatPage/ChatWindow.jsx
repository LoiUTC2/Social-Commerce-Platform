import React from 'react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import useChat from '../../../hooks/useChat';


const messages = [
  { id: 1, text: 'Chào shop, sản phẩm này còn không ạ?', sender: 'me' },
  { id: 2, text: 'Chào bạn, còn hàng bạn nhé!', sender: 'shop' },
  { id: 3, text: 'Mình đặt 2 cái được không?', sender: 'me' },
];

const ChatWindow = () => {
  const {
        messages,
        users,
        isConnected,
        sendMessage,
    } = useChat('123');

    const handleSubmit = (e) => {
        e.preventDefault();
        sendMessage('check');


    };
  return (
    <div className="flex flex-col h-[calc(100vh-110px)]">
      {/* Header chat */}
      <div className="p-4 border-b flex items-center gap-3">
        <img
          src="https://i.pravatar.cc/40?img=3"
          className="w-10 h-10 rounded-full"
          alt="avatar"
        />
        <div>
          <p className="font-semibold text-sm">Shop Đồng Hồ Sang Trọng</p>
          <p className="text-xs text-gray-500">Đang hoạt động</p>
        </div>
      </div>

      {/* Tin nhắn */}
      <div className="flex-1 overflow-y-auto px-4 py-1 space-y-1 bg-gray-50">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} text={msg.text} isMe={msg.sender === 'me'} />
        ))}
      </div>

      {/* Nhập tin nhắn */}
      <div className="border-t p-2" >
        <MessageInput handleSend={handleSubmit}/>
      </div>
    </div>
  );
};

export default ChatWindow;
