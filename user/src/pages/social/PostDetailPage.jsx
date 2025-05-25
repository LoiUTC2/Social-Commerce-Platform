"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import LeftSidebar from "../../components/layout/LeftSidebar"
import RightSidebar from "../../components/layout/RightSidebar"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import {
  ArrowLeft,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Share,
  Globe,
  Users,
  Lock,
  ShoppingCart,
  Send,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "../../components/ui/tooltip"

import MediaViewer from "../../components/feed/MediaViewer"
import MediaGallery from "../../components/feed/MediaGallery"
import ProductCard from "../../components/feed/ProductCard"
import CommentSection from "../../components/feed/CommentSection"
import LikesListModal from "../../components/feed/LikesListModal"
import SharePostModal from "../../components/feed/SharePostModal"
import SharesListModal from "../../components/feed/SharesListModal"

import { getPostById } from "../../services/postService"
import { likePost, getPostLikes, getPostShares } from "../../services/postInteractionService"
import { useAuth } from "../../contexts/AuthContext"

import { toast } from "sonner"
import { formatDistanceToNow, format } from "date-fns"
import { vi } from "date-fns/locale"

export default function PostDetailPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, setShowLoginModal } = useAuth()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(null)
  const [allMedia, setAllMedia] = useState([])

  // Interaction states
  const [likes, setLikes] = useState(0)
  const [liked, setLiked] = useState(false)
  const [likesList, setLikesList] = useState([])
  const [comments, setComments] = useState(0)
  const [shares, setShares] = useState(0)
  const [sharesList, setSharesList] = useState([])

  // Modal states
  const [openLikesModal, setOpenLikesModal] = useState(false)
  const [openSharesModal, setOpenSharesModal] = useState(false)
  const [openShare, setOpenShare] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await getPostById(postId)
        setPost(response.data)
        setLikes(response.data.likesCount || 0)
        setComments(response.data.commentsCount || 0)
        setShares(response.data.sharesCount || 0)

        // Tạo danh sách tất cả media
        const mediaList = []

        // Kiểm tra nếu là bài share
        const isSharedPost = response.data.type === "share" && response.data.sharedPost
        const currentPost = isSharedPost ? response.data : response.data

        // Chỉ thêm media từ bài viết hiện tại (không phải sharedPost)
        if (!isSharedPost) {
          // Thêm media từ bài viết (ưu tiên video)
          if (currentPost.videos) {
            currentPost.videos.forEach((url) => {
              mediaList.push({ url, type: "video", source: "post" })
            })
          }
          if (currentPost.images) {
            currentPost.images.forEach((url) => {
              mediaList.push({ url, type: "image", source: "post" })
            })
          }

          // Thêm media từ sản phẩm
          if (currentPost.productIds) {
            currentPost.productIds.forEach((product) => {
              if (product.videos) {
                product.videos.forEach((url) => {
                  mediaList.push({
                    url,
                    type: "video",
                    source: "product",
                    productId: product._id,
                    productName: product.name,
                  })
                })
              }
              if (product.images) {
                product.images.forEach((url) => {
                  mediaList.push({
                    url,
                    type: "image",
                    source: "product",
                    productId: product._id,
                    productName: product.name,
                  })
                })
              }
            })
          }
        }

        setAllMedia(mediaList)
      } catch (err) {
        setError(err.message)
        toast.error("Không thể tải bài viết")
      } finally {
        setLoading(false)
      }
    }

    if (postId) {
      fetchPost()
    }
  }, [postId])

  // Fetch likes status
  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const res = await getPostLikes(postId)
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

    if (postId && post) {
      fetchLikes()
    }
  }, [postId, user, post])

  const handleGoBack = () => {
    navigate(-1)
  }

  const handleMediaClick = (index) => {
    setSelectedMediaIndex(index)
  }

  const handleLike = async () => {
    if (!user) return setShowLoginModal(true)

    try {
      const res = await likePost(postId)
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
      toast.error("Không thể thích bài viết")
    }
  }

  const handleGetLikeList = async () => {
    if (!user) return setShowLoginModal(true)
    try {
      const res = await getPostLikes(postId)
      const likesData = res.data || []
      setLikesList(likesData)
      setLikes(likesData.length)
      setOpenLikesModal(true)
    } catch (err) {
      console.error("Lỗi khi lấy danh sách like:", err)
    }
  }

  const handleGetShareList = async () => {
    if (!user) return setShowLoginModal(true)
    try {
      const res = await getPostShares(postId)
      const sharesData = res.data.shares || []
      setSharesList(sharesData)
      setShares(sharesData.length)
      setOpenSharesModal(true)
    } catch (err) {
      console.error("Lỗi khi lấy danh sách chia sẻ:", err)
    }
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

  const handleMessage = () => {
    if (!user) return setShowLoginModal(true)
    navigate(`/messages/${post.author?._id?._id}`)
  }

  const renderPrivacyIcon = (privacy) => {
    const iconProps = { className: "w-4 h-4" }
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

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="px-4 max-w-[1600px] mx-auto pt-2">
          <div className="flex gap-6">
            <aside className="w-[22%] hidden xl:block sticky top-[112px] h-fit self-start">
              <LeftSidebar />
            </aside>
            <main className="flex-1">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-96 bg-gray-200 rounded"></div>
              </div>
            </main>
            <aside className="w-[25%] hidden 2xl:block sticky top-[112px] h-fit self-start">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="px-4 max-w-[1600px] mx-auto pt-2">
          <div className="flex gap-6">
            <aside className="w-[22%] hidden xl:block sticky top-[112px] h-fit self-start">
              <LeftSidebar />
            </aside>
            <main className="flex-1 flex items-center justify-center">
              <Card className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Không tìm thấy bài viết</h2>
                <p className="text-gray-600 mb-4">Bài viết có thể đã bị xóa hoặc bạn không có quyền xem.</p>
                <Button onClick={handleGoBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lại
                </Button>
              </Card>
            </main>
            <aside className="w-[25%] hidden 2xl:block sticky top-[112px] h-fit self-start">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    )
  }

  const { author, content, createdAt, privacy, productIds, sharedPost } = post
  const nameAuthor = author?.type === "User" ? author?._id?.fullName : author?._id?.name
  const avatarAuthor = author?._id?.avatar

  const isSharedPost = post.type === "share" && sharedPost
  const postToShare = isSharedPost ? sharedPost : post
  const postIdToShare = postToShare._id

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="px-4 max-w-[1600px] mx-auto pt-2">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside className="w-[22%] hidden xl:block sticky top-[112px] h-fit self-start">
            <LeftSidebar />
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-4">
            {/* Back Button */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleGoBack} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Quay lại
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Chi tiết bài viết</h1>
            </div>

            {/* Post Detail Card */}
            <Card className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={avatarAuthor || "/placeholder.svg?height=48&width=48"}
                          className="rounded-full w-12 h-12 object-cover cursor-pointer ring-2 ring-gray-100"
                          onClick={() => navigate(`/feed/profile/${author?._id?.slug}`)}
                          alt="Profile"
                        />
                        {author?.type === "Shop" && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                            <ShoppingCart className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p
                            className="font-semibold text-gray-900 cursor-pointer hover:underline text-lg"
                            onClick={() => navigate(`/feed/profile/${author?._id?.slug}`)}
                          >
                            {nameAuthor || "Người dùng"}
                          </p>
                          {author?.type === "Shop" && (
                            <Badge variant="secondary" className="text-xs">
                              Shop
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-pointer hover:text-gray-700">
                                  {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: vi }).replace(
                                    /^khoảng /,
                                    "",
                                  )}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {format(new Date(createdAt), "EEEE, dd 'tháng' MM, yyyy 'lúc' HH:mm", { locale: vi })}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="text-gray-300">•</span>
                          <TooltipProvider>{renderPrivacyIcon(privacy)}</TooltipProvider>
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
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
                </div>

                {/* Content */}
                {content && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-900 whitespace-pre-line leading-relaxed text-base">{content}</p>
                  </div>
                )}

                {/* Shared Post */}
                {isSharedPost && sharedPost && (
                  <div className="mx-6 mb-4 border rounded-xl overflow-hidden bg-gray-50/50">
                    {/* Header của bài viết gốc */}
                    <div className="p-4 pb-3 bg-white">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={sharedPost.author?._id?.avatar || "/placeholder.svg?height=40&width=40"}
                            className="w-10 h-10 rounded-full object-cover cursor-pointer ring-2 ring-gray-100"
                            onClick={() => navigate(`/feed/profile/${sharedPost.author?._id?.slug}`)}
                            alt="Original author"
                          />
                          {sharedPost.author?.type === "Shop" && (
                            <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                              <ShoppingCart className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className="font-semibold text-gray-900 cursor-pointer hover:underline"
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
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-pointer hover:text-gray-700">
                                    {formatDistanceToNow(new Date(sharedPost?.createdAt), {
                                      addSuffix: true,
                                      locale: vi,
                                    }).replace(/^khoảng /, "")}
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
                      <div className="px-4 pb-3 bg-white">
                        <p className="text-gray-900 whitespace-pre-line leading-relaxed">{sharedPost.content}</p>
                      </div>
                    )}

                    {/* Media Gallery của bài viết gốc */}
                    {(sharedPost.images?.length > 0 ||
                      sharedPost.videos?.length > 0 ||
                      sharedPost.productIds?.length > 0) && (
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
                            hasProducts={sharedPost.productIds?.length > 0}
                          />
                        </div>
                      )}

                    {/* Product Cards của bài viết gốc */}
                    {sharedPost.productIds && sharedPost.productIds.length > 0 && (
                      <div className="px-4 pb-3 bg-white">
                        <h3 className="font-semibold text-gray-900 mb-3">Sản phẩm liên quan</h3>
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
                {allMedia.length > 0 && (
                  <div className="px-6 pb-4">
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${Math.min(allMedia.length, 3)}, 1fr)` }}
                    >
                      {allMedia.slice(0, 6).map((mediaItem, index) => (
                        <div
                          key={index}
                          className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => handleMediaClick(index)}
                        >
                          {mediaItem.type === "video" ? (
                            <video src={mediaItem.url} className="w-full h-full object-cover" muted loop autoPlay={true} controls={true} playsInline />
                          ) : (
                            <img
                              src={mediaItem.url || "/placeholder.svg"}
                              alt={`Media ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}

                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                          {/* Media type badge */}
                          {mediaItem.type === "video" && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                              Video
                            </div>
                          )}

                          {/* Source badge */}
                          {mediaItem.source === "product" && (
                            <div className="absolute top-2 right-2 bg-blue-500/90 text-white px-2 py-1 rounded-full text-xs">
                              Sản phẩm
                            </div>
                          )}

                          {/* More overlay */}
                          {index === 5 && allMedia.length > 6 && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="text-white text-xl font-bold">+{allMedia.length - 6}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {productIds && productIds.length > 0 && (
                  <div className="px-6 pb-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Sản phẩm liên quan</h3>
                    <div className="space-y-3">
                      {productIds.map((product) => (
                        <ProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Interaction Stats */}
                <div className="px-6 py-3 border-t border-gray-100">
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
                              <span>{likes || 0}</span>
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

                    <div className="flex items-center gap-4 text-sm">
                      <span>{comments || 0} bình luận</span>
                      <button
                        className="hover:underline hover:text-green-600 transition-colors"
                        onClick={handleGetShareList}
                      >
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
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/30">
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
            </Card>

            {/* Comments Section */}
            <CommentSection postId={postId} commentsCount={comments} onCommentsCountChange={setComments} />
          </main>

          {/* Right Sidebar */}
          <aside className="w-[25%] hidden 2xl:block sticky top-[112px] h-fit self-start">
            <RightSidebar />
          </aside>
        </div>
      </div>

      {/* Media Viewer Modal */}
      {selectedMediaIndex !== null && (
        <MediaViewer media={allMedia} initialIndex={selectedMediaIndex} onClose={() => setSelectedMediaIndex(null)} />
      )}

      {/* Modals */}
      <LikesListModal
        open={openLikesModal}
        onOpenChange={setOpenLikesModal}
        likes={likesList}
        title="Những người đã thích bài viết"
        emptyMessage="Chưa có ai thích bài viết này"
      />
      <SharePostModal
        open={openShare}
        onOpenChange={setOpenShare}
        post={post}
        postIdToShare={postIdToShare}
        onShareCompleted={handleShareCompleted}
      />
      <SharesListModal open={openSharesModal} onOpenChange={setOpenSharesModal} shares={sharesList} />
    </div>
  )
}
