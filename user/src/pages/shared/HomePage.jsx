import React, { useState } from 'react';
import FeedPage from '../social/FeedPage';
import PlaceMarketPage from '../marketplace/PlaceMarketPage';
import { Button } from '../../components/ui/button';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('feed');

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Sticky tab dưới header tổng */}
      <div className="sticky top-[64px] z-40 bg-white border-b shadow-sm">
        <div className="flex justify-center space-x-4 px-4 py-2">
          <Button
            variant={activeTab === 'feed' ? 'default' : 'outline'}
            onClick={() => setActiveTab('feed')}
          >
            Bảng Tin
          </Button>
          <Button
            variant={activeTab === 'marketplace' ? 'default' : 'outline'}
            onClick={() => setActiveTab('marketplace')}
          >
            Sàn TMĐT
          </Button>
        </div>
      </div>

      <div className="px-4 max-w-[1700px] mx-auto pt-0">
        {activeTab === 'feed' && <FeedPage />}
        {activeTab === 'marketplace' && <PlaceMarketPage />}
      </div>
    </div>
  );
}
