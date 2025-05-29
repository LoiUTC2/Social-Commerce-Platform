"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Search, Filter, Grid, List, Users, Store, Hash, FileText, Heart, MessageCircle, Share2, ShoppingCart, Star, } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Separator } from "../../components/ui/separator"

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()

    // Get search query from URL
    const initialQuery = searchParams.get("q") || ""

    const [searchQuery, setSearchQuery] = useState(initialQuery)
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "all")
    const [viewMode, setViewMode] = useState("grid")
    const [sortBy, setSortBy] = useState("relevance")
    const [priceRange, setPriceRange] = useState("all")
    const [location, setLocation] = useState("all")
    const [isLoading, setIsLoading] = useState(false)
    const [searchResults, setSearchResults] = useState({
        posts: [],
        products: [],
        shops: [],
        users: [],
        groups: [],
        categories: [],
    })

    // Mock data for demonstration
    const mockSearchResults = {
        posts: [
            {
                id: 1,
                content: "Vừa mua được chiếc iPhone 15 Pro Max tuyệt vời! Ai cần tư vấn không?",
                author: { name: "Nguyễn Văn A", avatar: "/placeholder.svg?height=40&width=40", verified: true },
                likes: 124,
                comments: 23,
                shares: 5,
                timestamp: "2 giờ trước",
                images: ["/placeholder.svg?height=300&width=400"],
            },
            {
                id: 2,
                content: "Review chi tiết về laptop gaming mới nhất. Hiệu năng cực khủng!",
                author: { name: "Tech Reviewer", avatar: "/placeholder.svg?height=40&width=40", verified: true },
                likes: 89,
                comments: 15,
                shares: 12,
                timestamp: "4 giờ trước",
                images: [],
            },
        ],
        products: [
            {
                id: 1,
                name: "iPhone 15 Pro Max 256GB",
                price: 29990000,
                originalPrice: 32990000,
                rating: 4.8,
                reviews: 1234,
                sold: 500,
                shop: "Apple Store Official",
                image: "/placeholder.svg?height=200&width=200",
                discount: 9,
            },
            {
                id: 2,
                name: "Samsung Galaxy S24 Ultra",
                price: 26990000,
                originalPrice: 29990000,
                rating: 4.7,
                reviews: 892,
                sold: 320,
                shop: "Samsung Official",
                image: "/placeholder.svg?height=200&width=200",
                discount: 10,
            },
            {
                id: 3,
                name: "MacBook Pro M3 14 inch",
                price: 45990000,
                originalPrice: 49990000,
                rating: 4.9,
                reviews: 567,
                sold: 150,
                shop: "Apple Store Official",
                image: "/placeholder.svg?height=200&width=200",
                discount: 8,
            },
        ],
        shops: [
            {
                id: 1,
                name: "Apple Store Official",
                followers: 125000,
                products: 89,
                rating: 4.9,
                location: "Hồ Chí Minh",
                avatar: "/placeholder.svg?height=60&width=60",
                verified: true,
                description: "Cửa hàng chính thức Apple tại Việt Nam",
            },
            {
                id: 2,
                name: "Tech World Store",
                followers: 45000,
                products: 234,
                rating: 4.6,
                location: "Hà Nội",
                avatar: "/placeholder.svg?height=60&width=60",
                verified: false,
                description: "Chuyên cung cấp thiết bị công nghệ chính hãng",
            },
        ],
        users: [
            {
                id: 1,
                name: "Nguyễn Văn A",
                username: "@nguyenvana",
                followers: 1200,
                following: 450,
                posts: 89,
                avatar: "/placeholder.svg?height=60&width=60",
                verified: true,
                bio: "Tech enthusiast | Apple lover | Content creator",
            },
            {
                id: 2,
                name: "Tech Reviewer",
                username: "@techreviewer",
                followers: 25000,
                following: 120,
                posts: 567,
                avatar: "/placeholder.svg?height=60&width=60",
                verified: true,
                bio: "Professional tech reviewer | YouTube: 100K subs",
            },
        ],
        groups: [
            {
                id: 1,
                name: "iPhone Việt Nam",
                members: 45000,
                posts: 1234,
                privacy: "public",
                avatar: "/placeholder.svg?height=60&width=60",
                description: "Cộng đồng người dùng iPhone tại Việt Nam",
            },
            {
                id: 2,
                name: "Mua Bán Laptop Cũ",
                members: 23000,
                posts: 890,
                privacy: "public",
                avatar: "/placeholder.svg?height=60&width=60",
                description: "Nhóm mua bán, trao đổi laptop cũ uy tín",
            },
        ],
        categories: [
            {
                id: 1,
                name: "Điện thoại",
                productCount: 1234,
                shopCount: 89,
                icon: "📱",
                path: ["Điện tử", "Điện thoại"],
            },
            {
                id: 2,
                name: "Laptop",
                productCount: 567,
                shopCount: 45,
                icon: "💻",
                path: ["Điện tử", "Máy tính", "Laptop"],
            },
        ],
    }

    // Update URL when search params change
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        if (activeTab !== "all") params.set("tab", activeTab)

        setSearchParams(params)
    }, [searchQuery, activeTab, setSearchParams])

    // Perform search when query changes
    useEffect(() => {
        if (searchQuery.trim()) {
            performSearch(searchQuery.trim())
        }
    }, [searchQuery])

    const performSearch = async (query) => {
        setIsLoading(true)
        try {
            // TODO: Replace with actual API calls
            // const [categoriesResult, productsResult, postsResult] = await Promise.all([
            //   searchCategories(query),
            //   searchProducts(query),
            //   searchPosts(query)
            // ])

            // For now, use mock data
            setSearchResults(mockSearchResults)
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            performSearch(searchQuery.trim())
        }
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(price)
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Search Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm sản phẩm, bài viết, shop, người dùng..."
                                className="pl-10 pr-4 py-3 text-lg"
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={isLoading}>
                            <Search className="h-5 w-5" />
                        </Button>
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Sidebar Filters */}
                    <div className="w-64 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5" />
                                    Bộ lọc
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Sắp xếp theo</label>
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="relevance">Liên quan nhất</SelectItem>
                                            <SelectItem value="newest">Mới nhất</SelectItem>
                                            <SelectItem value="price-low">Giá thấp đến cao</SelectItem>
                                            <SelectItem value="price-high">Giá cao đến thấp</SelectItem>
                                            <SelectItem value="popular">Phổ biến nhất</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Khoảng giá</label>
                                    <Select value={priceRange} onValueChange={setPriceRange}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="under-5m">Dưới 5 triệu</SelectItem>
                                            <SelectItem value="5m-10m">5 - 10 triệu</SelectItem>
                                            <SelectItem value="10m-20m">10 - 20 triệu</SelectItem>
                                            <SelectItem value="20m-50m">20 - 50 triệu</SelectItem>
                                            <SelectItem value="over-50m">Trên 50 triệu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-2 block">Khu vực</label>
                                    <Select value={location} onValueChange={setLocation}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toàn quốc</SelectItem>
                                            <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                                            <SelectItem value="hn">Hà Nội</SelectItem>
                                            <SelectItem value="dn">Đà Nẵng</SelectItem>
                                            <SelectItem value="other">Tỉnh thành khác</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Categories */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Danh mục phổ biến</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {searchResults.categories.map((category) => (
                                        <Button key={category.id} variant="ghost" className="w-full justify-start h-auto p-3">
                                            <span className="text-lg mr-2">{category.icon}</span>
                                            <div className="text-left">
                                                <div className="font-medium">{category.name}</div>
                                                <div className="text-xs text-gray-500">{formatNumber(category.productCount)} sản phẩm</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Results Summary */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : "Tìm kiếm"}
                                    </h1>
                                    {searchQuery && <p className="text-gray-600">Tìm thấy 1,234 kết quả trong 0.05 giây</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant={viewMode === "grid" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setViewMode("grid")}
                                    >
                                        <Grid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === "list" ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setViewMode("list")}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Show message if no search query */}
                        {!searchQuery && (
                            <div className="text-center py-12">
                                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold text-gray-600 mb-2">Nhập từ khóa để tìm kiếm</h2>
                                <p className="text-gray-500">Tìm kiếm sản phẩm, bài viết, shop, người dùng và nhiều hơn nữa</p>
                            </div>
                        )}

                        {/* Search Results */}
                        {searchQuery && (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-6">
                                    <TabsTrigger value="all" className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Tất cả
                                    </TabsTrigger>
                                    <TabsTrigger value="products" className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4" />
                                        Sản phẩm
                                    </TabsTrigger>
                                    <TabsTrigger value="posts" className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Bài viết
                                    </TabsTrigger>
                                    <TabsTrigger value="shops" className="flex items-center gap-2">
                                        <Store className="h-4 w-4" />
                                        Shop
                                    </TabsTrigger>
                                    <TabsTrigger value="users" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Người dùng
                                    </TabsTrigger>
                                    <TabsTrigger value="groups" className="flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Nhóm
                                    </TabsTrigger>
                                </TabsList>

                                {/* All Results */}
                                <TabsContent value="all" className="space-y-8">
                                    {/* Top Products */}
                                    <div>
                                        <h2 className="text-xl font-semibold mb-4">Sản phẩm nổi bật</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {searchResults.products.slice(0, 3).map((product) => (
                                                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                                                    <CardContent className="p-4">
                                                        <div className="relative mb-3">
                                                            <img
                                                                src={product.image || "/placeholder.svg?height=200&width=200"}
                                                                alt={product.name}
                                                                className="w-full h-48 object-cover rounded-lg"
                                                            />
                                                            {product.discount > 0 && (
                                                                <Badge className="absolute top-2 left-2 bg-red-500">-{product.discount}%</Badge>
                                                            )}
                                                        </div>
                                                        <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-lg font-bold text-red-600">{formatPrice(product.price)}</span>
                                                            {product.originalPrice > product.price && (
                                                                <span className="text-sm text-gray-500 line-through">
                                                                    {formatPrice(product.originalPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                                            <div className="flex items-center gap-1">
                                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                                <span>{product.rating}</span>
                                                                <span>({formatNumber(product.reviews)})</span>
                                                            </div>
                                                            <span>Đã bán {formatNumber(product.sold)}</span>
                                                        </div>
                                                        <div className="text-sm text-gray-600 mt-1">{product.shop}</div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Recent Posts */}
                                    <div>
                                        <h2 className="text-xl font-semibold mb-4">Bài viết gần đây</h2>
                                        <div className="space-y-4">
                                            {searchResults.posts.map((post) => (
                                                <Card key={post.id}>
                                                    <CardContent className="p-6">
                                                        <div className="flex items-start gap-3">
                                                            <Avatar>
                                                                <AvatarImage src={post.author.avatar || "/placeholder.svg?height=40&width=40"} />
                                                                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="font-medium">{post.author.name}</span>
                                                                    {post.author.verified && (
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            Đã xác minh
                                                                        </Badge>
                                                                    )}
                                                                    <span className="text-sm text-gray-500">{post.timestamp}</span>
                                                                </div>
                                                                <p className="mb-3">{post.content}</p>
                                                                {post.images.length > 0 && (
                                                                    <div className="mb-3">
                                                                        <img
                                                                            src={post.images[0] || "/placeholder.svg?height=300&width=400"}
                                                                            alt="Post image"
                                                                            className="rounded-lg max-w-md"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <div className="flex items-center gap-6 text-sm text-gray-600">
                                                                    <button className="flex items-center gap-1 hover:text-red-500">
                                                                        <Heart className="h-4 w-4" />
                                                                        {formatNumber(post.likes)}
                                                                    </button>
                                                                    <button className="flex items-center gap-1 hover:text-blue-500">
                                                                        <MessageCircle className="h-4 w-4" />
                                                                        {formatNumber(post.comments)}
                                                                    </button>
                                                                    <button className="flex items-center gap-1 hover:text-green-500">
                                                                        <Share2 className="h-4 w-4" />
                                                                        {formatNumber(post.shares)}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>

                                {/* Other tabs content similar to previous implementation */}
                                <TabsContent value="products">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {searchResults.products.map((product) => (
                                            <Card key={product.id} className="hover:shadow-lg transition-shadow">
                                                <CardContent className="p-4">
                                                    <div className="relative mb-3">
                                                        <img
                                                            src={product.image || "/placeholder.svg?height=200&width=200"}
                                                            alt={product.name}
                                                            className="w-full h-48 object-cover rounded-lg"
                                                        />
                                                        {product.discount > 0 && (
                                                            <Badge className="absolute top-2 left-2 bg-red-500">-{product.discount}%</Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-medium mb-2 line-clamp-2">{product.name}</h3>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="text-lg font-bold text-red-600">{formatPrice(product.price)}</span>
                                                        {product.originalPrice > product.price && (
                                                            <span className="text-sm text-gray-500 line-through">
                                                                {formatPrice(product.originalPrice)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                            <span>{product.rating}</span>
                                                            <span>({formatNumber(product.reviews)})</span>
                                                        </div>
                                                        <span>Đã bán {formatNumber(product.sold)}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">{product.shop}</div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </TabsContent>

                                {/* Add other tab contents as needed */}
                            </Tabs>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchPage
