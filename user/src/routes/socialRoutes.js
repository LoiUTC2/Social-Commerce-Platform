import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Profile from '../pages/social/Profile';
import FeedPage from '../pages/social/FeedPage';
import AccountPage from '../pages/social/AccountPage';

const SocialRoutes = (
  <Route path="/feed" element={<MainLayout />}>
    <Route index element={<FeedPage showTabs={true}/>} />
    <Route path='/feed/profile/:slug' element={<Profile />}/>

    <Route path='/feed/setting-account/' element={<AccountPage />}/>
  </Route>
);

export default SocialRoutes;
