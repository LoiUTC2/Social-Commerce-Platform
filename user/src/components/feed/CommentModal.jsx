import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import CommentItem from './CommentItem';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../components/ui/select';
import { commentOrReply, getCommentsByPost } from '../../services/postInteractionService';
import { toast } from 'sonner';

export default function CommentModal({ open, onClose, postId }) {
  const { user, setShowLoginModal } = useAuth();
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [sortType, setSortType] = useState('top');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sortOptions = [
    { value: 'top', label: 'Nổi bật nhất' },
    { value: 'newest', label: 'Mới nhất' },
    { value: 'oldest', label: 'Cũ Nhất' },
  ];

  useEffect(() => {
    const fetchComments = async () => {
      if (!postId) return;
      try {
        const res = await getCommentsByPost(postId, sortType);
        setComments(res.data.comments || []);
      } catch (err) {
        console.error('Lỗi khi tải bình luận:', err);
        toast.error('Lỗi khi tải bình luận', { description: err.message });
      }
    };

    if (open) {
      fetchComments();
    }
  }, [open, postId, sortType]);

  const handleSubmit = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (comment.trim() !== '') {
      setIsSubmitting(true);
      try {
        const res = await commentOrReply(postId, comment);
        if (res.data.comment) {
          const newComment = {
            ...res.data.comment,
            author: {
              type: user.role === 'seller' ? 'Shop' : 'User',
              _id: {
                _id: user._id,
                fullName: user.fullName,
                avatar: user.avatar,
                name: user.role === 'seller' ? user.shopName : undefined,
              },
            },
            replies: [],
            likes: [],
          };
          setComments((prev) => [newComment, ...prev]);
          setComment('');
          toast.success('Bình luận thành công');
        }
      } catch (err) {
        console.error('Lỗi gửi bình luận:', err);
        toast.error('Lỗi khi gửi bình luận', { description: err.message });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReply = async (parentId, replyData) => {
    if (!user) return setShowLoginModal(true);

    try {
      const res = await commentOrReply(postId, replyData.content, parentId);
      if (res.data.comment) {
        const newReply = {
          ...res.data.comment,
          author: {
            type: user.role === 'seller' ? 'Shop' : 'User',
            _id: {
              _id: user._id,
              fullName: user.fullName,
              avatar: user.avatar,
              name: user.role === 'seller' ? user.shopName : undefined,
            },
          },
          likes: [],
        };
        const updatedComments = updateCommentTree(comments, parentId, newReply);
        setComments(updatedComments);
        toast.success('Phản hồi thành công');
      }
    } catch (err) {
      console.error('Lỗi gửi phản hồi:', err);
      toast.error('Lỗi khi gửi phản hồi', { description: err.message });
    }
  };

  const updateCommentTree = (comments, parentId, newReply) => {
    return comments.map((comment) => {
      if (comment._id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply],
        };
      }

      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentTree(comment.replies, parentId, newReply),
        };
      }

      return comment;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-xl bg-white rounded-xl shadow-lg"
        overlayClassName="bg-black/10 backdrop-blur-sm"
      >
        <DialogHeader className="border-b pb-2 mb-2">
          <DialogTitle className="text-center text-lg font-semibold">Bình luận</DialogTitle>
        </DialogHeader>

        <div className="flex justify-start">
          <Select value={sortType} onValueChange={setSortType}>
            <SelectTrigger className="w-40 h-8 text-sm bg-gray-100 border-none">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">Chưa có bình luận nào</div>
          ) : (
            comments.map((comment) => (
              <CommentItem
                key={comment._id}
                data={comment}
                onReply={handleReply}
                nestLevel={0}
                postId={postId}
              />
            ))
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Nhập bình luận..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}