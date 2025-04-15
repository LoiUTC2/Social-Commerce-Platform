import React from 'react';
import { Route } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import Login from '../pages/auth/Login';
import AuthPage from '../pages/auth/AuthPage';

const AuthRoutes = (
  <Route path="/auth" element={<AuthLayout />}>
    {/* <Route path="login" element={<Login />} /> */}
    <Route path="/auth/register" element={<AuthPage />} />
  </Route>
);

export default AuthRoutes;
