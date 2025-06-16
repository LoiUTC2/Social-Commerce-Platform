const Hashtag = require('../models/Hashtags');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { getHybridRecommendations } = require('../services/recommendationService');
const UserInteraction = require('../models/UserInteraction');
const { populatePostDetails } = require('../utils/populatePost');

//Thêm hoặc sửa hashtags
async function handleHashtagsUpdate(actorType, postId, hashtags = [], createdById) {
  for (const rawTag of hashtags) {
    const tagName = rawTag.trim().toLowerCase();
    if (!tagName) continue;

    const hashtag = await Hashtag.findOneAndUpdate(
      { name: tagName },
      {
        $setOnInsert: {
          name: tagName,
          createdBy: createdById,
          createdByModel: actorType
        },
        $addToSet: { posts: postId },
        $set: { lastUsedAt: new Date() },
        $inc: { usageCount: 1 }
      },
      { upsert: true, new: true }
    );
  }
}

exports.createPost = async (req, res) => {
  const authorId = req.actor._id;
  const authorType = req.actor.type === 'shop' ? 'Shop' : 'User';

  // const authorId = req.body.author._id; //Dùng để tạo dữ liệu ảo bằng runder postman
  // const authorType = req.body.author.type; //Dùng để tạo dữ liệu ảo bằng runder postman

  try {
    const {
      content,
      images = [],
      videos = [],
      productIds = [],
      hashtags = [],
      mainCategory,
      location = ''
    } = req.body;

    // Lọc và validate productIds
    let validProductIds = [];
    if (productIds && productIds.length > 0) {
      // Lọc bỏ các giá trị rỗng, null, undefined, khoảng trắng - kiểm tra kỹ hơn
      const filteredProductIds = productIds.filter(id => {
        // Kiểm tra id có tồn tại và không phải là null/undefined
        if (!id) return false;
        // Chuyển về string và trim
        const stringId = String(id).trim();
        // Chỉ giữ lại nếu không rỗng
        return stringId.length > 0;
      });

      if (filteredProductIds.length > 0) {
        // Validate ObjectId format trước khi query
        const mongoose = require('mongoose');

        // Chuyển tất cả về string và trim lại một lần nữa để đảm bảo
        const cleanedIds = filteredProductIds.map(id => String(id).trim()).filter(id => id.length > 0);

        if (cleanedIds.length === 0) {
          // Nếu sau khi clean không còn id nào hợp lệ
          validProductIds = [];
        } else {
          const invalidIds = cleanedIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

          if (invalidIds.length > 0) {
            return errorResponse(res, `ProductId không hợp lệ: ${invalidIds.join(', ')}`, 400);
          }

          // Kiểm tra sản phẩm có tồn tại không
          const existingProducts = await Product.find({
            _id: { $in: cleanedIds }
          }).select('_id');

          validProductIds = existingProducts.map(product => product._id);

          // Nếu có productId không tồn tại, báo lỗi
          if (validProductIds.length !== cleanedIds.length) {
            const existingIds = validProductIds.map(id => id.toString());
            const notFoundIds = cleanedIds.filter(id => !existingIds.includes(id));
            return errorResponse(res, `Không tìm thấy sản phẩm với ID: ${notFoundIds.join(', ')}`, 404);
          }
        }
      }
    }

    const newPost = new Post({
      author: {
        type: authorType,
        _id: authorId
      },
      content,
      images,
      videos,
      productIds: validProductIds,
      hashtags,
      mainCategory,
      location,
    });

    const savedPost = await newPost.save();

    // Cập nhật trường posts trong Product nếu có validProductIds
    if (validProductIds && validProductIds.length > 0) {
      await Product.updateMany(
        {
          _id: { $in: validProductIds },
          allowPosts: true // Chỉ thêm vào sản phẩm cho phép đăng bài
        },
        { $addToSet: { posts: savedPost._id } }
      );
    }

    await handleHashtagsUpdate(authorType, newPost._id, req.body.hashtags, authorId);

    return successResponse(res, 'Tạo bài viết thành công', savedPost);
  } catch (err) {
    return errorResponse(res, 'Lỗi tạo bài viết', 500, err.message);
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.actor._id;
    const actorType = req.actor.type === "shop" ? "Shop" : "User";

    // Tìm bài viết hiện tại
    const post = await Post.findById(id);
    if (!post) {
      return errorResponse(res, 'Bài viết không tồn tại', 404);
    }

    // Kiểm tra quyền sửa (chỉ author mới được sửa)
    if (post.author._id.toString() !== actorId.toString()) {
      return errorResponse(res, 'Bạn không có quyền sửa bài viết này', 403);
    }

    const {
      content,
      images = [],
      videos = [],
      productIds = [],
      hashtags = [],
      mainCategory,
      location,
      privacy
    } = req.body;

    // Lưu lại productIds cũ để so sánh
    const oldProductIds = post.productIds.map(id => id.toString());
    const newProductIds = productIds.map(id => id.toString());

    // Cập nhật thông tin bài viết
    post.content = content || post.content;
    post.images = images || post.images;
    post.videos = videos || post.videos;
    post.productIds = productIds || post.productIds;
    post.hashtags = hashtags || post.hashtags;
    post.mainCategory = mainCategory || post.mainCategory;
    post.location = location !== undefined ? location : post.location;
    post.privacy = privacy || post.privacy;
    post.updatedAt = Date.now();

    const updatedPost = await post.save();

    if (updatedPost.hashtags) {
      await handleHashtagsUpdate(actorType, updatedPost._id, updatedPost.hashtags, actorId);
    }

    // Kiểm tra và cập nhật trường posts trong Product nếu có thay đổi productIds
    if (JSON.stringify(oldProductIds) !== JSON.stringify(newProductIds)) {
      await updateProductPosts(oldProductIds, newProductIds, post._id);
    }

    return successResponse(res, 'Cập nhật bài viết thành công', updatedPost);
  } catch (err) {
    return errorResponse(res, 'Lỗi khi cập nhật bài viết', 500, err.message);
  }
};

// Helper function để cập nhật trường posts trong Product
const updateProductPosts = async (oldProductIds, newProductIds, postId) => {
  try {
    const Product = mongoose.model('Product');

    // Xóa postId khỏi các product cũ (nếu có)
    if (oldProductIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: oldProductIds } },
        { $pull: { posts: postId } }
      );
    }

    // Thêm postId vào các product mới (nếu có)
    if (newProductIds.length > 0) {
      await Product.updateMany(
        {
          _id: { $in: newProductIds },
          allowPosts: true // Chỉ thêm vào sản phẩm cho phép đăng bài
        },
        { $addToSet: { posts: postId } } // $addToSet để tránh trùng lặp
      );
    }
  } catch (error) {
    console.error('Error updating product posts:', error);
    throw error;
  }
};

exports.getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      populatePostDetails(
        Post.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Post.countDocuments()
    ]);

    const hasMore = skip + posts.length < total;
    const totalPages = Math.ceil(total / limit);

    console.log(`Page: ${page}, Skip: ${skip}, Limit: ${limit}, Returned: ${posts.length}, Total: ${total}, HasMore: ${hasMore}`);

    return successResponse(res, 'Lấy danh sách bài viết thành công', {
      posts: posts,
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: total,
        hasMore: hasMore
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách bài viết:', err);
    return errorResponse(res, 'Lỗi khi lấy danh sách bài viết', 500, err.message);
  }
};

// Lấy bài viết cho tab "Phổ biến" (Popular) - Infinite Scroll với AI
exports.getPopularPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const userId = req.actor?._id?.toString();
  const sessionId = req.sessionId;
  const role = req.actor?.role || 'user';

  try {
    let posts = [];
    let aiRecommendedPostIds = [];
    let totalPosts = 0;

    // 1. Lấy tất cả bài viết từ người dùng/shop đang theo dõi (Following)
    const followingPostIds = [];
    if (userId) {
      const user = await User.findById(userId).select('followingUsers followingShops').lean();
      const followedAuthorIds = [];
      if (user?.followingUsers) followedAuthorIds.push(...user.followingUsers);
      if (user?.followingShops) followedAuthorIds.push(...user.followingShops);

      if (followedAuthorIds.length > 0) {
        const followingPosts = await Post.find({
          'author._id': { $in: followedAuthorIds },
          privacy: 'public'
        })
          .sort({ createdAt: -1 })
          .select('_id')
          .lean();

        followingPosts.forEach(p => followingPostIds.push(p._id.toString()));
        console.log(`📱 [Popular Posts] Following posts: ${followingPosts.length} bài viết từ những người đang theo dõi`);
      }
    }

    // 2. Lấy AI Recommendations (nếu có)
    let aiPostIds = [];
    try {
      console.log(`🤖 [Popular Posts] Đang lấy AI recommendations cho user: ${userId || sessionId}, role: ${role}`);

      const aiRecommendations = await getHybridRecommendations(
        userId,
        sessionId,
        Math.ceil(limit * 2), // Lấy nhiều hơn để có đủ posts
        role
      );

      // Lọc chỉ lấy posts từ AI recommendations
      const aiPosts = aiRecommendations.filter(item => item.type === 'post');
      aiPosts.forEach(post => {
        const postId = post._id.toString();
        aiPostIds.push(postId);
        aiRecommendedPostIds.push(postId);
      });

      console.log(`🎯 [Popular Posts] AI gợi ý: ${aiPosts.length} bài viết từ AI`);

    } catch (aiError) {
      console.warn(`⚠️ [Popular Posts] Lỗi AI recommendations:`, aiError.message);
    }

    // 3. Lấy bài viết phổ biến (popular) dựa trên tương tác
    let popularPostIds = [];
    try {
      const popularInteractions = await UserInteraction.aggregate([
        {
          $match: {
            targetType: 'post',
            action: { $in: ['like', 'comment', 'share', 'view', 'save'] },
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$targetId',
            interactionCount: { $sum: 1 }
          }
        },
        { $sort: { interactionCount: -1 } }
      ]);

      popularPostIds = popularInteractions.map(interaction => interaction._id.toString());
      console.log(`🔥 [Popular Posts] Popular posts: ${popularPostIds.length} bài viết phổ biến`);
    } catch (popularError) {
      console.warn(`⚠️ [Popular Posts] Lỗi khi lấy popular posts:`, popularError.message);
    }

    // 4. Tạo danh sách ưu tiên với tỷ lệ phân bố
    const prioritizedPostIds = [];
    const usedPostIds = new Set();

    // Tính toán tỷ lệ phân bố cho từng trang
    const followingRatio = 0.3;  // 30% following
    const aiRatio = 0.4;         // 40% AI
    const popularRatio = 0.2;    // 20% popular
    const latestRatio = 0.1;     // 10% latest

    const followingCount = Math.ceil(limit * followingRatio);
    const aiCount = Math.ceil(limit * aiRatio);
    const popularCount = Math.ceil(limit * popularRatio);
    const latestCount = Math.ceil(limit * latestRatio);

    // Thêm following posts với ưu tiên cao nhất
    let addedFollowing = 0;
    for (let i = 0; i < followingPostIds.length && addedFollowing < followingCount; i++) {
      const postId = followingPostIds[i];
      if (!usedPostIds.has(postId)) {
        prioritizedPostIds.push({
          id: postId,
          source: 'following',
          priority: 1000 + (followingPostIds.length - i)
        });
        usedPostIds.add(postId);
        addedFollowing++;
      }
    }

    // Thêm AI posts với ưu tiên cao
    let addedAI = 0;
    for (let i = 0; i < aiPostIds.length && addedAI < aiCount; i++) {
      const postId = aiPostIds[i];
      if (!usedPostIds.has(postId)) {
        prioritizedPostIds.push({
          id: postId,
          source: 'AI',
          priority: 900 + (aiPostIds.length - i)
        });
        usedPostIds.add(postId);
        addedAI++;
      }
    }

    // Thêm popular posts
    let addedPopular = 0;
    for (let i = 0; i < popularPostIds.length && addedPopular < popularCount; i++) {
      const postId = popularPostIds[i];
      if (!usedPostIds.has(postId)) {
        prioritizedPostIds.push({
          id: postId,
          source: 'popular',
          priority: 800 + (popularPostIds.length - i)
        });
        usedPostIds.add(postId);
        addedPopular++;
      }
    }

    // 5. Nếu chưa đủ posts, lấy thêm từ tất cả posts (latest)
    const currentCount = prioritizedPostIds.length;
    const remainingSlots = Math.max(0, limit - currentCount);

    if (remainingSlots > 0) {
      console.log(`📊 [Popular Posts] Cần thêm ${remainingSlots} bài viết để đạt ${limit}`);

      // Lấy posts mới nhất (không bao gồm những posts đã có)
      const latestPosts = await Post.find({
        privacy: 'public',
        _id: { $nin: Array.from(usedPostIds) }
      })
        .sort({ createdAt: -1 })
        .limit(remainingSlots * 2) // Lấy nhiều hơn để đảm bảo đủ
        .select('_id')
        .lean();

      let addedLatest = 0;
      for (const post of latestPosts) {
        if (addedLatest >= remainingSlots) break;

        const postId = post._id.toString();
        if (!usedPostIds.has(postId)) {
          prioritizedPostIds.push({
            id: postId,
            source: 'latest',
            priority: 700 + (latestPosts.length - addedLatest)
          });
          usedPostIds.add(postId);
          addedLatest++;
        }
      }

      console.log(`⏰ [Popular Posts] Latest posts: ${addedLatest} bài viết mới nhất để bổ sung`);
    }

    // 6. Sắp xếp theo priority và pagination
    prioritizedPostIds.sort((a, b) => b.priority - a.priority);

    // Tính tổng số posts có thể có (để tính totalPages)
    const totalAvailablePosts = await Post.countDocuments({ privacy: 'public' });
    const totalPages = Math.ceil(totalAvailablePosts / limit);

    // Lấy posts cho trang hiện tại
    const paginatedPostIds = prioritizedPostIds.slice(skip, skip + limit);

    // 7. Lấy thông tin chi tiết của posts
    if (paginatedPostIds.length > 0) {
      const postIds = paginatedPostIds.map(p => p.id);
      const foundPosts = await populatePostDetails(
        Post.find({ _id: { $in: postIds } })
      );

      const plainPosts = JSON.parse(JSON.stringify(foundPosts));

      // Sắp xếp lại theo thứ tự priority
      posts = paginatedPostIds
        .map(prioritizedPost => {
          const post = plainPosts.find(p => p._id.toString() === prioritizedPost.id);
          if (post) {
            return {
              ...post,
              isAIRecommended: aiRecommendedPostIds.includes(post._id.toString()),
              recommendationSource: prioritizedPost.source,
              priority: prioritizedPost.priority
            };
          }
          return null;
        })
        .filter(Boolean);
    }

    // 8. Nếu vẫn không đủ posts cho trang này, lấy thêm từ database
    if (posts.length < limit && page > 1) {
      console.log(`📊 [Popular Posts] Trang ${page} chỉ có ${posts.length}/${limit} posts, lấy thêm từ DB`);

      const additionalNeeded = limit - posts.length;
      const additionalSkip = Math.max(0, (page - 1) * limit - prioritizedPostIds.length);

      const additionalPosts = await populatePostDetails(
        Post.find({
          privacy: 'public',
          _id: { $nin: posts.map(p => p._id) }
        })
          .sort({ createdAt: -1 })
          .skip(additionalSkip)
          .limit(additionalNeeded)
      );

      const plainAdditionalPosts = JSON.parse(JSON.stringify(additionalPosts));
      const enhancedAdditionalPosts = plainAdditionalPosts.map(post => ({
        ...post,
        isAIRecommended: false,
        recommendationSource: 'database',
        priority: 0
      }));

      posts = posts.concat(enhancedAdditionalPosts);
    }

    const hasMore = (skip + posts.length) < totalAvailablePosts;

    // Statistics
    const aiPostsInResult = posts.filter(p => p.isAIRecommended).length;
    const sourceStats = posts.reduce((acc, post) => {
      acc[post.recommendationSource] = (acc[post.recommendationSource] || 0) + 1;
      return acc;
    }, {});

    console.log(`📊 [Popular Posts] Kết quả trang ${page}:`);
    console.log(`   - Tổng số bài viết: ${posts.length}`);
    console.log(`   - Phân bố nguồn:`, sourceStats);
    console.log(`   - Bài viết AI gợi ý: ${aiPostsInResult} (${Math.round(aiPostsInResult / posts.length * 100)}%)`);

    return successResponse(res, 'Lấy bài viết phổ biến thành công', {
      posts: posts,
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalAvailablePosts,
        hasMore: hasMore
      },
      aiStats: {
        totalAIRecommended: aiPostsInResult,
        aiRecommendedIds: aiRecommendedPostIds,
        aiPercentage: Math.round(aiPostsInResult / posts.length * 100),
        sourceDistribution: sourceStats
      }
    });

  } catch (err) {
    console.error('❌ [Popular Posts] Lỗi khi lấy bài viết phổ biến:', err);
    return errorResponse(res, 'Lỗi khi lấy bài viết phổ biến', 500, err.message);
  }
};

// lấy bài viết cho tab "Dành cho bạn" (For You)
exports.getForYouPosts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const userId = req.actor?._id?.toString();
    const sessionId = req.sessionId;
    const role = req.actor?.type || 'user'; // Vai trò của người dùng

    if (!userId && !sessionId) {
        return errorResponse(res, 'Cần userId hoặc sessionId để lấy gợi ý cá nhân hóa', 400);
    }

    try {
        console.log(`🔍 Getting For You posts for user: ${userId || sessionId}, role: ${role}, page: ${page}, limit: ${limit}`);

        // Sử dụng hàm getHybridRecommendations từ recommendationService
        // Lấy nhiều hơn để đảm bảo đủ bài viết sau khi lọc và phân trang
        const batchSize = Math.max(limit * (page + 1), 20); // Đảm bảo có đủ items để lọc
        
        let recommendedItems = [];
        try {
            // Thêm timeout cho getHybridRecommendations để tránh treo
            const recommendationTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Recommendation timeout')), 20000); // 20 giây
            });

            const recommendationPromise = getHybridRecommendations(userId, sessionId, batchSize, role);
            recommendedItems = await Promise.race([recommendationPromise, recommendationTimeout]);
            
            console.log(`📊 Received ${recommendedItems?.length || 0} recommended items`);
        } catch (recommendationError) {
            console.warn('⚠️ Lỗi khi lấy hybrid recommendations:', recommendationError.message);
            
            // Fallback: trả về thông báo thân thiện thay vì lỗi
            if (recommendationError.message.includes('timeout')) {
                return successResponse(res, 'Hệ thống đang xử lý gợi ý cho bạn. Vui lòng thử lại sau ít phút.', {
                    posts: [],
                    pagination: {
                        currentPage: page,
                        limit: limit,
                        totalPages: 0,
                        totalResults: 0,
                        hasMore: false
                    },
                    fallbackMessage: 'Hệ thống gợi ý đang được cải thiện.'
                });
            }
            
            recommendedItems = []; // Tiếp tục với array rỗng
        }

        // Đảm bảo recommendedItems là array hợp lệ
        if (!Array.isArray(recommendedItems)) {
            console.warn('⚠️ recommendedItems không phải là array, chuyển về array rỗng');
            recommendedItems = [];
        }

        // Lọc ra chỉ các bài viết (posts) và lấy ID
        const recommendedPostIds = recommendedItems
            .filter(item => {
                // Kiểm tra item hợp lệ và có type là 'post'
                return item && 
                       typeof item === 'object' && 
                       item.type === 'post' && 
                       item._id && 
                       /^[0-9a-fA-F]{24}$/.test(item._id.toString());
            })
            .map(item => item._id.toString()); // Chuyển về string để dùng trong $in

        console.log(`📝 Filtered ${recommendedPostIds.length} valid post IDs from recommendations`);

        let posts = [];
        let total = 0;

        if (recommendedPostIds.length > 0) {
            try {
                // Lấy thông tin chi tiết của các bài viết được gợi ý
                // COMMENT: Cần đảm bảo thứ tự của các bài viết theo thứ tự recommendation
                const foundPosts = await populatePostDetails(
                    Post.find({ 
                        _id: { $in: recommendedPostIds },
                        privacy: 'public', // Chỉ lấy bài viết public
                        isActive: { $ne: false } // Loại bỏ bài viết bị deactive
                    })
                );

                console.log(`📋 Found ${foundPosts.length} posts from database`);

                // Sắp xếp lại theo thứ tự gợi ý từ AI
                const sortedPosts = recommendedPostIds
                    .map(id => foundPosts.find(post => post._id.toString() === id))
                    .filter(Boolean); // Lọc bỏ các bài viết không tìm thấy hoặc null

                total = sortedPosts.length;
                
                // Áp dụng phân trang
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                posts = sortedPosts.slice(startIndex, endIndex);

                console.log(`📄 Returning ${posts.length} posts for page ${page}`);

            } catch (dbError) {
                console.error('❌ Lỗi khi truy vấn database:', dbError);
                
                // Trả về lỗi database nhưng vẫn thân thiện
                return errorResponse(res, 'Có lỗi xảy ra khi lấy bài viết. Vui lòng thử lại.', 500, dbError.message);
            }

        } else {
            // Nếu không có gợi ý bài viết từ AI, fallback về bài viết mới nhất hoặc phổ biến
            console.log('⚠️ Không có gợi ý bài viết từ AI, fallback về bài viết phổ biến.');
            
            try {
                // Fallback: lấy bài viết phổ biến gần đây
                const fallbackQuery = Post.find({
                    privacy: 'public',
                    isActive: { $ne: false },
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 ngày gần đây
                })
                .sort({ 
                    likesCount: -1, 
                    commentsCount: -1, 
                    sharesCount: -1,
                    createdAt: -1 
                })
                .skip((page - 1) * limit)
                .limit(limit);

                const fallbackPosts = await populatePostDetails(fallbackQuery);
                
                // Đếm tổng số bài viết fallback
                const fallbackTotal = await Post.countDocuments({
                    privacy: 'public',
                    isActive: { $ne: false },
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                });

                posts = fallbackPosts;
                total = fallbackTotal;

                console.log(`📋 Fallback: returning ${posts.length} popular posts`);

            } catch (fallbackError) {
                console.error('❌ Lỗi fallback:', fallbackError);
                
                // Trả về thông báo thân thiện khi cả fallback cũng thất bại
                return successResponse(res, 'Hiện tại chưa có bài viết phù hợp cho bạn. Hãy tương tác nhiều hơn để nhận gợi ý tốt hơn!', {
                    posts: [],
                    pagination: {
                        currentPage: page,
                        limit: limit,
                        totalPages: 0,
                        totalResults: 0,
                        hasMore: false
                    },
                    recommendation: {
                        message: 'Hệ thống sẽ học hỏi từ hoạt động của bạn để đưa ra gợi ý tốt hơn.',
                        suggestions: [
                            'Thích và bình luận các bài viết bạn quan tâm',
                            'Theo dõi những người dùng và cửa hàng yêu thích',
                            'Tìm kiếm các chủ đề bạn muốn khám phá'
                        ]
                    }
                });
            }
        }

        // Tính toán pagination
        const hasMore = (page * limit) < total;
        const totalPages = Math.ceil(total / limit);

        // Thêm metadata cho debugging (chỉ trong development)
        const responseData = {
            posts: posts,
            pagination: {
                currentPage: page,
                limit: limit,
                totalPages: totalPages,
                totalResults: total,
                hasMore: hasMore
            }
        };

        // Thêm debug info nếu là development environment
        if (process.env.NODE_ENV === 'development') {
            responseData.debug = {
                recommendedItemsCount: recommendedItems.length,
                recommendedPostIds: recommendedPostIds.length,
                foundPostsInDb: posts.length,
                userId: userId || 'N/A',
                sessionId: sessionId || 'N/A',
                role: role
            };
        }

        return successResponse(res, 'Lấy bài viết dành cho bạn thành công', responseData);
        
    } catch (err) {
        console.error('❌ Lỗi tổng thể khi lấy bài viết dành cho bạn:', err);
        
        // Error response thân thiện với user
        return errorResponse(res, 'Có lỗi xảy ra khi lấy bài viết. Chúng tôi đang khắc phục vấn đề này.', 500, 
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
};

// Lấy bài viết những người đang theo dõi user/shop
exports.getFollowingPosts = async (req, res) => {
  const actor = req.actor;
  const actorId = actor?._id;
  const actorType = actor?.type === 'shop' ? 'Shop' : 'User';

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (!actorId) {
    return errorResponse(res, 'Bạn cần đăng nhập để xem bài viết từ người theo dõi', 401);
  }

  try {
    // Lấy danh sách người mà bạn đang follow
    const following = await UserInteraction.find({
      'author._id': actorId,
      'author.type': actorType,
      action: 'follow'
    }).select('targetId targetType -_id');

    if (!following.length) {
      return successResponse(res, 'Bạn chưa theo dõi ai nên chưa có bài viết', {
        posts: [],
        pagination: {
          currentPage: page,
          limit: limit,
          totalPages: 0,
          totalResults: 0,
          hasMore: false
        }
      });
    }

    // Lấy danh sách ID của User và Shop mà bạn đang follow
    const followedUserIds = following
      .filter(f => f.targetType === 'user')
      .map(f => f.targetId);

    const followedShopIds = following
      .filter(f => f.targetType === 'shop')
      .map(f => f.targetId);

    // Tìm bài viết từ các user/shop bạn đang theo dõi
    const query = {
      privacy: 'public',
      $or: [
        { 'author.type': 'User', 'author._id': { $in: followedUserIds } },
        { 'author.type': 'Shop', 'author._id': { $in: followedShopIds } }
      ]
    };

    // Ưu tiên bài có nhiều tương tác: like + comment + share
    const sortCriteria = {
      likesCount: -1,
      commentsCount: -1,
      sharesCount: -1,
      createdAt: -1 // sau cùng ưu tiên mới nhất
    };

    const [posts, total] = await Promise.all([
      populatePostDetails(
        Post.find(query)
          .sort(sortCriteria)
          .skip(skip)
          .limit(limit)
      ),
      Post.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasMore = skip + posts.length < total;

    return successResponse(res, 'Lấy bài viết từ người theo dõi thành công', {
      posts,
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages,
        totalResults: total,
        hasMore
      }
    });
  } catch (err) {
    console.error('Lỗi khi lấy feed theo dõi:', err);
    return errorResponse(res, 'Lỗi khi lấy bài viết từ người theo dõi', 500, err.message);
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await populatePostDetails(Post.findById(req.params.id));
    if (!post) return errorResponse(res, 'Bài viết không tồn tại', 404);
    return successResponse(res, 'Chi tiết bài viết', post);
  } catch (err) {
    return errorResponse(res, 'Lỗi khi lấy chi tiết bài viết', 500, err.message);
  }
};

// Helper function để tìm author theo slug
const findAuthorBySlug = async (slug) => {
  // Thử tìm User trước
  const user = await User.findOne({ slug: slug }).select('_id fullName avatar coverImage slug');
  if (user) {
    return {
      _id: user._id,
      type: 'User',
      data: user
    };
  }

  // Nếu không tìm thấy User, thử tìm Shop
  const shop = await Shop.findOne({ slug: slug }).select('_id name avatar coverImage logo slug');
  if (shop) {
    return {
      _id: shop._id,
      type: 'Shop',
      data: shop
    };
  }

  return null;
};

exports.getPostsByAuthorSlug = async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    // Bước 1: Tìm User hoặc Shop theo slug
    const author = await findAuthorBySlug(slug);

    if (!author) {
      return errorResponse(res, 'Không tìm thấy tác giả với slug này', 404);
    }

    // Bước 2: Tìm bài viết theo authorId và authorType
    const query = {
      'author._id': author._id,
      'author.type': author.type
    };

    const [posts, total] = await Promise.all([
      populatePostDetails(
        Post.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
      ),
      Post.countDocuments(query)
    ]);

    const hasMore = skip + posts.length < total;
    const totalPages = Math.ceil(total / limit);

    return successResponse(res, 'Lấy danh sách bài viết của tác giả thành công', {
      posts: posts, // Đổi từ 'data' thành 'posts' cho rõ ràng
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: total, // Đổi từ 'totalPosts' thành 'totalResults' để đồng nhất với các API khác nếu có
        hasMore: hasMore
      },
      authorInfo: {
        _id: author._id,
        type: author.type,
        slug: slug,
        fullName: author.data.fullName || author.data.name, // Lấy fullName nếu là User, name nếu là Shop
        avatar: author.data.avatar,
        coverImage: author.data.coverImage,
        logo: author.data.logo // Nếu là shop có logo
      }
    });
  } catch (err) {
    console.error('Error in getPostsByAuthorSlug:', err);
    return errorResponse(res, 'Lỗi khi lấy danh sách bài viết của tác giả', 500, err.message);
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 'Bài viết không tồn tại', 404);
    if (post.author._id.toString() !== req.actor._id)
      return errorResponse(res, 'Bạn không có quyền xoá bài viết này', 403);

    await post.deleteOne();
    return successResponse(res, 'Xoá bài viết thành công');
  } catch (err) {
    return errorResponse(res, 'Lỗi khi xoá bài viết', 500, err.message);
  }
};
