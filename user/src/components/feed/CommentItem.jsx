import { Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils'; // Nếu bạn dùng Tailwind helper để merge className


export default function CommentItem({ data, onReply }) {
  const { user, setShowLoginModal } = useAuth();
  const [liked, setLiked] = useState(data.liked || false);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false); // ✅ Loading giả


  const handleLike = () => {
    if (!user) return setShowLoginModal(true);
    setLiked(!liked);
  };

  const handleReplySubmit = () => {
    if (!user) return setShowLoginModal(true);
    if (replyText.trim() !== '') {
        setIsReplying(true); // ✅ bắt đầu loading
        setTimeout(() => {
          onReply(data.id, {
            id: Date.now(),
            author: user.name || 'Bạn',
            avatar: user.avatar || 'https://i.pravatar.cc/40?u=' + user.name,
            content: replyText,
            liked: false,
            replies: [],
          });
          setReplyText('');
          setShowReply(false);
          setIsReplying(false);
        }, 600); // ✅ Giả lập 600ms xử lý
    }
  };

  return (
    <div className="border-b pb-2 space-y-1">
      <p className="text-sm font-medium">{data.author}</p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{data.content}</p>
      <div className="flex gap-4 text-sm text-gray-500">
        <button onClick={handleLike} className="flex items-center gap-1 hover:text-red-500">
          <Heart size={14} className={liked ? 'fill-red-500 text-red-500' : ''} />
          {liked ? 'Đã thích' : 'Thích'}
        </button>
        <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 hover:text-blue-500">
          <MessageCircle size={14} /> Phản hồi
        </button>
      </div>

      {/* Form reply */}
      {showReply && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Trả lời bình luận..."
          />
          <Button onClick={handleReplySubmit}>Gửi</Button>
        </div>
      )}

      {/* Hiển thị replies */}
      {data.replies?.length > 0 && (
        <div className="ml-4 mt-2 space-y-2">
          {data.replies.map((reply) => (
            <CommentItem key={reply.id} data={reply} onReply={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}