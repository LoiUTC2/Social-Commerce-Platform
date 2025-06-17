import React from 'react';
import Banner from '../../components/marketplace/Banner';
import FlashSale from '../../components/marketplace/FlashSale';
import MarketplaceCategory from '../../components/marketplace/MarketplaceCategory';
import TopShops from "../../components/marketplace/shops/TopShops"
import FeaturedProducts from '../../components/marketplace/products/FeaturedProducts';
import SuggestedProducts from '../../components/marketplace/products/SuggestedProducts';
import LatestProducts from '../../components/marketplace/products/LatestProducts';


const PlaceMarketPage = () => {
  return (
    <main className="w-full space-y-8 bg-gray-50">
      <Banner />
      <MarketplaceCategory />
      <FlashSale />
      <TopShops />

      {/* Sản phẩm nổi bật */}
      <FeaturedProducts limit={12} />

      {/* Sản phẩm gợi ý với AI */}
      <SuggestedProducts method="hybrid" limit={12} />

      {/* Sản phẩm mới nhất trong 30 ngày */}
      <LatestProducts timeRange="30d" limit={12} />

    </main>
  )
}

export default PlaceMarketPage
