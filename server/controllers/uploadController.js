exports.uploadFile = (req, res) => {
    if (!req.file) return res.status(400).json({ message: "Không có file" });

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    res.json({
        success: true,
        message: "Tải lên thành công",
        url: fileUrl
    });
};
