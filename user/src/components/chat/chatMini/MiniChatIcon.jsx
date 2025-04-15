import { X } from 'lucide-react';

const MiniChatIcon = ({ avatar, onClick, onClose, index }) => {
  const bottomOffset = 16 + index * 68;

  return (
    <div
      className="fixed right-4 z-[60] w-12 h-12 rounded-full bg-white shadow-md border overflow-hidden cursor-pointer transition-all group"
      style={{ bottom: `${bottomOffset}px` }}
    >
      <img
        src={avatar}
        alt="avatar"
        onClick={onClick}
        className="w-full h-full object-cover"
      />
      {/* Nút đóng nhỏ */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // tránh mở lại chat
          onClose();
        }}
        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] hidden group-hover:flex items-center justify-center"
      >
        <X size={100} />
      </button>
    </div>
  );
};

export default MiniChatIcon;
