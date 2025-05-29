const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, setActor, requireRole, checkShopOwnership} = require('../middleware/authMiddleware');

// Tạo đơn hàng từ giỏ hàng của người dùng
router.post('/checkout', verifyToken, setActor, orderController.checkoutOrder);

// Tạo đơn hàng trực tiếp từ 1 sản phẩm bất kỳ
router.post('/direct', verifyToken, setActor, orderController.createDirectOrder);

// Lấy danh sách đơn hàng (có phân trang và lọc theo status) cho ADMIN
router.get('/', verifyToken, setActor, orderController.getOrders);

// Lấy danh sách đơn hàng cho seller
router.get('/seller', verifyToken, setActor, requireRole(["seller", "admin"]), checkShopOwnership, orderController.getOrdersForSeller);

// Lấy danh sách đơn hàng cho user
router.get('/buyer', verifyToken, setActor, orderController.getOrdersForBuyer);

// Thống kê đơn hàng cho shop (phải đặt trước route /:id để tránh conflict)
router.get('/stats', verifyToken, setActor, requireRole(["seller", "admin"]), checkShopOwnership, orderController.getOrderStats);

// **BỔ SUNG MỚI** - Route để xuất báo cáo Excel
router.get('/export/excel', verifyToken, setActor, requireRole(["seller", "admin"]), checkShopOwnership, orderController.exportOrdersToExcel);

// Lấy chi tiết đơn hàng dành cho buyer
router.get('/buyer/:id', verifyToken, setActor, orderController.getOrderDetailForBuyer);

// Lấy chi tiết đơn hàng dành cho seller  
router.get('/seller/:id', verifyToken, setActor, requireRole(["seller", "admin"]), checkShopOwnership, orderController.getOrderDetailForSeller);

// Lấy chi tiết đơn hàng theo ID
router.get('/:id', verifyToken, setActor, orderController.getOrderById);

// Cập nhật trạng thái đơn hàng (chỉ seller và admin)
router.put('/:id/status', verifyToken, setActor, requireRole(["seller", "admin"]), checkShopOwnership, orderController.updateOrderStatus);

// Cho phép người dùng (buyer) hủy đơn hàng trước khi shop xử lý
router.put('/:id/cancel', verifyToken, setActor, orderController.cancelOrderByUser);

// Xác nhận đã nhận hàng (chỉ buyer)
router.put('/:id/confirm-received', verifyToken, setActor, orderController.confirmOrderReceived);

module.exports = router; 