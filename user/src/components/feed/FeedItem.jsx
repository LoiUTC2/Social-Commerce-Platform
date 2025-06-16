import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { MoreHorizontal, Heart, MessageCircle, Share, Send, Lock, Globe, Users, ShoppingCart, UserPlus, UserCheck, Bookmark, BookmarkCheck } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../components/ui/tooltip"

import MediaGallery from "./MediaGallery"
import ProductCard from "./ProductCard"
import LikesListModal from "./LikesListModal"
import CommentModal from "./CommentModal"
import SharePostModal from "./SharePostModal"
import SharesListModal from "./SharesListModal"

import { toast } from "sonner"
import { formatDistanceToNow, format, isValid } from "date-fns"
import { vi } from "date-fns/locale"
import { formatTimeAgo } from '../../utils/timeFormatter';
import { useNavigate } from "react-router-dom"

import { likePost, getPostLikes, getPostShares } from "../../services/postInteractionService"
import { toggleFollow } from "../../services/followService"
import { toggleSavePost, checkSavedPost } from "../../services/savedPostService"

import { useAuth } from "../../contexts/AuthContext"
import { useFollow } from "../../contexts/FollowContext";

export default function FeedItem({ post }) {
  const {
    _id,
    author,
    content,
    images = [],
    videos = [],
    productIds = [],
    createdAt,
    likesCount = 0,
    commentsCount = 0,
    sharesCount = 0,
    sharedPost,
    privacy,
  } = post

  const { user, setShowLoginModal } = useAuth()
  const { getFollowStatus, updateFollowStatus } = useFollow();
  const navigate = useNavigate()

  const nameAuthor = author?.type === "User" ? author?._id?.fullName : author?._id?.name
  const avatarAuthor = author?._id?.avatar

  const [isFollowing, setIsFollowing] = useState(false) //hiển thị chữ theo dõi/đang theo dõi
  const [followLoading, setFollowLoading] = useState(false)

  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const [likes, setLikes] = useState(likesCount)
  const [liked, setLiked] = useState(false)
  const [likesList, setLikesList] = useState([])
  const [comments, setComments] = useState(commentsCount)
  const [shares, setShares] = useState(sharesCount)
  const [sharesList, setSharesList] = useState([])

  const [openLikesModal, setOpenLikesModal] = useState(false)
  const [openSharesModal, setOpenSharesModal] = useState(false)
  const [openComment, setOpenComment] = useState(false)
  const [openShare, setOpenShare] = useState(false)

  const isSharedPost = post.type === "share" && sharedPost
  const postToShare = isSharedPost ? sharedPost : post
  const postIdToShare = postToShare._id

  // Xử lý media từ bài viết và sản phẩm (không bao gồm sharedPost)
  const getDisplayMedia = () => {
    let allMedia = []

    // Chỉ thêm media từ bài viết hiện tại (không phải sharedPost)
    if (!isSharedPost) {
      const postVideos = videos.map((url) => ({ url, type: "video", source: "post" }))
      const postImages = images.map((url) => ({ url, type: "image", source: "post" }))

      // Ưu tiên video trước
      allMedia = [...postVideos, ...postImages]

      // Thêm media từ sản phẩm nếu có
      if (productIds && productIds.length > 0) {
        productIds.forEach((product) => {
          if (product.videos) {
            const productVideos = product.videos.map((url) => ({
              url,
              type: "video",
              source: "product",
              productId: product._id,
              productName: product.name,
              productSlug: product.slug,
            }))
            allMedia = [...allMedia, ...productVideos]
          }

          if (product.images) {
            const productImages = product.images.map((url) => ({
              url,
              type: "image",
              source: "product",
              productId: product._id,
              productName: product.name,
              productSlug: product.slug,
            }))
            allMedia = [...allMedia, ...productImages]
          }
        })
      }
    }

    return allMedia
  }

  const displayMedia = getDisplayMedia()
  const hasProducts = productIds && productIds.length > 0

  const timePosted = formatTimeAgo(createdAt);

  const timeShared = formatTimeAgo(sharedPost?.createdAt, "Chưa được chia sẻ");


  const renderPrivacyIcon = (privacy) => {
    const iconProps = { className: "w-3 h-3" }
    switch (privacy) {
      case "public":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Globe {...iconProps} />
            </TooltipTrigger>
            <TooltipContent>Công khai</TooltipContent>
          </Tooltip>
        )
      case "friends":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Users {...iconProps} />
            </TooltipTrigger>
            <TooltipContent>Bạn bè</TooltipContent>
          </Tooltip>
        )
      case "private":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Lock {...iconProps} />
            </TooltipTrigger>
            <TooltipContent>Chỉ mình tôi</TooltipContent>
          </Tooltip>
        )
      default:
        return null
    }
  }

  // Kiểm tra trạng thái follow ngay từ đầu
  useEffect(() => {
    const checkInitialFollowStatus = async () => {
      if (!user || !author?._id?._id || user._id === author?._id?._id) {
        setIsFollowing(false);
        return;
      }

      try {
        const targetType = author?.type === "Shop" ? "shop" : "user";
        const isFollowing = await getFollowStatus(author._id._id, targetType);
        setIsFollowing(isFollowing);
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái follow:", err);
        setIsFollowing(false);
      }
    }

    checkInitialFollowStatus();
  }, [user, author?._id?._id, author?.type, getFollowStatus]);

  // Kiểm tra trạng thái lưu bài viết
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!user) {
        setIsSaved(false)
        return
      }

      try {
        const res = await checkSavedPost(_id)
        setIsSaved(res.data.isSaved)
      } catch (err) {
        console.error("Lỗi kiểm tra trạng thái lưu bài viết:", err)
        setIsSaved(false)
      }
    }

    checkSavedStatus()
  }, [_id, user])

  // Kiểm tra trạng thái like
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await getPostLikes(_id)
        const likesData = res.data || []
        setLikesList(likesData)
        setLikes(likesData.length)

        if (user) {
          const userLiked = likesData.some(
            (likeItem) => likeItem?._id === user?._id && likeItem?.type === (user?.role === "seller" ? "Shop" : "User"),
          )
          setLiked(userLiked)
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách likes:", err)
      }
    }
    fetchLikes()
  }, [_id, user])

  const handleToggleFollow = async () => {
    if (!user) return setShowLoginModal(true);
    if (user._id === author?._id?._id) return;

    setFollowLoading(true);
    try {
      const targetType = author?.type === "Shop" ? "shop" : "user";
      const res = await toggleFollow({
        targetId: author._id._id,
        targetType
      });

      const newFollowStatus = res.data.isFollowing;
      setIsFollowing(newFollowStatus);

      // Cập nhật cache
      updateFollowStatus(author._id._id, targetType, newFollowStatus);

      toast.success(
        newFollowStatus ? "Đã theo dõi" : "Đã bỏ theo dõi",
        {
          description: newFollowStatus
            ? `Bạn đã theo dõi ${nameAuthor}`
            : `Bạn đã bỏ theo dõi ${nameAuthor}`
        }
      );
    } catch (err) {
      console.error("Lỗi toggle follow:", err);
      toast.error("Có lỗi xảy ra", {
        description: "Không thể thực hiện hành động này"
      });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user) return setShowLoginModal(true)

    setSaveLoading(true)
    try {
      const res = await toggleSavePost(_id)
      setIsSaved(!isSaved)

      toast.success(res.message || (isSaved ? "Đã bỏ lưu bài viết" : "Đã lưu bài viết thành công"), {
        description: isSaved
          ? "Bài viết đã được xóa khỏi danh sách đã lưu"
          : "Bài viết đã được thêm vào danh sách đã lưu"
      })
    } catch (err) {
      console.error("Lỗi khi lưu/bỏ lưu bài viết:", err)
      toast.error("Có lỗi xảy ra", {
        description: "Không thể thực hiện hành động này"
      })
    } finally {
      setSaveLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user) return setShowLoginModal(true)

    try {
      const res = await likePost(_id)
      const likesCountFromDB = res.data.likesCount
      setLikes(likesCountFromDB)

      if (res.message.includes("Đã thích")) {
        setLiked(true)
        const userAlreadyLiked = likesList.some((like) => like._id === user?._id)
        if (!userAlreadyLiked) {
          setLikesList((prev) => [
            ...prev,
            {
              _id: user?._id,
              type: user?.role === "seller" ? "Shop" : "User",
              fullName: user?.fullName,
              avatar: user?.avatar,
              name: user?.role === "seller" ? user?.shopName : undefined,
            },
          ])
        }
      } else {
        setLiked(false)
        setLikesList((prev) => prev.filter((like) => like?._id !== user?._id))
      }
    } catch (err) {
      console.error("Lỗi like bài viết:", err.message)
    }
  }

  const handleGetLikeList = async () => {
    if (!user) return setShowLoginModal(true)
    try {
      const res = await getPostLikes(_id)
      const likesData = res.data || []
      setLikesList(likesData)
      setLikes(likesData.length)
      setOpenLikesModal(true)
    } catch (err) {
      console.error("Lỗi khi lấy danh sách like:", err)
    }
  }

  const handleComment = () => {
    if (!user) return setShowLoginModal(true)
    setOpenComment(true)
  }

  const handleShare = () => {
    if (!user) return setShowLoginModal(true)
    setOpenShare(true)
  }

  const handleShareCompleted = () => {
    setShares((prev) => prev + 1)
    toast.success("Chia sẻ thành công", {
      description: "Bài viết đã được chia sẻ lên tường của bạn",
    })
  }

  const handleGetShareList = async () => {
    if (!user) return setShowLoginModal(true)
    try {
      const res = await getPostShares(_id)
      const sharesData = res.data.shares || []
      setSharesList(sharesData)
      setShares(sharesData.length)
      setOpenSharesModal(true)
    } catch (err) {
      console.error("Lỗi khi lấy danh sách chia sẻ:", err)
    }
  }

  const handleMessage = () => {
    if (!user) return setShowLoginModal(true)
    navigate(`/messages/${author?._id?._id}`)
  }

  return (
    <Card className="mb-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative">
                <img
                  src={avatarAuthor || "/placeholder.svg?height=40&width=40"}
                  className="rounded-full w-10 h-10 object-cover cursor-pointer ring-2 ring-gray-100"
                  onClick={() => navigate(`/feed/profile/${author?._id?.slug}`)}
                  alt="Profile"
                />
                {author?.type === "Shop" && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                    <ShoppingCart className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="font-semibold text-gray-900 cursor-pointer hover:underline truncate"
                    onClick={() => navigate(`/feed/profile/${author?._id?.slug}`)}
                  >
                    {nameAuthor || "Người dùng"}
                  </p>
                  {author?.type === "Shop" && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      Shop
                    </Badge>
                  )}

                  {/* Nút Follow - chỉ hiển thị khi user đã login và không phải chính mình */}
                  {user && user._id !== author?._id?._id && (
                    <Button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      size="sm"
                      variant={isFollowing ? "secondary" : "default"}
                      className={`ml-2 h-7 px-3 text-xs flex-shrink-0 ${isFollowing
                        ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                      {followLoading ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1" />
                      ) : isFollowing ? (
                        <UserCheck className="w-3 h-3 mr-1" />
                      ) : (
                        <UserPlus className="w-3 h-3 mr-1" />
                      )}
                      {followLoading ? "..." : isFollowing ? "Đang theo dõi" : "Theo dõi"}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-pointer hover:text-gray-700">
                          {timePosted}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {format(new Date(createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-gray-300">•</span>
                  <TooltipProvider>{renderPrivacyIcon(post?.privacy)}</TooltipProvider>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Quan tâm</DropdownMenuItem>
                <DropdownMenuItem>Không quan tâm</DropdownMenuItem>
                <DropdownMenuItem>Ẩn bài viết</DropdownMenuItem>

                <DropdownMenuItem
                  onClick={handleToggleSave}
                  disabled={saveLoading}
                  className="flex items-center gap-2"
                >
                  {saveLoading ? (
                    <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSaved ? (
                    <BookmarkCheck className="w-4 h-4" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  {saveLoading ? "Đang xử lý..." : isSaved ? "Bỏ lưu bài viết" : "Lưu bài viết"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Nội dung bài viết */}
        {content && (
          <div className="px-4 pb-3" onClick={() => navigate(`/feed/post/${post._id}`)}>
            <p className="text-gray-900 whitespace-pre-line leading-relaxed cursor-pointer">{content}</p>
          </div>
        )}

        {/* Bài viết được chia sẻ */}
        {isSharedPost && sharedPost && (
          <div className="mx-4 mb-3 border rounded-xl overflow-hidden bg-gray-50/50">
            {/* Header của bài viết gốc */}
            <div className="p-4 pb-3 bg-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={sharedPost.author?._id?.avatar || "/placeholder.svg?height=32&width=32"}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer ring-2 ring-gray-100"
                    onClick={() => navigate(`/feed/profile/${sharedPost.author?._id?.slug}`)}
                    alt="Original author"
                  />
                  {sharedPost.author?.type === "Shop" && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <ShoppingCart className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className="font-medium text-sm cursor-pointer hover:underline"
                      onClick={() => navigate(`/feed/profile/${sharedPost.author?._id?.slug}`)}
                    >
                      {sharedPost.author?._id?.fullName || sharedPost.author?._id?.name || "Người dùng"}
                    </p>
                    {sharedPost.author?.type === "Shop" && (
                      <Badge variant="secondary" className="text-xs">
                        Shop
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-pointer hover:text-gray-700">
                            {timeShared}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {format(new Date(sharedPost?.createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", {
                            locale: vi,
                          })}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-gray-300">•</span>
                    <TooltipProvider>{renderPrivacyIcon(sharedPost?.privacy)}</TooltipProvider>
                  </div>
                </div>
              </div>
            </div>

            {/* Nội dung bài viết gốc */}
            {sharedPost.content && (
              <div className="px-4 pb-3 bg-white point-cursor" onClick={() => navigate(`/feed/post/${sharedPost._id}`)}>
                <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed cursor-pointer">{sharedPost.content}</p>
              </div>
            )}

            {/* Media Gallery của bài viết gốc */}
            {(sharedPost.images?.length > 0 || sharedPost.videos?.length > 0 || sharedPost.productIds?.length > 0) && (
              <div className="bg-white">
                <MediaGallery
                  media={[
                    ...(sharedPost.videos?.map((url) => ({ url, type: "video", source: "post" })) || []),
                    ...(sharedPost.images?.map((url) => ({ url, type: "image", source: "post" })) || []),
                    // Thêm media từ sản phẩm của bài viết gốc
                    ...(sharedPost.productIds?.flatMap((product) => [
                      ...(product.videos?.map((url) => ({
                        url,
                        type: "video",
                        source: "product",
                        productId: product._id,
                        productName: product.name,
                        productSlug: product.slug,
                      })) || []),
                      ...(product.images?.map((url) => ({
                        url,
                        type: "image",
                        source: "product",
                        productId: product._id,
                        productName: product.name,
                        productSlug: product.slug,
                      })) || []),
                    ]) || []),
                  ]}
                  postId={sharedPost._id}
                  compact={true}
                  hasProducts={sharedPost.productIds?.length > 0}
                />
              </div>
            )}

            {/* Product Cards của bài viết gốc */}
            {sharedPost.productIds && sharedPost.productIds.length > 0 && (
              <div className="px-4 pb-3 bg-white">
                <div className="space-y-3">
                  {sharedPost.productIds.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Media Gallery */}
        {displayMedia.length > 0 && (
          <div className="relative">
            <MediaGallery media={displayMedia} postId={_id} hasProducts={hasProducts} />
          </div>
        )}

        {/* Product Cards */}
        {hasProducts && (
          <div className="px-4 pb-3">
            <div className="space-y-3">
              {productIds.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* Interaction Stats */}
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      onClick={() => likes > 0 && handleGetLikeList()}
                    >
                      <div className="flex -space-x-1">
                        <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>
                      <span>{likes > 0 ? `${likes.toLocaleString()}` : "Chưa có lượt thích"}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {likesList.length === 0 ? (
                      <div>Chưa có ai thích</div>
                    ) : (
                      <div className="max-w-[200px]">
                        {likesList.slice(0, 5).map((user) => (
                          <div key={user?._id} className="truncate">
                            {user?.type === "User" ? user?.fullName : user?.name}
                          </div>
                        ))}
                        {likesList.length > 5 && (
                          <div className="text-gray-400 text-xs mt-1">... và {likesList.length - 5} người khác</div>
                        )}
                      </div>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <button className="hover:underline hover:text-blue-600 transition-colors" onClick={handleComment}>
                {comments || 0} bình luận
              </button>
              <button className="hover:underline hover:text-green-600 transition-colors" onClick={handleGetShareList}>
                {shares || 0} chia sẻ
              </button>

              {user && user._id !== author?._id?._id && (
                <Button
                  onClick={handleMessage}
                  size="sm"
                  variant="ghost"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                >
                  <Send className="w-4 h-4 mr-1" />
                  Nhắn tin
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30">
          <div className="grid grid-cols-3 gap-1">
            <Button
              onClick={handleLike}
              variant="ghost"
              className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${liked ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-gray-700 hover:bg-gray-100"
                }`}
            >
              <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
              <span className="font-medium">Thích</span>
            </Button>

            <Button
              onClick={handleComment}
              variant="ghost"
              className="flex items-center justify-center gap-2 py-2 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">Bình luận</span>
            </Button>

            <Button
              onClick={handleShare}
              variant="ghost"
              className="flex items-center justify-center gap-2 py-2 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-600 transition-all"
            >
              <Share className="w-5 h-5" />
              <span className="font-medium">Chia sẻ</span>
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Modals */}
      <LikesListModal open={openLikesModal} onOpenChange={setOpenLikesModal} likes={likesList} />
      <CommentModal open={openComment} onClose={setOpenComment} postId={_id} />
      <SharePostModal
        open={openShare}
        onOpenChange={setOpenShare}
        post={postToShare}
        postIdToShare={postIdToShare}
        onShareCompleted={handleShareCompleted}
      />
      <SharesListModal open={openSharesModal} onOpenChange={setOpenSharesModal} shares={sharesList} />
    </Card>
  )
}
