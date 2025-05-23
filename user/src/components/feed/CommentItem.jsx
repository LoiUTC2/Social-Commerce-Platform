import { Heart, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { likeComment } from '../../services/postInteractionService';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function CommentItem({ data, onReply, nestLevel = 0, postId }) {
  const { user, setShowLoginModal } = useAuth();
  const [isLiked, setIsLiked] = useState(user && data?.likes?.includes(user._id) || false);
  const [likesCount, setLikesCount] = useState(data?.likes?.length || 0);
  const [replyCount, setReplyCount] = useState(data?.replies?.length || 0);
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const maxNestLevel = 3;

  useEffect(() => {
    setIsLiked(user && data?.likes?.includes(user._id) || false);
    setLikesCount(data?.likes?.length || 0);
    setReplyCount(data?.replies?.length || 0);
  }, [data, user]);

  const handleLike = async () => {
    if (!user) return setShowLoginModal(true);
    try {
      const res = await likeComment(data._id);
      setIsLiked(res.data.isLiked);
      setLikesCount(res.data.totalLikes);
    } catch (err) {
      console.error('Lỗi khi like bình luận:', err);
    }
  };

  const handleReplySubmit = () => {
    if (!user) return setShowLoginModal(true);
    if (replyText.trim() !== '') {
      setIsReplying(true);
      setTimeout(() => {
        const actualParentId = nestLevel >= maxNestLevel - 1 ? data.parentId : data._id;
        onReply(actualParentId || data._id, {
          content: replyText,
          postId: postId,
        });
        setReplyText('');
        setShowReply(false);
        setIsReplying(false);
        setReplyCount(prev => prev + 1);
      }, 600);
    }
  };

  const marginClass = nestLevel === 0 ? '' : 'ml-4';

  return (
    <div className={cn('border-b pb-2 space-y-1', marginClass)}>
      <p className="text-sm font-medium">
        {data.author?.type === 'User' ? data.author?._id?.fullName : data.author?._id?.name || 'Người dùng'}
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-300">{data.text}</p>
      <p
        className="text-xs text-gray-500 dark:text-gray-400"
        title={format(new Date(data.createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}
      >
        {formatDistanceToNow(new Date(data.createdAt), { addSuffix: true, locale: vi }).replace(/^khoảng /, '')}
      </p>

      <div className="flex gap-4 text-sm text-gray-500">
        <button onClick={handleLike} className="flex items-center gap-1 hover:text-red-500">
          <Heart size={14} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
          {isLiked ? 'Đã thích' : 'Thích'} ({likesCount})
        </button>
        <button onClick={() => setShowReply(!showReply)} className="flex items-center gap-1 hover:text-blue-500">
          <MessageCircle size={14} /> Phản hồi ({replyCount})
        </button>
      </div>

      {/* Form reply */}
      {showReply && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Trả lời bình luận..."
            disabled={isReplying}
          />
          <Button onClick={handleReplySubmit} disabled={isReplying}>
            {isReplying ? 'Đang gửi...' : 'Gửi'}
          </Button>
        </div>
      )}

      {/* Hiển thị replies */}
      {data.replies?.length > 0 && (
        <div className="mt-2 space-y-2">
          {data.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              data={reply}
              onReply={onReply}
              nestLevel={nestLevel + 1}
              postId={postId}
            />
          ))}
        </div>
      )}
    </div>
  );
}