import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Profile from '../pages/social/Profile';
import FeedPage from '../pages/social/FeedPage';
import AccountPage from '../pages/social/AccountPage';
import PostDetailPage from '../pages/social/PostDetailPage';
import OrdersPage from '../pages/social/OrdersPage';
import OrderDetailPage from '../pages/social/OrderDetailPage';

const SocialRoutes = (
  <Route path="/feed" element={<MainLayout />}>
    <Route index element={<FeedPage showTabs={true} />} />

    <Route path='/feed/profile/:slug' element={<Profile />} />

    <Route path='/feed/setting-account/' element={<AccountPage />} />

    <Route path='/feed/orders/' element={<OrdersPage />} />

    <Route path='/feed/order-details/:orderId' element={<OrderDetailPage />} />


    <Route path='/feed/post/:postId' element={<PostDetailPage />} />

  </Route>
);

export default SocialRoutes;
