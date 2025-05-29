import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '../../../components/ui/pagination';
import { Package, Search, PlusCircle, Download, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Eye, RefreshCw, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';
import { toggleProductStatus, deleteProduct, getProductsByShopForSeller } from '../../../services/productService';
import { getCategoryTree } from '../../../services/categoryService';
import { useAuth } from '../../../contexts/AuthContext';

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

// Tìm đường dẫn danh mục dựa trên _id
const findCategoryPath = (categoryId, categories) => {
  if (!Array.isArray(categories)) {
    console.error('Categories is not an array:', categories);
    return 'Không xác định';
  }
  for (const cat of categories) {
    if (cat._id === categoryId) return cat.name;
    if (Array.isArray(cat.children)) {
      for (const child of cat.children) {
        if (child._id === categoryId) return `${cat.name} > ${child.name}`;
        if (Array.isArray(child.children)) {
          for (const grandchild of child.children) {
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

export default function Products() {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Lấy danh mục từ API
  const fetchCategories = async () => {
    try {
      const response = await getCategoryTree();
      const normalizedCategories = (response.data.tree || []).map(cat => ({
        ...cat,
        children: Array.isArray(cat.children)
          ? cat.children.map(child => ({
              ...child,
              children: Array.isArray(child.children) ? child.children : []
            }))
          : []
      }));
      console.log('Normalized categories:', normalizedCategories);
      setCategories(normalizedCategories);
    } catch (error) {
      toast.error('Lỗi', { description: 'Không thể lấy danh mục.' });
      console.error('Lỗi khi lấy danh mục:', error);
    }
  };

  // Lấy danh sách sản phẩm từ API
  const fetchProducts = async (page = 1) => {
    if (!user) return setShowLoginModal(true);
    setLoading(true);
    try {
      const response = await getProductsByShopForSeller(user._id, {
        page,
        limit: pagination.limit,
      });
      setProducts(response.data.products || []);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.totalPages,
      });
    } catch (error) {
      toast.error('Lỗi', { description: 'Không thể lấy danh sách sản phẩm.' });
      console.error('Lỗi khi lấy sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchCategories();
    fetchProducts(pagination.page);
  }, [pagination.page]);

  // Handle refresh button
  const handleRefresh = () => {
    fetchCategories();
    fetchProducts(pagination.page);
    toast.info('Đã làm mới danh sách sản phẩm và danh mục.');
  };

  // Handle status change
  const handleStatusChange = async (productId) => {
    setUpdatingStatus(productId);
    try {
      const res = await toggleProductStatus(productId);
      toast.success('Thành công', {
        description: `Cập nhật trạng thái thành ${res.data.isActive ? 'Đang bán' : 'Ngừng bán'}.`,
      });
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error('Lỗi', { description: 'Cập nhật trạng thái thất bại.' });
      console.error('Lỗi khi cập nhật trạng thái:', error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' ||
      product.categories?.some(category => category.name === filterCategory);

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' ? product.isActive : !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Handle delete product
  const handleDeleteProduct = async (productId) => {
    try {
      await deleteProduct(productId, 'hard');
      toast.success('Thành công', { description: 'Xóa sản phẩm thành công.' });
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error('Lỗi', { description: 'Xóa sản phẩm thất bại.' });
      console.error('Lỗi khi xóa sản phẩm:', error);
    }
  };

  // Handle delete selected
  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedProducts.map(id => deleteProduct(id, 'hard')));
      toast.success('Thành công', { description: `Đã xóa ${selectedProducts.length} sản phẩm.` });
      setSelectedProducts([]);
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error('Lỗi', { description: 'Xóa sản phẩm thất bại.' });
      console.error('Lỗi khi xóa nhiều sản phẩm:', error);
    }
  };

  // Lấy danh sách danh mục phẳng cho bộ lọc
  const flatCategories = [];
  const seenNames = new Set();
  categories.forEach(cat => {
    if (!seenNames.has(cat.name)) {
      flatCategories.push({ name: cat.name, level: cat.level, productCount: cat.productCount });
      seenNames.add(cat.name);
    }
    if (cat.children) {
      cat.children.forEach(child => {
        if (!seenNames.has(child.name)) {
          flatCategories.push({ name: child.name, level: child.level, productCount: child.productCount });
          seenNames.add(child.name);
        }
        if (child.children) {
          child.children.forEach(grandchild => {
            if (!seenNames.has(grandchild.name)) {
              flatCategories.push({ name: grandchild.name, level: grandchild.level, productCount: grandchild.productCount });
              seenNames.add(grandchild.name);
            }
          });
        }
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6" /> Quản lý sản phẩm
        </h1>
        <Button onClick={() => navigate('/seller/add-product')} className="bg-pink-500 hover:bg-pink-600">
          <PlusCircle className="w-4 h-4 mr-2" /> Thêm sản phẩm
        </Button>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm theo tên..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Danh mục">{filterCategory !== 'all' ? filterCategory : 'Danh mục'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {flatCategories.map((category, index) => (
                    <SelectItem key={`${category.name}-${index}`} value={category.name}>
                      <span className={category.level > 1 ? `pl-${(category.level - 1) * 4}` : ''}>
                        {category.level > 1 ? `➥ ${category.name}` : `⚫ ${category.name}`} ({category.productCount || 0})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="active">Đang bán</SelectItem>
                  <SelectItem value="inactive">Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" /> Làm mới
              </Button>
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <div className="mt-4 flex items-center gap-2 p-2 bg-blue-50 rounded border border-blue-100">
              <span className="text-sm font-medium mr-2">
                Đã chọn {selectedProducts.length} sản phẩm
              </span>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" /> Xuất Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500 hover:text-red-600"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Xóa đã chọn
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredProducts.length > 0 && filteredProducts.every(product => selectedProducts.includes(product._id))}
                      onCheckedChange={handleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead className="w-12">Ảnh</TableHead>
                  <TableHead className="max-w-[400px]">Tên sản phẩm</TableHead>
                  <TableHead className="max-w-[150px]">SKU</TableHead>
                  <TableHead className="max-w-[150px]">Giá bán</TableHead>
                  <TableHead className="max-w-[100px]">Tồn kho</TableHead>
                  <TableHead className="max-w-[200px]">Danh mục</TableHead>
                  <TableHead className="max-w-[120px]">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <Package className="w-12 h-12 mb-2 opacity-20" />
                        <p>Không tìm thấy sản phẩm phù hợp</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product._id)}
                          onCheckedChange={() => handleSelectProduct(product._id)}
                          aria-label={`Chọn sản phẩm ${product.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <img
                          src={product.images?.[0] || '/api/placeholder/50/50'}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[400px] whitespace-normal break-words">
                        <span title={product.name}>{product.name}</span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {product.sku || 'N/A'}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(product.slug);
                            toast.success('Đã sao chép mã SKU!');
                          }}
                        >
                          <Copy className="w-2 h-2 mr-2" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {product.discount > 0 ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-pink-600">
                              {formatCurrency(product.price - (product.price * product.discount/100))}
                            </span>
                            <span className="text-xs text-gray-500 line-through">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">{formatCurrency(product.price)}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${product.stock < 20 ? 'text-orange-500' : ''}`}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.mainCategory?._id
                            ? findCategoryPath(product.mainCategory._id, categories)
                            : 'Không xác định'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={product.isActive ? 'active' : 'inactive'}
                          onValueChange={() => handleStatusChange(product._id)}
                          disabled={updatingStatus === product._id}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" /> Đang bán
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive">
                              <div className="flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-gray-500" /> Ngừng bán
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/seller/product-detail/${product.slug}`)}>
                              <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/seller/edit-product/${product.slug}`)}>
                              <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" /> Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(pagination.page - 1)} />
                </PaginationItem>
                {[...Array(pagination.totalPages)].map((_, index) => {
                  const page = index + 1;
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= pagination.page - 1 && page <= pagination.page + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={pagination.page === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  if (
                    (page === pagination.page - 2 && pagination.page > 3) ||
                    (page === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
                  ) {
                    return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                  }
                  return null;
                })}
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(pagination.page + 1)} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}