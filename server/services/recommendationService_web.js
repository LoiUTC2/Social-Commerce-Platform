// const tf = require('@tensorflow/tfjs-node');
const tf = require('@tensorflow/tfjs');
const mongoose = require('mongoose');
const UserInteraction = require('../models/UserInteraction');
const Product = require('../models/Product');
const Post = require('../models/Post');
const redisClient = require('../config/redisClient');
const natural = require('natural');
const TfIdf = natural.TfIdf;

// Lưu mô hình vào Redis
const MODEL_KEY = 'mf_model';

// Hàm helper để lưu vào Redis với error handling
async function safeRedisSet(key, value, expireSeconds = 7 * 24 * 3600) {
    try {
        if (redisClient.isReady()) {
            await redisClient.setex(key, expireSeconds, JSON.stringify(value));
            return true;
        } else {
            console.warn('⚠️ Redis not ready, skipping cache');
            return false;
        }
    } catch (error) {
        console.warn('⚠️ Redis set failed:', error.message);
        return false;
    }
}

// Hàm helper để lấy từ Redis với error handling
async function safeRedisGet(key) {
    try {
        if (redisClient.isReady()) {
            const data = await redisClient.get(key);
            return data ? JSON.parse(data) : null;
        } else {
            console.warn('⚠️ Redis not ready, skipping cache read');
            return null;
        }
    } catch (error) {
        console.warn('⚠️ Redis get failed:', error.message);
        return null;
    }
}

// Hàm kiểm tra kết nối database trước khi thực hiện operations
async function checkDatabaseConnection() {
    if (mongoose.connection.readyState !== 1) {
        console.log('⚠️ Database not connected, waiting...');

        // Đợi tối đa 30 giây để kết nối
        for (let i = 0; i < 30; i++) {
            if (mongoose.connection.readyState === 1) {
                console.log('✅ Database connected');
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        throw new Error('Database connection timeout');
    }
    return true;
}

// Hàm thực hiện với retry logic được cải thiện
async function executeWithRetry(operation, maxRetries = 3, retryDelay = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Kiểm tra kết nối trước khi thực hiện
            await checkDatabaseConnection();
            return await operation();
        } catch (error) {
            console.log(`❌ Attempt ${attempt}/${maxRetries} failed:`, error.message);

            if (attempt === maxRetries) {
                throw error;
            }

            // Tăng thời gian chờ theo exponential backoff
            const delay = retryDelay * Math.pow(2, attempt - 1);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Hàm chuẩn bị ma trận user-item với optimization
async function prepareUserItemMatrix() {
    try {
        return await executeWithRetry(async () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            console.log('📊 Đang tải dữ liệu tương tác...');

            // Tối ưu query với pagination và streaming
            const batchSize = 1000;
            let skip = 0;
            let allInteractions = [];

            while (true) {
                const batch = await UserInteraction.find({
                    timestamp: { $gte: thirtyDaysAgo },
                    action: { $in: ['view', 'like', 'purchase', 'add_to_cart', 'search'] }
                })
                    .select('author sessionId targetId weight action timestamp')
                    .sort({ timestamp: -1 })
                    .skip(skip)
                    .limit(batchSize)
                    .lean()
                    .maxTimeMS(60000)
                    .exec();

                if (batch.length === 0) break;

                allInteractions = allInteractions.concat(batch);
                skip += batchSize;

                console.log(`📥 Loaded ${allInteractions.length} interactions...`);

                // Giới hạn tổng số để tránh memory issues
                if (allInteractions.length >= 50000) {
                    console.log('⚠️ Reached maximum interaction limit (50,000)');
                    break;
                }
            }

            if (!allInteractions.length) {
                console.warn('⚠️ Không có tương tác nào trong 30 ngày qua');
                return { matrix: [], users: [], items: [] };
            }

            console.log(`📊 Tổng cộng đã tải ${allInteractions.length} tương tác`);

            // Tạo danh sách user và item duy nhất
            const users = [...new Set(allInteractions.map(i => i.author?._id?.toString() || i.sessionId))];
            const items = [...new Set(allInteractions.map(i => i.targetId?.toString()))];

            console.log(`👥 Số users: ${users.length}, 📦 Số items: ${items.length}`);

            // Tạo ma trận user-item với optimization
            const matrix = Array(users.length).fill().map(() => Array(items.length).fill(0));

            // Sử dụng Map để tối ưu việc tìm kiếm index
            const userIndexMap = new Map();
            const itemIndexMap = new Map();

            users.forEach((user, idx) => userIndexMap.set(user, idx));
            items.forEach((item, idx) => itemIndexMap.set(item, idx));

            allInteractions.forEach(interaction => {
                const userIdx = userIndexMap.get(interaction.author?._id?.toString() || interaction.sessionId);
                const itemIdx = itemIndexMap.get(interaction.targetId?.toString());

                if (userIdx !== undefined && itemIdx !== undefined) {
                    matrix[userIdx][itemIdx] = Math.max(matrix[userIdx][itemIdx], interaction.weight || 1);
                }
            });

            return { matrix, users, items };
        });
    } catch (error) {
        console.error('❌ Lỗi khi chuẩn bị ma trận user-item:', error);
        throw error;
    }
}

// Hàm huấn luyện mô hình Matrix Factorization được cải thiện
async function trainMatrixFactorization() {
    try {
        console.log('🚀 Bắt đầu huấn luyện mô hình Matrix Factorization...');

        const { matrix, users, items } = await prepareUserItemMatrix();

        if (!matrix.length || !users.length || !items.length) {
            console.log('⚠️ Không đủ dữ liệu để huấn luyện mô hình');
            return null;
        }

        const numUsers = users.length;
        const numItems = items.length;
        const numFactors = Math.min(10, Math.min(numUsers, numItems));

        console.log(`📊 Ma trận: ${numUsers}x${numItems}, Factors: ${numFactors}`);

        // Tạo embedding layers với khởi tạo nhỏ hơn
        const userEmbedding = tf.variable(tf.randomNormal([numUsers, numFactors], 0, 0.01));
        const itemEmbedding = tf.variable(tf.randomNormal([numItems, numFactors], 0, 0.01));

        // Tạo danh sách các điểm dữ liệu không zero
        const trainingData = [];
        for (let i = 0; i < numUsers; i++) {
            for (let j = 0; j < numItems; j++) {
                if (matrix[i][j] > 0) {
                    trainingData.push({ userIdx: i, itemIdx: j, rating: matrix[i][j] });
                }
            }
        }

        console.log(`📈 Số điểm dữ liệu huấn luyện: ${trainingData.length}`);

        if (trainingData.length === 0) {
            console.log('⚠️ Không có dữ liệu huấn luyện');
            userEmbedding.dispose();
            itemEmbedding.dispose();
            return null;
        }

        // Optimizer với learning rate thích hợp
        const optimizer = tf.train.adam(0.01);

        // Huấn luyện với batch processing
        const epochs = 20;
        const batchSize = Math.min(500, Math.floor(trainingData.length / 5));

        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;
            let batchCount = 0;

            // Shuffle data
            const shuffledData = [...trainingData].sort(() => Math.random() - 0.5);

            // Process in batches
            for (let i = 0; i < shuffledData.length; i += batchSize) {
                const batch = shuffledData.slice(i, i + batchSize);

                const userIndices = batch.map(d => d.userIdx);
                const itemIndices = batch.map(d => d.itemIdx);
                const ratings = batch.map(d => d.rating);

                const loss = await optimizer.minimize(() => {
                    const userVecs = tf.gather(userEmbedding, userIndices);
                    const itemVecs = tf.gather(itemEmbedding, itemIndices);

                    const predictions = tf.sum(tf.mul(userVecs, itemVecs), 1);
                    const labels = tf.tensor1d(ratings);

                    const mse = tf.losses.meanSquaredError(labels, predictions);

                    // Add L2 regularization
                    const userRegularization = tf.mul(0.001, tf.sum(tf.square(userVecs)));
                    const itemRegularization = tf.mul(0.001, tf.sum(tf.square(itemVecs)));

                    const totalLoss = tf.add(mse, tf.add(userRegularization, itemRegularization));

                    // Cleanup intermediate tensors
                    userVecs.dispose();
                    itemVecs.dispose();
                    predictions.dispose();
                    labels.dispose();
                    mse.dispose();
                    userRegularization.dispose();
                    itemRegularization.dispose();

                    return totalLoss;
                });

                totalLoss += await loss.data();
                loss.dispose();
                batchCount++;
            }

            if (epoch % 5 === 0) {
                console.log(`📊 Epoch ${epoch + 1}/${epochs}, Average Loss: ${(totalLoss / batchCount).toFixed(6)}`);
            }
        }

        // Lưu mô hình vào Redis
        const modelData = {
            userWeights: Array.from(await userEmbedding.data()),
            itemWeights: Array.from(await itemEmbedding.data()),
            userShape: userEmbedding.shape,
            itemShape: itemEmbedding.shape,
            users,
            items,
            timestamp: Date.now()
        };

        const saved = await safeRedisSet(MODEL_KEY, modelData, 7 * 24 * 3600);
        if (saved) {
            console.log('✅ Mô hình đã được lưu vào Redis');
        } else {
            console.log('⚠️ Không thể lưu mô hình vào Redis, chỉ lưu trong memory');
        }

        // Cleanup tensors
        userEmbedding.dispose();
        itemEmbedding.dispose();

        return { users, items };
    } catch (error) {
        console.error('❌ Lỗi khi huấn luyện mô hình:', error);
        throw error;
    }
}

// Hàm chuẩn bị dữ liệu TF-IDF với optimization
async function prepareTfIdfMatrix() {
    try {
        return await executeWithRetry(async () => {
            console.log('📊 Đang tải dữ liệu sản phẩm và bài viết...');

            // Tải dữ liệu theo batch để tránh timeout
            const productBatchSize = 1000;
            const postBatchSize = 1000;

            let allProducts = [];
            let allPosts = [];

            // Tải products theo batch
            let productSkip = 0;
            while (true) {
                const productBatch = await Product.find({ isActive: true })
                    .select('name description hashtags')
                    .skip(productSkip)
                    .limit(productBatchSize)
                    .lean()
                    .maxTimeMS(60000)
                    .exec();

                if (productBatch.length === 0) break;

                allProducts = allProducts.concat(productBatch);
                productSkip += productBatchSize;

                console.log(`📦 Loaded ${allProducts.length} products...`);

                if (allProducts.length >= 10000) {
                    console.log('⚠️ Reached maximum product limit (10,000)');
                    break;
                }
            }

            // Tải posts theo batch
            let postSkip = 0;
            while (true) {
                const postBatch = await Post.find({ privacy: 'public' })
                    .select('content hashtags')
                    .skip(postSkip)
                    .limit(postBatchSize)
                    .lean()
                    .maxTimeMS(60000)
                    .exec();

                if (postBatch.length === 0) break;

                allPosts = allPosts.concat(postBatch);
                postSkip += postBatchSize;

                console.log(`📝 Loaded ${allPosts.length} posts...`);

                if (allPosts.length >= 10000) {
                    console.log('⚠️ Reached maximum post limit (10,000)');
                    break;
                }
            }

            console.log(`📊 Tổng cộng: ${allProducts.length} sản phẩm và ${allPosts.length} bài viết`);

            const tfidf = new TfIdf();
            const itemIds = [];

            // Thêm nội dung sản phẩm
            allProducts.forEach(product => {
                const content = `${product.name || ''} ${product.description || ''} ${(product.hashtags || []).join(' ')}`
                    .replace(/[^\w\s]/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (content.length > 3) {
                    tfidf.addDocument(content);
                    itemIds.push(product._id.toString());
                }
            });

            // Thêm nội dung bài viết
            allPosts.forEach(post => {
                const content = `${post.content || ''} ${(post.hashtags || []).join(' ')}`
                    .replace(/[^\w\s]/gi, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();

                if (content.length > 3) {
                    tfidf.addDocument(content);
                    itemIds.push(post._id.toString());
                }
            });

            // Lưu ma trận TF-IDF vào Redis
            const tfidfData = {
                documents: tfidf.documents,
                itemIds,
                timestamp: Date.now()
            };

            const saved = await safeRedisSet('tfidf_matrix', tfidfData, 7 * 24 * 3600);
            if (saved) {
                console.log(`✅ Ma trận TF-IDF đã được lưu vào Redis (${itemIds.length} items)`);
            } else {
                console.log(`⚠️ Không thể lưu TF-IDF vào Redis, chỉ lưu trong memory (${itemIds.length} items)`);
            }

            return { tfidf, itemIds };
        });
    } catch (error) {
        console.error('❌ Lỗi khi chuẩn bị TF-IDF:', error);
        throw error;
    }
}

// Các hàm khác giữ nguyên như cũ...
function cosineSimilarity(vecA, vecB) {
    const keysA = Object.keys(vecA);
    const keysB = Object.keys(vecB);
    const allKeys = [...new Set([...keysA, ...keysB])];

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    allKeys.forEach(key => {
        const valA = vecA[key] || 0;
        const valB = vecB[key] || 0;
        dotProduct += valA * valB;
        magnitudeA += valA * valA;
        magnitudeB += valB * valB;
    });

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

async function getCollaborativeRecommendations(userId, sessionId, limit = 10) {
    try {
        const modelData = await safeRedisGet(MODEL_KEY);
        if (!modelData) {
            console.log('⚠️ Chưa có mô hình được huấn luyện');
            return [];
        }

        const { userWeights, itemWeights, userShape, itemShape, users, items } = modelData;

        const userIdx = users.indexOf(userId || sessionId);
        if (userIdx === -1) {
            console.log('⚠️ Không tìm thấy người dùng trong mô hình');
            return [];
        }

        // Tái tạo embedding từ weights
        const userEmbedding = tf.tensor2d(userWeights, userShape);
        const itemEmbedding = tf.tensor2d(itemWeights, itemShape);

        const userVec = userEmbedding.slice([userIdx, 0], [1, userShape[1]]);
        const scores = tf.matMul(userVec, itemEmbedding, false, true).squeeze();

        // Lấy top k items
        const scoresArray = await scores.data();
        const itemScores = items.map((itemId, idx) => ({
            itemId,
            score: scoresArray[idx]
        }));

        // Sắp xếp và lấy top
        const topItems = itemScores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.itemId);

        // Cleanup tensors
        userEmbedding.dispose();
        itemEmbedding.dispose();
        userVec.dispose();
        scores.dispose();

        return topItems;
    } catch (error) {
        console.error('❌ Lỗi khi dự đoán collaborative filtering:', error);
        return [];
    }
}

async function getContentBasedRecommendations(itemId, limit = 10) {
    try {
        let cached = await safeRedisGet('tfidf_matrix');
        if (!cached) {
            console.log('⚠️ Chưa có ma trận TF-IDF, đang tạo...');
            await prepareTfIdfMatrix();
            cached = await safeRedisGet('tfidf_matrix');
        }

        if (!cached) {
            console.log('⚠️ Không thể tạo ma trận TF-IDF');
            return [];
        }

        const { documents, itemIds } = cached;
        const itemIdx = itemIds.indexOf(itemId);

        if (itemIdx === -1) {
            console.log('⚠️ Không tìm thấy item trong ma trận TF-IDF');
            return [];
        }

        const similarities = documents.map((doc, idx) => ({
            itemId: itemIds[idx],
            similarity: idx === itemIdx ? 0 : cosineSimilarity(documents[itemIdx], doc)
        }));

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(s => s.itemId);
    } catch (error) {
        console.error('❌ Lỗi khi gợi ý content-based:', error);
        return [];
    }
}

async function getHybridRecommendations(userId, sessionId, limit = 10) {
    try {
        // Lấy gợi ý collaborative
        const collaborativeRecs = await getCollaborativeRecommendations(userId, sessionId, limit * 2);
        const contentRecs = [];

        // Lấy các sản phẩm/bài viết người dùng đã tương tác
        const interactions = await executeWithRetry(async () => {
            return await UserInteraction.find({
                $or: [
                    userId ? { 'author._id': userId } : {},
                    sessionId ? { sessionId } : {}
                ].filter(obj => Object.keys(obj).length > 0),
                action: { $in: ['view', 'like', 'purchase', 'add_to_cart'] }
            })
                .select('targetId')
                .sort({ timestamp: -1 })
                .limit(5)
                .lean()
                .maxTimeMS(30000);
        });

        // Gợi ý dựa trên nội dung của các mục đã tương tác
        for (const interaction of interactions) {
            const recs = await getContentBasedRecommendations(interaction.targetId.toString(), limit);
            contentRecs.push(...recs);
        }

        // Kết hợp điểm số
        const scoreMap = new Map();

        // Collaborative filtering weight: 0.7
        collaborativeRecs.forEach((itemId, idx) => {
            const score = (1 - idx / collaborativeRecs.length) * 0.7;
            scoreMap.set(itemId, (scoreMap.get(itemId) || 0) + score);
        });

        // Content-based weight: 0.3
        contentRecs.forEach((itemId, idx) => {
            const score = (1 - idx / contentRecs.length) * 0.3;
            scoreMap.set(itemId, (scoreMap.get(itemId) || 0) + score);
        });

        // Sắp xếp và lấy top
        const recommendations = [...scoreMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([itemId]) => itemId);

        // Lấy thông tin chi tiết với error handling
        let products = [];
        let posts = [];

        try {
            [products, posts] = await Promise.all([
                Product.find({ _id: { $in: recommendations } }).lean().maxTimeMS(30000),
                Post.find({ _id: { $in: recommendations } }).lean().maxTimeMS(30000)
            ]);
        } catch (error) {
            console.error('⚠️ Lỗi khi lấy thông tin chi tiết:', error);
            // Fallback: trả về random items
            products = await Product.find({ isActive: true }).limit(limit).lean().maxTimeMS(30000);
        }

        return [...products, ...posts];
    } catch (error) {
        console.error('❌ Lỗi khi tạo hybrid recommendations:', error);

        // Fallback mechanism
        try {
            console.log('🔄 Đang thử fallback với sản phẩm phổ biến...');
            const popularProducts = await Product.find({ isActive: true })
                .sort({ viewCount: -1, createdAt: -1 })
                .limit(limit)
                .lean()
                .maxTimeMS(30000);
            return popularProducts;
        } catch (fallbackError) {
            console.error('❌ Fallback cũng thất bại:', fallbackError);
            return [];
        }
    }
}

// API routes
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { userId, sessionId, limit = '10' } = req.query;

        if (!userId && !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Cần có userId hoặc sessionId'
            });
        }

        const recommendations = await getHybridRecommendations(userId, sessionId, parseInt(limit));
        res.json({
            success: true,
            data: recommendations,
            count: recommendations.length
        });
    } catch (err) {
        console.error('❌ API Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

router.post('/train', async (req, res) => {
    try {
        console.log('🚀 Bắt đầu huấn luyện mô hình theo yêu cầu...');
        await trainMatrixFactorization();
        res.json({ success: true, message: 'Mô hình đã được huấn luyện thành công' });
    } catch (err) {
        console.error('❌ Training Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi huấn luyện mô hình',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = {
    router,
    trainMatrixFactorization,
    prepareTfIdfMatrix,
    getHybridRecommendations,
    getCollaborativeRecommendations,
    getContentBasedRecommendations
};