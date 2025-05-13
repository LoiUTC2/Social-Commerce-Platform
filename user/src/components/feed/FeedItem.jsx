import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { MoreHorizontal, Heart, MessageCircle, Share, Send, Plus, Lock, Globe, Users } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../../components/ui/tooltip';
import { useAuth } from '../../contexts/AuthContext';

import MediaItem from './MediaItem';
import LikesListModal from './LikesListModal';
import CommentModal from './CommentModal';
import SharePostModal from './SharePostModal';

import { useNavigate } from 'react-router-dom';
import { likePost, getPostLikes, sharePost, getPostShares } from '../../services/postInteractionService';

import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';



export default function FeedItem({ post }) {
  const { _id, userId, content, images, videos, createdAt, likesCount = 0, commentsCount = 0, sharesCount = 0, sharedPost, privacy } = post;
  const { user, setShowLoginModal } = useAuth();

  const [likes, setLikes] = useState(likesCount); // số lượng like
  const [liked, setLiked] = useState(false); // tuỳ chọn: theo dõi trạng thái đã like hay chưa
  const [likesList, setLikesList] = useState([]); // List người đã like

  const [comments, setComments] = useState(commentsCount);
  const [shares, setShares] = useState(sharesCount);

  const [openLikesModal, setOpenLikesModal] = useState(false);

  const [openComment, setOpenComment] = useState(false);
  const [openShare, setOpenShare] = useState(false);

  const navigate = useNavigate();

  const renderPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public':
        return (
          <span title="Công khai" className="flex items-center gap-1 text-gray-500 text-xs cursor-pointer">
            <Globe className="w-4 h-3" />
          </span>
        );
      case 'friends':
        return (
          <span title="Bạn bè" className="flex items-center gap-1 text-gray-500 text-xs cursor-pointer">
            <Users className="w-4 h-3" />
          </span>
        );
      case 'private':
        return (
          <span title="Chỉ mình tôi" className="flex items-center gap-1 text-gray-500 text-xs cursor-pointer">
            <Lock className="w-4 h-3" />
          </span>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await getPostLikes(_id);
        const likesData = res.data || [];
        setLikesList(likesData);
        setLikes(likesData.length);
        // Kiểm tra xem user hiện tại đã like bài viết chưa
        if (user) {
          const userLiked = likesData.some(likeItem => likeItem?._id === user?._id);
          setLiked(userLiked);
        }
      } catch (err) {
        console.error('Lỗi lấy danh sách likes:', err);
      }
    };
    fetchLikes();
  }, [_id, user]);

  const handleLike = async () => {
    if (!user) return setShowLoginModal(true);

    try {
      const res = await likePost(_id); // gọi API 
      const likesCountFromDB = res.data;
      setLikes(likesCountFromDB);
      if (res.message.includes('Đã thích')) {
        setLiked(true);
        // Thêm user hiện tại vào danh sách likes nếu chưa có
        const userAlreadyLiked = likesList.some(like => like._id === user?._id);
        if (!userAlreadyLiked) {
          setLikesList(prev => [...prev, {
            _id: user?._id,
            fullName: user?.fullName,
            avatar: user?.avatar
          }]);
        }
      } else {
        setLiked(false);
        setLikesList(prev => prev.filter(like => like?._id !== user?._id)); // Xóa user hiện tại khỏi danh sách likes
      }
    } catch (err) {
      console.error('Lỗi like bài viết:', err);
    }
  };

  const handleGetLikeList = async () => {
    if (!user) return setShowLoginModal(true);

    try {
      const res = await getPostLikes(_id); // ✅ Gọi API
      const likesData = res.data || [];
      setLikesList(likesData);// Lưu danh sách
      setLikes(likesData.length);
      setOpenLikesModal(true);
      console.log("like", res.data)
    } catch (err) {
      console.error('Lỗi khi lấy danh sách like:', err);
    }
  };

  const handleOpenLikesModal = () => {
    if (likes > 0) {
      handleGetLikeList();
    }
  };

  const handleComment = () => {
    if (!user) return setShowLoginModal(true);
    setOpenComment(true);
  };

  const handleShare = () => {
    if (!user) return setShowLoginModal(true);
    setOpenShare(true);
  };

  const handleShareCompleted = () => {
    setShares(prev => prev + 1);
    toast.success("Chia sẻ thành công", {
      description: "Bài viết đã được chia sẻ lên tường của bạn",
    });
  };

  const handleGetShareList = async () => {
    if (!user) return setShowLoginModal(true);

    try {
      const res = await getPostShares(_id); // ✅ Gọi API
      const likesData = res.data || [];
      setLikesList(likesData);// Lưu danh sách
      setLikes(likesData.length);
      setOpenLikesModal(true);
      console.log("like", res.data)
    } catch (err) {
      console.error('Lỗi khi lấy danh sách like:', err);
    }
  }

  // Kiểm tra có phải là bài viết được chia sẻ không
  const isSharedPost = post.type === 'share' && sharedPost;
  // Xác định bài viết cần chia sẻ (bài gốc nếu là bài share, nếu không thì là bài hiện tại)
  const postToShare = isSharedPost ? sharedPost : post;
  const postIdToShare = postToShare._id;

  const handleMessage = () => {
    if (!user) return setShowLoginModal(true);
    console.log('📨 Gửi tin nhắn cho Shop ABC');
    // navigate(`/messages/${userId?._id}`);
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={userId?.avatar || '/avatar-default.jpg'} className="rounded-full w-10 h-10" onClick={() => navigate('/feed/profile')} alt="Profile" />
            <div>
              <p className="font-semibold">{userId?.fullName || 'Người dùng'}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className='cursor-pointer' title={format(new Date(createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}>
                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: vi }).replace(/^khoảng /, '')}
                </span>
                {renderPrivacyIcon(post?.privacy)}
              </div>

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
        <p className="whitespace-pre-line">{content}</p>

        {/* Nếu là bài viết được chia sẻ, hiển thị bài viết gốc */}
        {isSharedPost && sharedPost && (
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <img
                src={sharedPost.userId?.avatar || '/avatar-default.jpg'}
                className="w-8 h-8 rounded-full"
                alt="Original author"
              />
              <div>
                <p className="font-medium text-sm">{sharedPost.userId?.fullName || 'Người dùng'}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className='cursor-pointer' title={format(new Date(createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}>
                    {formatDistanceToNow(new Date(sharedPost?.createdAt), { addSuffix: true, locale: vi }).replace(/^khoảng /, '')}
                  </span>
                  {renderPrivacyIcon(sharedPost?.privacy)}
                </div>
              </div>
            </div>
            <p className="text-sm whitespace-pre-line">{sharedPost.content}</p>

            {/* Media của bài viết gốc */}
            {sharedPost.images?.length > 0 || sharedPost.videos?.length > 0 ? (
              <div className="mt-2">
                <MediaItem
                  images={sharedPost.images}
                  videos={sharedPost.videos}
                  postId={sharedPost._id}
                  compact={true} // Hiển thị nhỏ gọn hơn
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Media container */}
        {(images?.length > 0 || videos?.length > 0) && (
          <MediaItem images={images} videos={videos} postId={_id} />
        )}

        {/* Thanh tương tác & gửi tin nhắn */}
        <div className="flex justify-between items-center text-sm text-gray-600 px-2 h-2">
          {/* Số lượt thích ❤ 👍 😆 */}
          <div className="pl-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-6 hover:text-black-500 cursor-pointer hover:underline" onClick={handleOpenLikesModal}>
                    {likes > 0 ? `${likes.toLocaleString()} lượt thích` : 'Chưa có lượt thích'}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="bg-white shadow-lg rounded-lg p-2 text-sm text-black">
                  {likesList.length === 0 ? (
                    <div>Chưa có ai thích</div>
                  ) : (
                    <div className="max-w-[200px]">
                      {likesList.slice(0, 5).map((user) => (
                        <div key={user?._id} className="truncate">
                          {user?.fullName}
                        </div>
                      ))}
                      {likesList.length > 5 && (
                        <div className="text-gray-400 text-xs mt-1">
                          ... và {likesList.length - 5} người khác
                        </div>
                      )}
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Số bình luận, chia sẻ, nhắn tin */}
          <div className="flex items-center gap-4">
            <span className='cursor-pointer hover:underline' onClick={handleComment}>{comments} bình luận</span>
            <span className='cursor-pointer hover:underline' onClick={handleShare}>{shares} lượt chia sẻ</span>

            {/* Gửi tin nhắn */}
            {user && user._id !== userId?._id && (
              <Button
                onClick={handleMessage}
                size="sm"
                variant="ghost"
                className="text-blue-600 flex items-center gap-1 h-8 px-2"
              >
                <Send size={16} /> Gửi tin nhắn
              </Button>
            )}
          </div>
        </div>

        {/* Các nút tương tác hành động */}
        <div className="flex justify-around text-gray-700 mt-2 pb-1 border-t pt-2 text-sm">
          <button onClick={handleLike} className={`flex items-center gap-1 hover:text-red-500 ${liked ? 'text-red-500' : ''}`}>
            <Heart size={16} className={liked ? 'fill-red-500' : ''} /> Thích
          </button>

          <button onClick={handleComment} className="flex items-center gap-1 hover:text-blue-500">
            <MessageCircle size={16} /> Bình luận
          </button>
          <button onClick={handleShare} className="flex items-center gap-1 hover:text-green-500">
            <Share size={16} /> Chia sẻ
          </button>
        </div>

      </CardContent>

      <LikesListModal open={openLikesModal} onOpenChange={setOpenLikesModal} likes={likesList} />
      <CommentModal open={openComment} onClose={setOpenComment} postId={_id} />

      <SharePostModal
        open={openShare}
        onOpenChange={setOpenShare}
        post={postToShare} // Truyền bài viết gốc nếu là bài share
        postIdToShare={postIdToShare} // Truyền ID của bài viết cần chia sẻ
        onShareCompleted={handleShareCompleted}
      />
    </Card>

  );

}
