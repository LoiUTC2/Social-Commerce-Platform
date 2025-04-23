const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization; //nằm trong header có dạng Authorization: Bearer <token>
    const token = authHeader && authHeader.split(" ")[1]; //Tách chuỗi Bearer <token> thành mảng ["Bearer", "<token>"], lấy phần tử thứ 1 (<token>).

    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //giải mã và xác minh token, trả về dữ liệu đã mã hóa (userId, email,...)
        req.user = decoded; // lưu thông tin user vào request
        next();
    } catch (err) {
        res.status(403).json({ message: "Token không hợp lệ" });
    }
};

// Chặn route nếu không đúng vai trò
exports.requireRole = (roles = []) => {
    if (typeof roles === "string") roles = [roles];

    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }
        next();
    };
};
