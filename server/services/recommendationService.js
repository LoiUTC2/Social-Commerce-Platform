const tf = require('@tensorflow/tfjs-node');
const UserInteraction = require('../models/UserInteraction');
const Product = require('../models/Product');
const Post = require('../models/Post');
const User = require('../models/User');
const Shop = require('../models/Shop');
const redisClient = require('../config/redisClient');
const natural = require('natural');
const TfIdf = natural.TfIdf;
const fs = require('fs').promises;
const path = require('path');

// Cache để lưu model trong memory
let modelCache = null;

// Thêm hàm chuẩn bị ma trận tất cả loại entity (product, post, user, shop) với trọng số phù hợp theo vai trò
async function prepareUserEntityMatrix() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const interactions = await UserInteraction.find({
        timestamp: { $gte: thirtyDaysAgo },
        action: {
            $in: ['view', 'like', 'comment', 'share', 'save', 'care', 'follow', 'review', 'purchase', 'add_to_cart', 'search',
                'click', 'reply', 'create', 'update', 'toggle_status', 'toggle_allow_posts',
                'unlike', 'unsave', 'uncare', 'unfollow', 'remove_cart_item', 'remove_multiple_cart_items',
                'clear_cart', 'clean_cart', 'delete', 'report'
            ]
        },
        targetType: { $in: ['product', 'post', 'user', 'shop', 'search'] }
    }).lean();

    if (!interactions.length) {
        console.warn('⚠️ Không có tương tác nào trong 30 ngày qua');
        return { matrix: [], users: [], entities: [] };
    }

    // Tạo danh sách user và entity duy nhất
    const users = [...new Set(interactions.map(i => i.author?._id?.toString() || i.sessionId))];
    // const entities = [...new Set(interactions.map(i => ({ id: i.targetId?.toString(), type: i.targetType })))].map(e => `${e.type}:${e.id}`);
    const entities = [...new Set(interactions.map(i => {
        if (i.targetType === 'search') {
            // ✅ Comment mới: Sử dụng searchSignature làm entityId cho tìm kiếm
            return `search:${i.searchSignature.query || 'unknown'}:${i.searchSignature.category || 'unknown'}:${(i.searchSignature.hashtags || []).join('|')}`;
        }
        return `${i.targetType}:${i.targetId?.toString()}`;
    }))];

    // Tạo ma trận user-entity
    const matrix = Array(users.length).fill().map(() => Array(entities.length).fill(0));
    interactions.forEach(interaction => {
        const userIdx = users.indexOf(interaction.author?._id?.toString() || interaction.sessionId);
        const entityIdx = entities.indexOf(
            interaction.targetType === 'search'
                ? `search:${interaction.searchSignature.query || 'unknown'}:${interaction.searchSignature.category || 'unknown'}:${(interaction.searchSignature.hashtags || []).join('|')}`
                : `${interaction.targetType}:${interaction.targetId?.toString()}`
        );
        if (userIdx !== -1 && entityIdx !== -1) {
            //Sử dụng weight trực tiếp, giữ nguyên giá trị âm cho hành vi tiêu cực
            matrix[userIdx][entityIdx] = interaction.weight || 0;

            // Loại bỏ các hành vi tiêu cực (unfollow, unsave, v.v.) nếu không mong muốn ảnh hưởng đến ma trận
            if (interaction.action.includes('un') || interaction.action.includes('remove') || interaction.action.includes('clear')) {
                matrix[userIdx][entityIdx] = Math.max(0, matrix[userIdx][entityIdx]); // Đặt giá trị không âm
            }
        }
    });

    return { matrix, users, entities };
}

////////////

// Huấn luyện mô hình User-Shop
async function trainUserShopModel() {
    const { matrix, users, entities } = await prepareUserEntityMatrix();

    if (!matrix.length || !users.length || !entities.length) {
        console.warn('⚠️ Không có dữ liệu để huấn luyện mô hình User/Shop');
        return null;
    }

    const numUsers = users.length;
    const numEntities = entities.length;
    const numFactors = Math.min(50, Math.min(numUsers, numEntities));

    console.log(`🎯 Bắt đầu huấn luyện với ${numUsers} users, ${numEntities} entities, ${numFactors} factors`);

    // Tạo embedding layers
    const userEmbedding = tf.variable(tf.randomNormal([numUsers, numFactors], 0, 0.1));
    const entityEmbedding = tf.variable(tf.randomNormal([numEntities, numFactors], 0, 0.1));

    // Tạo dữ liệu huấn luyện
    const trainData = [];
    for (let i = 0; i < numUsers; i++) {
        for (let j = 0; j < numEntities; j++) {
            if (matrix[i][j] > 0) {
                trainData.push({ userIdx: i, entityIdx: j, rating: matrix[i][j] });
            }
        }
    }

    console.log(`📊 Tạo được ${trainData.length} samples để huấn luyện`);

    if (trainData.length === 0) {
        console.warn('⚠️ Không có dữ liệu training');
        return null;
    }

    // Optimizer
    const optimizer = tf.train.adam(0.01);

    // Huấn luyện
    for (let epoch = 0; epoch < 50; epoch++) {
        let totalLoss = 0;
        const shuffledData = [...trainData].sort(() => Math.random() - 0.5); // Shuffle đơn giản

        for (let idx = 0; idx < shuffledData.length; idx++) {
            const sample = shuffledData[idx];
            try {
                const lossValue = tf.tidy(() => {
                    const userVec = userEmbedding.slice([sample.userIdx, 0], [1, numFactors]);
                    const entityVec = entityEmbedding.slice([sample.entityIdx, 0], [1, numFactors]);
                    const prediction = tf.matMul(userVec, entityVec, false, true).squeeze();
                    const label = tf.scalar(sample.rating);
                    const loss = tf.losses.meanSquaredError(label, prediction);
                    return loss.dataSync()[0];
                });

                totalLoss += lossValue;

                optimizer.minimize(() => {
                    return tf.tidy(() => {
                        const userVec = userEmbedding.slice([sample.userIdx, 0], [1, numFactors]);
                        const entityVec = entityEmbedding.slice([sample.entityIdx, 0], [1, numFactors]);
                        const prediction = tf.matMul(userVec, entityVec, false, true).squeeze();
                        const label = tf.scalar(sample.rating);
                        return tf.losses.meanSquaredError(label, prediction);
                    });
                });
            } catch (sampleError) {
                console.error(`❌ Lỗi tại sample ${idx}:`, sampleError);
                continue;
            }
        }

        if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch + 1}, Average Loss: ${totalLoss / trainData.length}`);
        }
    }

    // Lưu model
    const modelData = {
        userEmbedding: await userEmbedding.data(),
        entityEmbedding: await entityEmbedding.data(),
        userEmbeddingShape: userEmbedding.shape,
        entityEmbeddingShape: entityEmbedding.shape,
        users,
        entities,
        numUsers,
        numEntities,
        numFactors,
        trainedAt: new Date().toISOString()
    };

    const modelDir = path.join(__dirname, '../models');
    try {
        await fs.mkdir(modelDir, { recursive: true });
        await fs.writeFile(
            path.join(modelDir, 'user_shop_model.json'),
            JSON.stringify(modelData, null, 2)
        );
        console.log('✅ Mô hình User/Shop đã được lưu thành công.');
    } catch (error) {
        console.error('❌ Lỗi khi lưu mô hình User/Shop:', error);
    }

    return modelData; // Trả về trực tiếp để dùng trong API
}

// Thêm hàm load mô hình User-Shop
async function loadUserShopModel() {
    const modelPath = path.join(__dirname, '../models/user_shop_model.json');
    try {
        const modelDataStr = await fs.readFile(modelPath, 'utf8');
        const modelData = JSON.parse(modelDataStr);
        return {
            userEmbedding: tf.tensor(Array.from(modelData.userEmbedding), modelData.userEmbeddingShape),
            entityEmbedding: tf.tensor(Array.from(modelData.entityEmbedding), modelData.entityEmbeddingShape),
            users: modelData.users,
            entities: modelData.entities,
            numFactors: modelData.numFactors
        };
    } catch (error) {
        console.log('⚠️ Không thể load mô hình User/Shop, sẽ huấn luyện mới');
        return await trainUserShopModel();
    }
}

// Thêm hàm gợi ý User/Shop
async function getUserShopRecommendations(userId, sessionId, limit = 10, entityType = 'all', role = 'user') {
    try {
        const model = await loadUserShopModel();
        if (!model) {
            console.warn('⚠️ Không có mô hình User/Shop để thực hiện recommendation');
            return [];
        }

        const { userEmbedding, entityEmbedding, users, entities } = model;
        const userIdx = users.indexOf(userId || sessionId);

        if (userIdx === -1) {
            console.log(`⚠️ Không tìm thấy user ${userId || sessionId} trong mô hình`);
            return [];
        }

        const userVec = userEmbedding.slice([userIdx, 0], [1, userEmbedding.shape[1]]);
        const scores = tf.matMul(userVec, entityEmbedding, false, true).squeeze();
        const scoresArray = await scores.data();

        const entityScores = entities.map((entityId, idx) => ({
            entityId,
            score: scoresArray[idx]
        }));

        // Lọc theo loại (user/shop) và điều chỉnh theo vai trò
        let filteredEntities = entityScores;
        if (entityType === 'user') {
            const usersList = await User.find({ _id: { $in: entities } }).select('_id');
            filteredEntities = entityScores.filter(e => usersList.some(u => u._id.toString() === e.entityId));
            if (role === 'shop') {
                // Shop ưu tiên user có hành vi mua sắm
                const validEntities = await Promise.all(filteredEntities.map(async e => {
                    const interactions = await UserInteraction.find({
                        targetId: e.entityId,
                        action: { $in: ['purchase', 'add_to_cart'] }
                    }).lean();
                    return interactions.length > 0 ? e : null;
                }));
                filteredEntities = validEntities.filter(e => e !== null);
            }
        } else if (entityType === 'shop') {
            const shopsList = await Shop.find({ _id: { $in: entities } }).select('_id');
            filteredEntities = entityScores.filter(e => shopsList.some(s => s._id.toString() === e.entityId));
            if (role === 'user') {
                // User ưu tiên shop có sản phẩm tương tác
                const validEntities = await Promise.all(filteredEntities.map(async e => {
                    const interactions = await UserInteraction.find({
                        targetId: e.entityId,
                        action: { $in: ['view', 'like', 'purchase'] }
                    }).lean();
                    return interactions.length > 0 ? e : null;
                }));
                filteredEntities = validEntities.filter(e => e !== null);
            }
        }

        const topEntities = filteredEntities
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(e => e.entityId);

        userVec.dispose();
        scores.dispose();

        // Lấy thông tin chi tiết
        let result = [];
        if (entityType === 'user' || entityType === 'all') {
            const users = await User.find({ _id: { $in: topEntities } })
                .lean()
                .then(users => users.map(u => {
                    const count = UserInteraction.countDocuments({
                        targetType: 'user',
                        targetId: u._id,
                        action: 'follow'
                    }).then(count => ({ ...u, followersCount: count, type: 'user' }));
                    return count;
                }));
            result = result.concat(await Promise.all(users));
        }
        if (entityType === 'shop' || entityType === 'all') {
            const shops = await Shop.find({ _id: { $in: topEntities } })
                .lean()
                .then(shops => shops.map(s => {
                    const count = UserInteraction.countDocuments({
                        targetType: 'shop',
                        targetId: s._id,
                        action: 'follow'
                    }).then(count => ({ ...s, followersCount: count, type: 'shop' }));
                    return count;
                }));
            result = result.concat(await Promise.all(shops));
        }

        return result;
    } catch (error) {
        console.error('❌ Lỗi trong getUserShopRecommendations:', error);
        return [];
    }
}

//////////////

// Matrix Factorization: Huấn luyện mô hình dựa trên tương tác người dùng
// Hàm huấn luyện mô hình Matrix Factorization: tạo gợi ý dựa trên hành vi (collaborative filtering).
async function trainMatrixFactorization() {
    const { matrix, users, entities } = await prepareUserEntityMatrix();

    if (!matrix.length || !users.length || !entities.length) {
        console.warn('⚠️ Không có dữ liệu để huấn luyện model');
        return null;
    }

    const numUsers = users.length;
    const numEntities = entities.length;
    const numFactors = Math.min(50, Math.min(numUsers, numEntities));

    console.log(`🎯 Bắt đầu huấn luyện với ${numUsers} users, ${numEntities} entities, ${numFactors} factors`);

    // Tạo embedding layers
    const userEmbedding = tf.variable(tf.randomNormal([numUsers, numFactors], 0, 0.1));
    const entityEmbedding = tf.variable(tf.randomNormal([numEntities, numFactors], 0, 0.1));

    // Tạo dữ liệu huấn luyện
    const trainData = [];
    for (let i = 0; i < numUsers; i++) {
        for (let j = 0; j < numEntities; j++) {
            if (matrix[i][j] > 0) {
                trainData.push({ userIdx: i, entityIdx: j, rating: matrix[i][j] });
            }
        }
    }

    console.log(`📊 Tạo được ${trainData.length} samples để huấn luyện`);

    if (trainData.length === 0) {
        console.warn('⚠️ Không có dữ liệu training');
        return null;
    }

    // Kiểm tra dữ liệu training
    console.log('🔍 Sample đầu tiên:', trainData[0]);
    console.log('🔍 Kiểu dữ liệu trainData:', typeof trainData, Array.isArray(trainData));

    // Optimizer
    const optimizer = tf.train.adam(0.01);

    // Huấn luyện
    for (let epoch = 0; epoch < 50; epoch++) {
        let totalLoss = 0;

        // const shuffledData = [...trainData].sort(() => Math.random() - 0.5);

        // Shuffle training data using Fisher-Yates algorithm
        const shuffledData = [];
        for (let i = 0; i < trainData.length; i++) {
            shuffledData.push(trainData[i]);
        }

        // Fisher-Yates shuffle
        for (let i = shuffledData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = shuffledData[i];
            shuffledData[i] = shuffledData[j];
            shuffledData[j] = temp;
        }

        // Training loop
        for (let idx = 0; idx < shuffledData.length; idx++) {
            const sample = shuffledData[idx];
            try {
                const lossValue = tf.tidy(() => {
                    const userVec = userEmbedding.slice([sample.userIdx, 0], [1, numFactors]);
                    const entityVec = entityEmbedding.slice([sample.entityIdx, 0], [1, numFactors]);
                    const prediction = tf.matMul(userVec, entityVec, false, true).squeeze();
                    const label = tf.scalar(sample.rating);
                    const loss = tf.losses.meanSquaredError(label, prediction);
                    return loss.dataSync()[0];
                });

                totalLoss += lossValue;

                optimizer.minimize(() => {
                    return tf.tidy(() => {
                        const userVec = userEmbedding.slice([sample.userIdx, 0], [1, numFactors]);
                        const entityVec = entityEmbedding.slice([sample.entityIdx, 0], [1, numFactors]);
                        const prediction = tf.matMul(userVec, entityVec, false, true).squeeze();
                        const label = tf.scalar(sample.rating);
                        return tf.losses.meanSquaredError(label, prediction);
                    });
                });
            } catch (sampleError) {
                console.error(`❌ Lỗi tại sample ${idx}:`, sampleError);
                continue;
            }
        }

        if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch + 1}, Average Loss: ${totalLoss / trainData.length}`);
        }
    }

    // Lưu model
    const modelData = {
        userEmbedding: await userEmbedding.data(),
        entityEmbedding: await entityEmbedding.data(),
        userEmbeddingShape: userEmbedding.shape,
        entityEmbeddingShape: entityEmbedding.shape,
        users,
        entities,
        numUsers,
        numEntities,
        numFactors,
        trainedAt: new Date().toISOString()
    };

    const modelDir = path.join(__dirname, '../models');
    try {
        await fs.mkdir(modelDir, { recursive: true });
        await fs.writeFile(
            path.join(modelDir, 'mf_model.json'),
            JSON.stringify(modelData, null, 2)
        );
        console.log('✅ Mô hình Matrix Factorization đã được lưu thành công.');

        // Lưu vào cache
        modelCache = {
            userEmbedding: tf.tensor(Array.from(modelData.userEmbedding), modelData.userEmbeddingShape),
            entityEmbedding: tf.tensor(Array.from(modelData.entityEmbedding), modelData.entityEmbeddingShape),
            users: modelData.users,
            entities: modelData.entities,
            numFactors: modelData.numFactors
        };
    } catch (error) {
        console.error('❌ Lỗi khi lưu mô hình:', error);
    }

    return modelCache;
}

// Hàm load model
async function loadMatrixFactorizationModel() {
    const cacheKey = 'mf_model';
    if (modelCache) {
        return modelCache;
    }

    const cached = await redisClient.get(cacheKey);
    if (cached) {
        const modelData = JSON.parse(cached);
        modelCache = {
            userEmbedding: tf.tensor(Array.from(modelData.userEmbedding), modelData.userEmbeddingShape),
            entityEmbedding: tf.tensor(Array.from(modelData.entityEmbedding), modelData.entityEmbeddingShape),
            users: modelData.users,
            entities: modelData.entities,
            numFactors: modelData.numFactors
        };
        console.log('✅ Model loaded from Redis cache');
        return modelCache;
    }

    const modelPath = path.join(__dirname, '../models/mf_model.json');
    try {
        const modelDataStr = await fs.readFile(modelPath, 'utf8');
        const modelData = JSON.parse(modelDataStr);
        modelCache = {
            userEmbedding: tf.tensor(Array.from(modelData.userEmbedding), modelData.userEmbeddingShape),
            entityEmbedding: tf.tensor(Array.from(modelData.entityEmbedding), modelData.entityEmbeddingShape),
            users: modelData.users,
            entities: modelData.entities,
            numFactors: modelData.numFactors
        };

        await redisClient.setex(cacheKey, 3600, JSON.stringify(modelData)); // Cache 1 giờ
        console.log('✅ Model loaded from file and cached in Redis');
        return modelCache;
    } catch (error) {
        console.log('⚠️ Không thể load model từ file, sẽ huấn luyện model mới');
        return await trainMatrixFactorization();
    }
}

// Hàm dự đoán gợi ý cho người dùng
async function getCollaborativeRecommendations(userId, sessionId, limit = 10, role = 'user') {
    const cacheKey = `recs:collab:${userId || sessionId}:${limit}:${role}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // Logic tính toán
    try {
        const model = await loadMatrixFactorizationModel();

        if (!model) {
            console.warn('⚠️ Không có model để thực hiện recommendation');
            return [];
        }

        const { userEmbedding, entityEmbedding, users, entities } = model;
        const userIdx = users.indexOf(userId || sessionId);

        if (userIdx === -1) {
            console.log(`⚠️ Không tìm thấy user ${userId || sessionId} trong model`);
            return [];
        }

        // Tính điểm số cho tất cả items
        const userVec = userEmbedding.slice([userIdx, 0], [1, userEmbedding.shape[1]]);
        const scores = tf.matMul(userVec, entityEmbedding, false, true).squeeze();
        const scoresArray = await scores.data();

        // Lấy top
        const entityScores = entities.map((entityStr, idx) => {
            const [type, id] = entityStr.split(':');
            return { entityId: id, entityType: type, score: scoresArray[idx] };
        });

        // Lọc theo vai trò
        let filteredEntities = entityScores;
        if (role === 'user') {
            filteredEntities = entityScores.filter(e => ['user', 'shop'].includes(e.entityType));
        } else if (role === 'shop') {
            filteredEntities = entityScores.filter(e => ['product', 'post', 'user'].includes(e.entityType));
        }

        // Sắp xếp và lấy top
        const topEntities = filteredEntities
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(e => ({ id: e.entityId, type: e.entityType }));

        // Cleanup tensors
        userVec.dispose();
        scores.dispose();

        // Lấy thông tin chi tiết
        const result = [];
        for (const entity of topEntities) {
            if (entity.type === 'product') {
                const product = await Product.findById(entity.id).lean();
                if (product) result.push({ ...product, type: 'product' });
            } else if (entity.type === 'post') {
                const post = await Post.findById(entity.id).lean();
                if (post) result.push({ ...post, type: 'post' });
            } else if (entity.type === 'user') {
                const user = await User.findById(entity.id).lean();
                if (user) result.push({ ...user, type: 'user', followersCount: await UserInteraction.countDocuments({ targetType: 'user', targetId: entity.id, action: 'follow' }) });
            } else if (entity.type === 'shop') {
                const shop = await Shop.findById(entity.id).lean();
                if (shop) result.push({ ...shop, type: 'shop', followersCount: await UserInteraction.countDocuments({ targetType: 'shop', targetId: entity.id, action: 'follow' }) });
            }
        }

        await redisClient.setex(cacheKey, 3600, JSON.stringify(result)); // Cache 1 giờ
        return result;
    } catch (error) {
        console.error('❌ Lỗi trong getCollaborativeRecommendations:', error);
        return [];
    }
}

//////////////

// Hàm chuẩn bị dữ liệu TF-IDF
async function prepareTfIdfMatrix() {
    const products = await Product.find({ isActive: true }).select('name description hashtags').lean();
    const posts = await Post.find({ privacy: 'public' }).select('content hashtags').lean();

    const tfidf = new TfIdf();
    const itemIds = [];

    // Thêm nội dung sản phẩm
    products.forEach(product => {
        const content = `${product.name} ${product.description} ${product.hashtags.join(' ')}`;
        tfidf.addDocument(content);
        itemIds.push(product._id.toString());
    });

    // Thêm nội dung bài viết
    posts.forEach(post => {
        const content = `${post.content} ${post.hashtags.join(' ')}`;
        tfidf.addDocument(content);
        itemIds.push(post._id.toString());
    });

    // Lưu ma trận TF-IDF vào Redis
    const tfidfData = {
        documents: tfidf.documents,
        itemIds,
        createdAt: new Date().toISOString()
    };

    await redisClient.setex('tfidf_matrix', 3600, JSON.stringify(tfidfData)); // Cache 1 giờ
    return { tfidf, itemIds };
}

// Hàm tính độ tương đồng cosine
function cosineSimilarity(vecA, vecB) {
    const dotProduct = Object.keys(vecA).reduce((sum, key) => {
        return sum + (vecA[key] || 0) * (vecB[key] || 0);
    }, 0);

    const magnitudeA = Math.sqrt(Object.values(vecA).reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(Object.values(vecB).reduce((sum, val) => sum + val * val, 0));

    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}

// Hàm gợi ý dựa trên TF-IDF
async function getContentBasedRecommendations(itemId, limit = 10) {
    try {
        const cached = await redisClient.get('tfidf_matrix');
        let tfidfData;

        if (!cached) {
            const result = await prepareTfIdfMatrix();
            tfidfData = { documents: result.tfidf.documents, itemIds: result.itemIds };
        } else {
            tfidfData = JSON.parse(cached);
        }

        const { documents, itemIds } = tfidfData;
        const itemIdx = itemIds.indexOf(itemId);

        if (itemIdx === -1) {
            console.log(`⚠️ Không tìm thấy item ${itemId} trong TF-IDF matrix`);
            return [];
        }

        const similarities = documents.map((doc, idx) => ({
            itemId: itemIds[idx],
            similarity: idx === itemIdx ? 0 : cosineSimilarity(documents[itemIdx], doc)
        }));

        return similarities
            .filter(s => s.similarity > 0)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(s => s.itemId);

    } catch (error) {
        console.error('❌ Lỗi trong getContentBasedRecommendations:', error);
        return [];
    }
}

///////////////

// Hàm mới để gợi ý dựa trên từ khóa tìm kiếm, danh mục, và hashtag
async function getContentBasedRecommendationsFromSearch(query, category, hashtags, limit = 10) {
    try {
        const cached = await redisClient.get('tfidf_matrix');
        let tfidfData;

        if (!cached) {
            const result = await prepareTfIdfMatrix();
            tfidfData = { documents: result.tfidf.documents, itemIds: result.itemIds };
        } else {
            tfidfData = JSON.parse(cached);
        }

        const { documents, itemIds } = tfidfData;
        const similarities = [];

        // Tìm kiếm dựa trên query, category, và hashtags
        const searchContent = `${query || ''} ${category || ''} ${hashtags?.join(' ') || ''}`.toLowerCase();
        documents.forEach((doc, idx) => {
            let similarity = cosineSimilarity(
                natural.TfIdf.tf(searchContent.split(' '), searchContent.split(' ')),
                doc
            );
            if (similarity > 0) {
                similarities.push({ itemId: itemIds[idx], similarity });
            }
        });

        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(s => s.itemId);

    } catch (error) {
        console.error('❌ Lỗi trong getContentBasedRecommendationsFromSearch:', error);
        return [];
    }
}

///////////////

// Hàm kết hợp gợi ý
async function getHybridRecommendations(userId, sessionId, limit = 10, role = 'user') {
    try {
        const collaborativeRecs = await getCollaborativeRecommendations(userId, sessionId, limit * 2, role);
        const contentRecs = [];

        // Lấy các entity người dùng đã tương tác
        const interactions = await UserInteraction.find({
            $or: [{ 'author._id': userId }, { sessionId }],
            action: { $in: ['view', 'like', 'purchase', 'add_to_cart', 'search'] }
        }).sort({ timestamp: -1 }).limit(5);

        // Gợi ý dựa trên nội dung của các mục đã tương tác, bao gồm cả tìm kiếm
        for (const interaction of interactions) {
            if (interaction.targetType === 'search') {
                const searchQuery = interaction.searchSignature.query;
                const category = interaction.searchSignature.category;
                const hashtags = interaction.searchSignature.hashtags;
                //Gợi ý dựa trên từ khóa tìm kiếm, danh mục, và hashtag
                const searchBasedRecs = await getContentBasedRecommendationsFromSearch(searchQuery, category, hashtags, Math.ceil(limit / 2));
                contentRecs.push(...searchBasedRecs);
            } else {
                const recs = await getContentBasedRecommendations(interaction.targetId.toString(), Math.ceil(limit / 2));
                contentRecs.push(...recs);
            }
        }

        // Kết hợp điểm số
        const scoreMap = new Map();

        // Điểm từ collaborative filtering (trọng số 0.7)
        collaborativeRecs.forEach((item, idx) => {
            const score = (1 - idx / collaborativeRecs.length) * 0.7;
            scoreMap.set(item._id.toString(), (scoreMap.get(item._id.toString()) || 0) + score);
        });

        // Điểm từ content-based filtering (trọng số 0.3)
        contentRecs.forEach((itemId, idx) => {
            const score = (1 - idx / contentRecs.length) * 0.3;
            scoreMap.set(itemId, (scoreMap.get(itemId) || 0) + score);
        });

        // Sắp xếp và lấy top
        const recommendations = [...scoreMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([itemId]) => {
                const match = collaborativeRecs.find(r => r._id.toString() === itemId) || { _id: itemId };
                return match;
            });

        // Lấy thông tin chi tiết
        const productIds = recommendations.filter(r => r.type === 'product').map(r => r._id);
        const postIds = recommendations.filter(r => r.type === 'post').map(r => r._id);
        const userIds = recommendations.filter(r => r.type === 'user').map(r => r._id);
        const shopIds = recommendations.filter(r => r.type === 'shop').map(r => r._id);

        const [products, posts, users, shops] = await Promise.all([
            Product.find({ _id: { $in: productIds }, isActive: true }).lean(),
            Post.find({ _id: { $in: postIds }, privacy: 'public' }).lean(),
            User.find({ _id: { $in: userIds } }).lean().then(users => users.map(u => ({
                ...u,
                type: 'user',
                followersCount: UserInteraction.countDocuments({ targetType: 'user', targetId: u._id, action: 'follow' })
            }))),
            Shop.find({ _id: { $in: shopIds } }).lean().then(shops => shops.map(s => ({
                ...s,
                type: 'shop',
                followersCount: UserInteraction.countDocuments({ targetType: 'shop', targetId: s._id, action: 'follow' })
            })))
        ]);

        // Sắp xếp theo thứ tự recommendation
        const result = [];
        for (const rec of recommendations) {
            let item;
            if (rec.type === 'product') item = products.find(p => p._id.toString() === rec._id.toString());
            else if (rec.type === 'post') item = posts.find(p => p._id.toString() === rec._id.toString());
            else if (rec.type === 'user') item = users.find(u => u._id.toString() === rec._id.toString());
            else if (rec.type === 'shop') item = shops.find(s => s._id.toString() === rec._id.toString());
            if (item) result.push(item);
        }

        return result;

    } catch (error) {
        console.error('❌ Lỗi trong getHybridRecommendations:', error);
        return [];
    }
}

module.exports = {
    prepareUserEntityMatrix,
    trainUserShopModel,
    trainMatrixFactorization,
    prepareTfIdfMatrix,
    getUserShopRecommendations,
    getCollaborativeRecommendations,
    getContentBasedRecommendations,
    getContentBasedRecommendationsFromSearch,
    getHybridRecommendations,
};