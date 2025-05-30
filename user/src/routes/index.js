import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SocialRoutes from './socialRoutes';
import MarketplaceRoutes from './marketplaceRoutes';
import AuthRoutes from './authRoutes';
import HomepageRoutes from './homepageRoutes';
import SellerRoutes from './sellerRoutes';
import ChatRoutes from './chatRoutes';
import SearchRoutes from './searchRoutes';

export default function AppRoutes() {
  return (
      <Routes>
        {HomepageRoutes}
        {AuthRoutes}
        {SearchRoutes}
        {SocialRoutes}
        {MarketplaceRoutes}
        {SellerRoutes}
        {ChatRoutes}
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
  );
}
