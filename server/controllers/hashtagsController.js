const Hashtag = require('../models/Hashtags');
const { successResponse, errorResponse } = require('../utils/response');

// Hàm xử lý hashtags khi tạo/cập nhật sản phẩm
const processProductHashtags = async (hashtagNames, productId, sellerId) => {
    if (!hashtagNames || !Array.isArray(hashtagNames) || hashtagNames.length === 0) {
        return [];
    }

    const processedHashtags = [];
    
    for (let tagName of hashtagNames) {
        // Chuẩn hóa hashtag (loại bỏ #, chuyển thành lowercase, trim)
        const normalizedName = tagName.replace(/^#+/, '').toLowerCase().trim();
        
        if (!normalizedName) continue;

        try {
            // Tìm hoặc tạo hashtag
            let hashtag = await Hashtag.findOne({ name: normalizedName });
            
            if (!hashtag) {
                // Tạo hashtag mới
                hashtag = new Hashtag({
                    name: normalizedName,
                    usageCount: 1,
                    createdBy: sellerId,
                    createdByModel: 'Shop',
                    lastUsedAt: new Date()
                });

                // Thêm product vào danh sách
                hashtag.products.push(productId);
            } else {
                // Tăng usage count
                hashtag.usageCount += 1;
                hashtag.lastUsedAt = new Date();
                
                // Thêm product nếu chưa có
                if (!hashtag.products.includes(productId)) {
                    hashtag.products.push(productId);
                }
            }

            await hashtag.save();
            processedHashtags.push(normalizedName);
            
        } catch (error) {
            console.error(`Error processing hashtag ${normalizedName}:`, error);
        }
    }

    return processedHashtags;
};

// Hàm xóa hashtag references khi xóa sản phẩm
const removeProductHashtagReferences = async (hashtagNames, productId) => {
    if (!hashtagNames || hashtagNames.length === 0) return;

    for (let tagName of hashtagNames) {
        const normalizedName = tagName.replace(/^#+/, '').toLowerCase().trim();
        
        try {
            const hashtag = await Hashtag.findOne({ name: normalizedName });
            if (!hashtag) continue;

            // Xóa product reference
            hashtag.products = hashtag.products.filter(id => !id.equals(productId));
            
            // Giảm usage count
            hashtag.usageCount = Math.max(0, hashtag.usageCount - 1);
            
            // Xóa hashtag nếu không còn được sử dụng
            if (hashtag.usageCount === 0 && hashtag.products.length === 0) {
                await Hashtag.findOneAndDelete({ name: normalizedName });
            } else {
                await hashtag.save();
            }
        } catch (error) {
            console.error(`Error removing hashtag reference ${normalizedName}:`, error);
        }
    }
};

// Lấy hashtags có usageCount cao nhất với phân trang
exports.getPopularHashtags = async (req, res) => {
    try {
        const { 
            limit = 20, 
            page = 1, 
            offset 
        } = req.query;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        
        // Tính toán skip: ưu tiên offset nếu có, không thì dùng page
        let skip;
        if (offset !== undefined) {
            skip = parseInt(offset);
        } else {
            skip = (pageNum - 1) * limitNum;
        }

        // Đếm tổng số hashtags để tính pagination info
        const totalCount = await Hashtag.countDocuments({});
        
        const hashtags = await Hashtag.find({})
            .sort({ usageCount: -1, lastUsedAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .select('name usageCount lastUsedAt')
            .lean();

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const paginationInfo = {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? pageNum + 1 : null,
            prevPage: hasPrevPage ? pageNum - 1 : null
        };

        const responseData = {
            hashtags,
            pagination: paginationInfo
        };

        return successResponse(res, 'Lấy hashtags phổ biến thành công', responseData);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy hashtags phổ biến', 500, error.message);
    }
};

// Tìm kiếm hashtags
exports.searchHashtags = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        
        if (!q || q.trim().length === 0) {
            return errorResponse(res, 'Từ khóa tìm kiếm không được để trống', 400);
        }

        const searchTerm = q.trim().toLowerCase().replace(/^#+/, '');
        
        const hashtags = await Hashtag.find({
            name: { $regex: searchTerm, $options: 'i' }
        })
        .sort({ usageCount: -1 })
        .limit(parseInt(limit))
        .select('name usageCount')
        .lean();

        return successResponse(res, 'Tìm kiếm hashtags thành công', hashtags);

    } catch (error) {
        return errorResponse(res, 'Lỗi khi tìm kiếm hashtags', 500, error.message);
    }
};

module.exports = {
    processProductHashtags,
    removeProductHashtagReferences,
    getPopularHashtags: exports.getPopularHashtags,
    searchHashtags: exports.searchHashtags
};