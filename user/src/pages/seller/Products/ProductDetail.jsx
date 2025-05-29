import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Package, ArrowLeft, Edit, CheckCircle, XCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { getProductDetailForSeller } from '../../../services/productService';
import { getCategoryTree } from '../../../services/categoryService';

export default function ProductDetail() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [categoryPath, setCategoryPath] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Lấy danh mục từ API
    const fetchCategories = async () => {
        try {
            const response = await getCategoryTree();
            console.log('Categories fetched:', response.data.tree);
            return response.data.tree || [];
        } catch (error) {
            toast.error('Lỗi', { description: 'Không thể tải danh mục. Vui lòng thử lại.' });
            console.error('Lỗi khi lấy danh mục:', error);
            throw error;
        }
    };

    // Tìm đường dẫn danh mục dựa trên _id
    const findCategoryPath = (categoryId, categories) => {
        // Kiểm tra categories có phải là mảng
        if (!Array.isArray(categories)) {
            console.error('Categories is not an array:', categories);
            return 'Không xác định';
        }

        for (const cat of categories) {
            // Kiểm tra danh mục cấp 1
            if (cat._id === categoryId) {
                return cat.name;
            }

            // Kiểm tra children của cấp 1
            if (Array.isArray(cat.children)) {
                for (const child of cat.children) {
                    // Kiểm tra danh mục cấp 2
                    if (child._id === categoryId) {
                        return `${cat.name} > ${child.name}`;
                    }

                    // Kiểm tra children của cấp 2
                    if (Array.isArray(child.children)) {
                        for (const grandchild of child.children) {
                            // Kiểm tra danh mục cấp 3
                            if (grandchild._id === categoryId) {
                                const path = `${cat.name} > ${child.name} > ${grandchild.name}`;
                                console.log('Product PATH maincategory:', path);
                                return path;
                            }
                        }
                    } else {
                        console.warn(`Child "${child.name}" has invalid children:`, child.children);
                    }
                }
            } else {
                console.warn(`Category "${cat.name}" has invalid children:`, cat.children);
            }
        }

        console.warn(`Category ID "${categoryId}" not found in categories`);
        return 'Không xác định';
    };

    // Lấy dữ liệu sản phẩm và danh mục
    const fetchProductDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const categories = await fetchCategories();
            const response = await getProductDetailForSeller(slug);
            const productData = response.data.product;
            const productDataStats = response.data.stats;

            console.log('Product data:', productData);
            console.log('Product variants:', productData.variants);
            console.log('Product maincategoryID:', productData.mainCategory._id);
            console.log('Product maincategory:', productData.mainCategory);

            // Đảm bảo variants luôn là mảng
            setProduct({ ...productData, variants: productData.variants || [] });
            // Tìm đường dẫn danh mục dựa trên mainCategory
            if (productData.mainCategory && productData.mainCategory._id) {
                const path = findCategoryPath(productData.mainCategory._id, categories);
                setCategoryPath(path);
            }
        } catch (error) {
            setError('Không thể lấy thông tin sản phẩm hoặc danh mục.');
            toast.error('Lỗi', { description: 'Không thể lấy thông tin sản phẩm. Vui lòng thử lại sau.' });
            console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductDetail();
    }, [slug]);

    const handleGoBack = () => {
        navigate('/seller/products');
    };

    const handleEdit = () => {
        navigate(`/seller/edit-product/${slug}`);
    };

    if (loading) {
        return <div className="container mx-auto py-6">Đang tải...</div>;
    }

    if (error || !product) {
        return <div className="container mx-auto py-6">{error || 'Không tìm thấy sản phẩm.'}</div>;
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6" /> Chi tiết sản phẩm
                    </h1>
                </div>

                <Button onClick={handleEdit} className="bg-pink-500 hover:bg-pink-600">
                    <Edit className="h-4 w-4 mr-2" /> Chỉnh sửa sản phẩm
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thông tin cơ bản */}
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Thông tin sản phẩm</CardTitle>
                        <CardDescription>Chi tiết về sản phẩm của bạn</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tên sản phẩm</p>
                                <div className="max-w-full break-words" title={product.name}>
                                    <p className="text-base">{product.name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Thương hiệu</p>
                                <div className="max-w-full break-words">
                                    <p className="text-base">{product.brand || 'Không có'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Mã SKU</p>
                                <div className="flex items-center gap-2 max-w-full break-words">
                                    <p className="text-base">{product.sku || 'N/A'}</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(product.sku || 'N/A');
                                            toast.success('Đã sao chép mã SKU!');
                                        }}
                                    >
                                        <Copy className="w-2 h-2 mr-2" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Số lượng đã bán</p>
                                <p className="text-base">{product.soldCount || 0}</p>
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Mô tả sản phẩm</p>
                            <div className="max-w-full break-words max-h-40 overflow-y-auto">
                                <p className="text-base whitespace-pre-wrap">{product.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Giá bán</p>
                                <p className="text-base">
                                    {typeof product.price === 'number'
                                        ? `${product.price.toLocaleString('vi-VN')} VNĐ`
                                        : 'Không xác định'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Giảm giá</p>
                                <p className="text-base">
                                    {typeof product.discount === 'number'
                                        ? `${product.discount.toLocaleString('vi-VN')} %`
                                        : 'Không có'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Số lượng tồn kho</p>
                                <p className="text-base">{typeof product.stock === 'number' ? product.stock : 'Không xác định'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Danh mục</p>
                                <Badge variant="outline">{categoryPath}</Badge>
                                {/* <div className="flex gap-2">
                                    {product.categoryPath && product.categoryPath.length > 0 ? (
                                        product.categoryPath.map((categoryPath, index) => (
                                            <Badge key={index} variant="outline">{categoryPath.name}</Badge>
                                        ))
                                    ) : (
                                        <p className="text-base">Không có</p>
                                    )}
                                </div> */}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tình trạng</p>
                                <p className="text-base">{product.condition === 'new' ? 'Mới' : 'Đã sử dụng'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Trạng thái</p>
                                {product.isActive ? (
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Đang bán
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-gray-500">
                                        <XCircle className="w-3 h-3 mr-1" /> Ngừng bán
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Thẻ (hashtags)</p>
                            <div className="flex gap-2">
                                {product.hashtags && product.hashtags.length > 0 ? (
                                    product.hashtags.map((tag, index) => (
                                        <Badge key={index} variant="outline">{tag}</Badge>
                                    ))
                                ) : (
                                    <p className="text-base">Không có</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-medium text-gray-500">Slug</p>
                            <div className="max-w-full break-words">
                                <p className="text-base whitespace-pre-wrap">{product.slug || 'N/A'}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(product.slug || 'N/A');
                                        toast.success('Đã sao chép slug!');
                                    }}
                                >
                                    <Copy className="w-2 h-2" />
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Ngày tạo</p>
                                <p className="text-base">
                                    {product.createdAt
                                        ? new Date(product.createdAt).toLocaleDateString('vi-VN')
                                        : 'Không xác định'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Ngày cập nhật</p>
                                <p className="text-base">
                                    {product.updatedAt
                                        ? new Date(product.updatedAt).toLocaleDateString('vi-VN')
                                        : 'Không xác định'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Media và Biến thể */}
                <div className="col-span-1 space-y-6">
                    {/* Ảnh/Video sản phẩm */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hình ảnh/Video sản phẩm</CardTitle>
                            <CardDescription>Hình ảnh và video của sản phẩm</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {(product.images?.length > 0 || product.videos?.length > 0) ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {product.images?.map((image, index) => (
                                        <img
                                            key={`image-${index}`}
                                            src={image}
                                            alt={`Product image ${index}`}
                                            className="h-24 w-full object-cover rounded-md border border-gray-200"
                                        />
                                    ))}
                                    {product.videos?.map((video, index) => (
                                        <video
                                            key={`video-${index}`}
                                            src={video}
                                            controls
                                            className="h-24 w-full object-cover rounded-md border border-gray-200"
                                        />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">Không có hình ảnh hoặc video.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Biến thể sản phẩm */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Biến thể sản phẩm</CardTitle>
                            <CardDescription>Các biến thể của sản phẩm</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {!Array.isArray(product.variants) || product.variants.length === 0 ? (
                                <p className="text-center text-gray-500">Không có biến thể nào.</p>
                            ) : (
                                product.variants.map((variant, index) => (
                                    <div key={index} className="border rounded-md p-3 space-y-2">
                                        <p className="font-medium">{variant.name || 'Không xác định'}</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Array.isArray(variant.options) && variant.options.length > 0 ? (
                                                variant.options.map((option, optIndex) => (
                                                    <Badge key={optIndex} variant="outline">{option}</Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-500">Không có tùy chọn</p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}