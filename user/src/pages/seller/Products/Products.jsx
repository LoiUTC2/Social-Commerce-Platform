import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../../components/ui/pagination';
import { Package, Search, PlusCircle, Download, MoreVertical, Edit, Trash2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { toast } from 'sonner';
import { createProduct, deleteProduct, getAllProductsToShop } from '../../../services/productService';
import { useAuth } from '../../../contexts/AuthContext';

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function Products() {
  const navigate = useNavigate();
  const {user, showLoginModal, setShowLoginModal} = useAuth();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // Thay đổi khởi tạo từ '' thành 'all'
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // Lấy danh sách sản phẩm từ API
  const fetchProducts = async (page = 1) => {
    if (!user) return setShowLoginModal(true);
    setLoading(true);
    try {
      const response = await getAllProductsToShop(user._id, {
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
      toast('Lỗi',
        {description: 'Không thể lấy danh sách sản phẩm. Vui lòng thử lại sau.',}
      );
      console.error('Lỗi khi lấy sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount hoặc khi page thay đổi
  useEffect(() => {
    fetchProducts(pagination.page);
  }, [pagination.page]);

  // Handle selection of all products
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  };

  // Handle selection of a single product
  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'active' ? product.isActive : !product.isActive);

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
      await deleteProduct(productId, 'soft');
      toast.success("Thành công", {
        description: 'Xóa sản phẩm thành công.',
      });
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error("Lỗi", {
        description: 'Xóa sản phẩm thất bại. Vui lòng thử lại sau.',
      });
      console.error('Lỗi khi xóa sản phẩm:', error);
    }
  };

  // Handle delete selected products
  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedProducts.map(id => deleteProduct(id, 'soft')));
      toast.success("Thành công", {
        description: `Đã xóa ${selectedProducts.length} sản phẩm`,
      });
      setSelectedProducts([]);
      fetchProducts(pagination.page);
    } catch (error) {
      toast.error("Lỗi", {
        description: 'Xóa sản phẩm thất bại. Vui lòng thử lại sau.',
      });
      console.error('Lỗi khi xóa nhiều sản phẩm:', error);
    }
  };

  // Danh mục sản phẩm từ backend (có thể gọi API để lấy, hiện tại dùng mock)
  const productCategories = [
    'Thời trang nam',
    'Thời trang nữ',
    'Đồ điện tử',
    'Đồ gia dụng',
    'Sách & Văn phòng phẩm',
    'Sức khỏe & Làm đẹp',
  ];

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
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {productCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem> {/* Thay value="" bằng "all" */}
                  <SelectItem value="active">Đang bán</SelectItem>
                  <SelectItem value="inactive">Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
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
                      checked={selectedProducts?.length === filteredProducts?.length && filteredProducts?.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(checked)}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead className="w-12">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Giá bán</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Trạng thái</TableHead>
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
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{product.sku || 'N/A'}</TableCell>
                      <TableCell>
                        {product.discount > 0 ? (
                          <div>
                            <span className="font-medium text-pink-600">
                              {formatCurrency(product.price - product.discount)}
                            </span>
                            <span className="text-xs text-gray-500 line-through ml-1">
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
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" /> Đang bán
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            <XCircle className="w-3 h-3 mr-1" /> Ngừng bán
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="flex items-center">
                              <Eye className="w-4 h-4 mr-2" /> Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center">
                              <Edit className="w-4 h-4 mr-2" /> Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center text-red-500"
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

          {/* Pagination */}
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
                    return <PaginationEllipsis key={page} />;
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