import { Route } from 'react-router-dom';
import DashboardLayout from '../pages/seller/DashboardLayout';
import Orders from '../pages/seller/Orders/Orders';
import Customers from '../pages/seller/Customers';
import StoreLayout from '.././pages/seller/Store/StoreLayout';
import StoreInfo from '../pages/seller/Store/StoreInfo';
import BusinessInfo from '../pages/seller/Store/BusinessInfo';
import SellerInfo from '../pages/seller/Store/SellerInfo';
import Products from '../pages/seller/Products/Products';
import Support from '../pages/seller/Support';
import Marketing from '../pages/seller/Marketing';
import Dashboard from '../pages/seller/Dashboard';
import AddProduct from '../pages/seller/Products/AddProduct';
import ProductDetail from '../pages/seller/Products/ProductDetail';
import EditProduct from '../pages/seller/Products/EditProduct';

const SellerRoutes = (
  <Route path="/seller" element={<DashboardLayout />}>
    <Route index element={<Dashboard />} />
    {/* <Route path='dashboard' element={<Dashboard />} /> */}
    <Route path="orders" element={<Orders />} />
    <Route path="customers" element={<Customers />} />

    <Route path="store" element={<StoreLayout />}>
      <Route index element={<StoreInfo />} />
      <Route path="basic" element={<StoreInfo />} />
      <Route path="business" element={<BusinessInfo />} />
      <Route path="seller" element={<SellerInfo />} />
    </Route>

    <Route path="products" element={<Products />} />
    <Route path="add-product" element={<AddProduct />} />
    <Route path="product-detail/:slug" element={<ProductDetail />} />
    <Route path="edit-product/:slug" element={<EditProduct />} />

    <Route path="support" element={<Support />} />
    <Route path="marketing" element={<Marketing />} />
  </Route>
);

export default SellerRoutes;
