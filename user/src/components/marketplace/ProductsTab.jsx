import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import {
    Search,
    SlidersHorizontal,
    Grid,
    List,
    TrendingUp,
    Star,
    Clock,
    DollarSign,
    Store,
    Package,
    ShoppingBag,
    Users,
    BarChart3,
    ShoppingCart,
} from "lucide-react"
import ProductCard from "./ProductCard"
import { getProductsByShopForUser } from "../../services/productService"
import { getAllCategories, getCategoryTree } from "../../services/categoryService" // Import category service
import { formatCurrency } from "../../lib/utils"

// Mock data cho các sản phẩm (giữ nguyên để fallback)
const MOCK_PRODUCTS = [
    {
        id: "1",
        name: "Áo thun unisex cotton form rộng thoáng mát, thấm hút mồ hôi tốt",
        price: 150000,
        discount: 20,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.8, count: 120 },
        soldCount: 1500,
        stock: 200,
        isActive: true,
        mainCategory: "fashion",
    },
    {
        id: "2",
        name: "Tai nghe bluetooth không dây, chống ồn chủ động, pin 40h",
        price: 1200000,
        discount: 15,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.5, count: 85 },
        soldCount: 750,
        stock: 50,
        isActive: true,
        mainCategory: "electronics",
    },
    {
        id: "3",
        name: "Nồi cơm điện đa năng 1.8L, 8 chức năng nấu, lòng nồi chống dính",
        price: 890000,
        discount: 10,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.7, count: 65 },
        soldCount: 320,
        stock: 30,
        isActive: true,
        mainCategory: "home",
    },
    {
        id: "4",
        name: "Kem dưỡng ẩm chống nắng SPF50+ dành cho da nhạy cảm",
        price: 350000,
        discount: 0,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.9, count: 210 },
        soldCount: 1800,
        stock: 150,
        isActive: true,
        mainCategory: "beauty",
    },
    {
        id: "5",
        name: "Giày thể thao nam nữ đế cao su bền bỉ, thiết kế hiện đại",
        price: 650000,
        discount: 25,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.6, count: 95 },
        soldCount: 680,
        stock: 80,
        isActive: true,
        mainCategory: "sports",
    },
    {
        id: "6",
        name: "Balo laptop chống nước, nhiều ngăn tiện lợi, phù hợp đi học, đi làm",
        price: 450000,
        discount: 5,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.4, count: 75 },
        soldCount: 420,
        stock: 60,
        isActive: true,
        mainCategory: "fashion",
    },
    {
        id: "7",
        name: "Đồng hồ thông minh đo nhịp tim, theo dõi giấc ngủ, chống nước IP68",
        price: 1500000,
        discount: 30,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.7, count: 150 },
        soldCount: 890,
        stock: 40,
        isActive: true,
        mainCategory: "electronics",
    },
    {
        id: "8",
        name: "Bộ chăn ga gối cotton 100%, mềm mại, thoáng mát",
        price: 1200000,
        discount: 12,
        images: ["/placeholder.svg?height=300&width=300"],
        ratings: { avg: 4.8, count: 60 },
        soldCount: 250,
        stock: 25,
        isActive: true,
        mainCategory: "home",
    },
]

export default function ProductsTab({ sellerId }) {
    const [products, setProducts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [categoriesLoading, setCategoriesLoading] = useState(true)
    const [viewMode, setViewMode] = useState("grid")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [sortOption, setSortOption] = useState("newest")
    const [searchQuery, setSearchQuery] = useState("")
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    // Thống kê shop
    const shopStats = {
        totalProducts: products.length,
        totalSold: products.reduce((sum, product) => sum + (product.soldCount || 0), 0),
        avgRating: (
            products.reduce((sum, product) => sum + (product.ratings?.avg || 0), 0) / (products.length || 1)
        ).toFixed(1),
        followers: 1250,
        responseRate: "98%",
        joinedSince: "10/2022",
    }

    // Lấy danh sách categories từ API
    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true)
            try {
                // Thử lấy categories từ API
                const response = await getAllCategories()

                if (response && response.success && response.data) {
                    // Tạo danh sách categories với "Tất cả sản phẩm" ở đầu
                    const categoriesWithAll = [
                        { _id: "all", name: "Tất cả sản phẩm", slug: "all" },
                        ...response.data.filter(cat => cat.isActive && cat.isVisible)
                    ]
                    setCategories(categoriesWithAll)
                } else {
                    // Fallback categories nếu API không trả về dữ liệu
                    setCategories([
                        { _id: "all", name: "Tất cả sản phẩm", slug: "all" },
                        { _id: "electronics", name: "Điện tử", slug: "electronics" },
                        { _id: "fashion", name: "Thời trang", slug: "fashion" },
                        { _id: "home", name: "Nhà cửa", slug: "home" },
                        { _id: "beauty", name: "Làm đẹp", slug: "beauty" },
                        { _id: "sports", name: "Thể thao", slug: "sports" },
                    ])
                }
            } catch (error) {
                console.error("Lỗi khi lấy categories:", error)
                // Sử dụng mock categories khi có lỗi
                setCategories([
                    { _id: "all", name: "Tất cả sản phẩm", slug: "all" },
                    { _id: "electronics", name: "Điện tử", slug: "electronics" },
                    { _id: "fashion", name: "Thời trang", slug: "fashion" },
                    { _id: "home", name: "Nhà cửa", slug: "home" },
                    { _id: "beauty", name: "Làm đẹp", slug: "beauty" },
                    { _id: "sports", name: "Thể thao", slug: "sports" },
                ])
            } finally {
                setCategoriesLoading(false)
            }
        }

        fetchCategories()
    }, [])

    // Lấy dữ liệu sản phẩm từ API hoặc mock data
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            try {
                // Thử gọi API thực tế
                const response = await getProductsByShopForUser(sellerId, pagination.page, pagination.limit, sortOption)

                if (response && response.data && response.data.products) {
                    setProducts(response.data.products)
                    setPagination(response.data.pagination)
                } else {
                    // Nếu API không trả về dữ liệu, dùng mock data
                    setProducts(MOCK_PRODUCTS)
                    setPagination({
                        page: 1,
                        limit: 20,
                        total: MOCK_PRODUCTS.length,
                        totalPages: 1,
                    })
                }
            } catch (error) {
                console.error("Lỗi khi lấy sản phẩm:", error)
                // Dùng mock data khi có lỗi
                setProducts(MOCK_PRODUCTS)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [sellerId, pagination.page, pagination.limit, sortOption])

    // Lọc sản phẩm theo danh mục và tìm kiếm
    const filteredProducts = products.filter((product) => {
        const matchesCategory = selectedCategory === "all" ||
            product.mainCategory === selectedCategory ||
            product.categoryId === selectedCategory ||
            product.category === selectedCategory
        const matchesSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesCategory && matchesSearch
    })

    // Đếm số sản phẩm theo từng category
    const getCategoryProductCount = (categoryId) => {
        if (categoryId === "all") return products.length
        return products.filter(product =>
            product.mainCategory === categoryId ||
            product.categoryId === categoryId ||
            product.category === categoryId
        ).length
    }

    return (
        <div className="space-y-6">
            {/* Thống kê shop */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-sm">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Store className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900">Thống kê cửa hàng</h3>
                                <p className="text-sm text-blue-700">Tham gia từ {shopStats.joinedSince}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">
                            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
                                <Package className="w-4 h-4 text-blue-500 mb-1" />
                                <span className="text-xs text-gray-600">Sản phẩm</span>
                                <span className="font-bold text-blue-700">{shopStats.totalProducts}</span>
                            </div>

                            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
                                <ShoppingBag className="w-4 h-4 text-green-500 mb-1" />
                                <span className="text-xs text-gray-600">Đã bán</span>
                                <span className="font-bold text-green-700">{shopStats.totalSold}</span>
                            </div>

                            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
                                <Star className="w-4 h-4 text-yellow-500 mb-1" />
                                <span className="text-xs text-gray-600">Đánh giá</span>
                                <span className="font-bold text-yellow-700">{shopStats.avgRating}/5</span>
                            </div>

                            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
                                <Users className="w-4 h-4 text-purple-500 mb-1" />
                                <span className="text-xs text-gray-600">Người theo dõi</span>
                                <span className="font-bold text-purple-700">{shopStats.followers}</span>
                            </div>

                            <div className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm">
                                <BarChart3 className="w-4 h-4 text-orange-500 mb-1" />
                                <span className="text-xs text-gray-600">Tỉ lệ phản hồi</span>
                                <span className="font-bold text-orange-700">{shopStats.responseRate}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Thanh tìm kiếm và lọc */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <Input
                        placeholder="Tìm kiếm sản phẩm..."
                        className="pl-10 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger className="w-[180px] bg-white">
                            <SelectValue placeholder="Sắp xếp theo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} />
                                    <span>Mới nhất</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="popular">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    <span>Phổ biến nhất</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="rating">
                                <div className="flex items-center gap-2">
                                    <Star size={16} />
                                    <span>Đánh giá cao</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="price_asc">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} />
                                    <span>Giá: Thấp đến cao</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="price_desc">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={16} />
                                    <span>Giá: Cao đến thấp</span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex border rounded-md overflow-hidden">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                            className="rounded-none"
                        >
                            <Grid size={18} />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                            className="rounded-none"
                        >
                            <List size={18} />
                        </Button>
                    </div>

                    <Button variant="outline" className="gap-2 bg-white">
                        <SlidersHorizontal size={16} />
                        <span className="hidden sm:inline">Lọc</span>
                    </Button>
                </div>
            </div>

            {/* Danh mục sản phẩm */}
            <div className="overflow-x-auto pb-2">
                {categoriesLoading ? (
                    <div className="flex items-center gap-2 py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-500">Đang tải danh mục...</span>
                    </div>
                ) : (
                    <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                        <TabsList className="bg-white p-1 h-auto flex flex-nowrap overflow-x-auto hide-scrollbar">
                            {categories.map((category) => {
                                const productCount = getCategoryProductCount(category._id || category.id)
                                return (
                                    <TabsTrigger
                                        key={category._id || category.id}
                                        value={category._id || category.id}
                                        className="px-4 py-2 whitespace-nowrap data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
                                    >
                                        {category.name}
                                        {productCount > 0 && (
                                            <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200">
                                                {productCount}
                                            </Badge>
                                        )}
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </Tabs>
                )}
            </div>

            {/* Hiển thị sản phẩm */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : filteredProducts.length > 0 ? (
                <div
                    className={
                        viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-4"
                    }
                >
                    {filteredProducts.map((product) =>
                        viewMode === "grid" ? (
                            <ProductCard key={product.id || product._id} product={product} />
                        ) : (
                            <Card key={product.id || product._id} className="flex flex-row overflow-hidden">
                                <div className="w-32 h-32 shrink-0">
                                    <img
                                        src={product.images?.[0] || "/placeholder.svg?height=300&width=300"}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <CardContent className="flex-1 p-4">
                                    <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-red-600 font-bold">
                                            {formatCurrency(product.price - product.price * (product.discount / 100))}
                                        </span>
                                        {product.discount > 0 && (
                                            <span className="text-gray-400 text-xs line-through">{formatCurrency(product.price)}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-500 mb-2">
                                        <div className="flex items-center text-yellow-400 mr-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={12}
                                                    fill={i < Math.floor(product.ratings?.avg || 0) ? "currentColor" : "none"}
                                                    className="mr-0.5"
                                                />
                                            ))}
                                        </div>
                                        <span>
                                            {product.ratings?.avg?.toFixed(1) || "0.0"} ({product.ratings?.count || 0})
                                        </span>
                                        <span className="mx-2">•</span>
                                        <span>Đã bán {product.soldCount || 0}</span>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <Button size="sm">Mua ngay</Button>
                                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                                            <ShoppingCart size={14} />
                                            <span>Thêm vào giỏ</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ),
                    )}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <div className="text-6xl mb-4">🛍️</div>
                    <h3 className="text-xl font-semibold mb-2">Không tìm thấy sản phẩm</h3>
                    <p className="text-gray-600 mb-4">
                        {searchQuery
                            ? `Không tìm thấy sản phẩm phù hợp với từ khóa "${searchQuery}"`
                            : "Không có sản phẩm nào trong danh mục này"}
                    </p>
                    <Button
                        onClick={() => {
                            setSearchQuery("")
                            setSelectedCategory("all")
                        }}
                    >
                        Xem tất cả sản phẩm
                    </Button>
                </Card>
            )}
        </div>
    )
}