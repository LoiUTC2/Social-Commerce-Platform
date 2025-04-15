import { useState } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share, Send } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useAuth } from '../../contexts/AuthContext';
import mySneakers from '../../assets/images.jpg';
import CommentModal from './CommentModal';
import { useNavigate } from 'react-router-dom';

export default function FeedItem({ id }) {
  const { user, setShowLoginModal } = useAuth();
  const [openComment, setOpenComment] = useState(false);
  const navigate = useNavigate();
  // Giả lập dữ liệu bài viết
  const hasImage = true;
  const [likes, setLikes] = useState(12251);
  const [comments, setComments] = useState(4);
  const [shares, setShares] = useState(2);

  const handleLike = () => {
    if (!user) return setShowLoginModal(true);
    setLikes(likes + 1);
  };

  const handleComment = () => {
    if (!user) return setShowLoginModal(true);
    setOpenComment(true);
  };

  const handleShare = () => {
    if (!user) return setShowLoginModal(true);
    setShares(shares + 1);
  };

  const handleMessage = () => {
    if (!user) return setShowLoginModal(true);
    console.log('📨 Gửi tin nhắn cho Shop ABC');
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="https://i.pravatar.cc/40" className="rounded-full w-10 h-10" onClick={()=> navigate('/feed/profile')}/>
            <div>
              <p className="font-semibold">Shop ABC</p>
              <p className="text-xs text-gray-500">2 giờ trước</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Quan tâm</DropdownMenuItem>
              <DropdownMenuItem>Không quan tâm</DropdownMenuItem>
              <DropdownMenuItem>Ẩn bài viết</DropdownMenuItem>
              <DropdownMenuItem>Lưu bài viết</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Nội dung bài viết */}
        <p>🌟 Giày sneaker mới về! Giảm giá 30% trong hôm nay! 🛍️</p>

        {/* Hình ảnh sản phẩm */}
        {hasImage && (
          <div className="relative">
            <img
              src={mySneakers}
              alt="Sản phẩm"
              className="rounded-xl w-full object-cover"
            />
            <div className="absolute bottom-3 right-3 flex gap-2">
              <Button size="sm" variant="outline" className="backdrop-blur bg-white/70" onClick={() => navigate(`/marketplace/products/${5}`)}>Xem chi tiết</Button>
              <Button size="sm" onClick={() => navigate(`/marketplace/checkout`)} >Mua ngay</Button>
            </div>
          </div>
        )}

        {/* Thanh tương tác & gửi tin nhắn */}
        <div className="flex justify-between items-center text-sm text-gray-600 px-2 h-2">
          {/* Số lượt thích */}
          <div className="pl-1">
            <span className="ml-6">{likes.toLocaleString()} lượt thích</span>
          </div>

          <div className="flex items-center gap-4">
            <span>{comments} bình luận</span>
            <span>{shares} lượt chia sẻ</span>

            {/* Gửi tin nhắn */}
            <Button
              onClick={handleMessage}
              size="sm"
              variant="ghost"
              className="text-blue-600 flex items-center gap-1 h-8 px-2"
            >
              <Send size={16} /> Gửi tin nhắn
            </Button>
          </div>
        </div>

        {/* Các nút tương tác hành động */}
        <div className="flex justify-around text-gray-700 mt-2 pb-1 border-t pt-2 text-sm">
          <button onClick={handleLike} className="flex items-center gap-1 hover:text-red-500">
            <Heart size={16} /> Thích
          </button>
          <button onClick={handleComment} className="flex items-center gap-1 hover:text-blue-500">
            <MessageCircle size={16} /> Bình luận
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 hover:text-green-500">
            <Share size={16} /> Chia sẻ
          </button>
        </div>

      </CardContent>

      <CommentModal open={openComment} onClose={setOpenComment} postId={id} />

    </Card>
    
  );
  
}
