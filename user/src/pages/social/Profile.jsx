"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs"
import { Card, CardContent } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import FeedItem from "../../components/feed/FeedItem"
import ProductsTab from "../../components/marketplace/ProductsTab"
import { useEffect, useState, useCallback, useRef } from "react"
import { getPostsByAuthorSlug } from "../../services/postService"
import { getSavedPosts } from "../../services/savedPostService"
import { useAuth } from "../../contexts/AuthContext"
import { MapPin, Calendar, Users, Store, Heart, MessageCircle, Verified } from "lucide-react"
import { useParams } from "react-router-dom"
import { getShopBySlug } from "../../services/shopService"
import { getUserBySlug } from "../../services/authService"
import { toggleFollow } from "../../services/followService"
import { useFollow } from "../../contexts/FollowContext"
import FollowersFollowingModal from "../../components/feed/FollowersFollowingModal"

export default function Profile() {
  const { slug } = useParams();
  const { user: currentUser, setShowLoginModal } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [profileType, setProfileType] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("posts")

  const { getFollowStatus, updateFollowStatus } = useFollow()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)


  const [userPosts, setUserPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [postsInitialized, setPostsInitialized] = useState(false) // Thêm flag để tránh load posts nhiều lần

  const [savedPosts, setSavedPosts] = useState([])
  const [savedPostsLoading, setSavedPostsLoading] = useState(false)
  const [hasMoreSavedPosts, setHasMoreSavedPosts] = useState(true)
  const [currentSavedPage, setCurrentSavedPage] = useState(1)
  const [savedPostsInitialized, setSavedPostsInitialized] = useState(false)

  const [showFollowModal, setShowFollowModal] = useState(false)
  const [followModalTab, setFollowModalTab] = useState("followers")

  const lastPostElementRef = useRef()
  const lastSavedPostElementRef = useRef()
  const isOwnProfile = currentUser?.slug === slug

  const profileStats = {
    postsCount: userPosts.length || 0,
    followersCount: followersCount || profileData?.stats?.followersCount || 0,
    followingCount: profileData?.stats?.followingCount || 0,
    likesReceived: 1250,
  }

  //load trạng thái follow
  const loadFollowStatus = useCallback(async () => {
    if (!currentUser || !profileData || isOwnProfile) return

    try {
      const status = await getFollowStatus(profileData._id, profileType)
      setIsFollowing(status)
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái follow:", error)
    }
  }, [currentUser, profileData, profileType, isOwnProfile, getFollowStatus])

  //useEffect để load trạng thái follow
  useEffect(() => {
    if (profileData && currentUser && !isOwnProfile) {
      loadFollowStatus()
    }
  }, [profileData, currentUser, loadFollowStatus])

  ///////////////////

  // Optimize loadProfileData - loại bỏ dependency không cần thiết
  const loadProfileData = useCallback(async () => {
    if (!slug) return

    setProfileLoading(true)
    try {
      let userData = null
      let shopData = null

      try {
        userData = await getUserBySlug(slug)
        if (userData?.data) {
          setProfileData(userData.data)
          setProfileType('user')
          return
        }
      } catch (err) {
        console.log('Không tìm thấy user, thử tìm shop...')
      }

      try {
        shopData = await getShopBySlug(slug)
        if (shopData?.data) {
          setProfileData(shopData.data)
          setProfileType('shop')
          return
        }
      } catch (err) {
        console.log('Không tìm thấy shop')
      }

      console.error('Không tìm thấy profile với slug:', slug)
    } catch (err) {
      console.error("Lỗi khi tải thông tin profile:", err)
    } finally {
      setProfileLoading(false)
    }
  }, [slug]) // Chỉ phụ thuộc vào slug


  ////////////////////

  // Optimize loadPosts - tránh recreate function không cần thiết
  const loadPosts = useCallback(
    async (page = 1, reset = false) => {
      if (postsLoading || !slug) return

      setPostsLoading(true)
      try {
        const res = await getPostsByAuthorSlug(slug, page, 5)
        console.log('Posts API Response:', res.data)
        console.log('Posts array:', res.data?.posts)

        if (reset) {
          setUserPosts(res.data?.posts || [])
          setCurrentPage(1) // Reset currentPage khi reset posts
        } else {
          setUserPosts((prev) => [...prev, ...(res.data?.posts || [])])
        }

        setHasMorePosts(res.data?.pagination?.hasMore || false)
      } catch (err) {
        console.error("Lỗi khi tải bài viết:", err)
      } finally {
        setPostsLoading(false)
      }
    },
    [slug], // Loại bỏ postsLoading khỏi dependencies để tránh vòng lặp
  )

  // Optimize observer
  const lastPostObserver = useCallback(
    (node) => {
      if (postsLoading) return
      if (lastPostElementRef.current) lastPostElementRef.current.disconnect()

      lastPostElementRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMorePosts && !postsLoading) {
          const nextPage = currentPage + 1
          setCurrentPage(nextPage)
          loadPosts(nextPage)
        }
      })

      if (node) lastPostElementRef.current.observe(node)
    },
    [postsLoading, hasMorePosts, currentPage, loadPosts],
  )

  ///////////////////

  const loadSavedPosts = useCallback(
    async (page = 1, reset = false) => {
      if (savedPostsLoading) return

      setSavedPostsLoading(true)
      try {
        const res = await getSavedPosts(page, 5)
        console.log('Saved Posts API Response:', res.data)
        console.log('Posts:', res.data?.posts)

        if (reset) {
          setSavedPosts(res.data?.posts || [])
          setCurrentSavedPage(1)
        } else {
          setSavedPosts((prev) => [...prev, ...(res.data?.posts || [])])
        }

        // Kiểm tra hasMore từ pagination
        const pagination = res.data?.pagination
        if (pagination) {
          setHasMoreSavedPosts(pagination.currentPage < pagination.totalPages)
        } else {
          setHasMoreSavedPosts(false)
        }
      } catch (err) {
        console.error("Lỗi khi tải bài viết đã lưu:", err)
      } finally {
        setSavedPostsLoading(false)
      }
    },
    [], // Không cần dependencies để tránh vòng lặp
  )

  const lastSavedPostObserver = useCallback(
    (node) => {
      if (savedPostsLoading) return
      if (lastSavedPostElementRef.current) lastSavedPostElementRef.current.disconnect()

      lastSavedPostElementRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMoreSavedPosts && !savedPostsLoading) {
          const nextPage = currentSavedPage + 1
          setCurrentSavedPage(nextPage)
          loadSavedPosts(nextPage)
        }
      })

      if (node) lastSavedPostElementRef.current.observe(node)
    },
    [savedPostsLoading, hasMoreSavedPosts, currentSavedPage, loadSavedPosts],
  )

  // Load profile data chỉ khi slug thay đổi
  useEffect(() => {
    if (slug) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      // Reset tất cả state khi chuyển profile
      setProfileData(null)
      setProfileType(null)
      setUserPosts([])
      setPostsInitialized(false)
      setCurrentPage(1)
      setHasMorePosts(true)

      // Reset saved posts state
      setSavedPosts([])
      setSavedPostsInitialized(false)
      setCurrentSavedPage(1)
      setHasMoreSavedPosts(true)

      // Reset follow state
      setIsFollowing(false)
      setFollowLoading(false)
      setFollowersCount(0)

      loadProfileData()
    }
  }, [slug]) // Chỉ phụ thuộc vào slug

  //useEffect để set initial followersCount
  useEffect(() => {
    if (profileData) {
      const initialFollowersCount = profileData?.stats.followersCount || 0
      setFollowersCount(initialFollowersCount)
    }
  }, [profileData, followersCount])

  // Load posts chỉ khi cần thiết
  useEffect(() => {
    if (profileData && activeTab === "posts" && !postsInitialized) {
      setPostsInitialized(true)
      setCurrentPage(1)
      setUserPosts([])
      loadPosts(1, true)
    }
  }, [profileData, activeTab, postsInitialized])

  // Load saved posts chỉ khi cần thiết
  useEffect(() => {
    if (profileData && activeTab === "saved" && !savedPostsInitialized && isOwnProfile) {
      setSavedPostsInitialized(true)
      setCurrentSavedPage(1)
      setSavedPosts([])
      loadSavedPosts(1, true)
    }
  }, [profileData, activeTab, savedPostsInitialized, isOwnProfile])


  // Handle tab change
  const handleTabChange = (newTab) => {
    setActiveTab(newTab)
    if (newTab === "posts" && profileData) {
      setPostsInitialized(false)
    }
    else if (newTab === "saved" && profileData && isOwnProfile) {
      setSavedPostsInitialized(false)
    }
  }

  // Function để xử lý follow/unfollow
  const handleToggleFollow = async () => {
    if (!currentUser || !profileData || followLoading) return

    setFollowLoading(true)

    // OPTIMISTIC UPDATE - cập nhật UI ngay lập tức
    const optimisticFollowStatus = !isFollowing
    const currentFollowersCount = followersCount

    setIsFollowing(optimisticFollowStatus)
    setFollowersCount(prev => optimisticFollowStatus ? prev + 1 : prev - 1)

    try {
      const response = await toggleFollow({
        targetId: profileData._id,
        targetType: profileType
      })

      // SYNC với server response (đảm bảo chính xác)
      const actualFollowStatus = response.data.isFollowing
      const actualFollowersCount = response.data.targetFollowersCount

      setIsFollowing(actualFollowStatus)

      if (actualFollowersCount !== undefined) {
        setFollowersCount(actualFollowersCount)
      }

      updateFollowStatus(profileData._id, profileType, actualFollowStatus)
      console.log(response.message)

    } catch (error) {
      // ROLLBACK về trạng thái ban đầu nếu lỗi
      setIsFollowing(!optimisticFollowStatus)
      setFollowersCount(currentFollowersCount)
      console.error("Lỗi khi toggle follow:", error)
    } finally {
      setFollowLoading(false)
    }
  }

  // Function để mở modal follow
  const handleOpenFollowModal = (tabType) => {
    setFollowModalTab(tabType)
    setShowFollowModal(true)
  }

  // Xử lý tên hiển thị
  const getDisplayName = () => {
    if (profileType === 'shop') {
      return profileData?.name || 'Cửa hàng'
    }
    return profileData?.fullName || 'Người dùng'
  }

  // Xử lý avatar
  const getAvatarUrl = () => {
    if (profileType === 'shop') {
      return profileData?.avatar || profileData?.logo || "/shop-avatar-default.jpg"
    }
    return profileData?.avatar || "/avatar-default.jpg"
  }

  // Xử lý cover image
  const getCoverImageUrl = () => {
    if (profileType === 'shop') {
      return profileData?.coverImage || null
    }
    return profileData?.coverImage || null
  }

  // Xử lý bio/description
  const getBio = () => {
    if (profileType === 'shop') {
      return profileData?.description || "Chào mừng bạn đến với cửa hàng của chúng tôi!"
    }
    return profileData?.bio || "Chưa có tiểu sử"
  }

  // Xử lý location
  const getLocation = () => {
    if (profileType === 'shop') {
      const address = profileData?.contact?.businessAddress
      if (address) {
        return `${address.city}, ${address.province}`
      }
      return null
    }
    return profileData?.address
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy profile</h3>
            <p className="text-gray-600">Profile với slug "{slug}" không tồn tại.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header Profile với Cover Photo */}
        <div className="relative mb-8">
          {/* Cover Photo */}
          <div className="h-48 md:h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            {getCoverImageUrl() && (
              <img src={getCoverImageUrl()} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Profile Info Card */}
          <Card className="relative -mt-16 mx-4 md:mx-8 shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                {/* Avatar */}
                <div className="relative -mt-12 md:-mt-16">
                  <img
                    src={getAvatarUrl()}
                    alt="Avatar"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  {profileType === 'shop' && (
                    <Badge className="absolute -bottom-2 -right-2 bg-blue-500 text-white">
                      <Store className="w-3 h-3 mr-1" />
                      Shop
                    </Badge>
                  )}
                  {profileData?.status?.isApprovedCreate && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                      <Verified className="w-3 h-3" />
                    </Badge>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left space-y-3 mt-4 md:mt-0">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                      {getDisplayName()}
                    </h1>
                    {profileType === 'shop' && profileData?.owner && (
                      <p className="text-gray-600 font-medium">@{profileData.owner.fullName}</p>
                    )}
                    <p className="text-sm text-gray-500">@{slug}</p>
                  </div>

                  {/* Bio */}
                  <p className="text-gray-700 max-w-2xl">
                    {getBio()}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {getLocation() && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {getLocation()}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Tham gia {new Date(profileData?.createdAt).toLocaleDateString("vi-VN")}
                    </div>
                    {profileType === 'shop' && (
                      <>
                        {profileData?.stats?.rating?.avg > 0 && (
                          <div className="flex items-center gap-1">
                            ⭐ {profileData.stats.rating.avg.toFixed(1)}
                            ({profileData.stats.rating.count} đánh giá)
                          </div>
                        )}
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {profileData?.productInfo?.mainCategory?.name || 'Cửa hàng'}
                        </Badge>
                      </>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex gap-6 pt-2">
                    <div className="text-center">
                      <div className="font-bold text-lg">{profileStats.postsCount}</div>
                      <div className="text-sm text-gray-600">Bài viết</div>
                    </div>

                    <div
                      className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => handleOpenFollowModal("followers")}
                    >
                      <div className="font-bold text-lg">{profileStats.followersCount}</div>
                      <div className="text-sm text-gray-600 hover:text-pink-600">Người theo dõi</div>
                    </div>

                    <div
                      className="text-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      onClick={() => handleOpenFollowModal("following")}
                    >
                      <div className="font-bold text-lg">{profileStats.followingCount}</div>
                      <div className="text-sm text-gray-600 hover:text-blue-600">Đang theo dõi</div>
                    </div>

                    {profileType === 'shop' && (
                      <div className="text-center">
                        <div className="font-bold text-lg">{profileData?.stats?.orderCount || 0}</div>
                        <div className="text-sm text-gray-600">Đơn hàng</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className="font-bold text-lg">{profileStats.likesReceived}</div>
                      <div className="text-sm text-gray-600">Lượt thích</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && currentUser && (
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Nhắn tin
                    </Button>
                    <Button
                      onClick={handleToggleFollow}
                      disabled={followLoading}
                      className={`flex items-center gap-2 transition-colors ${isFollowing
                        ? 'bg-pink-500 hover:bg-pink-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                    >
                      {followLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
                      )}
                      {followLoading ? 'Đang xử lý...' : (isFollowing ? 'Đang theo dõi' : 'Theo dõi')}
                    </Button>
                  </div>
                )}

                {/* Hiển thị nút đăng nhập nếu chưa đăng nhập */}
                {!isOwnProfile && !currentUser && (
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setShowLoginModal(true)
                      }}
                    >
                      <Heart className="w-4 h-4" />
                      Đăng nhập để theo dõi
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-white shadow-md rounded-xl p-1 h-12">
              <TabsTrigger
                value="posts"
                className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                📝 Bài viết ({profileStats.postsCount})
              </TabsTrigger>

              {profileType === 'shop' && (
                <TabsTrigger
                  value="products"
                  className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  🛒 Sản phẩm
                </TabsTrigger>
              )}

              <TabsTrigger
                value="about"
                className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
              >
                ℹ️ Giới thiệu
              </TabsTrigger>

              {isOwnProfile && (
                <TabsTrigger
                  value="saved"
                  className="flex items-center gap-2 px-6 py-2 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                >
                  🔖 Đã lưu
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* Posts Tab với Infinite Scroll */}
          <TabsContent value="posts" className="space-y-4">
            {userPosts.length > 0 ? (
              <>
                {userPosts.map((post, index) => {
                  if (userPosts.length === index + 1) {
                    return (
                      <div ref={lastPostObserver} key={post._id}>
                        <FeedItem post={post} />
                      </div>
                    )
                  } else {
                    return <FeedItem key={post._id} post={post} />
                  }
                })}

                {postsLoading && (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}

                {!hasMorePosts && userPosts.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>🎉 Bạn đã xem hết tất cả bài viết!</p>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold mb-2">Chưa có bài viết nào</h3>
                  <p className="text-gray-600 mb-4">
                    {profileType === 'shop'
                      ? "Cửa hàng chưa chia sẻ bài viết nào."
                      : "Người dùng chưa chia sẻ bài viết nào."}
                  </p>
                  {isOwnProfile && (
                    <Button>Tạo bài viết đầu tiên</Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Saved Tab */}
          {isOwnProfile && (
            <TabsContent value="saved" className="space-y-4">
              {savedPosts.length > 0 ? (
                <>
                  {savedPosts.map((savedPost, index) => {
                    const post = savedPost; // Lấy post từ savedPost object
                    if (savedPosts.length === index + 1) {
                      return (
                        <div ref={lastSavedPostObserver} key={savedPost._id}>
                          <FeedItem post={post} />
                        </div>
                      )
                    } else {
                      return <FeedItem key={savedPost._id} post={post} />
                    }
                  })}

                  {savedPostsLoading && (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  )}

                  {!hasMoreSavedPosts && savedPosts.length > 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>🎉 Bạn đã xem hết tất cả bài viết đã lưu!</p>
                    </div>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-6xl mb-4">🔖</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {savedPostsLoading ? "Đang tải..." : "Chưa có bài viết đã lưu"}
                    </h3>
                    <p className="text-gray-600">
                      {savedPostsLoading ? "Vui lòng chờ..." : "Những bài viết bạn lưu sẽ xuất hiện ở đây."}
                    </p>
                    {savedPostsLoading && (
                      <div className="flex justify-center mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )}

          {/* Products Tab */}
          {profileType === 'shop' && (
            <TabsContent value="products">
              <ProductsTab sellerId={profileData?._id || profileData?.owner?._id} />
            </TabsContent>
          )}

          {/* About Tab */}
          <TabsContent value="about">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    {profileType === 'shop' ? <Store className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    {profileType === 'shop' ? 'Thông tin cửa hàng' : 'Thông tin cá nhân'}
                  </h3>
                  <div className="space-y-3 text-sm">
                    {profileType === 'user' ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Họ tên:</span>
                          <span className="font-medium">{profileData?.fullName || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{profileData?.email || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Điện thoại:</span>
                          <span className="font-medium">{profileData?.phone || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giới tính:</span>
                          <span className="font-medium">{profileData?.gender || "Chưa cập nhật"}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tên cửa hàng:</span>
                          <span className="font-medium">{profileData?.name || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{profileData?.contact?.email || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Điện thoại:</span>
                          <span className="font-medium">{profileData?.contact?.phone || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Đánh giá:</span>
                          <span className="font-medium">
                            ⭐ {profileData?.stats?.rating?.avg?.toFixed(1) || '0.0'}
                            ({profileData?.stats?.rating?.count || 0} đánh giá)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trạng thái:</span>
                          <span className={`font-medium ${profileData?.status?.isApprovedCreate ? 'text-green-600' : 'text-yellow-600'}`}>
                            {profileData?.status?.isApprovedCreate ? 'Đã được duyệt' : 'Chưa được duyệt'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {profileType === 'shop' && profileData?.businessInfo && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Store className="w-5 h-5" />
                      Thông tin kinh doanh
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Mã số thuế:</span>
                        <span className="font-medium">{profileData.businessInfo?.taxIdentificationNumber || "Chưa cập nhật"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Giấy phép KD:</span>
                        <span className="font-medium">{profileData.businessInfo?.businessLicense || "Chưa cập nhật"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Danh mục chính:</span>
                        <span className="font-medium">{profileData.productInfo?.mainCategory?.name || "Chưa cập nhật"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <FollowersFollowingModal
        open={showFollowModal}
        onOpenChange={setShowFollowModal}
        userSlug={slug}
        initialTab={followModalTab}
      />
    </div>
  )
}