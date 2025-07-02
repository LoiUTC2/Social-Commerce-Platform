const Hashtag = require('../models/Hashtags');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { getHybridRecommendations } = require('../services/recommendationService');
const UserInteraction = require('../models/UserInteraction');
const { populatePostDetails } = require('../utils/populatePost');
const mongoose = require('mongoose');

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
exports.getPopularPosts_1 = async (req, res) => {
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
exports.getForYouPosts_1 = async (req, res) => {
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


// Hàm helper để shuffle array (random thứ tự)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Hàm helper để lấy danh sách category từ interactions
async function getCategoriesFromInteractions(interactions) {
  const categorySet = new Set();

  for (const interaction of interactions) {
    // Lấy category từ targetDetails nếu có
    if (interaction.targetDetails?.category) {
      categorySet.add(interaction.targetDetails.category);
    }

    // Nếu là interaction với product, lấy thêm category từ Product
    if (interaction.targetType === 'product' && interaction.targetId) {
      try {
        const product = await Product.findById(interaction.targetId)
          .select('categories mainCategory')
          .populate('categories mainCategory', '_id name')
          .lean();

        if (product) {
          // Thêm mainCategory
          if (product.mainCategory) {
            categorySet.add(product.mainCategory._id.toString());
          }
          // Thêm tất cả categories
          if (product.categories) {
            product.categories.forEach(cat => {
              categorySet.add(cat._id.toString());
            });
          }
        }
      } catch (error) {
        console.warn(`⚠️ Lỗi khi lấy category từ product ${interaction.targetId}:`, error.message);
      }
    }
  }

  return Array.from(categorySet);
}

// Hàm helper để ghi nhận view interaction
async function recordViewInteraction_TC(sessionId, userId, postId, deviceInfo) {
  try {
    await UserInteraction.recordInteraction({
      author: userId ? { _id: userId, type: 'User' } : null,
      targetType: 'post',
      targetId: postId,
      action: 'view',
      sessionId: sessionId,
      deviceInfo: deviceInfo,
      targetDetails: {
        content: 'post_view_in_feed'
      }
    });
  } catch (error) {
    console.warn('⚠️ Lỗi khi ghi nhận view interaction:', error.message);
  }
}

// Lấy bài viết cho tab "Phổ biến" (Popular) - Dựa trên hành vi người dùng
exports.getPopularPosts_TC = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const userId = req.actor?._id?.toString();
  const sessionId = req.sessionId;
  const role = req.actor?.role || 'user';

  try {
    let posts = [];
    let totalPosts = 0;

    console.log(`📱 [Popular Posts] Lấy bài viết cho user: ${userId || 'anonymous'}, session: ${sessionId}, trang: ${page}`);

    // 1. Lấy bài viết đã xem của session này để tránh duplicate
    const viewedPostIds = new Set();
    try {
      const viewedInteractions = await UserInteraction.find({
        sessionId: sessionId,
        targetType: 'post',
        action: 'view'
      })
        .select('targetId')
        .lean();

      viewedInteractions.forEach(interaction => {
        if (interaction.targetId) {
          viewedPostIds.add(interaction.targetId.toString());
        }
      });

      console.log(`👁️ [Popular Posts] Đã xem ${viewedPostIds.size} bài viết trước đó`);
    } catch (error) {
      console.warn('⚠️ Lỗi khi lấy danh sách bài viết đã xem:', error.message);
    }

    // 2. Lấy các hành vi gần đây của user (30 ngày gần nhất)
    const recentInteractions = await UserInteraction.find({
      $or: [
        { sessionId: sessionId },
        ...(userId ? [{ 'author._id': userId }] : [])
      ],
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      targetType: { $in: ['product', 'shop', 'post'] },
      action: { $in: ['view', 'like', 'add_to_cart', 'purchase', 'save', 'care', 'follow'] }
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    console.log(`🔄 [Popular Posts] Tìm thấy ${recentInteractions.length} hành vi gần đây`);

    // 3. Lấy danh sách categories từ các interactions
    const relatedCategories = await getCategoriesFromInteractions(recentInteractions);
    console.log(`📂 [Popular Posts] Tìm thấy ${relatedCategories.length} categories liên quan`);

    // 4. Tạo aggregation pipeline để lấy posts theo priority với pagination
    const baseMatchCondition = {
      privacy: 'public',
      _id: { $nin: Array.from(viewedPostIds) }
    };

    // 4.1. Lấy posts từ người/shop đang theo dõi
    let followingPostIds = [];
    if (userId) {
      try {
        const user = await User.findById(userId).select('followingUsers followingShops').lean();
        const followedAuthorIds = [];
        if (user?.followingUsers) followedAuthorIds.push(...user.followingUsers);
        if (user?.followingShops) followedAuthorIds.push(...user.followingShops);

        if (followedAuthorIds.length > 0) {
          const followingPosts = await Post.find({
            'author._id': { $in: followedAuthorIds },
            ...baseMatchCondition
          })
            .select('_id')
            .lean();

          followingPostIds = followingPosts.map(p => p._id.toString());
          console.log(`👥 [Popular Posts] Tìm thấy ${followingPostIds.length} bài viết từ following`);
        }
      } catch (error) {
        console.warn('⚠️ Lỗi khi lấy bài viết following:', error.message);
      }
    }

    // 4.2. Lấy posts có category liên quan
    let categoryRelatedPostIds = [];
    if (relatedCategories.length > 0) {
      try {
        const categoryPosts = await Post.find({
          $or: [
            { mainCategory: { $in: relatedCategories } },
            { categories: { $in: relatedCategories } }
          ],
          ...baseMatchCondition
        })
          .select('_id')
          .lean();

        categoryRelatedPostIds = categoryPosts.map(p => p._id.toString());
        console.log(`🏷️ [Popular Posts] Tìm thấy ${categoryRelatedPostIds.length} bài viết theo category`);
      } catch (error) {
        console.warn('⚠️ Lỗi khi lấy bài viết theo category:', error.message);
      }
    }

    // 4.3. Lấy posts phổ biến (7 ngày gần nhất)
    let popularPostIds = [];
    try {
      const popularInteractions = await UserInteraction.aggregate([
        {
          $match: {
            targetType: 'post',
            action: { $in: ['like', 'comment', 'share', 'save'] },
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: '$targetId',
            interactionCount: { $sum: 1 }
          }
        },
        { $sort: { interactionCount: -1 } },
        { $limit: 500 } // Tăng limit để có đủ posts cho pagination
      ]);

      const popularIds = popularInteractions.map(i => i._id.toString());

      if (popularIds.length > 0) {
        const popularPosts = await Post.find({
          _id: { $in: popularIds },
          ...baseMatchCondition
        })
          .select('_id')
          .lean();

        popularPostIds = popularPosts.map(p => p._id.toString());
        console.log(`🔥 [Popular Posts] Tìm thấy ${popularPostIds.length} bài viết phổ biến`);
      }
    } catch (error) {
      console.warn('⚠️ Lỗi khi lấy bài viết phổ biến:', error.message);
    }

    // 5. Tạo danh sách posts theo priority (không giới hạn số lượng)
    const prioritizedPosts = [];
    const usedPostIds = new Set();

    // Thêm bài viết đã xem vào usedPostIds
    viewedPostIds.forEach(id => usedPostIds.add(id));

    // 5.1. Following posts (priority 1000+)
    followingPostIds.forEach(postId => {
      if (!usedPostIds.has(postId)) {
        prioritizedPosts.push({
          id: postId,
          source: 'following',
          priority: 1000 + Math.random() * 100
        });
        usedPostIds.add(postId);
      }
    });

    // 5.2. Category related posts (priority 900+)
    categoryRelatedPostIds.forEach(postId => {
      if (!usedPostIds.has(postId)) {
        prioritizedPosts.push({
          id: postId,
          source: 'category_based',
          priority: 900 + Math.random() * 100
        });
        usedPostIds.add(postId);
      }
    });

    // 5.3. Popular posts (priority 800+)
    popularPostIds.forEach(postId => {
      if (!usedPostIds.has(postId)) {
        prioritizedPosts.push({
          id: postId,
          source: 'popular',
          priority: 800 + Math.random() * 100
        });
        usedPostIds.add(postId);
      }
    });

    // 5.4. Latest posts để đảm bảo có đủ content cho tất cả các trang
    const latestPosts = await Post.find({
      ...baseMatchCondition,
      _id: { $nin: Array.from(usedPostIds) }
    })
      .sort({ createdAt: -1 })
      .limit(1000) // Lấy nhiều posts để đảm bảo pagination
      .select('_id')
      .lean();

    latestPosts.forEach(post => {
      if (!usedPostIds.has(post._id.toString())) {
        prioritizedPosts.push({
          id: post._id.toString(),
          source: 'latest',
          priority: 700 + Math.random() * 100
        });
        usedPostIds.add(post._id.toString());
      }
    });

    console.log(`📊 [Popular Posts] Tổng cộng có ${prioritizedPosts.length} bài viết để phân trang`);

    // 6. Sắp xếp theo priority và random trong cùng mức priority
    prioritizedPosts.sort((a, b) => {
      // Sắp xếp theo priority giảm dần
      if (Math.floor(a.priority / 100) !== Math.floor(b.priority / 100)) {
        return b.priority - a.priority;
      }
      // Nếu cùng mức priority, random
      return Math.random() - 0.5;
    });

    // 7. Áp dụng pagination
    const totalAvailablePosts = prioritizedPosts.length;
    const totalPages = Math.ceil(totalAvailablePosts / limit);
    const paginatedPosts = prioritizedPosts.slice(skip, skip + limit);

    console.log(`📄 [Popular Posts] Trang ${page}/${totalPages}: lấy ${paginatedPosts.length} bài viết từ vị trí ${skip}`);

    // 8. Lấy thông tin chi tiết của posts
    if (paginatedPosts.length > 0) {
      const postIds = paginatedPosts.map(p => p.id);
      const foundPosts = await populatePostDetails(
        Post.find({ _id: { $in: postIds } })
      );

      const plainPosts = JSON.parse(JSON.stringify(foundPosts));

      // Map posts với metadata và giữ thứ tự priority
      posts = paginatedPosts
        .map(prioritizedPost => {
          const post = plainPosts.find(p => p._id.toString() === prioritizedPost.id);
          if (post) {
            return {
              ...post,
              recommendationSource: prioritizedPost.source,
              priority: prioritizedPost.priority,
              isPersonalized: ['following', 'category_based'].includes(prioritizedPost.source)
            };
          }
          return null;
        })
        .filter(Boolean);

      // 9. Ghi nhận view interactions
      const deviceInfo = {
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        platform: 'web'
      };

      Promise.all(
        posts.map(post =>
          recordViewInteraction(sessionId, userId, post._id, deviceInfo)
        )
      ).catch(error => {
        console.warn('⚠️ Lỗi khi ghi nhận view interactions:', error.message);
      });
    }

    const hasMore = (skip + posts.length) < totalAvailablePosts;

    // Statistics
    const sourceStats = posts.reduce((acc, post) => {
      acc[post.recommendationSource] = (acc[post.recommendationSource] || 0) + 1;
      return acc;
    }, {});

    const personalizedCount = posts.filter(p => p.isPersonalized).length;

    console.log(`📊 [Popular Posts] Kết quả trang ${page}:`);
    console.log(`   - Bài viết trả về: ${posts.length}/${limit}`);
    console.log(`   - Tổng bài viết khả dụng: ${totalAvailablePosts}`);
    console.log(`   - Phân bố nguồn:`, sourceStats);
    console.log(`   - Bài viết cá nhân hóa: ${personalizedCount}`);
    console.log(`   - Còn trang tiếp theo: ${hasMore}`);

    return successResponse(res, 'Lấy bài viết phổ biến thành công', {
      posts: posts,
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: totalAvailablePosts,
        hasMore: hasMore
      },
      userStats: {
        totalPersonalized: personalizedCount,
        personalizedPercentage: posts.length > 0 ? Math.round(personalizedCount / posts.length * 100) : 0,
        sourceDistribution: sourceStats,
        previouslyViewed: viewedPostIds.size,
        recentInteractions: recentInteractions.length,
        relatedCategories: relatedCategories.length
      }
    });

  } catch (err) {
    console.error('❌ [Popular Posts] Lỗi khi lấy bài viết phổ biến:', err);
    return errorResponse(res, 'Lỗi khi lấy bài viết phổ biến', 500, err.message);
  }
};


/////////////////// POPULAR_AI

// ✅ Helper function: Lấy danh sách posts đã hiển thị trên feed trong session
async function getFeedImpressionPostsInSession(userId, sessionId) {
  try {
    const query = {
      targetType: 'post',
      action: 'feed_impression', // 👈 Dùng action mới cho feed impression
      sessionId: sessionId
    };

    // Nếu có userId, thêm vào filter để chính xác hơn
    if (userId) {
      query['author._id'] = userId;
    }

    const impressionInteractions = await UserInteraction.find(query)
      .select('targetId')
      .lean();

    return impressionInteractions
      .map(interaction => interaction.targetId)
      .filter(id => id); // Loại bỏ null/undefined
  } catch (error) {
    console.warn('⚠️ [getFeedImpressionPostsInSession] Lỗi khi lấy posts đã hiển thị:', error.message);
    return [];
  }
}

// ✅ Helper function: Record feed impression cho posts được trả về trên feed
async function recordFeedImpressions(posts, userId, sessionId, req) {
  try {
    if (!posts || posts.length === 0) return;

    // Tạo interaction data cho mỗi post với action feed_impression
    const interactionPromises = posts.map(post => {
      const interactionData = {
        author: userId ? {
          _id: userId,
          type: 'User'
        } : null,
        targetType: 'post',
        targetId: post._id,
        action: 'feed_impression', // 👈 Action riêng cho feed impression
        sessionId: sessionId,
        targetDetails: {
          content: post.content?.substring(0, 100),
          authorType: post.author?.type,
          isSponsored: post.isSponsored || false,
          likesCount: post.reactions?.likes?.length || 0,
          commentsCount: post.comments?.length || 0,
          hashtags: post.hashtags || []
        },
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: req.ip,
          platform: 'web'
        },
        metadata: {
          recommendationSource: post.recommendationSource,
          isAIRecommended: post.isAIRecommended,
          priority: post.priority,
          feedContext: 'popular_feed' // 👈 Thêm context để phân biệt
        }
      };

      return UserInteraction.recordInteraction(interactionData);
    });

    // Execute tất cả interactions song song
    await Promise.allSettled(interactionPromises);
    console.log(`📝 [recordFeedImpressions] Đã ghi nhận ${posts.length} feed impression interactions`);

  } catch (error) {
    console.warn('⚠️ [recordFeedImpressions] Lỗi khi ghi nhận feed impressions:', error.message);
    // Không throw error để không ảnh hưởng đến response chính
  }
}

// Lấy bài viết cho tab "Phổ biến" (Popular) - Infinite Scroll với AI và Session Deduplication
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

    // 1. Lấy danh sách bài viết đã hiển thị trên feed trong session này
    const impressionPostIds = await getFeedImpressionPostsInSession(userId, sessionId);
    console.log(`👀 [Popular Posts] Session ${sessionId}: Đã hiển thị ${impressionPostIds.length} bài viết trên feed trước đó`);

    // 2. Lấy tất cả bài viết từ người dùng/shop đang theo dõi (Following)
    const followingPostIds = [];
    if (userId) {
      const user = await User.findById(userId).select('followingUsers followingShops').lean();
      const followedAuthorIds = [];
      if (user?.followingUsers) followedAuthorIds.push(...user.followingUsers);
      if (user?.followingShops) followedAuthorIds.push(...user.followingShops);

      if (followedAuthorIds.length > 0) {
        const followingPosts = await Post.find({
          'author._id': { $in: followedAuthorIds },
          privacy: 'public',
          _id: { $nin: impressionPostIds } // ✅ Loại bỏ posts đã hiển thị trên feed
        })
          .sort({ createdAt: -1 })
          .select('_id')
          .lean();

        followingPosts.forEach(p => followingPostIds.push(p._id.toString()));
        console.log(`📱 [Popular Posts] Following posts: ${followingPosts.length} bài viết mới từ những người đang theo dõi`);
      }
    }

    // 3. Lấy AI Recommendations (nếu có) - loại bỏ posts đã hiển thị trên feed
    let aiPostIds = [];
    try {
      console.log(`🤖 [Popular Posts] Đang lấy AI recommendations cho user: ${userId || sessionId}, role: ${role}`);

      const aiRecommendations = await getHybridRecommendations(
        userId,
        sessionId,
        Math.ceil(limit * 3), // Lấy nhiều hơn vì sẽ filter ra posts đã hiển thị
        role
      );
      const aiRecommendationsLength = 30; const aiPostsLength = 5; //
      // Lọc chỉ lấy posts từ AI recommendations và chưa hiển thị trên feed
      const aiPosts = aiRecommendations
        .filter(item => item.type === 'post')
        .filter(post => !impressionPostIds.includes(post._id.toString()));

      aiPosts.forEach(post => {
        const postId = post._id.toString();
        aiPostIds.push(postId);
        aiRecommendedPostIds.push(postId);
      });

      // console.log(`🎯 [Popular Posts] AI gợi ý: ${aiPosts.length} bài viết mới từ AI (đã lọc ${aiRecommendations.filter(item => item.type === 'post').length - aiPosts.length} bài đã hiển thị)`);
      console.log(`🤖 AI Integration Status: AI đã được tích hợp thành công! Đề xuất ${aiRecommendationsLength} bài viết, hiển thị ${aiPostsLength} bài (đã lọc 3 bài đã có).`);
    } catch (aiError) {
      console.warn(`⚠️ [Popular Posts] Lỗi AI recommendations:`, aiError.message);
    }

    // 4. Lấy bài viết phổ biến (popular) dựa trên tương tác - loại bỏ posts đã hiển thị trên feed
    let popularPostIds = [];
    try {
      const popularInteractions = await UserInteraction.aggregate([
        {
          $match: {
            targetType: 'post',
            action: { $in: ['like', 'comment', 'share', 'view', 'save'] }, // 👈 Giữ nguyên 'view' cho AI học
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            targetId: { $nin: impressionPostIds } // ✅ Loại bỏ posts đã hiển thị trên feed
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
      console.log(`🔥 [Popular Posts] Popular posts: ${popularPostIds.length} bài viết phổ biến mới`);
    } catch (popularError) {
      console.warn(`⚠️ [Popular Posts] Lỗi khi lấy popular posts:`, popularError.message);
    }

    // 5. Tạo danh sách ưu tiên với tỷ lệ phân bố
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

    // 6. Nếu chưa đủ posts, lấy thêm từ tất cả posts (latest) - loại bỏ posts đã hiển thị trên feed
    const currentCount = prioritizedPostIds.length;
    const remainingSlots = Math.max(0, limit - currentCount);

    if (remainingSlots > 0) {
      console.log(`📊 [Popular Posts] Cần thêm ${remainingSlots} bài viết để đạt ${limit}`);

      // Tạo exclusion list gồm posts đã hiển thị trên feed và posts đã được chọn
      const allExcludedIds = [...impressionPostIds, ...Array.from(usedPostIds)];

      // Lấy posts mới nhất (không bao gồm những posts đã có và đã hiển thị)
      const latestPosts = await Post.find({
        privacy: 'public',
        _id: { $nin: allExcludedIds }
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

    // 7. Sắp xếp theo priority và pagination
    prioritizedPostIds.sort((a, b) => b.priority - a.priority);

    // Tính tổng số posts có thể có (loại bỏ posts đã hiển thị trên feed)
    const totalAvailablePosts = await Post.countDocuments({
      privacy: 'public',
      _id: { $nin: impressionPostIds }
    });
    const totalPages = Math.ceil(totalAvailablePosts / limit);

    // Lấy posts cho trang hiện tại
    const paginatedPostIds = prioritizedPostIds.slice(skip, skip + limit);

    // 8. Lấy thông tin chi tiết của posts
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

    // 9. Nếu vẫn không đủ posts cho trang này, lấy thêm từ database (loại bỏ posts đã hiển thị trên feed)
    if (posts.length < limit && page > 1) {
      console.log(`📊 [Popular Posts] Trang ${page} chỉ có ${posts.length}/${limit} posts, lấy thêm từ DB`);

      const additionalNeeded = limit - posts.length;
      const additionalSkip = Math.max(0, (page - 1) * limit - prioritizedPostIds.length);

      // Tạo exclusion list cho additional posts
      const allExcludedForAdditional = [...impressionPostIds, ...posts.map(p => p._id)];

      const additionalPosts = await populatePostDetails(
        Post.find({
          privacy: 'public',
          _id: { $nin: allExcludedForAdditional }
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

    // 10. ✅ Record feed impressions cho tất cả posts được trả về trên feed
    await recordFeedImpressions(posts, userId, sessionId, req);

    const hasMore = (skip + posts.length) < totalAvailablePosts;

    // Statistics
    const aiPostsInResult = posts.filter(p => p.isAIRecommended).length;
    const sourceStats = posts.reduce((acc, post) => {
      acc[post.recommendationSource] = (acc[post.recommendationSource] || 0) + 1;
      return acc;
    }, {});

    // console.log(`📊 [Popular Posts] Kết quả trang ${page}:`);
    // console.log(`   - Tổng số bài viết: ${posts.length}`);
    // console.log(`   - Phân bố nguồn:`, sourceStats);
    // console.log(`   - Bài viết AI gợi ý: ${aiPostsInResult} (${Math.round(aiPostsInResult / posts.length * 100)}%)`);
    // console.log(`   - Posts đã loại bỏ (đã hiển thị trên feed): ${impressionPostIds.length}`);

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
      },
      sessionStats: {
        feedImpressionCount: impressionPostIds.length,
        newPostsThisRequest: posts.length
      }
    });

  } catch (err) {
    console.error('❌ [Popular Posts] Lỗi khi lấy bài viết phổ biến:', err);
    return errorResponse(res, 'Lỗi khi lấy bài viết phổ biến', 500, err.message);
  }
};


///////////////////// FOR YOU_TC
// Lấy bài viết cho tab "Dành cho bạn" (For You) dựa trên UserInteraction
exports.getForYouPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.actor?._id?.toString();
  const sessionId = req.sessionId;
  const role = req.actor?.type || 'user';

  if (!userId && !sessionId) {
    return errorResponse(res, 'Cần userId hoặc sessionId để lấy gợi ý cá nhân hóa', 400);
  }

  try {
    console.log(`🔍 Getting For You posts for user: ${userId || sessionId}, role: ${role}, page: ${page}, limit: ${limit}`);
    console.log(`🤖 AI đang phân tích hành vi người dùng trong 3 ngày gần nhất...`);

    // Kiểm tra mongoose import
    const mongoose = require('mongoose');
    if (!mongoose.Types || !mongoose.Types.ObjectId) {
      console.error('❌ Mongoose not properly imported');
      return errorResponse(res, 'Server configuration error', 500);
    }

    // Lấy dữ liệu tương tác trong 3 ngày gần nhất
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const interactionFilter = {
      timestamp: { $gte: thirtyMinutesAgo },
      action: { $ne: 'feed_impression' }
    };

    // Thêm điều kiện cho user hoặc session
    if (userId) {
      interactionFilter['author._id'] = new mongoose.Types.ObjectId(userId);
    } else {
      interactionFilter.sessionId = sessionId;
    }

    // Lấy các tương tác, sắp xếp theo thời gian mới nhất và weight cao nhất
    const userInteractions = await UserInteraction.find(interactionFilter)
      .sort({ timestamp: -1, weight: -1 })
      .lean();

    console.log(`📊 Tìm thấy ${userInteractions.length} tương tác trong 3 ngày gần nhất`);

    if (userInteractions.length === 0) {
      console.log(`⚠️ Không có dữ liệu tương tác, chuyển sang fallback`);
      return await getFallbackPosts(res, page, limit);
    }

    // Phân tích từng loại tương tác
    let recommendedPostIds = new Set();
    let analysisLog = [];

    for (const interaction of userInteractions) {
      const { targetType, targetId, action, weight, targetDetails } = interaction;

      console.log(`🔍 Phân tích tương tác: ${targetType} - ${action} (weight: ${weight})`);

      try {
        let foundPosts = [];

        switch (targetType) {
          case 'post':
            foundPosts = await analyzePostInteraction(targetId);
            analysisLog.push(`📝 Post: Tìm thấy ${foundPosts.length} bài viết tương tự`);
            break;

          case 'shop':
            foundPosts = await analyzeShopInteraction(targetId);
            analysisLog.push(`🏪 Shop: Tìm thấy ${foundPosts.length} bài viết từ shop và danh mục liên quan`);
            break;

          case 'product':
            foundPosts = await analyzeProductInteraction(targetId);
            analysisLog.push(`📦 Product: Tìm thấy ${foundPosts.length} bài viết liên quan đến sản phẩm`);
            break;

          case 'user':
            foundPosts = await analyzeUserInteraction(targetId);
            analysisLog.push(`👤 User: Tìm thấy ${foundPosts.length} bài viết từ user`);
            break;

          case 'search':
            foundPosts = await analyzeSearchInteraction(targetDetails?.searchQuery);
            analysisLog.push(`🔍 Search: Tìm thấy ${foundPosts.length} bài viết liên quan đến "${targetDetails?.searchQuery}"`);
            break;

          default:
            console.log(`⚠️ Bỏ qua targetType không hỗ trợ: ${targetType}`);
        }

        // Thêm các bài viết tìm được vào danh sách gợi ý
        foundPosts.forEach(postId => {
          if (postId) {
            recommendedPostIds.add(postId.toString());
          }
        });

      } catch (error) {
        console.error(`❌ Lỗi khi phân tích ${targetType}:`, error.message);
      }
    }

    // In log phân tích
    analysisLog.forEach(log => console.log(log));

    const recommendedPostIdsArray = Array.from(recommendedPostIds);
    console.log(`🎯 AI đã gợi ý ${recommendedPostIdsArray.length} bài viết duy nhất`);

    if (recommendedPostIdsArray.length === 0) {
      console.log(`⚠️ Không tìm thấy bài viết phù hợp, chuyển sang fallback`);
      return await getFallbackPosts(res, page, limit);
    }

    // Lấy thông tin chi tiết các bài viết
    const foundPosts = await populatePostDetails(
      Post.find({
        _id: { $in: recommendedPostIdsArray.map(id => new mongoose.Types.ObjectId(id)) },
        privacy: 'public',
        isActive: { $ne: false }
      })
    );

    console.log(`📋 Lấy được ${foundPosts.length} bài viết từ database`);

    // Sắp xếp bài viết theo thứ tự ưu tiên từ tương tác
    const sortedPosts = sortPostsByInteractionPriority(foundPosts, userInteractions);

    // Áp dụng phân trang
    const total = sortedPosts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const posts = sortedPosts.slice(startIndex, endIndex);

    console.log(`📄 Trả về ${posts.length} bài viết cho trang ${page}`);
    console.log(`🤖 AI đã hoàn thành việc cá nhân hóa nội dung cho bạn!`);

    // Tính toán pagination
    const hasMore = (page * limit) < total;
    const totalPages = Math.ceil(total / limit);

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
        interactionsAnalyzed: userInteractions.length,
        uniquePostsFound: recommendedPostIdsArray.length,
        finalPostsReturned: posts.length,
        analysisLog: analysisLog,
        userId: userId || 'N/A',
        sessionId: sessionId || 'N/A',
        role: role
      };
    }

    return successResponse(res, 'Lấy bài viết dành cho bạn thành công', responseData);

  } catch (err) {
    console.error('❌ Lỗi tổng thể khi lấy bài viết dành cho bạn:', err);
    return errorResponse(res, 'Có lỗi xảy ra khi lấy bài viết. Chúng tôi đang khắc phục vấn đề này.', 500,
      process.env.NODE_ENV === 'development' ? err.message : undefined
    );
  }
};

// Phân tích tương tác với bài viết
async function analyzePostInteraction(postId) {
  if (!postId) return [];

  try {
    const post = await Post.findById(postId).select('categories hashtags').lean();
    if (!post) return [];

    console.log(`  📝 Phân tích bài viết có ${post.categories?.length || 0} categories và ${post.hashtags?.length || 0} hashtags`);

    const query = {
      privacy: 'public',
      isActive: { $ne: false },
      _id: { $ne: postId }, // Loại bỏ bài viết gốc
      $or: []
    };

    // Tìm bài viết có cùng categories
    if (post.categories && post.categories.length > 0) {
      query.$or.push({ categories: { $in: post.categories } });
    }

    // Tìm bài viết có cùng hashtags
    if (post.hashtags && post.hashtags.length > 0) {
      query.$or.push({ hashtags: { $in: post.hashtags } });
    }

    if (query.$or.length === 0) return [];

    const similarPosts = await Post.find(query).select('_id').lean();
    return similarPosts.map(p => p._id);

  } catch (error) {
    console.error('❌ Lỗi analyzePostInteraction:', error);
    return [];
  }
}

// Phân tích tương tác với shop
async function analyzeShopInteraction(shopId) {
  if (!shopId) return [];

  try {
    const shop = await Shop.findById(shopId)
      .select('productInfo.mainCategory productInfo.subCategories')
      .lean();

    if (!shop) return [];

    console.log(`  🏪 Phân tích shop với mainCategory và ${shop.productInfo?.subCategories?.length || 0} subCategories`);

    const query = {
      privacy: 'public',
      isActive: { $ne: false },
      $or: []
    };

    // Tìm bài viết từ chính shop này
    query.$or.push({
      'author.type': 'Shop',
      'author._id': shopId
    });

    // Tìm bài viết có categories trùng với mainCategory của shop
    if (shop.productInfo?.mainCategory) {
      query.$or.push({ categories: shop.productInfo.mainCategory });
    }

    // Tìm bài viết có categories trùng với subCategories của shop
    if (shop.productInfo?.subCategories && shop.productInfo.subCategories.length > 0) {
      query.$or.push({ categories: { $in: shop.productInfo.subCategories } });
    }

    if (query.$or.length === 0) return [];

    const relatedPosts = await Post.find(query).select('_id').lean();
    return relatedPosts.map(p => p._id);

  } catch (error) {
    console.error('❌ Lỗi analyzeShopInteraction:', error);
    return [];
  }
}

// Phân tích tương tác với sản phẩm
async function analyzeProductInteraction(productId) {
  if (!productId) return [];

  try {
    const product = await Product.findById(productId)
      .select('categories hashtags')
      .lean();

    if (!product) return [];

    console.log(`  📦 Phân tích sản phẩm có ${product.categories?.length || 0} categories và ${product.hashtags?.length || 0} hashtags`);

    const query = {
      privacy: 'public',
      isActive: { $ne: false },
      $or: []
    };

    // Tìm bài viết có cùng categories
    if (product.categories && product.categories.length > 0) {
      query.$or.push({ categories: { $in: product.categories } });
    }

    // Tìm bài viết có cùng hashtags
    if (product.hashtags && product.hashtags.length > 0) {
      query.$or.push({ hashtags: { $in: product.hashtags } });
    }

    // Tìm bài viết có chứa sản phẩm này
    query.$or.push({ productIds: productId });

    if (query.$or.length === 0) return [];

    const relatedPosts = await Post.find(query).select('_id').lean();
    return relatedPosts.map(p => p._id);

  } catch (error) {
    console.error('❌ Lỗi analyzeProductInteraction:', error);
    return [];
  }
}

// Phân tích tương tác với user
async function analyzeUserInteraction(userId) {
  if (!userId) return [];

  try {
    console.log(`  👤 Phân tích bài viết từ user`);

    const userPosts = await Post.find({
      'author.type': 'User',
      'author._id': userId,
      privacy: 'public',
      isActive: { $ne: false }
    }).select('_id').lean();

    return userPosts.map(p => p._id);

  } catch (error) {
    console.error('❌ Lỗi analyzeUserInteraction:', error);
    return [];
  }
}

// Phân tích tương tác tìm kiếm
async function analyzeSearchInteraction(searchQuery) {
  if (!searchQuery) return [];

  try {
    console.log(`  🔍 Phân tích từ khóa tìm kiếm: "${searchQuery}"`);

    const posts = await Post.find({
      privacy: 'public',
      isActive: { $ne: false },
      content: { $regex: searchQuery, $options: 'i' } // Tìm kiếm không phân biệt hoa thường
    }).select('_id').lean();

    return posts.map(p => p._id);

  } catch (error) {
    console.error('❌ Lỗi analyzeSearchInteraction:', error);
    return [];
  }
}

// Cải thiện thuật toán sắp xếp bài viết theo tương tác
function sortPostsByInteractionPriority(posts, interactions) {
  // Kiểm tra dữ liệu đầu vào
  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    console.warn('⚠️ sortPostsByInteractionPriority: No posts to sort');
    return [];
  }

  if (!interactions || !Array.isArray(interactions) || interactions.length === 0) {
    console.warn('⚠️ sortPostsByInteractionPriority: No interactions to analyze');
    return posts;
  }

  // Map để lưu điểm số cho từng bài viết
  const postScores = new Map();

  // Map để track bài viết được tìm thấy từ tương tác nào
  const postToInteractionMap = new Map();

  // Khởi tạo điểm số ban đầu
  posts.forEach(post => {
    if (!post || !post._id) {
      console.warn('⚠️ sortPostsByInteractionPriority: Invalid post structure', post);
      return;
    }

    const postId = post._id.toString();
    postScores.set(postId, 0);
    postToInteractionMap.set(postId, []);
  });

  // Duyệt qua từng tương tác và chỉ cộng điểm cho bài viết liên quan
  interactions.forEach((interaction, index) => {
    if (!interaction) {
      console.warn('⚠️ sortPostsByInteractionPriority: Invalid interaction at index', index);
      return;
    }

    const { targetType, targetId, action, weight, timestamp } = interaction;

    try {
      // Tính điểm dựa trên:
      // - Weight của action (mua hàng > like > view)
      // - Thứ tự thời gian (mới hơn = điểm cao hơn)
      // - Loại tương tác
      const timeScore = interactions.length - index; // Tương tác đầu tiên có điểm cao nhất
      const actionMultiplier = getActionMultiplier(action);
      const totalScore = (weight || 1) * actionMultiplier + (timeScore * 0.5);

      // Tìm bài viết liên quan đến tương tác này
      const relatedPosts = findRelatedPosts(posts, interaction);

      relatedPosts.forEach(post => {
        if (!post || !post._id) return;

        const postId = post._id.toString();

        // Cộng điểm cho bài viết liên quan
        const currentScore = postScores.get(postId) || 0;
        postScores.set(postId, currentScore + totalScore);

        // Track tương tác nào tạo ra bài viết này
        const interactionList = postToInteractionMap.get(postId) || [];
        interactionList.push({
          interactionIndex: index,
          score: totalScore,
          targetType,
          action
        });
        postToInteractionMap.set(postId, interactionList);
      });

    } catch (error) {
      console.error(`❌ sortPostsByInteractionPriority: Error processing interaction ${index}:`, error.message);
    }
  });

  // Sắp xếp bài viết theo điểm số
  return posts.sort((a, b) => {
    try {
      if (!a || !a._id || !b || !b._id) {
        console.warn('⚠️ sortPostsByInteractionPriority: Invalid post in sorting');
        return 0;
      }

      const scoreA = postScores.get(a._id.toString()) || 0;
      const scoreB = postScores.get(b._id.toString()) || 0;

      if (scoreB !== scoreA) {
        return scoreB - scoreA; // Điểm cao hơn = xếp trước
      }

      // Nếu điểm bằng nhau, ưu tiên bài viết từ tương tác mới hơn
      const interactionsA = postToInteractionMap.get(a._id.toString()) || [];
      const interactionsB = postToInteractionMap.get(b._id.toString()) || [];

      if (interactionsA.length > 0 && interactionsB.length > 0) {
        const minInteractionIndexA = Math.min(...interactionsA.map(i => i.interactionIndex));
        const minInteractionIndexB = Math.min(...interactionsB.map(i => i.interactionIndex));

        if (minInteractionIndexA !== minInteractionIndexB) {
          return minInteractionIndexA - minInteractionIndexB; // Index nhỏ hơn = tương tác mới hơn
        }
      }

      // Cuối cùng sắp xếp theo thời gian tạo bài viết
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;

    } catch (error) {
      console.error('❌ sortPostsByInteractionPriority: Error in sorting comparison:', error.message);
      return 0;
    }
  });
}

// Helper function: Tìm bài viết liên quan đến tương tác cụ thể
function findRelatedPosts(allPosts, interaction) {
  const { targetType, targetId, targetDetails } = interaction;
  const relatedPosts = [];

  // Kiểm tra dữ liệu đầu vào
  if (!allPosts || !Array.isArray(allPosts) || !interaction) {
    console.warn('⚠️ findRelatedPosts: Invalid input data');
    return relatedPosts;
  }

  allPosts.forEach(post => {
    // Kiểm tra post có tồn tại và có cấu trúc hợp lệ
    if (!post || !post._id) {
      console.warn('⚠️ findRelatedPosts: Invalid post structure', post);
      return;
    }

    let isRelated = false;

    try {
      switch (targetType) {
        case 'post':
          // Bài viết có cùng categories hoặc hashtags
          if (targetDetails?.hashtags?.length > 0) {
            const commonHashtags = post.hashtags?.filter(tag =>
              targetDetails.hashtags.includes(tag)
            ) || [];
            if (commonHashtags.length > 0) isRelated = true;
          }
          if (targetDetails?.category && post.categories?.includes(targetDetails.category)) {
            isRelated = true;
          }
          break;

        case 'product':
          // Bài viết có chứa sản phẩm hoặc cùng categories
          if (targetId && post.productIds?.includes(targetId)) {
            isRelated = true;
          } else if (targetDetails?.hashtags?.length > 0) {
            const commonHashtags = post.hashtags?.filter(tag =>
              targetDetails.hashtags.includes(tag)
            ) || [];
            if (commonHashtags.length > 0) isRelated = true;
          }
          break;

        case 'shop':
          // Bài viết từ shop này hoặc cùng ngành
          if (targetId &&
            post.author?.type === 'Shop' &&
            post.author._id &&
            post.author._id.toString() === targetId.toString()) {
            isRelated = true;
          } else if (targetDetails?.subCategories?.length > 0) {
            const commonCategories = post.categories?.filter(cat =>
              targetDetails.subCategories.includes(cat?.toString())
            ) || [];
            if (commonCategories.length > 0) isRelated = true;
          }
          break;

        case 'user':
          // Bài viết từ user này
          if (targetId &&
            post.author?.type === 'User' &&
            post.author._id &&
            post.author._id.toString() === targetId.toString()) {
            isRelated = true;
          }
          break;

        case 'search':
          // Bài viết có nội dung liên quan đến từ khóa tìm kiếm
          const searchQuery = targetDetails?.searchQuery?.toLowerCase();
          if (searchQuery && post.content?.toLowerCase().includes(searchQuery)) {
            isRelated = true;
          }
          break;

        default:
          console.warn(`⚠️ findRelatedPosts: Unsupported targetType: ${targetType}`);
      }

      if (isRelated) {
        relatedPosts.push(post);
      }

    } catch (error) {
      console.error(`❌ findRelatedPosts: Error processing post ${post._id}:`, error.message);
      console.error('Post data:', JSON.stringify(post, null, 2));
      console.error('Interaction data:', JSON.stringify(interaction, null, 2));
    }
  });

  return relatedPosts;
}

// Helper function: Hệ số nhân cho từng loại action
function getActionMultiplier(action) {
  const multipliers = {
    'purchase': 3.0,      // Mua hàng = quan tâm cao nhất
    'add_to_cart': 2.5,   // Thêm giỏ hàng
    'save': 2.0,          // Lưu bài viết
    'share': 2.0,         // Chia sẻ
    'comment': 1.8,       // Bình luận
    'like': 1.5,          // Thích
    'follow': 2.2,        // Theo dõi
    'view': 1.0,          // Xem
    'click': 1.2,         // Click
    'search': 1.3,        // Tìm kiếm
    'feed_impression': 0.5 // Hiển thị trong feed
  };

  return multipliers[action] || 1.0;
}

// Fallback khi không có dữ liệu tương tác
async function getFallbackPosts(res, page, limit) {
  try {
    console.log('🔄 Sử dụng fallback: bài viết phổ biến gần đây');

    const fallbackQuery = Post.find({
      privacy: 'public',
      isActive: { $ne: false },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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

    const fallbackTotal = await Post.countDocuments({
      privacy: 'public',
      isActive: { $ne: false },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    console.log(`📋 Fallback: trả về ${fallbackPosts.length} bài viết phổ biến`);

    const hasMore = (page * limit) < fallbackTotal;
    const totalPages = Math.ceil(fallbackTotal / limit);

    return successResponse(res, 'Lấy bài viết dành cho bạn thành công', {
      posts: fallbackPosts,
      pagination: {
        currentPage: page,
        limit: limit,
        totalPages: totalPages,
        totalResults: fallbackTotal,
        hasMore: hasMore
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

  } catch (error) {
    console.error('❌ Lỗi fallback:', error);
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

