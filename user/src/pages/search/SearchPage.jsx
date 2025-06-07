"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { Search, Filter, Grid, List, Users, Store, Hash, FileText, ShoppingCart, TrendingUp, Tag } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Separator } from "../../components/ui/separator"
import { Slider } from "../../components/ui/slider"
import {
    searchProducts,
    searchShops,
    searchUsers,
    searchPosts,
    searchAll,
    searchByHashtag,
    searchByCategory,
    getPopularSearches,
} from "../../services/searchService"
import { useAuth } from "../../contexts/AuthContext"
import { parseSearchParams } from "../../utils/searchNavigation"
import CategorySelector from "../../components/search/CategorySelector"
import SearchResultsGrid from "../../components/search/SearchResultsGrid"
import ProductCard from "../../components/search/ProductCard"
import ShopCard from "../../components/search/ShopCard"
import UserCard from "../../components/search/UserCard"
import PostCard from "../../components/search/PostCard"
import PopularHashtags from "../../components/search/PopularHashtags"

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    // Parse URL parameters
    const urlParams = parseSearchParams(searchParams)
    const [searchQuery, setSearchQuery] = useState(urlParams.q || "")
    const [hashtag, setHashtag] = useState(urlParams.hashtag || "")
    const [categoryId, setCategoryId] = useState(urlParams.categoryId || "")
    const [categoryName, setCategoryName] = useState(urlParams.categoryName || "")
    const [activeTab, setActiveTab] = useState(urlParams.tab || "all")

    const [viewMode, setViewMode] = useState("grid")
    const [isLoading, setIsLoading] = useState(false)

    // Search results
    const [searchResults, setSearchResults] = useState({
        all: null,
        products: { data: [], pagination: null },
        shops: { data: [], pagination: null },
        users: { data: [], pagination: null },
        posts: { data: [], pagination: null },
        hashtag: { data: null, pagination: null },
        category: { data: null, pagination: null },
    })

    // Filters
    const [filters, setFilters] = useState({
        sortBy: "relevance",
        priceRange: [0, 100000000],
        brand: "",
        condition: "",
        minRating: "",
        role: "",
        authorType: "",
        privacy: "public",
    })

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(20)

    // Popular searches
    const [popularSearches, setPopularSearches] = useState([])

    // Load popular searches on mount
    useEffect(() => {
        const loadPopularSearches = async () => {
            try {
                const response = await getPopularSearches(10, "7d")
                if (response.success) {
                    setPopularSearches(response.data.searches)
                }
            } catch (error) {
                console.error("Error loading popular searches:", error)
            }
        }
        loadPopularSearches()
    }, [])

    // Update URL when search params change
    useEffect(() => {
        const params = new URLSearchParams()
        if (searchQuery) params.set("q", searchQuery)
        if (hashtag) params.set("hashtag", hashtag)
        if (categoryId) params.set("categoryId", categoryId)
        if (categoryName) params.set("categoryName", categoryName)
        if (activeTab !== "all") params.set("tab", activeTab)
        setSearchParams(params)
    }, [searchQuery, hashtag, categoryId, categoryName, activeTab, setSearchParams])

    // Perform search when query or filters change
    useEffect(() => {
        if (searchQuery.trim() || hashtag || categoryId) {
            performSearch()
        }
    }, [hashtag, categoryId, activeTab, filters, currentPage])

    const performSearch = async () => {
        if (!searchQuery.trim() && !hashtag && !categoryId) return

        setIsLoading(true)
        try {
            const searchParams = {
                page: currentPage,
                limit: itemsPerPage,
                sortBy: filters.sortBy,
            }

            // Determine search type and perform appropriate search
            let result

            if (hashtag) {
                // Search by hashtag - ALWAYS call searchByHashtag for AI tracking
                if (activeTab === "all") {
                    result = await searchByHashtag({ hashtag, limit: 5 })
                    if (result.success) {
                        setSearchResults((prev) => ({ ...prev, all: result.data }))
                    }
                } else {
                    result = await searchByHashtag({ hashtag, ...searchParams })
                    if (result.success) {
                        setSearchResults((prev) => ({
                            ...prev,
                            hashtag: { data: result.data, pagination: result.data.pagination },
                        }))
                    }
                }
            } else if (categoryId) {
                // Search by category - ALWAYS call searchByCategory for AI tracking
                if (activeTab === "all") {
                    result = await searchByCategory({ categoryId, limit: 5 })
                    if (result.success) {
                        setSearchResults((prev) => ({ ...prev, all: result.data }))
                    }
                } else {
                    result = await searchByCategory({ categoryId, ...searchParams })
                    if (result.success) {
                        setSearchResults((prev) => ({
                            ...prev,
                            category: { data: result.data, pagination: result.data.pagination },
                        }))
                    }
                }
            } else {
                // Search by keyword
                if (activeTab === "all") {
                    result = await searchAll({ q: searchQuery.trim(), limit: 5 })
                    if (result.success) {
                        setSearchResults((prev) => ({ ...prev, all: result.data }))
                    }
                } else {
                    // Add specific filters based on tab
                    if (activeTab === "products") {
                        if (filters.brand) searchParams.brand = filters.brand
                        if (filters.condition) searchParams.condition = filters.condition
                        if (filters.priceRange[0] > 0) searchParams.minPrice = filters.priceRange[0]
                        if (filters.priceRange[1] < 100000000) searchParams.maxPrice = filters.priceRange[1]
                    } else if (activeTab === "shops") {
                        if (filters.minRating) searchParams.minRating = filters.minRating
                    } else if (activeTab === "users") {
                        if (filters.role) searchParams.role = filters.role
                    } else if (activeTab === "posts") {
                        if (filters.authorType) searchParams.authorType = filters.authorType
                        searchParams.privacy = filters.privacy
                    }

                    searchParams.q = searchQuery.trim()

                    switch (activeTab) {
                        case "products":
                            result = await searchProducts(searchParams)
                            if (result.success) {
                                setSearchResults((prev) => ({
                                    ...prev,
                                    products: { data: result.data.products, pagination: result.data.pagination },
                                }))
                            }
                            break
                        case "shops":
                            result = await searchShops(searchParams)
                            if (result.success) {
                                setSearchResults((prev) => ({
                                    ...prev,
                                    shops: { data: result.data.shops, pagination: result.data.pagination },
                                }))
                            }
                            break
                        case "users":
                            result = await searchUsers(searchParams)
                            if (result.success) {
                                setSearchResults((prev) => ({
                                    ...prev,
                                    users: { data: result.data.users, pagination: result.data.pagination },
                                }))
                            }
                            break
                        case "posts":
                            result = await searchPosts(searchParams)
                            if (result.success) {
                                setSearchResults((prev) => ({
                                    ...prev,
                                    posts: { data: result.data.posts, pagination: result.data.pagination },
                                }))
                            }
                            break
                    }
                }
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Handle search form submission - ONLY trigger search on Enter or button click
    const handleSearch = (e) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            setHashtag("")
            setCategoryId("")
            setCategoryName("")
            setCurrentPage(1)
            performSearch()
        }
    }

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
        setCurrentPage(1)
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab)
        setCurrentPage(1)
    }

    // Handle category selection - triggers searchByCategory API call
    const handleCategorySelect = (category) => {
        if (category) {
            setCategoryId(category._id)
            setCategoryName(category.name)
            setSearchQuery("")
            setHashtag("")
        } else {
            setCategoryId("")
            setCategoryName("")
        }
        setCurrentPage(1)
    }

    // Handle hashtag click - triggers searchByHashtag API call
    const handleHashtagClick = (hashtagName) => {
        setHashtag(hashtagName)
        setSearchQuery("")
        setCategoryId("")
        setCategoryName("")
        setCurrentPage(1)
        // The useEffect will trigger performSearch automatically
    }

    const clearAllFilters = () => {
        setSearchQuery("")
        setHashtag("")
        setCategoryId("")
        setCategoryName("")
        setCurrentPage(1)
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

    const getSearchTitle = () => {
        if (hashtag) return `Kết quả cho hashtag "#${hashtag}"`
        if (categoryId && categoryName) return `Kết quả cho danh mục "${categoryName}"`
        if (searchQuery) return `Kết quả tìm kiếm cho "${searchQuery}"`
        return "Tìm kiếm"
    }

    const getCurrentResults = () => {
        if (hashtag && activeTab === "all") return searchResults.all
        if (categoryId && activeTab === "all") return searchResults.all
        if (hashtag) return searchResults.hashtag?.data
        if (categoryId) return searchResults.category?.data
        return searchResults[activeTab]
    }

    // Event handlers for card interactions
    const handleProductClick = (product) => {
        navigate(`/products/${product._id}`)
    }

    const handleShopClick = (shop) => {
        navigate(`/shops/${shop._id}`)
    }

    const handleUserClick = (user) => {
        navigate(`/users/${user._id}`)
    }

    const handlePostClick = (post) => {
        navigate(`/posts/${post._id}`)
    }

    const handlePostLike = (post) => {
        // TODO: Implement like functionality
        console.log("Like post:", post._id)
    }

    const handlePostComment = (post) => {
        // TODO: Implement comment functionality
        console.log("Comment on post:", post._id)
    }

    const handlePostShare = (post) => {
        // TODO: Implement share functionality
        console.log("Share post:", post._id)
    }

    // Get the appropriate data for the current tab
    const getTabData = (tabName) => {
        if (hashtag) {
            return searchResults.hashtag?.data?.[tabName] || []
        }
        if (categoryId) {
            return searchResults.category?.data?.[tabName] || []
        }
        return searchResults[tabName]?.data || []
    }

    // Loading state component
    const LoadingState = () => (
        <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tìm kiếm...</p>
        </div>
    )

    // Empty state component
    const EmptySearchState = () => (
        <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Chọn danh mục hoặc nhập từ khóa để tìm kiếm</h2>
            <p className="text-gray-500">Tìm kiếm sản phẩm, bài viết, shop, người dùng và nhiều hơn nữa</p>
        </div>
    )

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
                                placeholder="Nhập từ khóa và nhấn Enter để tìm kiếm sản phẩm, bài viết, shop, người dùng..."
                                className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-pink-500"
                            />
                        </div>
                        <Button type="submit" size="lg" disabled={isLoading} className="bg-pink-500 hover:bg-pink-600">
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                                <Search className="h-5 w-5" />
                            )}
                        </Button>
                    </form>

                    {/* Active Filters Display */}
                    {(hashtag || categoryName || searchQuery) && (
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className="text-sm text-gray-600">Đang tìm:</span>
                            {hashtag && (
                                <Badge variant="secondary" className="bg-pink-100 text-pink-700">
                                    <Hash className="h-3 w-3 mr-1" />
                                    {hashtag}
                                </Badge>
                            )}
                            {categoryName && (
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {categoryName}
                                </Badge>
                            )}
                            {searchQuery && (
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                    <Search className="h-3 w-3 mr-1" />
                                    {searchQuery}
                                </Badge>
                            )}
                            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-gray-500 hover:text-gray-700">
                                Xóa tất cả
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex gap-6">
                    {/* Sidebar Filters */}
                    <div className="w-80 space-y-6">
                        {/* Category Selector */}
                        <CategorySelector onCategorySelect={handleCategorySelect} selectedCategoryId={categoryId} />

                        {/* Popular Hashtags */}
                        <PopularHashtags onHashtagClick={handleHashtagClick} />

                        {/* Other Filters */}
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
                                    <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="relevance">Liên quan nhất</SelectItem>
                                            <SelectItem value="newest">Mới nhất</SelectItem>
                                            <SelectItem value="price_asc">Giá thấp đến cao</SelectItem>
                                            <SelectItem value="price_desc">Giá cao đến thấp</SelectItem>
                                            <SelectItem value="popular">Phổ biến nhất</SelectItem>
                                            <SelectItem value="rating">Đánh giá cao</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Price Range Filter - Only for products */}
                                {activeTab === "products" && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">
                                            Khoảng giá: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                                        </label>
                                        <Slider
                                            value={filters.priceRange}
                                            onValueChange={(value) => handleFilterChange("priceRange", value)}
                                            max={100000000}
                                            step={100000}
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                {/* Additional filters based on tab */}
                                {activeTab === "products" && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Tình trạng</label>
                                        <Select value={filters.condition} onValueChange={(value) => handleFilterChange("condition", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn tình trạng" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tất cả</SelectItem>
                                                <SelectItem value="new">Mới</SelectItem>
                                                <SelectItem value="used">Đã sử dụng</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {activeTab === "shops" && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Đánh giá tối thiểu</label>
                                        <Select value={filters.minRating} onValueChange={(value) => handleFilterChange("minRating", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn đánh giá" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tất cả</SelectItem>
                                                <SelectItem value="4">4+ sao</SelectItem>
                                                <SelectItem value="4.5">4.5+ sao</SelectItem>
                                                <SelectItem value="4.8">4.8+ sao</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {activeTab === "users" && (
                                    <div>
                                        <label className="text-sm font-medium mb-2 block">Vai trò</label>
                                        <Select value={filters.role} onValueChange={(value) => handleFilterChange("role", value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn vai trò" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Tất cả</SelectItem>
                                                <SelectItem value="buyer">Người mua</SelectItem>
                                                <SelectItem value="seller">Người bán</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Popular Searches */}
                        {popularSearches.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5" />
                                        Tìm kiếm phổ biến
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {popularSearches.slice(0, 8).map((search, index) => (
                                            <Button
                                                key={index}
                                                variant="ghost"
                                                className="w-full justify-start h-auto p-2 text-left"
                                                onClick={() => {
                                                    setSearchQuery(search.keyword)
                                                    setHashtag("")
                                                    setCategoryId("")
                                                    setCategoryName("")
                                                }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="text-sm">{search.keyword}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {formatNumber(search.count)}
                                                    </Badge>
                                                </div>
                                            </Button>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Results Summary */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-2xl font-bold">{getSearchTitle()}</h1>
                                    {(searchQuery || hashtag || categoryId) && (
                                        <p className="text-gray-600">
                                            {(() => {
                                                const currentResults = getCurrentResults()
                                                if (activeTab === "all" && currentResults) {
                                                    return `Tìm thấy ${currentResults.totalResults || 0} kết quả`
                                                } else if (currentResults?.pagination) {
                                                    return `Tìm thấy ${currentResults.pagination.totalItems || 0} kết quả`
                                                } else if (hashtag && searchResults.hashtag?.data) {
                                                    return `Tìm thấy ${searchResults.hashtag.data.pagination?.totalItems || 0} kết quả`
                                                } else if (categoryId && searchResults.category?.data) {
                                                    return `Tìm thấy ${searchResults.category.data.pagination?.totalItems || 0} kết quả`
                                                }
                                                return ""
                                            })()}
                                        </p>
                                    )}
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
                        {!searchQuery && !hashtag && !categoryId && <EmptySearchState />}

                        {/* Search Results */}
                        {(searchQuery || hashtag || categoryId) && (
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
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
                                </TabsList>

                                {/* All Results */}
                                <TabsContent value="all" className="space-y-8">
                                    {isLoading ? (
                                        <LoadingState />
                                    ) : searchResults.all ? (
                                        <>
                                            {/* Top Products */}
                                            {searchResults.all.products?.length > 0 && (
                                                <div>
                                                    <h2 className="text-xl font-semibold mb-4">Sản phẩm nổi bật</h2>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                        {searchResults.all.products.map((product) => (
                                                            <ProductCard key={product._id} product={product} onProductClick={handleProductClick} />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {searchResults.all.products?.length > 0 && searchResults.all.posts?.length > 0 && <Separator />}

                                            {/* Recent Posts */}
                                            {searchResults.all.posts?.length > 0 && (
                                                <div>
                                                    <h2 className="text-xl font-semibold mb-4">Bài viết gần đây</h2>
                                                    <div className="space-y-4">
                                                        {searchResults.all.posts.map((post) => (
                                                            <PostCard
                                                                key={post._id}
                                                                post={post}
                                                                onPostClick={handlePostClick}
                                                                onLike={handlePostLike}
                                                                onComment={handlePostComment}
                                                                onShare={handlePostShare}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {(searchResults.all.posts?.length > 0 || searchResults.all.products?.length > 0) &&
                                                (searchResults.all.shops?.length > 0 || searchResults.all.users?.length > 0) && <Separator />}

                                            {/* Shops and Users */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {searchResults.all.shops?.length > 0 && (
                                                    <div>
                                                        <h2 className="text-xl font-semibold mb-4">Shop</h2>
                                                        <div className="space-y-4">
                                                            {searchResults.all.shops.map((shop) => (
                                                                <ShopCard key={shop._id} shop={shop} onShopClick={handleShopClick} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {searchResults.all.users?.length > 0 && (
                                                    <div>
                                                        <h2 className="text-xl font-semibold mb-4">Người dùng</h2>
                                                        <div className="space-y-4">
                                                            {searchResults.all.users.map((user) => (
                                                                <UserCard key={user._id} user={user} onUserClick={handleUserClick} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center py-12">
                                            <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                            <h2 className="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy kết quả</h2>
                                            <p className="text-gray-500">Thử tìm kiếm với từ khóa khác</p>
                                        </div>
                                    )}
                                </TabsContent>

                                {/* Products Tab */}
                                <TabsContent value="products">
                                    {isLoading ? (
                                        <LoadingState />
                                    ) : (
                                        <SearchResultsGrid
                                            results={getTabData("products")}
                                            type="products"
                                            viewMode={viewMode}
                                            onProductClick={handleProductClick}
                                        />
                                    )}
                                </TabsContent>

                                {/* Posts Tab */}
                                <TabsContent value="posts">
                                    {isLoading ? (
                                        <LoadingState />
                                    ) : (
                                        <SearchResultsGrid
                                            results={getTabData("posts")}
                                            type="posts"
                                            viewMode={viewMode}
                                            onPostClick={handlePostClick}
                                            onPostLike={handlePostLike}
                                            onPostComment={handlePostComment}
                                            onPostShare={handlePostShare}
                                        />
                                    )}
                                </TabsContent>

                                {/* Shops Tab */}
                                <TabsContent value="shops">
                                    {isLoading ? (
                                        <LoadingState />
                                    ) : (
                                        <SearchResultsGrid
                                            results={getTabData("shops")}
                                            type="shops"
                                            viewMode={viewMode}
                                            onShopClick={handleShopClick}
                                        />
                                    )}
                                </TabsContent>

                                {/* Users Tab */}
                                <TabsContent value="users">
                                    {isLoading ? (
                                        <LoadingState />
                                    ) : (
                                        <SearchResultsGrid
                                            results={getTabData("users")}
                                            type="users"
                                            viewMode={viewMode}
                                            onUserClick={handleUserClick}
                                        />
                                    )}
                                </TabsContent>
                            </Tabs>
                        )}

                        {/* Pagination */}
                        {(searchQuery || hashtag || categoryId) &&
                            (() => {
                                const currentResults = getCurrentResults()
                                const pagination = currentResults?.pagination
                                return (
                                    pagination &&
                                    activeTab !== "all" && (
                                        <div className="mt-8 flex justify-center">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    disabled={currentPage === 1}
                                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                                >
                                                    Trước
                                                </Button>
                                                <span className="px-4 py-2 text-sm">
                                                    Trang {currentPage} / {pagination.totalPages}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    disabled={currentPage === pagination.totalPages}
                                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                                >
                                                    Sau
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                )
                            })()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchPage
