"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import LeftSidebar from "../../components/layout/leftSidebar/LeftSidebar"
import RightSidebar from "../../components/layout/rightSidebar/RightSidebar"
import FeedItem from "../../components/feed/FeedItem"
import { Button } from "../../components/ui/button"
import StoryBar from "../../components/feed/StoryBar"
import CreatePost from "../../components/feed/CreatePost"
import { getAllPosts, getPopularPosts, getForYouPosts, getFollowingPosts } from "../../services/postService" // ✅

const FeedPage = ({ showTabs = false }) => {
  const [tab, setTab] = useState("popular")
  const [posts, setPosts] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const isInitialFetchDone = useRef(false) // Quan trọng: Sử dụng ref thay vì state để theo dõi API đã gọi chưa
  const currentTab = useRef(tab) // Thêm ref để theo dõi tab hiện tại

  const observerRef = useRef()

  const sidebarStickyTop = showTabs ? "top-[160px]" : "top-[112px]" // Tính toán top sidebar phù hợp nếu có tab phụ

  // Hàm để lấy API tương ứng với tab
  const getApiForTab = useCallback((currentTab, pageNumber, limit) => {
    switch (currentTab) {
      case "popular":
        return getPopularPosts(pageNumber, limit)
      case "foryou":
        return getForYouPosts(pageNumber, limit)
      case "following":
        return getFollowingPosts(pageNumber, limit)
      default:
        return getAllPosts(pageNumber, limit)
    }
  }, [])

  // Tách riêng hàm tải dữ liệu đầu tiên và tải thêm
  const fetchInitialPosts = useCallback(async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      // Sử dụng hàm helper để lấy API phù hợp
      const res = await getApiForTab(currentTab.current, 1, 5)

      if (res.data && res.data.posts && res.data.posts.length > 0) {
        setPosts(res.data.posts)
        setPage(2) // Đặt trang tiếp theo là 2
        setHasMore(res.data.pagination.hasMore)
      } else {
        setPosts([])
        setHasMore(false)
      }
      isInitialFetchDone.current = true
      console.log(`[${currentTab.current}] Đã tải ${res.data.posts?.length || 0} bài viết ban đầu`)
      console.log(`[${currentTab.current}] Còn bài viết không: ${res.data.pagination?.hasMore}`)
    } catch (err) {
      console.error(`[${currentTab.current}] Lỗi tải bài viết:`, err)
      setPosts([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, getApiForTab]) // Loại bỏ tab khỏi dependencies

  //gọi API bài viết
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      // Sử dụng hàm helper để lấy API phù hợp
      const res = await getApiForTab(currentTab.current, page, 5)

      if (res.data && res.data.posts && res.data.posts.length > 0) {
        setPosts((prev) => [...prev, ...res.data.posts])
        setPage((prevPage) => prevPage + 1)
        setHasMore(res.data.pagination.hasMore) // sử dụng hasMore từ backend
        console.log(`[${currentTab.current}] Đã tải thêm ${res.data.posts.length} bài viết, trang ${page}`)
      } else {
        setHasMore(false)
        console.log(`[${currentTab.current}] Không còn bài viết để tải`)
      }
    } catch (err) {
      console.error(`[${currentTab.current}] Lỗi tải thêm bài viết:`, err)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, hasMore, page, getApiForTab]) // Loại bỏ tab khỏi dependencies

  // Xử lý khi tab thay đổi
  const handleTabChange = useCallback(
    (newTab) => {
      if (newTab === currentTab.current) return // Không làm gì nếu tab không thay đổi

      setTab(newTab)
      currentTab.current = newTab // Cập nhật ref

      // Reset state
      setPosts([])
      setPage(1)
      setHasMore(true)
      isInitialFetchDone.current = false

      // Tải dữ liệu mới
      setTimeout(() => {
        fetchInitialPosts()
      }, 0)
    },
    [fetchInitialPosts],
  )

  // Chỉ tải dữ liệu ban đầu một lần khi component mount
  useEffect(() => {
    if (!isInitialFetchDone.current) {
      fetchInitialPosts()
    }
  }, [fetchInitialPosts])

  // Infinite scroll với điều kiện chỉ kích hoạt sau khi đã tải dữ liệu đầu tiên
  const lastPostRef = useCallback(
    (node) => {
      if (isLoading || !hasMore || !node || !isInitialFetchDone.current) return

      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts() // không cần truyền page, đã lấy từ state
        }
      })
      observerRef.current.observe(node)
    },
    [hasMore, isLoading, loadMorePosts],
  )

  // useEffect(() => {
  //   const fetchPosts = async () => {
  //     try {
  //       const res = await getAllPosts(); // gọi API
  //       setPosts(res.data); // hoặc res.posts nếu backend trả về như vậy
  //     } catch (err) {
  //       console.error('Lỗi tải bài viết:', err);
  //     }
  //   };

  //   fetchPosts();
  // }, []);
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Tabs phụ dạng sticky nếu showTabs */}
      {showTabs && (
        <div className="sticky top-[80px] z-40 bg-white border-b shadow-sm">
          <div className="flex justify-center space-x-4 px-4 py-2">
            <Button variant={tab === "popular" ? "default" : "outline"} onClick={() => handleTabChange("popular")}>
              Phổ biến
            </Button>
            <Button variant={tab === "foryou" ? "default" : "outline"} onClick={() => handleTabChange("foryou")}>
              Dành cho bạn
            </Button>
            {/* Tab Bạn bè tạm thời comment lại vì chưa làm
            <Button
              variant={tab === 'friends' ? 'default' : 'outline'}
              onClick={() => handleTabChange('friends')}
            >
              Bạn bè
            </Button>
            */}
            <Button variant={tab === "following" ? "default" : "outline"} onClick={() => handleTabChange("following")}>
              Theo dõi
            </Button>
          </div>
        </div>
      )}

      {/* Wrapper giống HomePage */}
      <div className="px-4 max-w-[1600px] mx-auto pt-2">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside className={`w-[24%] hidden xl:block sticky top-[130px] h-fit self-start`}>
            <LeftSidebar />
          </aside>

          {/* Feed content */}
          <main className="flex-1 space-y-4 w-[22%]">
            <CreatePost />
            <StoryBar />

            {posts.length === 0 && !isLoading && (
              <div className="bg-white rounded-lg p-6 text-center shadow-sm">
                <p className="text-gray-500">Không có bài viết nào để hiển thị</p>
              </div>
            )}

            {posts.map((post, index) => {
              const isLast = index === posts.length - 1
              return (
                <div ref={isLast ? lastPostRef : null} key={post._id}>
                  <FeedItem post={post} />
                </div>
              )
            })}
            {isLoading && <p className="text-center text-sm text-gray-500">Đang tải thêm bài viết...</p>}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Bạn đã xem hết bài viết 🎉</p>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className={`w-[25%] hidden 2xl:block sticky top-[130px] h-fit self-start`}>
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default FeedPage
