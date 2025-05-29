import api from "../utils/api"

// 🛒 Đặt hàng từ giỏ hàng
export const checkoutOrder = async ({ shippingAddress, paymentMethod = "COD", notes = "" }) => {
    const res = await api.post("/orders/checkout", {
        shippingAddress,
        paymentMethod,
        notes,
    })
    return res.data
}

// 🛍️ Đặt hàng trực tiếp 1 sản phẩm
export const createDirectOrder = async ({
    productId,
    quantity = 1,
    selectedVariant = {},
    shippingAddress,
    paymentMethod = "COD",
    notes = "",
}) => {
    const res = await api.post("/orders/direct", {
        productId,
        quantity,
        selectedVariant,
        shippingAddress,
        paymentMethod,
        notes,
    })
    return res.data
}

// 📋 Lấy danh sách đơn hàng cho seller (có phân trang và lọc)
export const getOrdersForAdmin = async (params = {}) => {
    const searchParams = new URLSearchParams()

    // Pagination
    searchParams.append("page", params.page || 1)
    searchParams.append("limit", params.limit || 10)

    // Filters
    if (params.status && params.status !== "all") {
        searchParams.append("status", params.status)
    }

    // Search query - backend sẽ tìm kiếm trong orderNumber, customer name, phone
    if (params.search) {
        searchParams.append("search", params.search)
    }

    // Date range
    if (params.startDate) {
        searchParams.append("startDate", params.startDate)
    }
    if (params.endDate) {
        searchParams.append("endDate", params.endDate)
    }

    const res = await api.get(`/orders?${searchParams.toString()}`)
    return res.data
}

// 📋 Lấy danh sách đơn hàng cho seller (có phân trang và lọc)
export const getOrdersForSeller = async (params = {}) => {
    const searchParams = new URLSearchParams()

    // Pagination
    searchParams.append("page", params.page || 1)
    searchParams.append("limit", params.limit || 10)

    // Filters
    if (params.status && params.status !== "all") {
        searchParams.append("status", params.status)
    }

    // Date range
    if (params.startDate) {
        searchParams.append("startDate", params.startDate)
    }
    if (params.endDate) {
        searchParams.append("endDate", params.endDate)
    }

    const res = await api.get(`/orders/seller?${searchParams.toString()}`)
    return res.data
}

// 📋 Lấy danh sách đơn hàng cho buyer (có phân trang và lọc)
export const getOrdersForBuyer = async (params = {}) => {
    const searchParams = new URLSearchParams()

    // Pagination
    searchParams.append("page", params.page || 1)
    searchParams.append("limit", params.limit || 10)

    // Filters
    if (params.status && params.status !== "all") {
        searchParams.append("status", params.status)
    }

    // Filter theo shop
    if (params.shopId) {
        searchParams.append("shopId", params.shopId)
    }

    const res = await api.get(`/orders/buyer?${searchParams.toString()}`)
    return res.data
}

// 📄 Lấy chi tiết đơn hàng theo ID
export const getOrderById = async (orderId) => {
    const res = await api.get(`/orders/${orderId}`)
    return res.data
}

// 📄 Lấy chi tiết đơn hàng cho buyer
export const getOrderDetailForBuyer = async (orderId) => {
    const res = await api.get(`/orders/buyer/${orderId}`)
    return res.data
}

// 📄 Lấy chi tiết đơn hàng cho seller
export const getOrderDetailForSeller = async (orderId) => {
    const res = await api.get(`/orders/seller/${orderId}`)
    return res.data
}

// 📊 Lấy thống kê đơn hàng (chỉ dành cho shop)
export const getOrderStats = async (sellerId, params = {}) => {
    const searchParams = new URLSearchParams()

    // Date range for stats
    if (params.startDate) {
        searchParams.append("startDate", params.startDate)
    }
    if (params.endDate) {
        searchParams.append("endDate", params.endDate)
    }

    const res = await api.get(`/orders/stats?${searchParams.toString()}`)
    return res.data
}

// ✏️ Cập nhật trạng thái đơn hàng (chỉ seller/admin)
export const updateOrderStatus = async (orderId, status) => {
    const res = await api.put(`/orders/${orderId}/status`, { status })
    return res.data
}

// ❌ Hủy đơn hàng (chỉ buyer)
export const cancelOrder = async (orderId, reason = "") => {
    const res = await api.put(`/orders/${orderId}/cancel`, { reason })
    return res.data
}

// ✅ Xác nhận đã nhận hàng (chỉ buyer)
export const confirmReceived = async (orderId, { rating, review } = {}) => {
    const res = await api.put(`/orders/${orderId}/confirm-received`, {
        rating,
        review
    })
    return res.data
}

// 🔍 Kiểm tra đơn hàng có thể xác nhận nhận hàng không
export const canConfirmReceived = (order) => {
    return order?.status === 'shipping'
}

// 📋 Lấy danh sách đơn hàng đang chờ xác nhận nhận hàng
export const getOrdersAwaitingConfirmation = async (params = {}) => {
    return await getOrdersForBuyer({
        ...params,
        status: 'shipping'
    })
}

// 📈 Lấy lịch sử đơn hàng theo trạng thái
export const getOrdersByStatus = async (status, { page = 1, limit = 10 } = {}) => {
    return await getOrdersForSeller(null, { page, limit, status })
}

// 🔍 Tìm kiếm đơn hàng
export const searchOrders = async (query, { page = 1, limit = 10 } = {}) => {
    return await getOrdersForSeller(null, { page, limit, search: query })
}

// 📊 Lấy thống kê đơn hàng theo khoảng thời gian
export const getOrderStatsByDateRange = async (startDate, endDate) => {
    return await getOrderStats(null, { startDate, endDate })
}

// 🚚 Theo dõi đơn hàng (wrapper cho getOrderById với format khác)
export const trackOrder = async (orderId) => {
    const orderData = await getOrderById(orderId)

    // Format lại data cho tracking
    return {
        ...orderData,
        trackingInfo: {
            currentStatus: orderData.data?.status,
            statusHistory: orderData.data?.statusHistory || [],
            estimatedDelivery: orderData.data?.estimatedDelivery,
            trackingNumber: orderData.data?.trackingNumber,
        },
    }
}

// 🔄 Đặt lại đơn hàng (reorder)
export const reorderItems = async (orderId) => {
    const orderData = await getOrderDetailForBuyer(orderId)

    if (!orderData.success || !orderData.data) {
        throw new Error("Không thể lấy thông tin đơn hàng")
    }

    const order = orderData.data

    // Thêm các item từ đơn hàng cũ vào giỏ hàng
    const addToCartPromises = order.items.map((item) =>
        api.post("/carts/add", {
            productId: item.product._id,
            quantity: item.quantity,
            selectedVariant: item.selectedVariant,
        }),
    )

    await Promise.all(addToCartPromises)
    return { success: true, message: "Đã thêm các sản phẩm vào giỏ hàng" }
}

// 📤 Xuất báo cáo Excel (cập nhật để sử dụng API backend)
export const exportOrdersToExcel = async (params = {}) => {
    const searchParams = new URLSearchParams()

    // Filters
    if (params.status && params.status !== "all") {
        searchParams.append("status", params.status)
    }

    // Date range
    if (params.startDate) {
        searchParams.append("startDate", params.startDate)
    }
    if (params.endDate) {
        searchParams.append("endDate", params.endDate)
    }

    const res = await api.get(`/orders/export/excel?${searchParams.toString()}`)
    return res.data
}

// 🔄 Cập nhật hàng loạt trạng thái đơn hàng
export const bulkUpdateOrderStatus = async (orderIds, status) => {
    const updatePromises = orderIds.map((orderId) =>
        updateOrderStatus(orderId, status).catch((error) => ({
            orderId,
            error: error.message,
        })),
    )

    const results = await Promise.allSettled(updatePromises)

    const successful = results
        .filter((result) => result.status === "fulfilled" && !result.value.error)
        .map((result) => result.value)

    const failed = results.filter((result) => result.status === "rejected" || result.value.error)

    return {
        success: true,
        data: {
            updatedOrders: successful,
            successCount: successful.length,
            totalCount: orderIds.length,
            failedCount: failed.length,
            errors: failed,
        },
    }
}
