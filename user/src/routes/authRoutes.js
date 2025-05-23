import React from 'react';
import { Navigate, Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import AuthPage from '../pages/auth/AuthPage';
import HuloIntroduction from '../layouts/HuloIntroduction';
import RegisterShopPage from '../pages/auth/RegisterShopPage';
import RegisterSellerPage from '../pages/auth/RegisterSellerPage';

const AuthRoutes = (
  <Route path="/auth" element={<AuthLayout />}>
    {/* <Route index element={<HuloIntroduction />} /> */}

    {/* <Route index element={<Navigate to="/auth/login" replace />} /> */}
    {/* <Route path="login" element={<AuthPage />} />
    <Route path="register" element={<AuthPage />} /> */}

    <Route index element={<AuthPage />} />

    <Route path="registerShop" element={<RegisterShopPage />} />
    <Route path="registerSeller" element={<RegisterSellerPage />} />

    <Route path="survey" element={<AuthPage />} />

  </Route>
);

export default AuthRoutes;
