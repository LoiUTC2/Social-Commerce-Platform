import { Route } from 'react-router-dom';
import DashboardLayout from '../pages/seller/DashboardLayout';
import Orders from '../pages/seller/Orders';
import Customers from '../pages/seller/Customers';
import StoreInfo from '../pages/seller/StoreInfo';
import Products from '../pages/seller/Products/Products';
import Support from '../pages/seller/Support';
import Marketing from '../pages/seller/Marketing';
import Dashboard from '../pages/seller/Dashboard';
import AddProduct from '../pages/seller/Products/AddProduct';


const SellerRoutes = (
  <Route path="/seller" element={<DashboardLayout />}>
    <Route index element={<Dashboard />} />
    {/* <Route path='dashboard' element={<Dashboard />} /> */}
    <Route path="orders" element={<Orders />} />
    <Route path="customers" element={<Customers />} />
    <Route path="store" element={<StoreInfo />} />
    <Route path="products" element={<Products />} />
    <Route path="add-product" element={<AddProduct />} />

    <Route path="support" element={<Support />} />
    <Route path="marketing" element={<Marketing />} />
  </Route>
);

export default SellerRoutes;
