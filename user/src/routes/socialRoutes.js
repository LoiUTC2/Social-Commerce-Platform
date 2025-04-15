import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Profile from '../pages/social/Profile';
import FeedPage from '../pages/social/FeedPage';

const SocialRoutes = (
  <Route path="/feed" element={<MainLayout />}>
    <Route index element={<FeedPage showTabs={true}/>} />
    <Route path='/feed/profile/' element={<Profile />}/>

  </Route>
);

export default SocialRoutes;
