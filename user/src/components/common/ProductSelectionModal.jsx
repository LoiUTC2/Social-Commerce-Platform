import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

import { X, Search, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProductsForPosts } from '../../services/productService';

//DÙNG CHO MỌI NGƯỜI ĐỀU ĐĂNG KÈM SẢN PHẨM ĐÓ ĐƯỢC, nếu như seller cho phép
const ProductSelectionModal = ({ open, onOpenChange, onSelectProducts, selectedProducts = [] }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSelected, setTempSelected] = useState(selectedProducts);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);

    // Fetch sản phẩm từ API getProductsForPosts
    const fetchProducts = async (page = 1, search = '') => {
        setLoading(true);
        setError(null);

        try {
            const response = await getProductsForPosts(page, 12, search);

            if (response.success) {
                setProducts(response.data.products);
                setPagination(response.data.pagination);
            } else {
                setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
                setProducts([]);
                setPagination({});
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
            setProducts([]);
            setPagination({});
        } finally {
            setLoading(false);
        }
    };

    // Load sản phẩm khi mở modal
    useEffect(() => {
        if (open) {
            setTempSelected(selectedProducts);
            setCurrentPage(1);
            fetchProducts(1, searchTerm);
        }
    }, [open, selectedProducts]);

    // Tìm kiếm với debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (open) {
                setCurrentPage(1);
                fetchProducts(1, searchTerm);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, open]);

    const handleToggleProduct = (product) => {
        // Với API getProductsForPosts, tất cả sản phẩm trả về đều có thể chọn
        // vì đã được filter isActive: true và allowPosts: true từ backend
        setTempSelected(prev => {
            const exists = prev.find(p => p._id === product._id);
            if (exists) {
                return prev.filter(p => p._id !== product._id);
            } else {
                return [...prev, product];
            }
        });
    };

    const handleConfirm = () => {
        onSelectProducts(tempSelected);
        onOpenChange(false);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getFinalPrice = (price, discount) => {
        return discount > 0 ? price * (1 - discount / 100) : price;
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        fetchProducts(newPage, searchTerm);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <ShoppingBag size={20} />
                        Chọn sản phẩm để gắn thẻ
                    </DialogTitle>
                </DialogHeader>

                {/* Thanh tìm kiếm */}
                <div className="flex-shrink-0 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Tìm kiếm sản phẩm theo tên, mô tả, hashtag..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Thông tin kết quả */}
                    {pagination.total !== undefined && !loading && (
                        <div className="flex gap-4 text-sm">
                            <Badge variant="outline" className="text-blue-600">
                                Tìm thấy: {pagination.total} sản phẩm
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                                Đã chọn: {tempSelected.length}
                            </Badge>
                        </div>
                    )}

                    {/* Hiển thị lỗi nếu có */}
                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}
                </div>

                {/* Danh sách sản phẩm */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="text-gray-500">Đang tải sản phẩm...</div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                            <Package size={48} className="mb-2" />
                            <div>Không tìm thấy sản phẩm nào</div>
                            {searchTerm && (
                                <div className="text-sm">
                                    Thử tìm kiếm với từ khóa khác
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {products.map(product => {
                                const isSelected = tempSelected.find(p => p._id === product._id);
                                const finalPrice = getFinalPrice(product.price, product.discount);

                                return (
                                    <div
                                        key={product._id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all relative ${isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                        onClick={() => handleToggleProduct(product)}
                                    >
                                        {/* Hiển thị trạng thái hết hàng */}
                                        {product.stock === 0 && (
                                            <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                                Hết hàng
                                            </div>
                                        )}

                                        {/* Hiển thị shop name nếu có */}
                                        {product.seller?.shopName && (
                                            <div className="absolute top-1 right-1 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                                                {product.seller.shopName}
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <img
                                                src={product.images?.[0] || 'https://via.placeholder.com/80x80?text=No+Image'}
                                                alt={product.name}
                                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm line-clamp-2 mb-1">
                                                    {product.name}
                                                </div>

                                                <div className="flex items-center gap-2 mb-1">
                                                    {product.discount > 0 ? (
                                                        <>
                                                            <span className="text-red-600 font-semibold text-sm">
                                                                {formatPrice(finalPrice)}
                                                            </span>
                                                            <span className="text-gray-400 line-through text-xs">
                                                                {formatPrice(product.price)}
                                                            </span>
                                                            <Badge variant="destructive" className="text-xs px-1 py-0">
                                                                -{product.discount}%
                                                            </Badge>
                                                        </>
                                                    ) : (
                                                        <span className="text-blue-600 font-semibold text-sm">
                                                            {formatPrice(product.price)}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>Kho: {product.stock}</span>
                                                    <span>Đã bán: {product.soldCount}</span>
                                                </div>

                                                {/* Hiển thị rating nếu có */}
                                                {product.ratings?.avg > 0 && (
                                                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                                        <span>⭐ {product.ratings.avg.toFixed(1)}</span>
                                                        <span>({product.ratings.count})</span>
                                                    </div>
                                                )}

                                                {/* Hiển thị danh mục nếu có */}
                                                {product.mainCategory?.name && (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        {product.mainCategory.name}
                                                    </div>
                                                )}

                                                <div className="text-xs text-gray-400 mt-1">
                                                    SKU: {product.sku}
                                                </div>
                                            </div>

                                            {isSelected && (
                                                <div className="text-blue-500 flex-shrink-0">
                                                    <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">
                                                        ✓
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Phân trang */}
                {pagination.totalPages > 1 && (
                    <div className="flex-shrink-0 flex justify-center gap-2 pt-3 border-t">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            Trước
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                const page = i + Math.max(1, currentPage - 2);
                                if (page > pagination.totalPages) return null;

                                return (
                                    <Button
                                        key={page}
                                        variant={page === currentPage ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handlePageChange(page)}
                                        className="w-8 h-8 p-0"
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={currentPage === pagination.totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            Sau
                        </Button>
                    </div>
                )}

                {/* Nút xác nhận */}
                <div className="flex-shrink-0 flex gap-2 pt-3 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                        Hủy
                    </Button>
                    <Button onClick={handleConfirm} className="flex-1">
                        Xác nhận ({tempSelected.length} sản phẩm)
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProductSelectionModal;