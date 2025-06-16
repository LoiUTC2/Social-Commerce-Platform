const requestLogger = (req, res, next) => {
    const startTime = Date.now();

    // Log request
    console.log(`📝 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log(`📝 Query params:`, req.query);
    console.log(`📝 Headers:`, req.headers);

    // Intercept response
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        console.log(`📝 Response [${res.statusCode}] - ${duration}ms`);
        console.log(`📝 Response data length:`, data ? data.length : 0);

        // Log first 500 chars of response for debugging
        if (data && typeof data === 'string') {
            console.log(`📝 Response preview:`, data.substring(0, 500) + (data.length > 500 ? '...' : ''));
        }

        return originalSend.call(this, data);
    };

    next();
};

module.exports = { requestLogger};