import React from 'react';

const MessageBubble = ({ text, isMe }) => {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-3 py-2 rounded-xl max-w-[70%] text-sm ${
          isMe
            ? 'bg-pink-500 text-white self-end'
            : 'bg-gray-200 text-gray-900 self-start'
        }`}
      >
        {text}
      </div>
    </div>
  );
};

export default MessageBubble;
