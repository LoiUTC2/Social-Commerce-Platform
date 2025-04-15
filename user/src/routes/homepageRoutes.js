import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/shared/HomePage';
// import HomePage from '../pages/shared/HomePageTest';

const SocialRoutes = (
  <Route path="/" element={<MainLayout />}>
    <Route index element={<HomePage />} />
    {/* Bạn có thể thêm: /profile/:id, /post/:id ... */}
  </Route>
);

export default SocialRoutes;
