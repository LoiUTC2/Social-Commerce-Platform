import React, { useState, useEffect, useRef, useCallback } from 'react';
import LeftSidebar from '../../components/layout/LeftSidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import FeedItem from '../../components/feed/FeedItem';
import { Button } from '../../components/ui/button';
import StoryBar from '../../components/feed/StoryBar';
import CreatePost from '../../components/feed/CreatePost';
import { getAllPosts } from '../../services/postService'; // ✅

const FeedPage = ({ showTabs = false }) => {
  const [tab, setTab] = useState('popular');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const isInitialFetchDone = useRef(false); // Quan trọng: Sử dụng ref thay vì state để theo dõi API đã gọi chưa

  const observerRef = useRef();

  const sidebarStickyTop = showTabs ? 'top-[160px]' : 'top-[112px]';   // Tính toán top sidebar phù hợp nếu có tab phụ

  // Tách riêng hàm tải dữ liệu đầu tiên và tải thêm
  const fetchInitialPosts = useCallback(async () => {
    if (isInitialFetchDone.current || isLoading) return;
    
    setIsLoading(true);
    try {
      const res = await getAllPosts(1, 5);
      if (res.data.length > 0) {
        setPosts(res.data);
        setPage(2); // Đặt trang tiếp theo là 2
        setHasMore(res.hasMore);
      } else {
        setHasMore(false);
      }
      isInitialFetchDone.current = true;
      console.log("Danh sách bài viết: ", res.data)

    } catch (err) {
      console.error('Lỗi tải bài viết:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  //gọi API bài viết
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await getAllPosts(page, 5);
      if (res.data.length > 0) {
        setPosts((prev) => [...prev, ...res.data]);
        setPage((prevPage) => prevPage + 1);
        setHasMore(res.hasMore); // sử dụng hasMore từ backend

      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Lỗi tải thêm bài viết:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, page]);

  // Chỉ tải dữ liệu ban đầu một lần khi component mount
  useEffect(() => {
    fetchInitialPosts();
  }, [fetchInitialPosts]);

  // Infinite scroll với điều kiện chỉ kích hoạt sau khi đã tải dữ liệu đầu tiên
  const lastPostRef = useCallback((node) => {
    if (isLoading || !hasMore || !node || !isInitialFetchDone.current) return;

    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMorePosts(); // không cần truyền page, đã lấy từ state
      }
    });
    observerRef.current.observe(node);
  }, [hasMore, isLoading, loadMorePosts]);

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
        <div className="sticky top-[64px] z-40 bg-white border-b shadow-sm">
          <div className="flex justify-center space-x-4 px-4 py-2">
            <Button
              variant={tab === 'popular' ? 'default' : 'outline'}
              onClick={() => setTab('popular')}
            >
              Phổ biến
            </Button>
            <Button
              variant={tab === 'foryou' ? 'default' : 'outline'}
              onClick={() => setTab('foryou')}
            >
              Dành cho bạn
            </Button>
            <Button
              variant={tab === 'friends' ? 'default' : 'outline'}
              onClick={() => setTab('friends')}
            >
              Bạn bè
            </Button>
            <Button
              variant={tab === 'following' ? 'default' : 'outline'}
              onClick={() => setTab('following')}
            >
              Theo dõi
            </Button>
          </div>
        </div>
      )}

      {/* Wrapper giống HomePage */}
      <div className="px-4 max-w-[1600px] mx-auto pt-2">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <aside className={`w-[22%] hidden xl:block sticky top-[112px] h-fit self-start`}>
            <LeftSidebar />
          </aside>

          {/* Feed content */}
          <main className="flex-1 space-y-4">
            <CreatePost />
            <StoryBar />

            {posts.map((post, index) => {
              const isLast = index === posts.length - 1;
              return (
                <div ref={isLast ? lastPostRef : null} key={post._id}>
                  <FeedItem post={post} />
                </div>
              );
            })}
            {isLoading && <p className="text-center text-sm text-gray-500">Đang tải thêm bài viết...</p>}
            {!hasMore && <p className="text-center text-gray-400 text-sm py-4">Bạn đã xem hết bài viết 🎉</p>}
          </main>

          {/* Right Sidebar */}
          <aside className={`w-[25%] hidden 2xl:block sticky top-[112px] h-fit self-start`}>
            <RightSidebar />
          </aside>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
