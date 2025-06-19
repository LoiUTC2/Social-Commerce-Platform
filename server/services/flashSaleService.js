const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');

class FlashSaleService {
    /**
     * Lấy danh sách Flash Sale với điều kiện và populate dữ liệu
     */
    async getFlashSalesWithProducts(query, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = { startTime: -1 },
            populateProducts = true
        } = options;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [flashSales, total] = await Promise.all([
            FlashSale.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            FlashSale.countDocuments(query)
        ]);

        // Populate thông tin sản phẩm nếu cần
        if (populateProducts && flashSales.length > 0) {
            const enrichedFlashSales = await Promise.all(
                flashSales.map(flashSale => this.enrichFlashSaleWithProducts(flashSale))
            );
            return {
                items: enrichedFlashSales,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }

        return {
            items: flashSales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Enrichment: Thêm thông tin chi tiết sản phẩm vào Flash Sale
     */
    async enrichFlashSaleWithProducts(flashSale) {
        if (!flashSale.products || flashSale.products.length === 0) {
            return { ...flashSale, enrichedProducts: [] };
        }

        const productIds = flashSale.products.map(p => p.product);
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true
        })
            .select('name images price discount stock slug ratings soldCount mainCategory brand')
            .populate('mainCategory', 'name slug')
            .lean();

        // Tạo map để dễ tra cứu
        const productMap = products.reduce((acc, product) => {
            acc[product._id.toString()] = product;
            return acc;
        }, {});

        // Kết hợp thông tin Flash Sale với thông tin sản phẩm
        const enrichedProducts = flashSale.products
            .map(saleProduct => {
                const product = productMap[saleProduct.product.toString()];
                if (!product) return null;

                const originalPrice = product.price;
                const salePrice = saleProduct.salePrice;
                const discountPercent = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
                const remainingStock = Math.min(product.stock, saleProduct.stockLimit - saleProduct.soldCount);
                const soldPercent = saleProduct.stockLimit > 0
                    ? Math.round((saleProduct.soldCount / saleProduct.stockLimit) * 100)
                    : 0;

                return {
                    // Thông tin sản phẩm gốc
                    _id: product._id,
                    name: product.name,
                    slug: product.slug,
                    images: product.images,
                    originalPrice,
                    discount: product.discount,
                    stock: product.stock,
                    soldCount: product.soldCount,
                    ratings: product.ratings,
                    mainCategory: product.mainCategory,
                    brand: product.brand,

                    // Thông tin Flash Sale
                    flashSale: {
                        salePrice,
                        stockLimit: saleProduct.stockLimit,
                        soldCount: saleProduct.soldCount,
                        remainingStock,
                        discountPercent,
                        soldPercent,
                        savings: originalPrice - salePrice, // số tiền tiết kiệm
                        isAlmostSoldOut: remainingStock <= 5, // cảnh báo sắp hết hàng
                        isSoldOut: remainingStock <= 0
                    }
                };
            })
            .filter(Boolean); // Loại bỏ sản phẩm null

        return {
            ...flashSale,
            enrichedProducts,
            summary: {
                totalProducts: enrichedProducts.length,
                totalSold: enrichedProducts.reduce((sum, p) => sum + p.flashSale.soldCount, 0),
                avgDiscountPercent: enrichedProducts.length > 0
                    ? Math.round(enrichedProducts.reduce((sum, p) => sum + p.flashSale.discountPercent, 0) / enrichedProducts.length)
                    : 0,
                hasAvailableProducts: enrichedProducts.some(p => !p.flashSale.isSoldOut)
            }
        };
    }

    /**
     * Lấy Flash Sale đang diễn ra
     */
    async getActiveFlashSales(options = {}) {
        const now = new Date();
        const query = {
            isActive: true,
            isHidden: false,
            approvalStatus: 'approved',
            startTime: { $lte: now },
            endTime: { $gte: now }
        };

        return this.getFlashSalesWithProducts(query, {
            ...options,
            sort: { isFeatured: -1, startTime: -1 } // Ưu tiên featured trước
        });
    }

    /**
     * Lấy Flash Sale sắp diễn ra
     */
    async getUpcomingFlashSales(options = {}) {
        const now = new Date();
        const query = {
            isActive: true,
            isHidden: false,
            approvalStatus: 'approved',
            startTime: { $gt: now }
        };

        return this.getFlashSalesWithProducts(query, {
            ...options,
            sort: { isFeatured: -1, startTime: 1 } // Ưu tiên featured và sắp diễn ra sớm nhất
        });
    }

    /**
     * Lấy Flash Sale đã kết thúc (để hiển thị lịch sử)
     */
    async getEndedFlashSales(options = {}) {
        const now = new Date();
        const query = {
            isActive: true,
            isHidden: false,
            approvalStatus: 'approved',
            endTime: { $lt: now }
        };

        return this.getFlashSalesWithProducts(query, {
            ...options,
            sort: { endTime: -1 } // Mới kết thúc trước
        });
    }

    /**
     * Lấy tất cả Flash Sale (active + upcoming) cho trang chủ
     */
    async getAllFlashSalesForHomepage(options = {}) {
        const now = new Date();
        const query = {
            isActive: true,
            isHidden: false,
            approvalStatus: 'approved',
            $or: [
                { startTime: { $lte: now }, endTime: { $gte: now } }, // Đang diễn ra
                { startTime: { $gt: now } } // Sắp diễn ra
            ]
        };

        const result = await this.getFlashSalesWithProducts(query, {
            ...options,
            sort: {
                isFeatured: -1, // Featured trước
                startTime: 1    // Sắp diễn ra/đang diễn ra sớm nhất
            }
        });

        // Phân loại active và upcoming
        const now2 = new Date();
        const activeFlashSales = [];
        const upcomingFlashSales = [];

        result.items.forEach(flashSale => {
            const startTime = new Date(flashSale.startTime);
            const endTime = new Date(flashSale.endTime);

            if (startTime <= now2 && endTime >= now2) {
                activeFlashSales.push(flashSale);
            } else if (startTime > now2) {
                upcomingFlashSales.push(flashSale);
            }
        });

        return {
            ...result,
            activeFlashSales,
            upcomingFlashSales,
            summary: {
                totalActive: activeFlashSales.length,
                totalUpcoming: upcomingFlashSales.length,
                totalAvailableProducts: result.items.reduce((sum, fs) =>
                    sum + (fs.summary?.hasAvailableProducts ? fs.summary.totalProducts : 0), 0
                )
            }
        };
    }

    /**
     * Kiểm tra trạng thái Flash Sale
     */
    getFlashSaleStatus(flashSale) {
        const now = new Date();
        const startTime = new Date(flashSale.startTime);
        const endTime = new Date(flashSale.endTime);

        if (now < startTime) {
            return {
                status: 'upcoming',
                timeUntilStart: startTime - now,
                message: 'Sắp diễn ra'
            };
        } else if (now >= startTime && now <= endTime) {
            return {
                status: 'active',
                timeUntilEnd: endTime - now,
                message: 'Đang diễn ra'
            };
        } else {
            return {
                status: 'ended',
                message: 'Đã kết thúc'
            };
        }
    }

    /**
     * Lấy top Flash Sale hot nhất (theo lượt mua)
     */
    async getHotFlashSales(limit = 5) {
        const now = new Date();
        const query = {
            isActive: true,
            isHidden: false,
            approvalStatus: 'approved',
            startTime: { $lte: now },
            endTime: { $gte: now }
        };

        const result = await this.getFlashSalesWithProducts(query, {
            limit,
            sort: { 'stats.totalPurchases': -1, 'stats.totalRevenue': -1 }
        });

        return result.items;
    }
}

module.exports = new FlashSaleService();