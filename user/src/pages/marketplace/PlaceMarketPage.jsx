import React from 'react';
import Banner from '../../components/marketplace/Banner';
import FlashSale from '../../components/marketplace/FlashSale';
import TopShops from '../../components/marketplace/TopShops';
import DailySuggestions from '../../components/marketplace/DailySuggestions';
import MarketplaceCategory from '../../components/marketplace/MarketplaceCategory';
import ProductCard from '../../components/marketplace/ProductCard';

const PlaceMarketPage = () => {
  return (
    <main className="w-full space-y-6">
      <Banner />
      <MarketplaceCategory />
      <FlashSale />
      <TopShops />
      <DailySuggestions />
      <section>
        <h2 className="text-lg font-semibold mb-4 text-gray-800">🛒 Sản phẩm nổi bật</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <ProductCard key={i} i={i} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default PlaceMarketPage;
