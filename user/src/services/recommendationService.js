import api from '../utils/api';

// 🔮 Gợi ý tổng hợp (product, post, user, shop)
export const getGeneralRecommendations = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations', {
        params: { limit, page }
    });
    return res.data;
};

// 📝 Gợi ý bài viết
export const getRecommendedPosts = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/posts', {
        params: { limit, page }
    });
    return res.data;
};

// 🛍️ Gợi ý sản phẩm
export const getRecommendedProducts = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/products', {
        params: { limit, page }
    });
    return res.data;
};

// 🏪 Lấy gợi ý shops (cho người dùng chưa đăng nhập)
export const getRecommendedShops = async (page = 1, limit = 10, filters = {}) => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            ...filters, // spread filters directly instead of using URLSearchParams
        };

        const res = await api.get('/recommendations/shops', {
            params // use axios params option
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended shops:', error);
        throw error;
    }
};

// 🏪 Lấy gợi ý shops (cho người dùng đã đăng nhập)
export const getRecommendedShopsCaseLogin = async (page = 1, limit = 10, entityType = "shop") => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            entityType,
        };

        const res = await api.get('/recommendations/shops-case-login', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended shops (case login):', error);
        throw error;
    }
};

// 👥 Lấy gợi ý users (cho người dùng chưa đăng nhập)
export const getRecommendedUsers = async (page = 1, limit = 10, sortBy = "score", sortOrder = "desc") => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder,
        };

        const res = await api.get('/recommendations/users', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended users:', error);
        throw error;
    }
};

// 👥 Lấy gợi ý users (cho người dùng đã đăng nhập)
export const getRecommendedUsersCaseLogin = async (page = 1, limit = 10, entityType = "user") => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            entityType,
        };

        const res = await api.get('/recommendations/users-case-login', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended users (case login):', error);
        throw error;
    }
};

// ⚡ Lấy gợi ý Flash Sales
export const getRecommendedFlashSales = async (page = 1, limit = 10, filters = {}) => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            search: filters.search || '',
            sortBy: filters.sortBy || 'recommended',
            sortOrder: filters.sortOrder || 'desc',
        };

        const res = await api.get('/recommendations/flashsales', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended flash sales:', error);
        throw error;
    }
};

// 🔥 Lấy Flash Sales đang hot (shortcut function)
export const getHotFlashSales = async (limit = 5) => {
    try {
        return await getRecommendedFlashSales(1, limit, {
            sortBy: 'totalPurchases',
            sortOrder: 'desc'
        });
    } catch (error) {
        console.error('Error fetching hot flash sales:', error);
        throw error;
    }
};

// ⏰ Lấy Flash Sales sắp kết thúc
export const getEndingSoonFlashSales = async (limit = 5) => {
    try {
        return await getRecommendedFlashSales(1, limit, {
            sortBy: 'endTime',
            sortOrder: 'asc'
        });
    } catch (error) {
        console.error('Error fetching ending soon flash sales:', error);
        throw error;
    }
};

// 🆕 Lấy Flash Sales mới nhất
export const getNewestFlashSales = async (limit = 5) => {
    try {
        return await getRecommendedFlashSales(1, limit, {
            sortBy: 'newest',
            sortOrder: 'desc'
        });
    } catch (error) {
        console.error('Error fetching newest flash sales:', error);
        throw error;
    }
};

// 📊 Utility function để format Flash Sale data
export const formatFlashSaleData = (flashSaleData) => {
    if (!flashSaleData || !flashSaleData.data) {
        return {
            flashSales: [],
            products: [],
            pagination: null,
            hasData: false
        };
    }

    const { flashSales = [], products = [], pagination = {} } = flashSaleData.data;

    return {
        flashSales: flashSales.map(fs => ({
            ...fs,
            timeRemaining: calculateTimeRemaining(fs.endTime),
            isActive: new Date(fs.endTime) > new Date(),
            productCount: fs.products?.length || 0
        })),
        products: products.map(p => ({
            ...p,
            discountPercent: calculateDiscountPercent(p.price, p.salePrice),
            isOnSale: p.salePrice && p.salePrice < p.price
        })),
        pagination: {
            ...pagination.flashSales, // Use flashSales pagination as primary
            products: pagination.products
        },
        hasData: flashSales.length > 0 || products.length > 0,
        metadata: flashSaleData.data.metadata || {}
    };
};

// 🕐 Helper function để tính thời gian còn lại
export const calculateTimeRemaining = (endTime) => {
    if (!endTime) return null;

    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return { expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, expired: false };
};

// 💰 Helper function để tính phần trăm giảm giá
export const calculateDiscountPercent = (originalPrice, salePrice) => {
    if (!originalPrice || !salePrice || salePrice >= originalPrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// 📈 Bulk operations cho multiple flash sales
export const getBulkFlashSalesRecommendations = async () => {
    try {
        const [hot, endingSoon, newest] = await Promise.allSettled([
            getHotFlashSales(5),
            getEndingSoonFlashSales(5),
            getNewestFlashSales(5)
        ]);

        return {
            hot: hot.status === 'fulfilled' ? formatFlashSaleData(hot.value) : { flashSales: [], products: [], hasData: false },
            endingSoon: endingSoon.status === 'fulfilled' ? formatFlashSaleData(endingSoon.value) : { flashSales: [], products: [], hasData: false },
            newest: newest.status === 'fulfilled' ? formatFlashSaleData(newest.value) : { flashSales: [], products: [], hasData: false },
            errors: {
                hot: hot.status === 'rejected' ? hot.reason?.message : null,
                endingSoon: endingSoon.status === 'rejected' ? endingSoon.reason?.message : null,
                newest: newest.status === 'rejected' ? newest.reason?.message : null
            }
        };
    } catch (error) {
        console.error('Error fetching bulk flash sales recommendations:', error);
        throw error;
    }
};

//////////////

// 🚀 Huấn luyện lại mô hình Matrix Factorization (admin)
export const retrainMatrixModel = async () => {
    const res = await api.post('/recommendations/train');
    return res.data;
};

// 🚀 Huấn luyện lại mô hình User/Shop (admin)
export const retrainUserShopModel = async () => {
    const res = await api.post('/recommendations/train-user-shop');
    return res.data;
};

// 🔁 Cập nhật TF-IDF matrix (admin)
export const updateTfidfMatrix = async () => {
    const res = await api.post('/recommendations/update-tfidf');
    return res.data;
};
