"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Search,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    MessageSquare,
    DollarSign,
    TrendingUp,
    RefreshCw,
    X,
    Heart,
    Share2,
    Filter,
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Badge } from "../../../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Separator } from "../../../components/ui/separator"
import { Checkbox } from "../../../components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { toast } from "sonner"
import PostDetailModal from "../../../components/modals/posts/PostDetailModal"
import PostEditModal from "../../../components/modals/posts/PostEditModal"
import PostStatistics from "../../../components/modals/posts/PostStatisticsModal"
import AdvancedSearchModal from "../../../components/modals/posts/AdvancedSearchModal"
import {
    getAllPostsForAdmin,
    deletePostPermanently,
    updateSponsoredStatus,
    getPostStatistics,
} from "../../../services/postService"

export default function PostManagement() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedPosts, setSelectedPosts] = useState([])
    const [selectedPost, setSelectedPost] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showStatsModal, setShowStatsModal] = useState(false)
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
    const [statistics, setStatistics] = useState(null)

    const [filters, setFilters] = useState({
        keyword: "",
        authorType: "all",
        mainCategory: "all",
        type: "all",
        privacy: "all",
        isSponsored: "all",
        sortBy: "createdAt",
        sortOrder: "desc",
    })

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    })

    const [stats, setStats] = useState({
        total: 0,
        normal: 0,
        share: 0,
        sponsored: 0,
    })

    // Fetch posts
    const fetchPosts = async () => {
        try {
            setLoading(true)
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== "all" && value !== ""),
            )

            const response = await getAllPostsForAdmin(cleanFilters, pagination.page, pagination.limit)

            if (response.success) {
                setPosts(response.data.posts)
                setPagination(response.data.pagination)

                // Calculate stats
                const totalPosts = response.data.posts
                setStats({
                    total: totalPosts.length,
                    normal: totalPosts.filter((p) => p.type === "normal").length,
                    share: totalPosts.filter((p) => p.type === "share").length,
                    sponsored: totalPosts.filter((p) => p.isSponsored).length,
                })
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách bài viết")
            console.error("Error loading posts:", error)
        } finally {
            setLoading(false)
        }
    }

    // Load statistics
    const loadStatistics = async () => {
        try {
            const response = await getPostStatistics()
            if (response.success) {
                setStatistics(response.data)
            }
        } catch (error) {
            console.error("Error loading statistics:", error)
        }
    }

    useEffect(() => {
        fetchPosts()
    }, [pagination.page, pagination.limit])

    useEffect(() => {
        loadStatistics()
    }, [])

    // Handle search
    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }))
        fetchPosts()
    }

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedPosts.length === 0) {
            toast.error("Vui lòng chọn ít nhất một bài viết")
            return
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedPosts.length} bài viết đã chọn?`)) {
            return
        }

        try {
            const promises = selectedPosts.map((postId) => deletePostPermanently(postId))
            await Promise.all(promises)

            toast.success(`Đã xóa ${selectedPosts.length} bài viết`)
            setSelectedPosts([])
            fetchPosts()
        } catch (error) {
            toast.error("Có lỗi xảy ra khi xóa bài viết")
        }
    }

    // Handle single post actions
    const handlePostAction = async (postId, action) => {
        try {
            let response
            switch (action) {
                case "delete":
                    if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn?")) {
                        response = await deletePostPermanently(postId)
                    }
                    break
                case "toggleSponsored":
                    const post = posts.find((p) => p._id === postId)
                    response = await updateSponsoredStatus(postId, !post.isSponsored)
                    break
                default:
                    return
            }

            if (response?.success) {
                toast.success(response.message || "Thao tác thành công")
                fetchPosts()
            }
        } catch (error) {
            toast.error("Có lỗi xảy ra")
        }
    }

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    // Get author type badge
    const getAuthorTypeBadge = (type) => {
        return type === "User" ? (
            <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                Người dùng
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                Shop
            </Badge>
        )
    }

    // Get privacy badge
    const getPrivacyBadge = (privacy) => {
        const colors = {
            public: "bg-green-100 text-green-800",
            friends: "bg-yellow-100 text-yellow-800",
            private: "bg-red-100 text-red-800",
        }
        const labels = {
            public: "Công khai",
            friends: "Bạn bè",
            private: "Riêng tư",
        }
        return (
            <Badge variant="secondary" className={colors[privacy]}>
                {labels[privacy]}
            </Badge>
        )
    }

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            if (filters.keyword && !post.content.toLowerCase().includes(filters.keyword.toLowerCase())) {
                return false
            }
            return true
        })
    }, [posts, filters])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Bài viết</h1>
                    <p className="text-gray-600 mt-1">Quản lý và kiểm duyệt tất cả bài viết trên nền tảng</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => fetchPosts()}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button onClick={() => setShowStatsModal(true)} className="bg-pink-600 hover:bg-pink-700">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Thống kê
                    </Button>
                    <Button onClick={() => setShowAdvancedSearch(true)} variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Tìm kiếm nâng cao
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng bài viết</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics?.overview?.totalPosts || 0}</div>
                        <p className="text-xs text-muted-foreground">Trên toàn nền tảng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bài tài trợ</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{statistics?.overview?.totalSponsoredPosts || 0}</div>
                        <p className="text-xs text-muted-foreground">Đang được tài trợ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bài chia sẻ</CardTitle>
                        <Share2 className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{statistics?.overview?.totalSharePosts || 0}</div>
                        <p className="text-xs text-muted-foreground">Bài được chia sẻ</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tương tác TB</CardTitle>
                        <Heart className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {Math.round(statistics?.interactionStats?.avgLikes || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Lượt thích trung bình</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Bộ lọc & Tìm kiếm</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                placeholder="Tìm kiếm bài viết..."
                                value={filters.keyword}
                                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <Select value={filters.authorType} onValueChange={(value) => handleFilterChange("authorType", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Loại tác giả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="User">Người dùng</SelectItem>
                                <SelectItem value="Shop">Shop</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.type} onValueChange={(value) => handleFilterChange("type", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Loại bài viết" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="normal">Bài thường</SelectItem>
                                <SelectItem value="share">Bài chia sẻ</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button onClick={handleSearch} className="bg-pink-600 hover:bg-pink-700">
                            <Search className="w-4 h-4 mr-2" />
                            Tìm kiếm
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => {
                                setFilters({
                                    keyword: "",
                                    authorType: "all",
                                    mainCategory: "all",
                                    type: "all",
                                    privacy: "all",
                                    isSponsored: "all",
                                    sortBy: "createdAt",
                                    sortOrder: "desc",
                                })
                                fetchPosts()
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedPosts.length > 0 && (
                <Card className="border-pink-200 bg-pink-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Đã chọn {selectedPosts.length} bài viết</span>
                                <Button size="sm" variant="outline" onClick={() => setSelectedPosts([])}>
                                    Bỏ chọn tất cả
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                                    Xóa đã chọn
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Posts Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Bài viết</CardTitle>
                    <CardDescription>
                        Hiển thị {filteredPosts.length} / {pagination.total} bài viết
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedPosts.length === filteredPosts.length && filteredPosts.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedPosts(filteredPosts.map((p) => p._id))
                                                } else {
                                                    setSelectedPosts([])
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Nội dung</TableHead>
                                    <TableHead>Tác giả</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead>Quyền riêng tư</TableHead>
                                    <TableHead>Tương tác</TableHead>
                                    <TableHead>Tài trợ</TableHead>
                                    <TableHead>Ngày tạo</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={9}>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredPosts.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <MessageSquare className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500">Không tìm thấy bài viết nào</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPosts.map((post) => (
                                        <TableRow key={post._id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedPosts.includes(post._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedPosts((prev) => [...prev, post._id])
                                                        } else {
                                                            setSelectedPosts((prev) => prev.filter((id) => id !== post._id))
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <p className="text-sm line-clamp-2">{post.content}</p>
                                                    {post.hashtags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {post.hashtags.slice(0, 2).map((tag, idx) => (
                                                                <Badge key={idx} variant="outline" className="text-xs">
                                                                    #{tag}
                                                                </Badge>
                                                            ))}
                                                            {post.hashtags.length > 2 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{post.hashtags.length - 2}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Avatar className="w-6 h-6">
                                                        <AvatarImage src={post.author?._id?.avatar || "/placeholder.svg"} />
                                                        <AvatarFallback className="text-xs">
                                                            {post.author?._id?.fullName?.[0] || post.author?._id?.name?.[0] || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {post.author?._id?.fullName || post.author?._id?.name || "Unknown"}
                                                        </div>
                                                        {getAuthorTypeBadge(post.author?.type)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={post.type === "normal" ? "default" : "secondary"}>
                                                    {post.type === "normal" ? "Bài thường" : "Bài chia sẻ"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getPrivacyBadge(post.privacy)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-3 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-3 h-3" />
                                                        {post.likesCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {post.commentsCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Share2 className="w-3 h-3" />
                                                        {post.sharesCount || 0}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={post.isSponsored ? "default" : "secondary"}
                                                    className={post.isSponsored ? "bg-yellow-100 text-yellow-800" : ""}
                                                >
                                                    {post.isSponsored ? "Có" : "Không"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">{formatDate(post.createdAt)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedPost(post)
                                                                setShowDetailModal(true)
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedPost(post)
                                                                setShowEditModal(true)
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePostAction(post._id, "toggleSponsored")}>
                                                            <DollarSign className="w-4 h-4 mr-2" />
                                                            {post.isSponsored ? "Bỏ tài trợ" : "Đánh dấu tài trợ"}
                                                        </DropdownMenuItem>
                                                        <Separator />
                                                        <DropdownMenuItem
                                                            onClick={() => handlePostAction(post._id, "delete")}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Xóa vĩnh viễn
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
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} bài
                                viết
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                >
                                    Trước
                                </Button>
                                <span className="text-sm">
                                    Trang {pagination.page} / {pagination.totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page === pagination.totalPages}
                                >
                                    Sau
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modals */}
            {selectedPost && (
                <>
                    <PostDetailModal post={selectedPost} open={showDetailModal} onOpenChange={setShowDetailModal} />
                    <PostEditModal
                        post={selectedPost}
                        open={showEditModal}
                        onOpenChange={setShowEditModal}
                        onSuccess={() => {
                            fetchPosts()
                            setShowEditModal(false)
                        }}
                    />
                </>
            )}

            <PostStatistics open={showStatsModal} onOpenChange={setShowStatsModal} statistics={statistics} />

            <AdvancedSearchModal
                open={showAdvancedSearch}
                onOpenChange={setShowAdvancedSearch}
                onSearch={(searchParams) => {
                    setFilters((prev) => ({ ...prev, ...searchParams }))
                    setPagination((prev) => ({ ...prev, page: 1 }))
                    setShowAdvancedSearch(false)
                    fetchPosts()
                }}
            />
        </div>
    )
}
