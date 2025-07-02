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
const FlashSale = require('../models/FlashSale');


// Cache để lưu model trong memory (user_shop)
let modelCache = null;
let modelCacheTime = null;
const MODEL_CACHE_DURATION = 30 * 60 * 1000; // 30 phút

// Cache để lưu model MF trong memory (Matrix)
let mfModelCache = null;
let mfModelCacheTime = null;
const MF_MODEL_CACHE_DURATION = 30 * 60 * 1000; // 30 phút

// Hàm check xem có cần reload model không
function shouldReloadModel() {
    if (!modelCache || !modelCacheTime) return true;
    return (Date.now() - modelCacheTime) > MODEL_CACHE_DURATION;
}

// Hàm check xem có cần reload MFmodel không
function shouldReloadMFModel() {
    if (!mfModelCache || !mfModelCacheTime) {
        console.log('🔄 MF Model cache empty hoặc chưa có thời gian cache');
        return true;
    }

    const isExpired = (Date.now() - mfModelCacheTime) > MF_MODEL_CACHE_DURATION;
    console.log(`🔍 MF Cache check: ${isExpired ? 'EXPIRED' : 'VALID'}, Age: ${Math.floor((Date.now() - mfModelCacheTime) / 1000)}s`);
    return isExpired;
}
////////////////////////////

// Hàm chuẩn bị ma trận tất cả loại entity (product, post, user, shop) với trọng số phù hợp theo vai trò
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
    const users = [...new Set(interactions.map(i => i.author?._id?.toString() || i.sessionId))].sort();
    console.log(`🔍 DEBUG: Users list: ${users.join(', ')}`);

    // Sửa lỗi: Lọc bỏ các entity không hợp lệ
    const entities = [...new Set(interactions.map(i => {
        if (i.targetType === 'search') {
            // Kiểm tra searchSignature tồn tại trước khi truy cập thuộc tính
            if (i.searchSignature && typeof i.searchSignature === 'object') {
                const query = i.searchSignature.query || 'unknown';
                const category = i.searchSignature.category || 'unknown';
                const hashtags = Array.isArray(i.searchSignature.hashtags) ? i.searchSignature.hashtags.join('|') : '';
                return `search:${query}:${category}:${hashtags}`;
            } else {
                // Fallback nếu searchSignature không tồn tại hoặc không hợp lệ
                return `search:unknown:unknown:`;
            }
        }

        // Kiểm tra targetId có tồn tại và hợp lệ
        if (!i.targetId) {
            console.warn(`⚠️ targetId không tồn tại cho interaction:`, i._id);
            return null;
        }

        const targetIdStr = i.targetId.toString();
        // Kiểm tra định dạng ObjectId (24 ký tự hex) cho các loại không phải search
        if (!/^[0-9a-fA-F]{24}$/.test(targetIdStr)) {
            console.warn(`⚠️ targetId không đúng định dạng ObjectId: ${targetIdStr}`);
            return null;
        }

        return `${i.targetType}:${targetIdStr}`;
    }).filter(entity => entity !== null))]; // Loại bỏ các entity null

    console.log(`📊 Filtered entities: ${entities.length} valid entities from ${interactions.length} interactions`);

    // Tạo ma trận user-entity
    const matrix = Array(users.length).fill().map(() => Array(entities.length).fill(0));

    interactions.forEach(interaction => {
        const userIdx = users.indexOf(interaction.author?._id?.toString() || interaction.sessionId);

        let entityKey;
        if (interaction.targetType === 'search') {
            if (interaction.searchSignature && typeof interaction.searchSignature === 'object') {
                const query = interaction.searchSignature.query || 'unknown';
                const category = interaction.searchSignature.category || 'unknown';
                const hashtags = Array.isArray(interaction.searchSignature.hashtags) ? interaction.searchSignature.hashtags.join('|') : '';
                entityKey = `search:${query}:${category}:${hashtags}`;
            } else {
                entityKey = `search:unknown:unknown:`;
            }
        } else {
            // Kiểm tra targetId trước khi sử dụng
            if (!interaction.targetId) {
                return; // Bỏ qua interaction này
            }
            entityKey = `${interaction.targetType}:${interaction.targetId.toString()}`;
        }

        const entityIdx = entities.indexOf(entityKey);

        if (userIdx !== -1 && entityIdx !== -1) {
            // Sử dụng weight trực tiếp, giữ nguyên giá trị âm cho hành vi tiêu cực
            matrix[userIdx][entityIdx] = interaction.weight || 0;

            // Loại bỏ các hành vi tiêu cực (unfollow, unsave, v.v.) nếu không mong muốn ảnh hưởng đến ma trận
            if (interaction.action.includes('un') || interaction.action.includes('remove') || interaction.action.includes('clear')) {
                matrix[userIdx][entityIdx] = Math.max(0, matrix[userIdx][entityIdx]); // Đặt giá trị không âm
            }
        }
    });

    console.log(`📊 Đã tạo ma trận ${users.length} users x ${entities.length} entities`);
    return { matrix, users, entities };
}

////////////////////////////

// Huấn luyện mô hình User-Shop - SỬA LẠI CÁCH CACHE
async function trainUserShopModel() {
    console.log('🚀 Bắt đầu training model mới...');

    const { matrix, users, entities } = await prepareUserEntityMatrix();

    if (!matrix.length || !users.length || !entities.length) {
        console.warn('⚠️ Không có dữ liệu để huấn luyện mô hình User/Shop');
        return null;
    }

    const numUsers = users.length;
    const numEntities = entities.length;
    const numFactors = Math.min(50, Math.min(numUsers, numEntities));

    console.log(`🎯 Training với ${numUsers} users, ${numEntities} entities, ${numFactors} factors`);

    // Tạo embedding layers
    const userEmbedding = tf.variable(tf.randomNormal([numUsers, numFactors], 0, 0.1));
    const entityEmbedding = tf.variable(tf.randomNormal([numEntities, numFactors], 0, 0.1));

    // Tạo training data
    const trainData = [];
    for (let i = 0; i < numUsers; i++) {
        for (let j = 0; j < numEntities; j++) {
            if (matrix[i][j] > 0) {
                trainData.push({ userIdx: i, entityIdx: j, rating: matrix[i][j] });
            }
        }
    }

    console.log(`📊 Training data: ${trainData.length} samples`);

    if (trainData.length === 0) {
        console.warn('⚠️ Không có training data');
        userEmbedding.dispose();
        entityEmbedding.dispose();
        return null;
    }

    // Training loop
    const optimizer = tf.train.adam(0.01);

    for (let epoch = 0; epoch < 50; epoch++) {
        let totalLoss = 0;
        const shuffledData = [...trainData].sort(() => Math.random() - 0.5);

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

    // Lấy data và lưu model - SỬA LẠI CÁCH LƯU
    try {
        const userEmbeddingData = await userEmbedding.data();
        const entityEmbeddingData = await entityEmbedding.data();

        // Chuyển Float32Array thành regular array để JSON có thể serialize
        const userEmbeddingArray = Array.from(userEmbeddingData);
        const entityEmbeddingArray = Array.from(entityEmbeddingData);

        const modelData = {
            userEmbedding: userEmbeddingArray,
            entityEmbedding: entityEmbeddingArray,
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
        await fs.mkdir(modelDir, { recursive: true });
        await fs.writeFile(
            path.join(modelDir, 'user_shop_model.json'),
            JSON.stringify(modelData, null, 2)
        );

        console.log('✅ Model saved successfully');

        // Tạo model object để return và cache - QUAN TRỌNG: Tạo tensors mới
        const model = {
            userEmbedding: tf.tensor(userEmbeddingArray, userEmbedding.shape),
            entityEmbedding: tf.tensor(entityEmbeddingArray, entityEmbedding.shape),
            users,
            entities,
            numFactors,
            trainedAt: modelData.trainedAt
        };

        // Cache trong memory - KHÔNG CACHE TENSORS VÀO REDIS
        modelCache = model;
        modelCacheTime = Date.now();

        // CHỈ CACHE DATA THUẦN VÀO REDIS, KHÔNG CACHE TENSORS
        try {
            const redisModelData = {
                userEmbedding: userEmbeddingArray,
                entityEmbedding: entityEmbeddingArray,
                userEmbeddingShape: userEmbedding.shape,
                entityEmbeddingShape: entityEmbedding.shape,
                users,
                entities,
                numFactors,
                trainedAt: modelData.trainedAt
            };
            await redisClient.setex('user_shop_model_data', 1800, JSON.stringify(redisModelData));
            console.log('💾 Đã cache User-Shop model data vào Redis');
        } catch (redisError) {
            console.warn('⚠️ Không thể cache User-Shop model vào Redis:', redisError.message);
        }

        // Cleanup original tensors
        userEmbedding.dispose();
        entityEmbedding.dispose();
        optimizer.dispose();

        return model;

    } catch (saveError) {
        console.error('❌ Lỗi khi lưu model:', saveError);
        userEmbedding.dispose();
        entityEmbedding.dispose();
        optimizer.dispose();
        return null;
    }
}

// SỬA LẠI HÀM LOAD MODEL
async function loadUserShopModel() {
    // Kiểm tra cache trong memory trước
    if (!shouldReloadModel()) {
        console.log('✅ Sử dụng model từ memory cache');
        return modelCache;
    }

    // Nếu hết hạn hoặc chưa có, lấy từ redis - SỬA KEY
    const cacheKey = 'user_shop_model_data'; // Thay đổi key để tránh conflict

    try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('📦 Tìm thấy User-Shop model data trong Redis cache');
            const modelData = JSON.parse(cached);

            // TẠO LẠI TENSORS TỪ DATA
            const model = {
                userEmbedding: tf.tensor(modelData.userEmbedding, modelData.userEmbeddingShape),
                entityEmbedding: tf.tensor(modelData.entityEmbedding, modelData.entityEmbeddingShape),
                users: modelData.users,
                entities: modelData.entities,
                numFactors: modelData.numFactors,
                trainedAt: modelData.trainedAt
            };

            modelCache = model;
            modelCacheTime = Date.now();
            return model;
        }
    } catch (redisError) {
        console.warn('⚠️ Lỗi khi đọc User-Shop model từ Redis:', redisError.message);
    }

    // Nếu trên redis cũng không có, lấy từ file
    const modelPath = path.join(__dirname, '../models/user_shop_model.json');

    try {
        // Kiểm tra file tồn tại
        await fs.access(modelPath);
        console.log('✅ File model tồn tại, đang load...');

        const modelDataStr = await fs.readFile(modelPath, 'utf8');
        const modelData = JSON.parse(modelDataStr);

        console.log('🔍 Debug model data structure:', {
            hasUserEmbedding: !!modelData.userEmbedding,
            hasEntityEmbedding: !!modelData.entityEmbedding,
            userEmbeddingType: typeof modelData.userEmbedding,
            entityEmbeddingType: typeof modelData.entityEmbedding,
            userEmbeddingLength: modelData.userEmbedding ? modelData.userEmbedding.length : 0,
            entityEmbeddingLength: modelData.entityEmbedding ? modelData.entityEmbedding.length : 0,
            userEmbeddingShape: modelData.userEmbeddingShape,
            entityEmbeddingShape: modelData.entityEmbeddingShape,
            usersCount: modelData.users?.length || 0,
            entitiesCount: modelData.entities?.length || 0,
            trainedAt: modelData.trainedAt
        });

        // Kiểm tra các trường bắt buộc
        const requiredFields = ['userEmbedding', 'entityEmbedding', 'userEmbeddingShape', 'entityEmbeddingShape', 'users', 'entities', 'numFactors'];
        const missingFields = requiredFields.filter(field => !modelData[field]);

        if (missingFields.length > 0) {
            console.error('❌ Model data thiếu các trường:', missingFields);
            return await trainUserShopModel();
        }

        // Kiểm tra arrays
        if (!Array.isArray(modelData.users) || modelData.users.length === 0) {
            console.error('❌ Users array không hợp lệ hoặc rỗng');
            return await trainUserShopModel();
        }

        if (!Array.isArray(modelData.entities) || modelData.entities.length === 0) {
            console.error('❌ Entities array không hợp lệ hoặc rỗng');
            return await trainUserShopModel();
        }

        // Kiểm tra embedding data
        if (!modelData.userEmbedding || !modelData.entityEmbedding) {
            console.error('❌ Embedding data không tồn tại');
            return await trainUserShopModel();
        }

        // Chuyển đổi từ object về array nếu cần
        let userEmbeddingData = modelData.userEmbedding;
        let entityEmbeddingData = modelData.entityEmbedding;

        // Nếu là object (từ tensor.data()), chuyển về array
        if (userEmbeddingData && typeof userEmbeddingData === 'object' && !Array.isArray(userEmbeddingData)) {
            userEmbeddingData = Object.values(userEmbeddingData);
        }
        if (entityEmbeddingData && typeof entityEmbeddingData === 'object' && !Array.isArray(entityEmbeddingData)) {
            entityEmbeddingData = Object.values(entityEmbeddingData);
        }

        // Kiểm tra sau khi convert
        if (!Array.isArray(userEmbeddingData) || userEmbeddingData.length === 0) {
            console.error('❌ userEmbedding data không thể convert thành array hợp lệ');
            return await trainUserShopModel();
        }

        if (!Array.isArray(entityEmbeddingData) || entityEmbeddingData.length === 0) {
            console.error('❌ entityEmbedding data không thể convert thành array hợp lệ');
            return await trainUserShopModel();
        }

        // Kiểm tra shape consistency
        const expectedUserSize = modelData.userEmbeddingShape[0] * modelData.userEmbeddingShape[1];
        const expectedEntitySize = modelData.entityEmbeddingShape[0] * modelData.entityEmbeddingShape[1];

        if (userEmbeddingData.length !== expectedUserSize) {
            console.error(`❌ userEmbedding size mismatch: expected ${expectedUserSize}, got ${userEmbeddingData.length}`);
            return await trainUserShopModel();
        }

        if (entityEmbeddingData.length !== expectedEntitySize) {
            console.error(`❌ entityEmbedding size mismatch: expected ${expectedEntitySize}, got ${entityEmbeddingData.length}`);
            return await trainUserShopModel();
        }

        // Tạo tensors với error handling
        let userEmbedding, entityEmbedding;

        try {
            userEmbedding = tf.tensor(userEmbeddingData, modelData.userEmbeddingShape);
            entityEmbedding = tf.tensor(entityEmbeddingData, modelData.entityEmbeddingShape);

            // Validate tensors
            if (!userEmbedding.shape || !entityEmbedding.shape) {
                throw new Error('Invalid tensor shapes after creation');
            }

            console.log('✅ Tensors created successfully:', {
                userEmbeddingShape: userEmbedding.shape,
                entityEmbeddingShape: entityEmbedding.shape
            });

        } catch (tensorError) {
            console.error('❌ Lỗi khi tạo tensors:', tensorError);
            if (userEmbedding) userEmbedding.dispose();
            if (entityEmbedding) entityEmbedding.dispose();
            return await trainUserShopModel();
        }

        // Tạo model object
        const model = {
            userEmbedding,
            entityEmbedding,
            users: modelData.users,
            entities: modelData.entities,
            numFactors: modelData.numFactors,
            trainedAt: modelData.trainedAt
        };

        // Cache trong memory
        modelCache = model;
        modelCacheTime = Date.now();

        // Cache DATA (không phải tensors) vào Redis
        try {
            const redisModelData = {
                userEmbedding: userEmbeddingData,
                entityEmbedding: entityEmbeddingData,
                userEmbeddingShape: modelData.userEmbeddingShape,
                entityEmbeddingShape: modelData.entityEmbeddingShape,
                users: modelData.users,
                entities: modelData.entities,
                numFactors: modelData.numFactors,
                trainedAt: modelData.trainedAt
            };
            await redisClient.setex(cacheKey, 3600, JSON.stringify(redisModelData));
        } catch (redisCacheError) {
            console.warn('⚠️ Không thể cache vào Redis:', redisCacheError.message);
        }

        console.log(`✅ Model loaded successfully from file. Users: ${modelData.users.length}, Entities: ${modelData.entities.length}`);
        return model;

    } catch (error) {
        console.log('⚠️ Không thể load model từ file, training model mới:', error.message);

        // Clear cache nếu có lỗi
        modelCache = null;
        modelCacheTime = null;

        return await trainUserShopModel();
    }
}

// Hàm gợi ý User/Shop hoàn chỉnh
async function getUserShopRecommendations(userId, sessionId, limit = 10, entityType = 'all', role = 'user', options = {}) {
    console.log('🚀 Starting getUserShopRecommendations:', { userId, sessionId, limit, entityType, role, options });

    const {
        enableCache = true,
        cacheTimeout = 1800, // 30 phút
        includeInactive = false,
        sortBy = 'score', // 'score', 'followers', 'created', 'random'
        minScore = 0
    } = options;

    const FUNCTION_TIMEOUT = 25000; // 25 giây
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Function timeout - getUserShopRecommendations')), FUNCTION_TIMEOUT);
    });

    try {
        const mainProcess = async () => {
            // 1. Kiểm tra cache
            if (enableCache) {
                const cacheKey = `user_shop_recs:${userId || sessionId}:${entityType}:${role}:${limit}:${sortBy}:${minScore}`;
                try {
                    const cached = await redisClient.get(cacheKey);
                    if (cached) {
                        console.log('✅ Lấy từ cache thành công');
                        const result = JSON.parse(cached);
                        return result.slice(0, limit);
                    }
                } catch (cacheError) {
                    console.warn('⚠️ Lỗi cache, tiếp tục xử lý:', cacheError.message);
                }
            }

            // 2. Load model
            console.log('🔄 Loading model...');
            const MODEL_TIMEOUT = 15000; // 15 giây
            const modelTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Model loading timeout')), MODEL_TIMEOUT);
            });

            let model;
            try {
                model = await Promise.race([
                    loadUserShopModel(),
                    modelTimeoutPromise
                ]);
            } catch (modelError) {
                console.error('❌ Lỗi load model:', modelError.message);
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            if (!model) {
                console.warn('⚠️ Không có model, fallback');
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            // 3. Validate model components
            const { userEmbedding, entityEmbedding, users, entities } = model;

            if (!userEmbedding || !entityEmbedding || !users || !entities) {
                console.error('❌ Model components không hợp lệ');
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            if (typeof userEmbedding.slice !== 'function' || typeof entityEmbedding.slice !== 'function') {
                console.error('❌ userEmbedding hoặc entityEmbedding không phải là TensorFlow tensors');
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            if (!Array.isArray(users) || !Array.isArray(entities) || users.length === 0 || entities.length === 0) {
                console.error('❌ Users hoặc entities không hợp lệ');
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            // 4. Tìm user index
            const userIdx = users.indexOf(userId || sessionId);
            if (userIdx === -1) {
                console.log(`⚠️ User ${userId || sessionId} không tồn tại trong model`);
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            // 5. Validate tensor shapes và user index
            if (!userEmbedding.shape || !entityEmbedding.shape) {
                console.error('❌ Tensor shapes không hợp lệ');
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            if (userIdx >= userEmbedding.shape[0]) {
                console.error(`❌ userIdx ${userIdx} vượt quá embedding size ${userEmbedding.shape[0]}`);
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            // 6. Thực hiện prediction
            let userVec, scores, scoresArray;
            try {
                console.log('🔄 Computing predictions...');
                const embeddingDim = userEmbedding.shape[1];

                userVec = userEmbedding.slice([userIdx, 0], [1, embeddingDim]);
                scores = tf.matMul(userVec, entityEmbedding, false, true).squeeze();

                const dataTimeout = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Tensor data extraction timeout')), 5000);
                });

                scoresArray = await Promise.race([
                    scores.data(),
                    dataTimeout
                ]);

            } catch (predictionError) {
                console.error('❌ Lỗi prediction:', predictionError.message);
                if (userVec) userVec.dispose();
                if (scores) scores.dispose();
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            // 7. Process scores và filter entities
            console.log('🔄 Processing scores...');
            let filteredEntityScores = [];

            try {
                const entityScores = entities.map((entityId, idx) => ({
                    entityId: entityId || '',
                    score: scoresArray[idx] || 0
                })).filter(item =>
                    item.entityId &&
                    typeof item.entityId === 'string' &&
                    item.score >= minScore
                );

                if (entityType === 'user') {
                    filteredEntityScores = entityScores.filter(e => e.entityId.startsWith('user:'));
                } else if (entityType === 'shop') {
                    filteredEntityScores = entityScores.filter(e => e.entityId.startsWith('shop:'));
                } else {
                    filteredEntityScores = entityScores.filter(e =>
                        e.entityId.startsWith('user:') || e.entityId.startsWith('shop:')
                    );
                }

                if (sortBy === 'score') {
                    filteredEntityScores.sort((a, b) => b.score - a.score);
                } else if (sortBy === 'random') {
                    filteredEntityScores.sort(() => Math.random() - 0.5);
                }

                filteredEntityScores = filteredEntityScores.slice(0, Math.min(limit * 3, 100));

            } catch (processingError) {
                console.error('❌ Lỗi processing scores:', processingError.message);
                filteredEntityScores = [];
            }

            // 8. Cleanup tensors
            try {
                userVec.dispose();
                scores.dispose();
                if (typeof userEmbedding?.dispose === 'function') userEmbedding.dispose();
                if (typeof entityEmbedding?.dispose === 'function') entityEmbedding.dispose();
            } catch (cleanupError) {
                console.warn('⚠️ Lỗi cleanup tensors:', cleanupError.message);
            }

            // 9. Fetch detailed information
            console.log(`🔄 Fetching details for ${filteredEntityScores.length} entities...`);

            if (filteredEntityScores.length === 0) {
                console.log('⚠️ Không có entities để fetch, fallback');
                return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
            }

            const result = await fetchEntityDetailsWithTimeout(
                filteredEntityScores,
                limit,
                { includeInactive, sortBy }
            );

            // 10. Cache result
            if (result.length > 0 && enableCache) {
                try {
                    const cacheKey = `user_shop_recs:${userId || sessionId}:${entityType}:${role}:${limit}:${sortBy}:${minScore}`;
                    await redisClient.setex(cacheKey, cacheTimeout, JSON.stringify(result));
                } catch (cacheError) {
                    console.warn('⚠️ Không thể cache result:', cacheError.message);
                }
            }

            console.log(`✅ Trả về ${result.length} recommendations`);
            return result;
        };

        return await Promise.race([mainProcess(), timeoutPromise]);

    } catch (error) {
        console.error('❌ Lỗi getUserShopRecommendations:', error.message);
        console.error('❌ Stack:', error.stack);

        try {
            return await getPopularShopsFallback(limit, entityType, { includeInactive, sortBy });
        } catch (fallbackError) {
            console.error('❌ Fallback cũng lỗi:', fallbackError.message);
            return [];
        }
    }
}

// Hàm helper: Fetch entity details với timeout và batch processing
async function fetchEntityDetailsWithTimeout(entityScores, limit, options = {}) {
    const { includeInactive = false, sortBy = 'score' } = options;
    const FETCH_TIMEOUT = 8000; // 8 giây
    const BATCH_SIZE = 5; // Xử lý 5 entities mỗi lần

    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Fetch details timeout')), FETCH_TIMEOUT);
    });

    const fetchProcess = async () => {
        const result = [];
        const validEntities = entityScores.filter(entity => {
            if (!entity.entityId || typeof entity.entityId !== 'string') return false;

            const parts = entity.entityId.split(':');
            if (parts.length !== 2) return false;

            const [type, id] = parts;
            return (type === 'user' || type === 'shop') &&
                id &&
                /^[0-9a-fA-F]{24}$/.test(id);
        });

        // Process in batches
        for (let i = 0; i < validEntities.length && result.length < limit; i += BATCH_SIZE) {
            const batch = validEntities.slice(i, i + BATCH_SIZE);

            const batchPromises = batch.map(async (entity) => {
                try {
                    const [type, id] = entity.entityId.split(':');

                    if (type === 'user') {
                        const query = { _id: id };
                        if (!includeInactive) {
                            query.isActive = true;
                        }

                        const user = await User.findOne(query)
                            .select('_id fullName avatar coverImage bio slug createdAt isActive')
                            .lean()
                            .maxTimeMS(2000);

                        if (user) {
                            let followersCount = 0;
                            try {
                                followersCount = await UserInteraction.countDocuments({
                                    targetType: 'user',
                                    targetId: id,
                                    action: 'follow'
                                }).maxTimeMS(1000);
                            } catch (countError) {
                                console.warn('⚠️ Không thể đếm followers cho user:', id);
                            }

                            return {
                                ...user,
                                followersCount,
                                type: 'user',
                                score: entity.score
                            };
                        }
                    } else if (type === 'shop') {
                        const query = { _id: id };
                        if (!includeInactive) {
                            query['status.isActive'] = true;
                            query['status.isApprovedCreate'] = true;
                        }

                        const shop = await Shop.findOne(query)
                            .select('_id name description avatar coverImage slug logo contact stats createdAt status')
                            .lean()
                            .maxTimeMS(2000);

                        if (shop) {
                            let followersCount = 0;
                            try {
                                followersCount = await UserInteraction.countDocuments({
                                    targetType: 'shop',
                                    targetId: id,
                                    action: 'follow'
                                }).maxTimeMS(1000);
                            } catch (countError) {
                                console.warn('⚠️ Không thể đếm followers cho shop:', id);
                            }

                            return {
                                ...shop,
                                followersCount,
                                type: 'shop',
                                score: entity.score
                            };
                        }
                    }
                } catch (entityError) {
                    console.warn(`⚠️ Lỗi fetch entity ${entity.entityId}:`, entityError.message);
                }
                return null;
            });

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                const validResults = batchResults
                    .filter(r => r.status === 'fulfilled' && r.value)
                    .map(r => r.value);

                result.push(...validResults);
            } catch (batchError) {
                console.warn('⚠️ Lỗi batch processing:', batchError.message);
            }

            if (result.length >= limit) break;
        }

        // Sort final results if needed
        if (sortBy === 'followers') {
            result.sort((a, b) => b.followersCount - a.followersCount);
        } else if (sortBy === 'created') {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return result.slice(0, limit);
    };

    try {
        return await Promise.race([fetchProcess(), timeoutPromise]);
    } catch (error) {
        console.warn('⚠️ Fetch details bị timeout, trả về empty array');
        return [];
    }
}

// Hàm fallback: Lấy shops/users phổ biến
async function getPopularShopsFallback(limit = 10, entityType = 'all', options = {}) {
    const { includeInactive = false, sortBy = 'score' } = options;
    console.log('🔄 Executing popular shops fallback...');

    try {
        const result = [];
        const halfLimit = Math.ceil(limit / 2);

        if (entityType === 'shop') {
            const query = {};
            if (!includeInactive) {
                query['status.isActive'] = true;
                query['status.isApprovedCreate'] = true;
            }

            let sort = {};
            if (sortBy === 'followers') {
                sort = { 'stats.followers': -1 };
            } else if (sortBy === 'created') {
                sort = { createdAt: -1 };
            } else {
                sort = { 'stats.followers': -1, 'stats.orderCount': -1 };
            }

            const shops = await Shop.find(query)
                .select('_id name description avatar coverImage slug logo contact stats createdAt status')
                .sort(sort)
                .limit(limit)
                .lean()
                .maxTimeMS(3000);

            return shops.map(shop => ({
                ...shop,
                type: 'shop',
                followersCount: shop.stats?.followers?.length || 0
            }));
        }

        if (entityType === 'user') {
            const query = {};
            if (!includeInactive) {
                query.isActive = true;
            }

            let sort = {};
            if (sortBy === 'created') {
                sort = { createdAt: -1 };
            } else {
                sort = { createdAt: -1 };
            }

            const users = await User.find(query)
                .select('_id fullName avatar coverImage slug bio createdAt isActive')
                .sort(sort)
                .limit(limit)
                .lean()
                .maxTimeMS(3000);

            return users.map(user => ({ ...user, type: 'user', followersCount: 0 }));
        }

        // entityType === 'all'
        const [shops, users] = await Promise.allSettled([
            Shop.find(includeInactive ? {} : {
                'status.isActive': true,
                'status.isApprovedCreate': true
            })
                .select('_id name description avatar coverImage slug logo contact stats createdAt status')
                .sort({ 'stats.followers': -1 })
                .limit(halfLimit)
                .lean()
                .maxTimeMS(2000),

            User.find(includeInactive ? {} : { isActive: true })
                .select('_id fullName avatar coverImage bio slug createdAt isActive')
                .sort({ createdAt: -1 })
                .limit(halfLimit)
                .lean()
                .maxTimeMS(2000)
        ]);

        if (shops.status === 'fulfilled') {
            result.push(...shops.value.map(shop => ({
                ...shop,
                type: 'shop',
                followersCount: shop.stats?.followers?.length || 0
            })));
        }

        if (users.status === 'fulfilled') {
            result.push(...users.value.map(user => ({
                ...user,
                type: 'user',
                followersCount: 0
            })));
        }

        console.log(`✅ Fallback trả về ${result.length} items`);
        return result.slice(0, limit);

    } catch (fallbackError) {
        console.error('❌ Lỗi trong fallback:', fallbackError.message);
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
    const numFactors = Math.min(20, Math.min(numUsers, numEntities)); // Giảm từ 50 xuống 20

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
        console.warn('⚠️ Không có dữ liệu training cho MF model');
        return null;
    }

    // Optimizer với learning rate cao hơn để converge nhanh
    const optimizer = tf.train.adam(0.05); // Tăng từ 0.01 lên 0.05

    // Giảm số epoch để tránh timeout
    const maxEpochs = Math.min(20, Math.max(10, Math.ceil(100 / trainData.length))); // Tối đa 20 epochs
    console.log(`🔄 Sử dụng ${maxEpochs} epochs`);

    // Huấn luyện
    for (let epoch = 0; epoch < maxEpochs; epoch++) {
        let totalLoss = 0;

        // Fisher-Yates shuffle - tối ưu hóa
        const shuffledData = [...trainData];
        for (let i = shuffledData.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]];
        }

        // Training loop với batch processing
        const batchSize = Math.min(16, trainData.length); // Batch processing
        for (let batchStart = 0; batchStart < shuffledData.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, shuffledData.length);
            const batch = shuffledData.slice(batchStart, batchEnd);

            try {
                const batchLoss = tf.tidy(() => {
                    let batchTotalLoss = tf.scalar(0);

                    for (const sample of batch) {
                        const userVec = userEmbedding.slice([sample.userIdx, 0], [1, numFactors]);
                        const entityVec = entityEmbedding.slice([sample.entityIdx, 0], [1, numFactors]);
                        const prediction = tf.matMul(userVec, entityVec, false, true).squeeze();
                        const label = tf.scalar(sample.rating);
                        const loss = tf.losses.meanSquaredError(label, prediction);
                        batchTotalLoss = batchTotalLoss.add(loss);
                    }

                    return batchTotalLoss.div(tf.scalar(batch.length));
                });

                totalLoss += await batchLoss.data();
                batchLoss.dispose();

                // Optimize batch
                optimizer.minimize(() => {
                    return tf.tidy(() => {
                        let batchTotalLoss = tf.scalar(0);

                        for (const sample of batch) {
                            const userVec = userEmbedding.slice([sample.userIdx, 0], [1, numFactors]);
                            const entityVec = entityEmbedding.slice([sample.entityIdx, 0], [1, numFactors]);
                            const prediction = tf.matMul(userVec, entityVec, false, true).squeeze();
                            const label = tf.scalar(sample.rating);
                            const loss = tf.losses.meanSquaredError(label, prediction);
                            batchTotalLoss = batchTotalLoss.add(loss);
                        }

                        return batchTotalLoss.div(tf.scalar(batch.length));
                    });
                });

            } catch (batchError) {
                console.error(`❌ Lỗi tại batch ${batchStart}-${batchEnd}:`, batchError);
                continue;
            }
        }

        // Log ít hơn để giảm I/O
        if (epoch % 5 === 0 || epoch === maxEpochs - 1) {
            console.log(`MF Model Epoch ${epoch + 1}/${maxEpochs}, Average Loss: ${totalLoss / Math.ceil(trainData.length / batchSize)}`);
        }
    }

    // Lưu model với kiểm tra dữ liệu
    try {
        const userEmbeddingData = await userEmbedding.data();
        const entityEmbeddingData = await entityEmbedding.data();

        // Kiểm tra dữ liệu tensor trước khi lưu
        if (!userEmbeddingData.length || !entityEmbeddingData.length) {
            console.error('❌ Dữ liệu tensor rỗng, không lưu mô hình');
            userEmbedding.dispose();
            entityEmbedding.dispose();
            optimizer.dispose();
            return null;
        }
        // Lưu model
        const modelData = {
            userEmbedding: await userEmbedding.data(),
            entityEmbedding: await entityEmbedding.data(),
            userEmbeddingShape: userEmbedding.shape,
            entityEmbeddingShape: entityEmbedding.shape,
            users: users || [],
            entities: entities || [],
            numUsers: users?.length || 0,
            numEntities: entities?.length || 0,
            numFactors: numFactors || 0,
            trainedAt: new Date().toISOString()
        };

        // Kiểm tra shape khớp với dữ liệu
        const expectedUserSize = userEmbedding.shape[0] * userEmbedding.shape[1];
        const expectedEntitySize = entityEmbedding.shape[0] * entityEmbedding.shape[1];
        if (userEmbeddingData.length !== expectedUserSize || entityEmbeddingData.length !== expectedEntitySize) {
            console.error(`❌ Shape không khớp: userEmbedding (${userEmbeddingData.length}/${expectedUserSize}), entityEmbedding (${entityEmbeddingData.length}/${expectedEntitySize})`);
            userEmbedding.dispose();
            entityEmbedding.dispose();
            optimizer.dispose();
            return null;
        }

        const modelDir = path.join(__dirname, '../models');

        await fs.mkdir(modelDir, { recursive: true });
        await fs.writeFile(
            path.join(modelDir, 'mf_model.json'),
            JSON.stringify(modelData, null, 2)
        );
        console.log('✅ Mô hình Matrix Factorization đã được lưu thành công vào mf_model.json.');

        // Lưu vào cache
        mfModelCache = {
            userEmbedding: tf.tensor(Array.from(modelData.userEmbedding), modelData.userEmbeddingShape),
            entityEmbedding: tf.tensor(Array.from(modelData.entityEmbedding), modelData.entityEmbeddingShape),
            users: modelData.users,
            entities: modelData.entities,
            numUsers: modelData.numUsers,
            numEntities: modelData.numEntities,
            numFactors: modelData.numFactors,
            trainedAt: modelData.trainedAt
        };

        // Set thời gian cache
        mfModelCacheTime = Date.now();

        // Cache vào Redis với TTL ngắn hơn
        try {
            await redisClient.setex('mf_model', 1800, JSON.stringify(modelData)); // 30 phút
            console.log('💾 Đã cache MF model vào Redis');
        } catch (redisError) {
            console.warn('⚠️ Không thể cache MF model vào Redis:', redisError.message);
        }

        userEmbedding.dispose();
        entityEmbedding.dispose();
        optimizer.dispose();

        return mfModelCache;
    } catch (error) {
        console.error('❌ Lỗi khi lưu MF model:', error);
        userEmbedding.dispose();
        entityEmbedding.dispose();
        optimizer.dispose();
        return null;
    }
}

// Hàm load model MATRIX
async function loadMatrixFactorizationModel() {
    console.log('🔍 Bắt đầu load Matrix Factorization model...');

    // 1. Kiểm tra memory cache trước
    if (!shouldReloadMFModel()) {
        console.log('✅ Sử dụng MF model từ memory cache');
        return mfModelCache;
    }

    const cacheKey = 'mf_model'; // Redis key riêng cho MF model

    // 2. Kiểm tra Redis cache
    try {
        console.log('🔍 Kiểm tra MF model trong Redis cache...');
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('📦 Tìm thấy MF model trong Redis cache');
            const modelData = JSON.parse(cached);

            // Kiểm tra dữ liệu Redis
            if (!modelData.userEmbedding || !modelData.entityEmbedding ||
                !Array.isArray(modelData.userEmbedding) || !Array.isArray(modelData.entityEmbedding)) {
                console.error('❌ Dữ liệu Redis không hợp lệ, xóa cache và thử load từ file');
                await redisClient.del(cacheKey);
            } else {
                const userTensor = tf.tensor(modelData.userEmbedding, modelData.userEmbeddingShape);
                const entityTensor = tf.tensor(modelData.entityEmbedding, modelData.entityEmbeddingShape);

                mfModelCache = {
                    userEmbedding: userTensor,
                    entityEmbedding: entityTensor,
                    users: modelData.users,
                    entities: modelData.entities,
                    numUsers: modelData.numUsers,
                    numEntities: modelData.numEntities,
                    numFactors: modelData.numFactors,
                    trainedAt: modelData.trainedAt
                };

                // Set thời gian cache
                mfModelCacheTime = Date.now();

                console.log('✅ MF Model loaded from Redis cache');
                return mfModelCache;
            }
        }
    } catch (redisError) {
        console.warn('⚠️ Lỗi khi đọc MF model từ Redis cache:', redisError.message);
    }

    // 3. Kiểm tra file system - FILE RIÊNG CHO MF MODEL
    const modelPath = path.join(__dirname, '../models/mf_model.json');
    try {
        console.log(`🔍 Kiểm tra MF model file tại: ${modelPath}`);

        await fs.access(modelPath);
        const modelDataStr = await fs.readFile(modelPath, 'utf8');
        const modelData = JSON.parse(modelDataStr);

        // Kiểm tra dữ liệu file
        if (!modelData.userEmbedding || !modelData.entityEmbedding ||
            !Array.isArray(modelData.userEmbedding) || !Array.isArray(modelData.entityEmbedding) ||
            !modelData.userEmbeddingShape || !modelData.entityEmbeddingShape) {
            console.error('❌ Dữ liệu file không hợp lệ');
            throw new Error('Invalid model data');
        }

        // Kiểm tra shape
        const expectedUserSize = modelData.userEmbeddingShape[0] * modelData.userEmbeddingShape[1];
        const expectedEntitySize = modelData.entityEmbeddingShape[0] * modelData.entityEmbeddingShape[1];
        if (modelData.userEmbedding.length !== expectedUserSize ||
            modelData.entityEmbedding.length !== expectedEntitySize) {
            console.error(`❌ Shape không khớp: userEmbedding (${modelData.userEmbedding.length}/${expectedUserSize}), entityEmbedding (${modelData.entityEmbedding.length}/${expectedEntitySize})`);
            throw new Error('Shape mismatch');
        }

        const userTensor = tf.tensor(modelData.userEmbedding, modelData.userEmbeddingShape);
        const entityTensor = tf.tensor(modelData.entityEmbedding, modelData.entityEmbeddingShape);

        // Tạo tensors từ file data
        mfModelCache = {
            userEmbedding: userTensor,
            entityEmbedding: entityTensor,
            users: modelData.users,
            entities: modelData.entities,
            numUsers: modelData.numUsers,
            numEntities: modelData.numEntities,
            numFactors: modelData.numFactors,
            trainedAt: modelData.trainedAt
        };

        // Set thời gian cache
        mfModelCacheTime = Date.now();

        // Cache vào Redis
        try {
            await redisClient.setex(cacheKey, 3600, JSON.stringify(modelData));
            console.log('💾 Đã cache MF model vào Redis');
        } catch (redisCacheError) {
            console.warn('⚠️ Không thể cache MF model vào Redis:', redisCacheError.message);
        }

        console.log('✅ MF Model loaded from file và cached');
        return mfModelCache;

    } catch (fileError) {
        console.log(`⚠️ Không thể load MF model từ file (${fileError.message}), sẽ huấn luyện model mới`);

        // 4. Huấn luyện model mới nếu không có (Chỉ gọi train nếu không phải lỗi shape)
        if (!fileError.message.includes('Shape mismatch')) {
            console.log('🔄 Bắt đầu huấn luyện MF model mới...');
            const newModel = await trainMatrixFactorization();
            if (newModel) {
                mfModelCacheTime = Date.now();
                console.log('✅ MF Model mới đã được huấn luyện và cached');
            }
            return newModel;
        } else {
            console.warn('⚠️ Bỏ qua huấn luyện vì dữ liệu file bị lỗi shape, trả về null');
            return null;
        }
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
            const parts = entityStr.split(':');
            const type = parts[0];
            const id = parts[1];

            // Kiểm tra xem id có hợp lệ không
            if (!id || id === 'undefined' || id === 'null') {
                console.warn(`⚠️ ID không hợp lệ trong entity: ${entityStr}`);
                return null;
            }

            return { entityId: id, entityType: type, score: scoresArray[idx] };
        }).filter(item => item !== null); // Loại bỏ các item null

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

        // Lấy thông tin chi tiết - KIỂM TRA ID TRƯỚC KHI QUERY
        const result = [];
        for (const entity of topEntities) {
            // Kiểm tra ObjectId hợp lệ
            if (!entity.id || entity.id === 'undefined' || entity.id === 'null') {
                console.warn(`⚠️ Bỏ qua entity với ID không hợp lệ:`, entity);
                continue;
            }

            // Kiểm tra định dạng ObjectId (24 ký tự hex)
            if (!/^[0-9a-fA-F]{24}$/.test(entity.id)) {
                console.warn(`⚠️ ID không đúng định dạng ObjectId: ${entity.id}`);
                continue;
            }

            try {
                if (entity.type === 'product') {
                    const product = await Product.findById(entity.id).lean();
                    if (product) result.push({ ...product, type: 'product' });
                } else if (entity.type === 'post') {
                    const post = await Post.findById(entity.id).lean();
                    if (post) result.push({ ...post, type: 'post' });
                } else if (entity.type === 'user') {
                    const user = await User.findById(entity.id).lean();
                    if (user) {
                        const followersCount = await UserInteraction.countDocuments({
                            targetType: 'user',
                            targetId: entity.id,
                            action: 'follow'
                        });
                        result.push({ ...user, type: 'user', followersCount });
                    }
                } else if (entity.type === 'shop') {
                    const shop = await Shop.findById(entity.id).lean();
                    if (shop) {
                        const followersCount = await UserInteraction.countDocuments({
                            targetType: 'shop',
                            targetId: entity.id,
                            action: 'follow'
                        });
                        result.push({ ...shop, type: 'shop', followersCount });
                    }
                }
            } catch (dbError) {
                console.error(`❌ Lỗi khi query ${entity.type} với ID ${entity.id}:`, dbError.message);
                continue;
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

    // Thêm Flash Sale vào ma trận
    const flashSales = await FlashSale.find({ isActive: true })
        .select('name description hashtags products')
        .populate({
            path: 'products.product',
            select: 'name description hashtags'
        })
        .lean();

    const tfidf = new TfIdf();
    const itemIds = [];
    const itemTypes = []; // Lưu type để phân biệt product/post/flashsale

    // Thêm nội dung sản phẩm
    products.forEach(product => {
        const content = `${product.name} ${product.description} ${product.hashtags.join(' ')}`;
        tfidf.addDocument(content);
        itemIds.push(product._id.toString());
        itemTypes.push('product');
    });

    // Thêm nội dung bài viết
    posts.forEach(post => {
        const content = `${post.content} ${post.hashtags.join(' ')}`;
        tfidf.addDocument(content);
        itemIds.push(post._id.toString());
        itemTypes.push('post');
    });

    // Thêm nội dung Flash Sale
    flashSales.forEach(flashSale => {
        const productContent = flashSale.products
            ?.map(p => `${p.product?.name} ${p.product?.hashtags.join(' ')}`)
            .join(' ');
        const content = `${flashSale.name} ${flashSale.description} ${productContent}`;
        tfidf.addDocument(content);
        itemIds.push(flashSale._id.toString());
        itemTypes.push('flashsale');
    });

    // Lưu ma trận TF-IDF vào Redis
    const tfidfData = {
        documents: tfidf.documents,
        itemIds,
        itemTypes, // Thêm itemTypes
        createdAt: new Date().toISOString()
    };

    await redisClient.setex('tfidf_matrix', 3600, JSON.stringify(tfidfData)); // Cache 1 giờ
    return { tfidf, itemIds, itemTypes }; // Trả về itemTypes
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
async function getContentBasedRecommendations(itemId, itemType = 'product', limit = 10) {
    try {
        const cached = await redisClient.get('tfidf_matrix');
        let tfidfData;

        if (!cached) {
            const result = await prepareTfIdfMatrix();
            tfidfData = { documents: result.tfidf.documents, itemIds: result.itemIds, itemTypes: result.itemTypes };
        } else {
            tfidfData = JSON.parse(cached);
        }

        const { documents, itemIds, itemTypes } = tfidfData;
        const itemIdx = itemIds.indexOf(itemId);

        if (itemIdx === -1) {
            console.log(`⚠️ Không tìm thấy item ${itemId} (${itemType}) trong TF-IDF matrix`);
            return [];
        }

        const similarities = documents.map((doc, idx) => ({
            itemId: itemIds[idx],
            itemType: itemTypes[idx],
            similarity: idx === itemIdx ? 0 : cosineSimilarity(documents[itemIdx], doc)
        }));

        // Lấy top items, ưu tiên Flash Sale và sản phẩm
        const topItems = similarities
            .filter(s => s.similarity > 0 && ['product', 'flashsale'].includes(s.itemType))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit);

        // Lấy thông tin chi tiết
        const result = [];
        for (const { itemId, itemType } of topItems) {
            try {
                if (itemType === 'product') {
                    const product = await Product.findById(itemId).lean();
                    if (product) result.push({ ...product, type: 'product' });
                } else if (itemType === 'flashsale') {
                    const flashSale = await FlashSale.findById(itemId)
                        .select('name description hashtags products startTime endTime')
                        .populate({
                            path: 'products.product',
                            select: 'name mainCategory price hashtags'
                        })
                        .lean();
                    if (flashSale) result.push({ ...flashSale, type: 'flashsale' });
                }
            } catch (dbError) {
                console.error(`❌ Lỗi khi query ${itemType} với ID ${itemId}:`, dbError.message);
                continue;
            }
        }

        return result;

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

// Hàm lấy content-based recommendations từ lịch sử user (ưu tiên Flash Sale)
async function getContentBasedRecommendationsFromUserHistory(userId, sessionId, limit = 20) {
    try {
        // Lấy interactions gần đây của user
        const recentInteractions = await UserInteraction.find({
            $or: [
                { 'author._id': userId },
                { sessionId: sessionId }
            ],
            action: { $in: ['view', 'like', 'purchase', 'add_to_cart', 'search', 'save'] },
            targetId: { $exists: true, $ne: null },
            timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 ngày gần đây
        })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        if (!recentInteractions.length) {
            console.log('⚠️ Không có interaction gần đây để content-based filtering');
            return [];
        }

        const contentRecs = new Set();

        // Xử lý từng interaction
        for (const interaction of recentInteractions) {
            try {
                if (interaction.targetType === 'search' && interaction.searchSignature) {
                    // Gợi ý dựa trên tìm kiếm
                    const searchRecs = await getContentBasedRecommendationsFromSearch(
                        interaction.searchSignature.query,
                        interaction.searchSignature.category,
                        interaction.searchSignature.hashtags,
                        Math.ceil(limit / 4)
                    );
                    searchRecs.forEach(id => contentRecs.add(`${id}:product`)); // Thêm type
                } else if (interaction.targetId && /^[0-9a-fA-F]{24}$/.test(interaction.targetId.toString())) {
                    // [Grok] Gợi ý dựa trên Flash Sale hoặc sản phẩm
                    const targetType = interaction.targetType === 'flashsale' ? 'flashsale' : 'product';
                    const itemRecs = await getContentBasedRecommendations(
                        interaction.targetId.toString(),
                        targetType,
                        Math.ceil(limit / 4)
                    );
                    itemRecs.forEach(item => contentRecs.add(`${item._id}:${item.type}`));
                }
            } catch (interactionError) {
                console.warn(`⚠️ Lỗi khi xử lý interaction ${interaction._id}:`, interactionError.message);
                continue;
            }
        }

        // Chuyển Set thành mảng và lấy thông tin chi tiết
        const result = [];
        const uniqueItems = Array.from(contentRecs).slice(0, limit);
        for (const item of uniqueItems) {
            const [itemId, itemType] = item.split(':');
            try {
                if (itemType === 'product') {
                    const product = await Product.findById(itemId).lean();
                    if (product) result.push({ ...product, type: 'product' });
                } else if (itemType === 'flashsale') {
                    const flashSale = await FlashSale.findById(itemId)
                        .select('name description products startTime endTime')
                        .populate({
                            path: 'products.product',
                            select: 'name mainCategory price hashtags'
                        })
                        .lean();
                    if (flashSale) result.push({ ...flashSale, type: 'flashsale' });
                }
            } catch (dbError) {
                console.error(`❌ Lỗi khi query ${itemType} với ID ${itemId}:`, dbError.message);
                continue;
            }
        }

        return result;

    } catch (error) {
        console.error('❌ Lỗi trong getContentBasedRecommendationsFromUserHistory:', error);
        return [];
    }
}

// Hàm kết hợp gợi ý được cải thiện với error handling tốt hơn (ưu tiên Flash Sale)
async function getHybridRecommendations(userId, sessionId, limit = 10, role = 'user') {
    const cacheKey = `recs:hybrid:${userId || sessionId}:${limit}:${role}`;

    try {
        // Kiểm tra cache trước
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy hybrid recommendations từ cache');
            return JSON.parse(cached);
        }

        console.log(`🔍 Tạo hybrid recommendations cho user: ${userId || sessionId}, role: ${role}`);

        // Khởi tạo arrays để tránh undefined
        let collaborativeRecs = [];
        let contentBasedItems = [];

        // 1. Lấy gợi ý từ collaborative filtering với timeout ngắn
        try {
            console.log('📊 Đang lấy collaborative recommendations...');

            // Tạo timeout promise cho collaborative filtering
            const collabTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Collaborative filtering timeout')), 15000); // 15 giây
            });

            const collabPromise = getCollaborativeRecommendations(
                userId,
                sessionId,
                Math.min(limit * 2, 50),
                role
            );

            collaborativeRecs = await Promise.race([collabPromise, collabTimeout]);
            console.log(`📊 Collaborative recs: ${collaborativeRecs?.length || 0} items`);
        } catch (collabError) {
            console.warn('⚠️ Lỗi collaborative filtering:', collabError.message);
            collaborativeRecs = [];

            // Nếu collaborative filtering timeout, fallback ngay
            if (collabError.message.includes('timeout')) {
                console.log('🔄 Collaborative filtering timeout, fallback to popular items');
                return await getFallbackRecommendations(role, limit);
            }
        }

        // 2. Lấy gợi ý từ content-based filtering với timeout ngắn
        try {
            console.log('📊 Đang lấy content-based recommendations...');

            const contentTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Content-based filtering timeout')), 10000); // 10 giây
            });

            const contentPromise = getContentBasedRecommendationsFromUserHistory(
                userId,
                sessionId,
                Math.min(limit * 2, 50)
            );

            contentBasedItems = await Promise.race([contentPromise, contentTimeout]);
            console.log(`📊 Content-based items: ${contentBasedItems?.length || 0} items`);
        } catch (contentError) {
            console.warn('⚠️ Lỗi content-based filtering:', contentError.message);
            contentBasedItems = [];
        }

        // 3. Kiểm tra nếu cả hai đều trống, fallback ngay
        if ((!collaborativeRecs || collaborativeRecs.length === 0) &&
            (!contentBasedItems || contentBasedItems.length === 0)) {
            console.log('⚠️ Không có gợi ý từ cả hai phương pháp, fallback ngay');
            const fallbackResult = await getFallbackRecommendations(role, limit);
            if (fallbackResult.length > 0) {
                await redisClient.setex(cacheKey, 1800, JSON.stringify(fallbackResult));
            }
            return fallbackResult;
        }

        // 4. Nếu chỉ có collaborative recs và đủ số lượng, trả về luôn
        if (collaborativeRecs && collaborativeRecs.length >= limit && (!contentBasedItems || contentBasedItems.length === 0)) {
            console.log('✅ Chỉ sử dụng collaborative recs vì đã đủ');
            const result = collaborativeRecs.slice(0, limit);
            await redisClient.setex(cacheKey, 1800, JSON.stringify(result));
            return result;
        }

        // 5. Kết hợp điểm số với trọng số khác nhau
        const scoreMap = new Map();
        const entityMap = new Map();

        // Xử lý collaborative filtering results (trọng số 0.7) Giảm trọng số để ưu tiên content-based
        if (collaborativeRecs && Array.isArray(collaborativeRecs)) {
            collaborativeRecs.forEach((item, index) => {
                if (item && item._id) {
                    const itemId = item._id.toString();
                    const score = (collaborativeRecs.length - index) / collaborativeRecs.length * 0.7;
                    scoreMap.set(itemId, (scoreMap.get(itemId) || 0) + score);
                    entityMap.set(itemId, { ...item, source: 'collaborative' });
                }
            });
        }

        // Xử lý content-based results (trọng số 0.3) [Grok] Tăng trọng số để ưu tiên Flash Sale
        if (contentBasedItems && Array.isArray(contentBasedItems)) {
            for (let i = 0; i < Math.min(contentBasedItems.length, limit); i++) {
                const item = contentBasedItems[i];
                if (item && item._id && /^[0-9a-fA-F]{24}$/.test(item._id.toString())) {
                    const itemId = item._id.toString();
                    const score = (Math.min(contentBasedItems.length, limit) - i) / Math.min(contentBasedItems.length, limit) * 0.3;
                    scoreMap.set(itemId, (scoreMap.get(itemId) || 0) + score);

                    if (!entityMap.has(itemId)) {
                        entityMap.set(itemId, { ...item, source: 'content-based' });
                    }
                }
            }
        }

        // 6. Nếu vẫn không có gợi ý nào, fallback
        if (scoreMap.size === 0) {
            console.log('⚠️ Không có điểm số nào, fallback về popular items');
            const fallbackResult = await getFallbackRecommendations(role, limit);
            if (fallbackResult.length > 0) {
                await redisClient.setex(cacheKey, 1800, JSON.stringify(fallbackResult));
            }
            return fallbackResult;
        }

        // 7. Sắp xếp theo điểm số và lấy top items
        const topScoredItems = [...scoreMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([itemId, score]) => ({ itemId, score, entity: entityMap.get(itemId) }));

        console.log(`🎯 Top scored items: ${topScoredItems.length}`);

        // 8. Fetch thông tin chi tiết với timeout
        let result = [];
        try {
            const fetchTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Fetch timeout')), 8000); // 8 giây
            });

            const fetchPromise = fetchDetailedRecommendations(topScoredItems, role);
            result = await Promise.race([fetchPromise, fetchTimeout]);
        } catch (fetchError) {
            console.warn('⚠️ Lỗi khi fetch detailed recommendations:', fetchError.message);
            // Trả về những gì đã có trong collaborative recs
            result = collaborativeRecs.slice(0, limit) || [];
        }

        // 9. Đảm bảo result là array hợp lệ
        if (!result || !Array.isArray(result)) {
            console.warn('⚠️ Result không hợp lệ, sử dụng collaborative recs');
            result = collaborativeRecs.slice(0, limit) || [];
        }

        // 10. Nếu vẫn không có gì, fallback
        if (result.length === 0) {
            console.log('🔄 Không có result, fallback');
            result = await getFallbackRecommendations(role, limit);
        }

        // 11. Cache kết quả nếu có
        if (result.length > 0) {
            try {
                await redisClient.setex(cacheKey, 1800, JSON.stringify(result)); // Cache 30 phút
            } catch (cacheError) {
                console.warn('⚠️ Không thể cache result:', cacheError.message);
            }
        }

        console.log(`✅ Trả về ${result.length} hybrid recommendations`);
        return result;

    } catch (error) {
        console.error('❌ Lỗi trong getHybridRecommendations:', error);

        // Fallback error handling
        try {
            console.log('🔄 Fallback do lỗi trong hybrid recommendations...');
            const fallbackResult = await getFallbackRecommendations(role, limit);
            if (fallbackResult.length > 0) {
                await redisClient.setex(cacheKey, 1800, JSON.stringify(fallbackResult));
            }
            return fallbackResult;
        } catch (fallbackError) {
            console.error('❌ Lỗi fallback:', fallbackError);
            return []; // Trả về array rỗng thay vì throw error
        }
    }
}


// Hàm fetch thông tin chi tiết cho recommendations
async function fetchDetailedRecommendations(scoredItems, role) {
    const result = [];

    // Phân loại items theo type
    const itemsByType = {
        product: [],
        post: [],
        user: [],
        shop: []
    };

    // Phân loại và chuẩn bị IDs để query
    for (const { itemId, score, entity } of scoredItems) {
        if (entity && !entity.needsFetch) {
            // Đã có thông tin chi tiết từ collaborative filtering
            result.push({ ...entity, hybridScore: score });
        } else {
            // Cần fetch thông tin chi tiết
            // Xác định type dựa trên role và ưu tiên
            let assumedType = 'product'; // default
            if (role === 'user') {
                assumedType = Math.random() > 0.7 ? 'user' : 'product'; // 70% product, 30% user/shop
            } else if (role === 'shop') {
                assumedType = Math.random() > 0.8 ? 'user' : 'product'; // 80% product, 20% user
            }

            itemsByType[assumedType].push({ itemId, score });
        }
    }

    // Fetch theo batch để tối ưu hiệu suất
    const fetchPromises = [];

    if (itemsByType.product.length > 0) {
        fetchPromises.push(
            Product.find({
                _id: { $in: itemsByType.product.map(i => i.itemId) },
                isActive: true
            })
                .lean()
                .then(products => products.map(p => ({ ...p, type: 'product' })))
        );
    }

    if (itemsByType.post.length > 0) {
        fetchPromises.push(
            Post.find({
                _id: { $in: itemsByType.post.map(i => i.itemId) },
                privacy: 'public'
            })
                .populate('author._id', 'fullName avatar')
                .lean()
                .then(posts => posts.map(p => ({ ...p, type: 'post' })))
        );
    }

    if (itemsByType.user.length > 0) {
        fetchPromises.push(
            User.find({
                _id: { $in: itemsByType.user.map(i => i.itemId) },
                isActive: true
            })
                .select('fullName avatar coverImage slug bio')
                .lean()
                .then(async users => {
                    const usersWithStats = await Promise.all(
                        users.map(async u => ({
                            ...u,
                            type: 'user',
                            followersCount: await UserInteraction.countDocuments({
                                targetType: 'user',
                                targetId: u._id,
                                action: 'follow'
                            })
                        }))
                    );
                    return usersWithStats;
                })
        );
    }

    if (itemsByType.shop.length > 0) {
        fetchPromises.push(
            Shop.find({
                _id: { $in: itemsByType.shop.map(i => i.itemId) },
                'status.isActive': true,
                'status.isApprovedCreate': true
            })
                .select('name avatar coverImage slug description stats')
                .lean()
                .then(shops => shops.map(s => ({ ...s, type: 'shop' })))
        );
    }

    // Thực hiện tất cả fetch operations
    try {
        const fetchedResults = await Promise.all(fetchPromises);
        const allFetchedItems = fetchedResults.flat();

        // Gắn điểm số hybrid cho các item đã fetch
        for (const item of allFetchedItems) {
            const matchingScore = [...itemsByType.product, ...itemsByType.post, ...itemsByType.user, ...itemsByType.shop]
                .find(scored => scored.itemId === item._id.toString());

            if (matchingScore) {
                result.push({ ...item, hybridScore: matchingScore.score });
            }
        }

    } catch (fetchError) {
        console.error('❌ Lỗi khi fetch detailed recommendations:', fetchError);
    }

    // Sắp xếp theo hybridScore và giới hạn kết quả
    return result
        .sort((a, b) => (b.hybridScore || 0) - (a.hybridScore || 0))
        .slice(0, scoredItems.length);
}

// Hàm fallback khi không có gợi ý
async function getFallbackRecommendations(role, limit) {
    console.log(`🔄 Getting fallback recommendations for role: ${role}`);

    try {
        if (role === 'user') {
            // Fallback cho user: products phổ biến + shops nổi bật
            const [popularProducts, popularShops] = await Promise.all([
                Product.find({ isActive: true })
                    .sort({ soldCount: -1, 'ratings.avg': -1 })
                    .limit(Math.ceil(limit * 0.7))
                    .lean(),
                Shop.find({
                    'status.isActive': true,
                    'status.isApprovedCreate': true
                })
                    .sort({ 'stats.rating.avg': -1, 'stats.followers.length': -1 })
                    .limit(Math.ceil(limit * 0.3))
                    .lean()
            ]);

            return [
                ...popularProducts.map(p => ({ ...p, type: 'product' })),
                ...popularShops.map(s => ({ ...s, type: 'shop' }))
            ].slice(0, limit);

        } else if (role === 'shop') {
            // Fallback cho shop: trending posts + popular users
            const [trendingPosts, popularUsers] = await Promise.all([
                Post.find({ privacy: 'public' })
                    .sort({ likesCount: -1, commentsCount: -1, createdAt: -1 })
                    .populate('author._id', 'fullName avatar')
                    .limit(Math.ceil(limit * 0.6))
                    .lean(),
                User.find({ isActive: true })
                    .sort({ createdAt: -1 })
                    .select('fullName avatar coverImage slug bio')
                    .limit(Math.ceil(limit * 0.4))
                    .lean()
            ]);

            const usersWithFollowers = await Promise.all(
                popularUsers.map(async u => ({
                    ...u,
                    type: 'user',
                    followersCount: await UserInteraction.countDocuments({
                        targetType: 'user',
                        targetId: u._id,
                        action: 'follow'
                    })
                }))
            );

            return [
                ...trendingPosts.map(p => ({ ...p, type: 'post' })),
                ...usersWithFollowers
            ].slice(0, limit);
        }

        // Default fallback
        const popularProducts = await Product.find({ isActive: true })
            .sort({ soldCount: -1 })
            .limit(limit)
            .lean();

        return popularProducts.map(p => ({ ...p, type: 'product' }));

    } catch (error) {
        console.error('❌ Lỗi trong getFallbackRecommendations:', error);
        return [];
    }
}

//////////////////////

// Hàm lấy gợi ý Flash Sale và sản phẩm bên trong
async function getFlashSaleRecommendations(userId, sessionId, limit = 10, role = 'user') {
    try {
        const cacheKey = `recs:flashsale:${userId || sessionId}:${limit}:${role}`;
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('✅ Lấy flash sale recommendations từ cache');
            return JSON.parse(cached);
        }

        // 1. Lấy gợi ý Flash Sale từ hybrid recommendations
        let flashSaleRecs = await getHybridRecommendations(userId, sessionId, limit * 2, role);
        flashSaleRecs = flashSaleRecs.filter(item => item.type === 'flashsale');

        // 2. Lấy sản phẩm phổ biến trong Flash Sale từ lịch sử mua hàng
        const purchasedProducts = new Set();
        if (flashSaleRecs.length < limit) {
            const flashSaleInteractions = await UserInteraction.find({
                $or: [
                    { 'author._id': userId },
                    { sessionId: sessionId }
                ],
                targetType: 'flashsale',
                action: 'purchase',
                timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 ngày
            }).lean();

            for (const interaction of flashSaleInteractions) {
                if (interaction.targetDetails?.products) {
                    interaction.targetDetails.products.forEach(p => {
                        if (p.productId) purchasedProducts.add(p.productId);
                    });
                }
            }

            // Lấy thêm Flash Sale từ sản phẩm đã mua
            const relatedFlashSales = await FlashSale.find({
                'products.product': { $in: Array.from(purchasedProducts) },
                isActive: true
            })
                .select('name description products startTime endTime')
                .populate({
                    path: 'products.product',
                    select: 'name mainCategory price hashtags'
                })
                .lean();

            flashSaleRecs = [...flashSaleRecs, ...relatedFlashSales.map(fs => ({ ...fs, type: 'flashsale' }))];
        }

        // 3. Lấy sản phẩm được mua nhiều trong Flash Sale
        const productRecs = [];
        for (const flashSale of flashSaleRecs) {
            if (flashSale.products) {
                const sortedProducts = flashSale.products
                    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
                    .slice(0, 3); // Top 3 sản phẩm
                productRecs.push(
                    ...sortedProducts.map(p => ({
                        ...p.product,
                        type: 'product',
                        flashSaleId: flashSale._id,
                        salePrice: p.salePrice
                    }))
                );
            }
        }

        // 4. Kết hợp và giới hạn kết quả
        const result = {
            flashSales: flashSaleRecs.slice(0, limit),
            products: productRecs.slice(0, limit)
        };

        // 5. Cache kết quả
        await redisClient.setex(cacheKey, 1800, JSON.stringify(result)); // Cache 30 phút
        console.log(`✅ Trả về ${result.flashSales.length} flash sales và ${result.products.length} products`);
        return result;

    } catch (error) {
        console.error('❌ Lỗi trong getFlashSaleRecommendations:', error);
        return { flashSales: [], products: [] };
    }
}

/////////////////////

// Hàm debug để kiểm tra chi tiết quá trình recommendation 
async function debugGetCollaborativeRecommendations(userId, sessionId, limit = 10, role = 'user') {
    console.log(`🔍 DEBUG: Starting collaborative recommendations for userId: ${userId}, sessionId: ${sessionId}, role: ${role}`);

    try {
        const model = await loadMatrixFactorizationModel();
        if (!model) {
            console.warn('⚠️ Không có model để thực hiện recommendation');
            return [];
        }

        const { userEmbedding, entityEmbedding, users, entities } = model;
        const userIdx = users.indexOf(userId || sessionId);

        console.log(`🔍 DEBUG: User index: ${userIdx}, Total users: ${users.length}`);
        console.log(`🔍 DEBUG: Total entities: ${entities.length}`);

        if (userIdx === -1) {
            console.log(`⚠️ Không tìm thấy user ${userId || sessionId} trong model`);
            return [];
        }

        // Tính điểm số cho tất cả items
        const userVec = userEmbedding.slice([userIdx, 0], [1, userEmbedding.shape[1]]);
        const scores = tf.matMul(userVec, entityEmbedding, false, true).squeeze();
        const scoresArray = await scores.data();

        console.log(`🔍 DEBUG: Scores calculated, length: ${scoresArray.length}`);

        // Lấy top scores và debug
        const entityScores = entities.map((entityStr, idx) => {
            const parts = entityStr.split(':');
            const type = parts[0];
            const id = parts[1];

            if (!id || id === 'undefined' || id === 'null') {
                console.warn(`⚠️ ID không hợp lệ trong entity: ${entityStr}`);
                return null;
            }

            return {
                entityId: id,
                entityType: type,
                score: scoresArray[idx],
                originalEntityStr: entityStr
            };
        }).filter(item => item !== null);

        console.log(`🔍 DEBUG: Valid entity scores: ${entityScores.length}`);
        console.log(`🔍 DEBUG: Sample entity scores:`, entityScores.slice(0, 5));

        // Lọc theo vai trò
        let filteredEntities = entityScores;
        if (role === 'user') {
            filteredEntities = entityScores.filter(e => ['product', 'post', 'user', 'shop'].includes(e.entityType));
        } else if (role === 'shop') {
            filteredEntities = entityScores.filter(e => ['product', 'post', 'user'].includes(e.entityType));
        }

        console.log(`🔍 DEBUG: After role filtering (${role}): ${filteredEntities.length}`);

        // Sắp xếp và lấy top
        const topEntities = filteredEntities
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        console.log(`🔍 DEBUG: Top entities selected: ${topEntities.length}`);
        console.log(`🔍 DEBUG: Top entities details:`, topEntities.map(e => ({
            type: e.entityType,
            id: e.entityId,
            score: e.score
        })));

        // Cleanup tensors
        userVec.dispose();
        scores.dispose();

        // Lấy thông tin chi tiết
        const result = [];
        for (const entity of topEntities) {
            if (!entity.entityId || entity.entityId === 'undefined' || entity.entityId === 'null') {
                console.warn(`⚠️ Bỏ qua entity với ID không hợp lệ:`, entity);
                continue;
            }

            if (!/^[0-9a-fA-F]{24}$/.test(entity.entityId)) {
                console.warn(`⚠️ ID không đúng định dạng ObjectId: ${entity.entityId}`);
                continue;
            }

            try {
                let item = null;
                if (entity.entityType === 'product') {
                    item = await Product.findById(entity.entityId).lean();
                    if (item) {
                        console.log(`✅ Found product: ${item.name}`);
                        result.push({ ...item, type: 'product' });
                    }
                } else if (entity.entityType === 'post') {
                    item = await Post.findById(entity.entityId).lean();
                    if (item) {
                        console.log(`✅ Found post: ${entity.entityId}`);
                        result.push({ ...item, type: 'post' });
                    }
                } else if (entity.entityType === 'user') {
                    item = await User.findById(entity.entityId).lean();
                    if (item) {
                        const followersCount = await UserInteraction.countDocuments({
                            targetType: 'user',
                            targetId: entity.entityId,
                            action: 'follow'
                        });
                        console.log(`✅ Found user: ${item.username || item.email}`);
                        result.push({ ...item, type: 'user', followersCount });
                    }
                } else if (entity.entityType === 'shop') {
                    item = await Shop.findById(entity.entityId).lean();
                    if (item) {
                        const followersCount = await UserInteraction.countDocuments({
                            targetType: 'shop',
                            targetId: entity.entityId,
                            action: 'follow'
                        });
                        console.log(`✅ Found shop: ${item.name || item._id}`);
                        result.push({ ...item, type: 'shop', followersCount });
                    }
                }

                if (!item) {
                    console.warn(`⚠️ Không tìm thấy ${entity.entityType} với ID: ${entity.entityId}`);
                }
            } catch (dbError) {
                console.error(`❌ Lỗi khi query ${entity.entityType} với ID ${entity.entityId}:`, dbError.message);
                continue;
            }
        }

        console.log(`🔍 DEBUG: Final result count: ${result.length}`);
        console.log(`🔍 DEBUG: Result types:`, result.map(r => r.type));

        return result;
    } catch (error) {
        console.error('❌ Lỗi trong debugGetCollaborativeRecommendations:', error);
        return [];
    }
}

// Sửa lại hàm getHybridRecommendations với debug
async function debugGetHybridRecommendations(userId, sessionId, limit = 10, role = 'user') {
    console.log(`🔍 DEBUG HYBRID: Starting hybrid recommendations for userId: ${userId}, sessionId: ${sessionId}, role: ${role}`);

    try {
        // Sử dụng hàm debug collaborative
        const collaborativeRecs = await debugGetCollaborativeRecommendations(userId, sessionId, limit * 2, role);
        console.log(`🔍 DEBUG HYBRID: Collaborative recs count: ${collaborativeRecs.length}`);
        console.log(`🔍 DEBUG HYBRID: Collaborative types:`, collaborativeRecs.map(r => r.type));

        const contentRecs = [];

        // Lấy các entity người dùng đã tương tác
        const interactions = await UserInteraction.find({
            $or: [{ 'author._id': userId }, { sessionId }],
            action: { $in: ['view', 'like', 'purchase', 'add_to_cart', 'search'] },
            targetId: { $exists: true, $ne: null }
        }).sort({ timestamp: -1 }).limit(5);

        console.log(`🔍 DEBUG HYBRID: Found ${interactions.length} recent interactions`);

        // Gợi ý dựa trên nội dung của các mục đã tương tác
        for (const interaction of interactions) {
            try {
                if (interaction.targetType === 'search') {
                    if (interaction.searchSignature && typeof interaction.searchSignature === 'object') {
                        const searchQuery = interaction.searchSignature.query;
                        const category = interaction.searchSignature.category;
                        const hashtags = interaction.searchSignature.hashtags;
                        const searchBasedRecs = await getContentBasedRecommendationsFromSearch(searchQuery, category, hashtags, Math.ceil(limit / 2));
                        contentRecs.push(...searchBasedRecs);
                    }
                } else {
                    if (interaction.targetId && /^[0-9a-fA-F]{24}$/.test(interaction.targetId.toString())) {
                        const recs = await getContentBasedRecommendations(interaction.targetId.toString(), Math.ceil(limit / 2));
                        contentRecs.push(...recs);
                    }
                }
            } catch (interactionError) {
                console.warn(`⚠️ Lỗi khi xử lý interaction ${interaction._id}:`, interactionError.message);
                continue;
            }
        }

        console.log(`🔍 DEBUG HYBRID: Content recs count: ${contentRecs.length}`);

        // Kết hợp điểm số
        const scoreMap = new Map();

        // Điểm từ collaborative filtering (trọng số 0.7)
        collaborativeRecs.forEach((item, idx) => {
            if (item && item._id) {
                const score = (1 - idx / collaborativeRecs.length) * 0.7;
                scoreMap.set(item._id.toString(), (scoreMap.get(item._id.toString()) || 0) + score);
            }
        });

        // Điểm từ content-based filtering (trọng số 0.3)
        contentRecs.forEach((itemId, idx) => {
            if (itemId && /^[0-9a-fA-F]{24}$/.test(itemId)) {
                const score = (1 - idx / contentRecs.length) * 0.3;
                scoreMap.set(itemId, (scoreMap.get(itemId) || 0) + score);
            }
        });

        console.log(`🔍 DEBUG HYBRID: Score map size: ${scoreMap.size}`);

        // Nếu không có gợi ý từ cả hai phương pháp, trả về gợi ý collaborative
        if (scoreMap.size === 0) {
            console.log('⚠️ Không có điểm số nào, trả về collaborative recs');
            return collaborativeRecs.slice(0, limit);
        }

        // Sắp xếp và lấy top
        const recommendations = [...scoreMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit * 2) // Lấy nhiều hơn để có đủ sau khi filter
            .map(([itemId, score]) => {
                const match = collaborativeRecs.find(r => r._id && r._id.toString() === itemId);
                return match || { _id: itemId, score };
            });

        console.log(`🔍 DEBUG HYBRID: Pre-filter recommendations: ${recommendations.length}`);

        // Lấy thông tin chi tiết cho những item chưa có thông tin
        const result = [];
        for (const rec of recommendations) {
            if (!rec._id) continue;

            const recId = rec._id.toString();

            // Nếu đã có type, thêm vào result
            if (rec.type) {
                result.push(rec);
                continue;
            }

            // Nếu chưa có type, cần query để xác định
            try {
                // Thử tìm trong các collection
                let item = null;
                let itemType = null;

                // Thử product trước
                item = await Product.findById(recId).lean();
                if (item) {
                    itemType = 'product';
                } else {
                    // Thử post
                    item = await Post.findById(recId).lean();
                    if (item) {
                        itemType = 'post';
                    } else {
                        // Thử user
                        item = await User.findById(recId).lean();
                        if (item) {
                            itemType = 'user';
                            const followersCount = await UserInteraction.countDocuments({
                                targetType: 'user',
                                targetId: recId,
                                action: 'follow'
                            });
                            item.followersCount = followersCount;
                        } else {
                            // Thử shop
                            item = await Shop.findById(recId).lean();
                            if (item) {
                                itemType = 'shop';
                                const followersCount = await UserInteraction.countDocuments({
                                    targetType: 'shop',
                                    targetId: recId,
                                    action: 'follow'
                                });
                                item.followersCount = followersCount;
                            }
                        }
                    }
                }

                if (item && itemType) {
                    result.push({ ...item, type: itemType });
                }
            } catch (dbError) {
                console.error(`❌ Lỗi khi query item với ID ${recId}:`, dbError.message);
                continue;
            }
        }

        console.log(`🔍 DEBUG HYBRID: Final result count: ${result.length}`);
        console.log(`🔍 DEBUG HYBRID: Final result types:`, result.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
        }, {}));

        return result;

    } catch (error) {
        console.error('❌ Lỗi trong debugGetHybridRecommendations:', error);
        return [];
    }
}

/////////////// CLEARRRRRR
// Thêm hàm để clear cache khi cần (modelCache)
function clearModelCache() {
    if (modelCache) {
        // Dispose tensors to free memory
        if (modelCache.userEmbedding) modelCache.userEmbedding.dispose();
        if (modelCache.entityEmbedding) modelCache.entityEmbedding.dispose();
        modelCache = null;
        modelCacheTime = null;
        console.log('✅ Model cache cleared');
    }
}

// Thêm hàm để clear cache khi cần (mdModelCache)
function clearMFModelCache() {
    console.log('🗑️ Clearing MF Model cache...');

    if (mfModelCache) {
        if (mfModelCache.userEmbedding) mfModelCache.userEmbedding.dispose();
        if (mfModelCache.entityEmbedding) mfModelCache.entityEmbedding.dispose();
    }

    mfModelCache = null;
    mfModelCacheTime = null;
    console.log('✅ MF Model cache cleared');
}

//Clear cả 2
function clearAllModelCache() {
    clearModelCache();
    clearMFModelCache();
    console.log('✅ All model caches cleared');
}

module.exports = {
    prepareUserEntityMatrix,
    trainUserShopModel,
    trainMatrixFactorization,
    loadMatrixFactorizationModel,
    prepareTfIdfMatrix,
    getUserShopRecommendations,
    getCollaborativeRecommendations,
    getContentBasedRecommendations,
    getContentBasedRecommendationsFromSearch,
    getContentBasedRecommendationsFromUserHistory,
    getHybridRecommendations,
    getFlashSaleRecommendations,

    debugGetCollaborativeRecommendations,
    debugGetHybridRecommendations,

    clearModelCache,
    clearMFModelCache,
    clearAllModelCache,
};