import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from '../../components/ui/dialog';
  import { Input } from '../../components/ui/input';
  import { Button } from '../../components/ui/button';
  import { useState } from 'react';
  import { useAuth } from '../../contexts/AuthContext';
  import CommentItem from './CommentItem';

  
  export default function CommentModal({ open, onClose, postId }) {
    const { user, setShowLoginModal } = useAuth();
    const [comment, setComment] = useState('');
    const [comments, setComments] = useState([
        {
          id: 1,
          author: 'User 1',
          content: 'Sản phẩm đẹp quá!',
          liked: false,
          replies: [
            { id: 11, author: 'Shop ABC', content: 'Cảm ơn bạn nhiều nha!', liked: false }
          ]
        },
    
      ]);
  
    const handleSubmit = () => {
      if (!user) {
        setShowLoginModal(true);
        return;
      }
  
      if (comment.trim() !== '') {
        const newComment = {
          id: Date.now(),
          author: user.name || 'Bạn',
          content: comment,
        };
        setComments([...comments, newComment]);
        setComment('');
      }
    };

    const handleReply = (parentId, replyData) => {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId ? { ...c, replies: [...(c.replies || []), replyData] } : c
          )
        );
      };
  
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Bình luận bài viết #{postId}</DialogTitle>
          </DialogHeader>
  
          {/* Danh sách bình luận */}
          <div className="max-h-60 overflow-y-auto space-y-3">
            {comments.map((cmt) => (
                <CommentItem key={cmt.id} data={cmt} onReply={handleReply} />
            ))}
          </div>
  
          {/* Ô nhập bình luận */}
          <div className="flex items-center gap-2 mt-4">
            <Input
              placeholder="Nhập bình luận..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button onClick={handleSubmit}>Gửi</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  