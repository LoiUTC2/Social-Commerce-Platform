import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '../../components//ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';

import { X, Search, Package, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProductsByShopForUser } from '../../services/productService';

const ProductSelectionModal = ({ open, onOpenChange, onSelectProducts, selectedProducts = [] }) => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [tempSelected, setTempSelected] = useState(selectedProducts);
    const [stats, setStats] = useState({});
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [error, setError] = useState(null);

    // Fetch sản phẩm từ shop của seller
    const fetchProducts = async (page = 1, search = '', status = 'active') => {
        if (!user?.shopId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = await getProductsByShopForUser(
                user.shopId, 
                page, 
                12, // limit
                'newest' // sort
            );

            if (response.success) {
                let filteredProducts = response.data.products;

                // Lọc theo tìm kiếm nếu có
                if (search) {
                    filteredProducts = filteredProducts.filter(product =>
                        product.name.toLowerCase().includes(search.toLowerCase()) ||
                        product.sku.toLowerCase().includes(search.toLowerCase()) ||
                        (product.brand && product.brand.toLowerCase().includes(search.toLowerCase()))
                    );
                }

                // Lọc theo trạng thái - chỉ lấy sản phẩm có thể đăng bài
                if (status === 'active') {
                    filteredProducts = filteredProducts.filter(p => p.isActive && p.allowPosts);
                } else if (status === 'inactive') {
                    filteredProducts = filteredProducts.filter(p => !p.isActive || !p.allowPosts);
                }

                setProducts(filteredProducts);
                
                // Tính toán thống kê từ dữ liệu đã lọc
                const allProducts = response.data.products;
                const calculatedStats = {
                    total: filteredProducts.length,
                    active: allProducts.filter(p => p.isActive && p.allowPosts).length,
                    inactive: allProducts.filter(p => !p.isActive || !p.allowPosts).length,
                    outOfStock: allProducts.filter(p => p.stock === 0).length,
                    lowStock: allProducts.filter(p => p.stock > 0 && p.stock <= 5).length
                };
                setStats(calculatedStats);

                // Cập nhật pagination info
                setPagination({
                    page: response.data.pagination?.page || page,
                    limit: response.data.pagination?.limit || 12,
                    total: filteredProducts.length,
                    totalPages: Math.ceil(filteredProducts.length / 12)
                });
            }
        } catch (error) {
            console.error('Lỗi khi tải sản phẩm:', error);
            setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Load sản phẩm khi mở modal
    useEffect(() => {
        if (open && user?.shopId) {
            setTempSelected(selectedProducts);
            setCurrentPage(1);
            fetchProducts(1, searchTerm);
        }
    }, [open, user?.shopId, selectedProducts]);

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
        // Chỉ cho phép chọn sản phẩm active và allowPosts
        if (!product.isActive || !product.allowPosts) return;

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

                {/* Thanh tìm kiếm và thống kê */}
                <div className="flex-shrink-0 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <Input
                            placeholder="Tìm kiếm sản phẩm theo tên, SKU, thương hiệu..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Thống kê nhanh */}
                    {stats.total !== undefined && (
                        <div className="flex gap-4 text-sm">
                            <Badge variant="outline" className="text-green-600">
                                Có thể đăng: {stats.active}
                            </Badge>
                            <Badge variant="outline" className="text-red-600">
                                Không thể đăng: {stats.inactive}
                            </Badge>
                            <Badge variant="outline" className="text-orange-600">
                                Hết hàng: {stats.outOfStock}
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
                                const canSelect = product.isActive && product.allowPosts;
                                const finalPrice = getFinalPrice(product.price, product.discount);

                                return (
                                    <div
                                        key={product._id}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all relative ${
                                            isSelected
                                                ? 'border-blue-500 bg-blue-50'
                                                : canSelect
                                                ? 'border-gray-200 hover:border-gray-300'
                                                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-75'
                                        }`}
                                        onClick={() => handleToggleProduct(product)}
                                    >
                                        {/* Trạng thái sản phẩm */}
                                        {!canSelect && (
                                            <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                                {!product.isActive ? 'Ngừng bán' : 'Không cho đăng'}
                                            </div>
                                        )}

                                        {product.stock === 0 && (
                                            <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-1 rounded">
                                                Hết hàng
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

                                                <div className="text-xs text-gray-400 mt-1">
                                                    SKU: {product.sku}
                                                </div>
                                            </div>

                                            {isSelected && canSelect && (
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