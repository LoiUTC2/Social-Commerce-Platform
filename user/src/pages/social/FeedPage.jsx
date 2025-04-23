import React, { useState } from 'react';
import LeftSidebar from '../../components/layout/LeftSidebar';
import RightSidebar from '../../components/layout/RightSidebar';
import FeedItem from '../../components/feed/FeedItem';
import { Button } from '../../components/ui/button';
import StoryBar from '../../components/feed/StoryBar';
import CreatePost from '../../components/feed/CreatePost';

const FeedPage = ({ showTabs = false }) => {
  const [tab, setTab] = useState('popular');

  // Tính toán top sidebar phù hợp nếu có tab phụ
  const sidebarStickyTop = showTabs ? 'top-[160px]' : 'top-[112px]';

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
          
            {[1, 2, 3].map((id) => (
              <FeedItem key={id} id={id} />
            ))}
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
