import { MessageCircle } from 'lucide-react';
import { useState } from 'react';
import ChatPopupModal from './chatPopup/ChatPopupModal';
import MiniChatBox from './chatMini/MiniChatBox';
import MiniChatIcon from './chatMini/MiniChatIcon';

const MAX_CHAT_BOXES = 3;

const HeaderChatIcon = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [activeChats, setActiveChats] = useState([]); // đang hiển thị MiniChatBox
  const [minimizedChats, setMinimizedChats] = useState([]); // icon thu nhỏ
  const [chatQueue, setChatQueue] = useState([]);

  const mockChats = [
    {
      id: '1',
      name: 'Shop HULO',
      avatar: '/avatars/shop1.jpg',
      lastMessage: 'Bạn cần hỗ trợ gì không?',
    },
    {
      id: '2',
      name: 'Nguyễn Văn A',
      avatar: '/avatars/user1.jpg',
      lastMessage: 'Đơn hàng đã giao chưa bạn?',
    },
    {
      id: '3',
      name: 'Shop Thời Trang',
      avatar: '/avatars/shop2.jpg',
      lastMessage: 'Cảm ơn bạn đã mua hàng!',
    },
    {
      id: '4',
      name: 'Người lạ ơi',
      avatar: '/avatars/user2.jpg',
      lastMessage: 'Xin chào!',
    },
    {
      id: '5',
      name: 'Khách VIP',
      avatar: '/avatars/user3.jpg',
      lastMessage: 'Giao hôm nay nhé!',
    },
  ];

  const handleSelectChat = (chat) => {
    const isActive = activeChats.find((c) => c.id === chat.id);
    const isMinimized = minimizedChats.find((c) => c.id === chat.id);

    // Nếu đã mở hoặc đã thu nhỏ => chỉ đóng popup
    if (isActive || isMinimized) {
      setShowPopup(false);
      return;
    }

    let updatedChats = [...activeChats];
    let updatedQueue = [...chatQueue];

    if (activeChats.length >= MAX_CHAT_BOXES) {
      const removed = updatedChats.shift();
      updatedQueue.push(removed);
    }

    updatedChats.push(chat);
    setActiveChats(updatedChats);
    setChatQueue(updatedQueue);
    setShowPopup(false);
  };

  const handleCloseMiniChat = (id) => {
    const updated = activeChats.filter((c) => c.id !== id);
    const next = chatQueue[0];
    const queueRest = chatQueue.slice(1);

    if (next) {
      setActiveChats([...updated, next]);
      setChatQueue(queueRest);
    } else {
      setActiveChats(updated);
    }
  };

  const handleMinimize = (chat) => {
    setActiveChats((prev) => prev.filter((c) => c.id !== chat.id));
    setMinimizedChats((prev) => [...prev, chat]);
  };

  const handleRestoreMinimized = (chat) => {
    if (activeChats.length >= MAX_CHAT_BOXES) return; // nếu đủ 3 rồi thì không mở thêm

    setMinimizedChats((prev) => prev.filter((c) => c.id !== chat.id));
    setActiveChats((prev) => [...prev, chat]);
  };

  const handleCloseMinimized = (id) => {
    setMinimizedChats((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="relative">
      <button onClick={() => setShowPopup(!showPopup)}>
        <MessageCircle size={24} />
      </button>

      {showPopup && (
        <ChatPopupModal
          chatList={mockChats}
          onClose={() => setShowPopup(false)}
          onSelectChat={handleSelectChat}
        />
      )}

      {/* Mini chat boxes */}
      {activeChats.map((chat, index) => (
        <MiniChatBox
          key={chat.id}
          chat={chat}
          index={index}
          onClose={() => handleCloseMiniChat(chat.id)}
          onMinimize={() => handleMinimize(chat)}
        />
      ))}

      {/* Thu nhỏ chat -> avatar dọc */}
      {minimizedChats.map((chat, index) => (
        <MiniChatIcon
          key={chat.id}
          avatar={chat.avatar}
          onClick={() => handleRestoreMinimized(chat)}
          onClose={() => handleCloseMinimized(chat.id)}
          index={index}
        />
      ))}
    </div>
  );
};

export default HeaderChatIcon;  
