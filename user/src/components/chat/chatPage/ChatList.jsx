import React from 'react';

const dummyChats = [
  {
    id: 1,
    name: 'Shop Đồng Hồ Sang Trọng',
    lastMessage: 'Cảm ơn bạn đã đặt hàng!',
    avatar: 'https://i.pravatar.cc/40?img=3',
  },
  {
    id: 2,
    name: 'Nguyễn Văn A',
    lastMessage: 'Mình muốn hỏi thêm về áo này...',
    avatar: 'https://i.pravatar.cc/40?img=5',
  },
];

const ChatList = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-3">Tin nhắn</h2>
      <div className="space-y-3">
        {dummyChats.map((chat) => (
          <div
            key={chat.id}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 cursor-pointer transition"
          >
            <img
              src={chat.avatar}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="font-medium text-sm">{chat.name}</p>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">{chat.lastMessage}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatList;
