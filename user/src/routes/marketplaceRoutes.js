import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProductDetail from '../pages/marketplace/ProductDetail';
import CartPage from '../pages/marketplace/CartPage';
import CheckoutPage from '../pages/marketplace/CheckoutPage';
import PlaceMarketPage from '../pages/marketplace/PlaceMarketPage';

const MarketplaceRoutes = (
  <Route path="/marketplace" element={<MainLayout />}>
    <Route index element={<PlaceMarketPage/>} />
    <Route path="/marketplace/products/:productId" element={<ProductDetail />} />
    <Route path="/marketplace/cart" element={<CartPage />} />
    <Route path="/marketplace/checkout" element={<CheckoutPage />} />
  </Route>
);

export default MarketplaceRoutes;
