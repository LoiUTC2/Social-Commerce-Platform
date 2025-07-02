import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import Login from '../pages/auth/Login';

import Dashboard from '../pages/dashboard/Dashboard';
// import Staff from '../pages/management/Staff';
import UserManagement from '../pages/management/users/UserManagement';
import ShopManagement from '../pages/management/shops/ShopManagement';
import PostManagement from '../pages/management/posts/PostManagement';
import ProductDetail from '../pages/management/products/ProductDetail';
import ProductList from '../pages/management/products/ProductList';
import ProductEdit from '../pages/management/products/ProductEdit';

// CATEGORY MANAGEMENT 
import CategoryList from "../pages/management/categories/CategoryList"
import CategoryDetail from "../pages/management/categories/CategoryDetail"
import CategoryForm from "../pages/management/categories/CategoryForm"
import CategoryMove from "../pages/management/categories/CategoryMove"

// import PostsReview from '../pages/moderation/PostsReview';
// import ContentReview from '../pages/moderation/ContentReview';
import ShopCreateApproval from "../pages/moderation/shop/ShopCreateApproval"
import ShopDeleteApproval from "../pages/moderation/shop/ShopDeleteApproval"
import FlashSaleDetail from '../pages/moderation/flashSale/FlashSaleDetail';
import FlashSaleForm from '../pages/moderation/flashSale/FlashSaleForm';
import FlashSaleList from '../pages/moderation/flashSale/FlashSaleList';


// import Wallets from '../pages/finance/Wallets';
// import Coupons from '../pages/finance/Coupons';
// import Revenue from '../pages/finance/Revenue';
// import BusinessPerformance from '../pages/finance/BusinessPerformance';

// import Complaints from '../pages/support/Complaints';
// import Disputes from '../pages/support/Disputes';

// import Notifications from '../pages/ads/Notifications';
// import Advertisements from '../pages/ads/Advertisements';
// import Recommendations from '../pages/ads/Recommendations';

export default function AppRouter() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Dashboard />} />
                    {/* Giám sát & Quản lý */}
                    {/* <Route path="staff" element={<Staff />} /> */}
                    <Route path="users" element={<UserManagement />} />
                    <Route path="stores" element={<ShopManagement />} />
                    <Route path="posts" element={<PostManagement />} />
                    <Route path="products" element={<ProductList />} />
                    <Route path="products/:productId" element={<ProductDetail />} />
                    <Route path="products/:productId/edit" element={<ProductEdit />} />

                    {/* CATEGORY MANAGEMENT ROUTE */}
                    <Route path="categories" element={<CategoryList />} />
                    <Route path="categories/create" element={<CategoryForm />} />
                    <Route path="categories/:categoryId" element={<CategoryDetail />} />
                    <Route path="categories/:categoryId/edit" element={<CategoryForm />} />
                    <Route path="categories/:categoryId/move" element={<CategoryMove />} />

                    {/* Kiểm duyệt & Nội dung */}
                    {/* <Route path="posts-review" element={<PostsReview />} />
                    <Route path="content-review" element={<ContentReview />} />
                    <Route path="seller-account-approval" element={<SellerAccountApproval />} />
                    <Route path="seller-account-deletion" element={<SellerAccountDeletion />} /> */}
                    <Route path="shop-create-approval" element={<ShopCreateApproval />} />
                    <Route path="shop-delete-approval" element={<ShopDeleteApproval />} />
                    <Route path="flash-sale-approval" element={<FlashSaleList />} />
                    <Route path="flash-sales/create" element={<FlashSaleForm />} />
                    <Route path="flash-sales/edit/:id" element={<FlashSaleForm />} />
                    <Route path="flash-sales/:id" element={<FlashSaleDetail />} />

                    {/* Quản lý tài chính */}
                    {/* <Route path="wallets" element={<Wallets />} />
                    <Route path="coupons" element={<Coupons />} />
                    <Route path="revenue" element={<Revenue />} />
                    <Route path="business-performance" element={<BusinessPerformance />} /> */}

                    {/* Hỗ trợ & Tranh chấp */}
                    {/* <Route path="complaints" element={<Complaints />} />
                    <Route path="disputes" element={<Disputes />} /> */}

                    {/* Thông báo & Quảng cáo */}
                    {/* <Route path="notifications" element={<Notifications />} />
                    <Route path="advertisements" element={<Advertisements />} />
                    <Route path="recommendations" element={<Recommendations />} /> */}
                </Route>

                <Route path="*" element={<Navigate to="/admin" />} />
            </Routes>
            {/* Sonner Toast Container */}
            <Toaster position="top-right" richColors closeButton duration={4000} />
        </Router>
    );
}
