const Hashtag = require('../models/Hashtags');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');
const { getHybridRecommendations } = require('../services/recommendationService');

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

// Helper function để populate post (tránh lặp code), giúp tái sử dụng logic populate cho các bài viết
const populatePostDetails = (query) => {
  return query
    .populate({
      path: 'author._id',
      select: 'fullName avatar name slug', // fullName nếu là User, name nếu là Shop
    })
    .populate({
      path: 'sharedPost',
      select: 'content images videos privacy createdAt author productIds',
      populate: [
        {
          path: 'author._id',
          select: 'fullName avatar name slug',
        },
        {
          path: 'productIds',
          select: 'name price discount images videos stock soldCount slug seller',
          populate: {
            path: 'seller',
            select: 'name slug avatar',
            model: 'Shop',
          },
        },
      ],
    })
    .populate({
      path: 'productIds',
      select: 'name price discount images videos stock soldCount slug seller',
      populate: {
        path: 'seller',
        select: 'name slug avatar',
        model: 'Shop'
      }
    });
};

exports.createPost = async (req, res) => {
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

    const newPost = new Post({
      author: {
        type: req.actor.type === 'shop' ? 'Shop' : 'User',
        _id: req.actor._id
      },
      content,
      images,
      videos,
      productIds,
      hashtags,
      mainCategory,
      location,
    });

    const savedPost = await newPost.save();

    // Cập nhật trường posts trong Product nếu có productIds
    if (productIds && productIds.length > 0) {
      await Product.updateMany(
        {
          _id: { $in: productIds },
          allowPosts: true // Chỉ thêm vào sản phẩm cho phép đăng bài
        },
        { $addToSet: { posts: savedPost._id } }
      );
    }

    await handleHashtagsUpdate(req.actor.type === 'shop' ? 'Shop' : 'User', newPost._id, req.body.hashtags, req.actor._id);

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

// Lấy bài viết cho tab "Phổ biến" (Popular)
exports.getPopularPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const userId = req.actor?.id; // Để lấy bài viết từ người dùng/shop đang theo dõi

  try {
    let uniquePostIds = new Set(); // Sử dụng Set để tự động loại bỏ trùng lặp

    // 1. Lấy bài viết từ người dùng/shop mà người dùng đang theo dõi (Following)
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
          .limit(Math.ceil(limit / 2)) // Lấy khoảng một nửa từ người theo dõi
          .select('_id')
          .lean();
        followingPosts.forEach(p => uniquePostIds.add(p._id.toString()));
      }
    }

    // 2. Lấy bài viết phổ biến nhất (nhiều tương tác nhất trong 30 ngày qua)
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
      { $sort: { interactionCount: -1 } },
      { $limit: limit } // Lấy đủ số lượng để trộn
    ]);
    popularInteractions.forEach(interaction => uniquePostIds.add(interaction._id.toString()));

    // 3. Lấy bài viết mới nhất (để bổ sung nếu chưa đủ)
    const latestPosts = await Post.find({ privacy: 'public', _id: { $nin: Array.from(uniquePostIds) } }) // Loại bỏ các post đã có
      .sort({ createdAt: -1 })
      .limit(limit) // Lấy thêm nếu cần để đạt đủ limit
      .select('_id')
      .lean();
    latestPosts.forEach(p => uniquePostIds.add(p._id.toString()));

    // COMMENT: Có thể thêm gợi ý AI vào đây nếu muốn "Phổ biến" cũng có một phần AI
    // Ví dụ:
    // if (userId) {
    //     const aiRecommendedPosts = await getHybridRecommendations(userId, null, limit / 4, role)
    //         .then(recs => recs.filter(r => r.type === 'post').map(r => r._id.toString()));
    //     aiRecommendedPosts.forEach(id => uniquePostIds.add(id));
    // }


    const finalPostIds = Array.from(uniquePostIds);
    const total = finalPostIds.length;
    const paginatedPostIds = finalPostIds.slice(skip, skip + limit);

    let posts = [];
    if (paginatedPostIds.length > 0) {
      // Lấy thông tin chi tiết của các bài viết
      // Sắp xếp lại theo thứ tự của uniquePostIds để giữ tính "ưu tiên"
      const foundPosts = await populatePostDetails(
        Post.find({ _id: { $in: paginatedPostIds } })
      );

      // Sắp xếp lại theo thứ tự trong paginatedPostIds
      posts = paginatedPostIds
        .map(id => foundPosts.find(post => post._id.toString() === id))
        .filter(Boolean);
    }

    const hasMore = (skip + posts.length) < total;
    const totalPages = Math.ceil(total / limit);

    return successResponse(res, 'Lấy bài viết phổ biến thành công', {
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
    console.error('Lỗi khi lấy bài viết phổ biến:', err);
    return errorResponse(res, 'Lỗi khi lấy bài viết phổ biến', 500, err.message);
  }
};

// lấy bài viết cho tab "Dành cho bạn" (For You)
exports.getForYouPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.actor?.id; // Lấy userId từ token hoặc sessionId từ middleware setActor
  const sessionId = req.actor?.sessionId;
  const role = req.actor?.type || 'user'; // Vai trò của người dùng

  if (!userId && !sessionId) {
    return errorResponse(res, 'Cần userId hoặc sessionId để lấy gợi ý cá nhân hóa', 400);
  }

  try {
    // Sử dụng hàm getHybridRecommendations từ recommendationService
    // Lấy nhiều hơn để đảm bảo đủ bài viết sau khi lọc và phân trang
    const recommendedItems = await getHybridRecommendations(userId, sessionId, limit * (page + 2), role);

    // Lọc ra chỉ các bài viết và lấy ID
    const recommendedPostIds = recommendedItems
      .filter(item => item.type === 'post')
      .map(item => item._id.toString()); // Chuyển về string để dùng trong $in

    let posts = [];
    let total = 0;

    if (recommendedPostIds.length > 0) {
      // Lấy thông tin chi tiết của các bài viết được gợi ý
      // COMMENT: Cần đảm bảo thứ tự của các bài viết theo thứ tự recommendation
      const foundPosts = await populatePostDetails(
        Post.find({ _id: { $in: recommendedPostIds } })
      );

      // Sắp xếp lại theo thứ tự gợi ý từ AI
      const sortedPosts = recommendedPostIds
        .map(id => foundPosts.find(post => post._id.toString() === id))
        .filter(Boolean); // Lọc bỏ các bài viết không tìm thấy

      total = sortedPosts.length;
      // Áp dụng phân trang
      posts = sortedPosts.slice((page - 1) * limit, page * limit);

    } else {
      // Nếu không có gợi ý bài viết từ AI, fallback về bài viết mới nhất hoặc phổ biến
      console.log('⚠️ Không có gợi ý bài viết từ AI, fallback về bài viết mới nhất.');
      // COMMENT: Bạn có thể chọn cách fallback phù hợp.
      // Ví dụ: lấy N bài viết mới nhất hoặc gọi hàm getPopularPosts.
      // Hiện tại tôi sẽ trả về rỗng và thông báo message.
      // Để gọi getPopularPosts, bạn cần thiết kế lại hàm đó để nó trả về dữ liệu thay vì gửi response trực tiếp.
      // Để đơn giản, ở đây sẽ trả về rỗng nếu không có gợi ý.
      return successResponse(res, 'Không có bài viết được gợi ý cho bạn. Hãy tương tác nhiều hơn để nhận gợi ý tốt hơn.', {
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

    const hasMore = (page * limit) < total;
    const totalPages = Math.ceil(total / limit);

    return successResponse(res, 'Lấy bài viết dành cho bạn thành công', {
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
    console.error('Lỗi khi lấy bài viết dành cho bạn:', err);
    return errorResponse(res, 'Lỗi khi lấy bài viết dành cho bạn', 500, err.message);
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
