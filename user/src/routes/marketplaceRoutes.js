import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProductDetail from '../pages/marketplace/ProductDetail';
import CartPage from '../pages/marketplace/CartPage';
import CheckoutPage from '../pages/marketplace/CheckoutPage';
import PlaceMarketPage from '../pages/marketplace/PlaceMarketPage';
import FeaturedProductsPage from '../pages/marketplace/placeMarketProduct/FeaturedProductsPage';
import SuggestedProductsPage from '../pages/marketplace/placeMarketProduct/SuggestedProductsPage';
import LatestProductsPage from '../pages/marketplace/placeMarketProduct/LatestProductsPage';
import FlashSalesPage from '../pages/marketplace/placeMarketFlashSale/FlashSalesPage';
import AIFlashSaleRecommendationsPage from '../pages/marketplace/placeMarketFlashSale/AIFlashSaleRecommendationsPage';
import ShopRecommendationsPage from '..//pages/marketplace/placeMarketShop/ShopRecommendationsPage';
import FeaturedShopsPage from '../pages/marketplace/placeMarketShop/FeaturedShopsPage';

const MarketplaceRoutes = (
  <Route path="/marketplace" element={<MainLayout />}>
    <Route index element={<PlaceMarketPage />} />
    <Route path="/marketplace/products/:slug" element={<ProductDetail />} />
    <Route path="/marketplace/cart" element={<CartPage />} />
    <Route path="/marketplace/checkout" element={<CheckoutPage />} />
    <Route path="/marketplace/featured-products" element={<FeaturedProductsPage />} />
    <Route path="/marketplace/suggested-products" element={<SuggestedProductsPage />} />
    <Route path="/marketplace/latest-products" element={<LatestProductsPage />} />
    <Route path="/marketplace/flash-sales" element={<FlashSalesPage />} />
    <Route path="/marketplace/flash-sales-recommendation" element={<AIFlashSaleRecommendationsPage />} />
    <Route path="/marketplace/shop-recommendation" element={<ShopRecommendationsPage />} />
    <Route path="/marketplace/shop-featured" element={<FeaturedShopsPage />} />
  </Route>
);

export default MarketplaceRoutes;
