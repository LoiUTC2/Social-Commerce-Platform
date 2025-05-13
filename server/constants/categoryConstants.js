const MAIN_CATEGORIES = [
    "Công nghệ", "Thời trang", "Nội thất", "Xe cộ", "Đồ gia dụng",
    "Thể thao", "Giải trí", "Sức khỏe & Làm đẹp", "Đồ ăn & Đồ uống", "Sách & Văn phòng phẩm"
];

const SUB_CATEGORIES = {
    "Công nghệ": [
        "Điện thoại", "Laptop", "Tablet", "Phụ kiện", "Máy ảnh", "Gaming", "Âm thanh", "Smartwatch",
        "Điện thoại Android", "Điện thoại iPhone", "Laptop Windows", "Laptop Macbook", "Bàn phím cơ", "Chuột gaming"
    ],
    "Thời trang": [
        "Sneakers", "Đồng hồ", "Mỹ phẩm", "Nước hoa", "Quần áo nam", "Quần áo nữ", "Túi xách",
        "Quần jean nam", "Áo khoác nữ", "Giày cao gót", "Đồ thể thao nam", "Đồ thể thao nữ"
    ],
    "Nội thất": [
        "Ghế", "Bàn", "Đèn trang trí", "Giường ngủ", "Tủ quần áo",
        "Ghế gaming", "Bàn làm việc", "Bàn trang điểm", "Tủ giày", "Rèm cửa"
    ],
    "Xe cộ": [
        "Xe máy", "Ô tô", "Xe điện", "Phụ kiện xe", "Dầu nhớt",
        "Xe đạp", "Đồ độ xe máy", "Lốp xe ô tô", "Camera hành trình", "Máy bơm xe"
    ],
    "Đồ gia dụng": [
        "Điện lạnh", "Bếp", "Thiết bị vệ sinh", "Dụng cụ nhà bếp", "Gia dụng thông minh",
        "Máy lọc không khí", "Máy giặt", "Bếp từ", "Nồi chiên không dầu", "Đèn LED thông minh"
    ],
    "Thể thao": [
        "Bóng đá", "Gym", "Yoga", "Thiết bị thể thao", "Giày thể thao",
        "Vợt cầu lông", "Găng tay boxing", "Xe đạp thể thao", "Thảm yoga", "Đồng hồ theo dõi vận động"
    ],
    "Giải trí": [
        "Đồ chơi", "Nhạc cụ", "Game console", "Dụng cụ quay phim",
        "Đồ chơi trẻ em", "Đàn guitar", "Máy chơi game PS5", "Drone", "Micro thu âm"
    ],
    "Sức khỏe & Làm đẹp": [
        "Dụng cụ y tế", "Thực phẩm chức năng", "Máy massage",
        "Sữa rửa mặt", "Kem chống nắng", "Máy đo huyết áp", "Tảo Spirulina", "Mặt nạ dưỡng da"
    ],
    "Đồ ăn & Đồ uống": [
        "Snack", "Thực phẩm tươi sống", "Đồ uống có cồn", "Cà phê",
        "Trà sữa", "Mật ong", "Thịt bò nhập khẩu", "Bánh kẹo ngoại", "Nước ngọt có ga"
    ],
    "Sách & Văn phòng phẩm": [
        "Sách giáo khoa", "Văn phòng phẩm", "Truyện tranh", "Tiểu thuyết",
        "Sách kinh doanh", "Sách phát triển bản thân", "Bút máy", "Giấy A4", "Sổ tay ghi chú"
    ]
};

module.exports = { MAIN_CATEGORIES, SUB_CATEGORIES };