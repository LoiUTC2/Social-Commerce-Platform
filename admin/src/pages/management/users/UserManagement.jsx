"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Search,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    Users,
    UserCheck,
    UserX,
    Store,
    RefreshCw,
    X,
    Filter,
    TrendingUp,
} from "lucide-react"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Badge } from "../../../components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Checkbox } from "../../../components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import { Separator } from "../../../components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar"
import { toast } from "sonner"
import UserDetailModal from "../../../components/modals/users/UserDetailModal"
import UserEditModal from "../../../components/modals/users/UserEditModal"
import UserStatistics from "../../../components/modals/users/UserStatisticsModal"
import AdvancedUserSearchModal from "../../../components/modals/users/AdvancedUserSearchModal"
import {
    getAllUsersForAdmin,
    toggleUserStatus,
    deleteUserPermanently,
    getUserStatistics,
} from "../../../services/userService"

export default function UserManagement() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedUsers, setSelectedUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showStatsModal, setShowStatsModal] = useState(false)
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
    const [statistics, setStatistics] = useState(null)

    const [filters, setFilters] = useState({
        keyword: "",
        role: "all",
        isActive: "all",
        hasShop: "all",
        shopStatus: "all",
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
        active: 0,
        inactive: 0,
        sellers: 0,
        buyers: 0,
        withShop: 0,
    })

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true)
            const cleanFilters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== "all" && value !== ""),
            )

            const response = await getAllUsersForAdmin(cleanFilters, pagination.page, pagination.limit)

            if (response.success) {
                setUsers(response.data.users)
                setPagination(response.data.pagination)

                // Update stats from response summary
                if (response.data.summary) {
                    setStats({
                        total: response.data.summary.totalUsers,
                        active: response.data.summary.activeUsers,
                        inactive: response.data.summary.inactiveUsers,
                        sellers: response.data.summary.sellers,
                        buyers: response.data.summary.buyers,
                        withShop: response.data.summary.usersWithShop,
                    })
                }
            }
        } catch (error) {
            toast.error("Lỗi khi tải danh sách người dùng")
            console.error("Error loading users:", error)
        } finally {
            setLoading(false)
        }
    }

    // Load statistics
    const loadStatistics = async () => {
        try {
            const response = await getUserStatistics("30d")
            if (response.success) {
                setStatistics(response.data)
            }
        } catch (error) {
            console.error("Error loading statistics:", error)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [pagination.page, pagination.limit])

    useEffect(() => {
        loadStatistics()
    }, [])

    // Handle search
    const handleSearch = () => {
        setPagination((prev) => ({ ...prev, page: 1 }))
        fetchUsers()
    }

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // Handle bulk actions
    const handleBulkAction = async (action) => {
        if (selectedUsers.length === 0) {
            toast.error("Vui lòng chọn ít nhất một người dùng")
            return
        }

        if (!window.confirm(`Bạn có chắc chắn muốn ${action} ${selectedUsers.length} người dùng đã chọn?`)) {
            return
        }

        try {
            const promises = selectedUsers.map((userId) => {
                switch (action) {
                    case "activate":
                        return toggleUserStatus(userId, true, "Bulk activation by admin")
                    case "deactivate":
                        return toggleUserStatus(userId, false, "Bulk deactivation by admin")
                    case "delete":
                        return deleteUserPermanently(userId, true)
                    default:
                        return Promise.resolve()
                }
            })

            await Promise.all(promises)

            toast.success(
                `Đã ${action === "activate" ? "kích hoạt" : action === "deactivate" ? "vô hiệu hóa" : "xóa"} ${selectedUsers.length} người dùng`,
            )
            setSelectedUsers([])
            fetchUsers()
        } catch (error) {
            toast.error("Có lỗi xảy ra khi thực hiện thao tác")
        }
    }

    // Handle single user actions
    const handleUserAction = async (userId, action) => {
        try {
            let response
            switch (action) {
                case "toggleStatus":
                    const user = users.find((u) => u._id === userId)
                    response = await toggleUserStatus(userId, !user.isActive, `Status changed by admin`)
                    break
                case "delete":
                    if (window.confirm("Bạn có chắc chắn muốn xóa người dùng này vĩnh viễn?")) {
                        response = await deleteUserPermanently(userId, true)
                    }
                    break
                default:
                    return
            }

            if (response?.success) {
                toast.success(response.message || "Thao tác thành công")
                fetchUsers()
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
        })
    }

    // Get role badge
    const getRoleBadge = (role) => {
        const colors = {
            admin: "bg-red-100 text-red-800",
            seller: "bg-blue-100 text-blue-800",
            buyer: "bg-green-100 text-green-800",
        }
        const labels = {
            admin: "Admin",
            seller: "Seller",
            buyer: "Buyer",
        }
        return (
            <Badge variant="secondary" className={colors[role] || "bg-gray-100 text-gray-800"}>
                {labels[role] || role}
            </Badge>
        )
    }

    // Get shop status badge
    const getShopStatusBadge = (user) => {
        if (!user.shopId) {
            return (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                    Không có shop
                </Badge>
            )
        }

        const status = user.shopDetails?.approvalStatus || "pending"
        const colors = {
            approved: "bg-green-100 text-green-800",
            pending: "bg-yellow-100 text-yellow-800",
            rejected: "bg-red-100 text-red-800",
        }
        const labels = {
            approved: "Đã duyệt",
            pending: "Chờ duyệt",
            rejected: "Bị từ chối",
        }

        return (
            <Badge variant="secondary" className={colors[status]}>
                {labels[status]}
            </Badge>
        )
    }

    const filteredUsers = useMemo(() => {
        return users.filter((user) => {
            if (filters.keyword) {
                const keyword = filters.keyword.toLowerCase()
                return (
                    user.fullName?.toLowerCase().includes(keyword) ||
                    user.email?.toLowerCase().includes(keyword) ||
                    user.phone?.includes(keyword)
                )
            }
            return true
        })
    }, [users, filters])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Quản lý Người dùng</h1>
                    <p className="text-gray-600 mt-1">Quản lý tất cả người dùng trên nền tảng</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => fetchUsers()}>
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Trên toàn nền tảng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Không hoạt động</CardTitle>
                        <UserX className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.inactive.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total > 0 ? Math.round((stats.inactive / stats.total) * 100) : 0}% tổng số
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sellers</CardTitle>
                        <Store className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.sellers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Người bán hàng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Buyers</CardTitle>
                        <Users className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">{stats.buyers.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Người mua hàng</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Có shop</CardTitle>
                        <Store className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.withShop.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Đã tạo shop</p>
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
                                placeholder="Tìm kiếm người dùng..."
                                value={filters.keyword}
                                onChange={(e) => handleFilterChange("keyword", e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                            />
                        </div>

                        <Select value={filters.role} onValueChange={(value) => handleFilterChange("role", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="buyer">Buyer</SelectItem>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={filters.isActive} onValueChange={(value) => handleFilterChange("isActive", value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="true">Hoạt động</SelectItem>
                                <SelectItem value="false">Không hoạt động</SelectItem>
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
                                    role: "all",
                                    isActive: "all",
                                    hasShop: "all",
                                    shopStatus: "all",
                                    sortBy: "createdAt",
                                    sortOrder: "desc",
                                })
                                fetchUsers()
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
                <Card className="border-pink-200 bg-pink-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium">Đã chọn {selectedUsers.length} người dùng</span>
                                <Button size="sm" variant="outline" onClick={() => setSelectedUsers([])}>
                                    Bỏ chọn tất cả
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleBulkAction("activate")}>
                                    Kích hoạt
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleBulkAction("deactivate")}>
                                    Vô hiệu hóa
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleBulkAction("delete")}>
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách Người dùng</CardTitle>
                    <CardDescription>
                        Hiển thị {filteredUsers.length} / {pagination.total} người dùng
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-gray-500">
                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} người
                                dùng
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
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSelectedUsers(filteredUsers.map((u) => u._id))
                                                } else {
                                                    setSelectedUsers([])
                                                }
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead>Người dùng</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Shop</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ngày tham gia</TableHead>
                                    <TableHead>Hoạt động</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell colSpan={8}>
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                                                    <div className="space-y-2 flex-1">
                                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8">
                                            <div className="flex flex-col items-center gap-2">
                                                <Users className="w-8 h-8 text-gray-400" />
                                                <p className="text-gray-500">Không tìm thấy người dùng nào</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedUsers.includes(user._id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedUsers((prev) => [...prev, user._id])
                                                        } else {
                                                            setSelectedUsers((prev) => prev.filter((id) => id !== user._id))
                                                        }
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <Avatar className="w-10 h-10">
                                                        <AvatarImage src={user.avatar || "/placeholder.svg"} />
                                                        <AvatarFallback className="bg-pink-100 text-pink-600">
                                                            {user.fullName?.[0] || "U"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium text-sm">{user.fullName || "Chưa có tên"}</div>
                                                        <div className="text-xs text-gray-500">{user.email}</div>
                                                        {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {getShopStatusBadge(user)}
                                                    {user.shopId && (
                                                        <div className="text-xs text-gray-500">{user.shopDetails?.name || "Shop"}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={user.isActive ? "default" : "secondary"}
                                                    className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                                                >
                                                    {user.isActive ? "Hoạt động" : "Không hoạt động"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{formatDate(user.createdAt)}</div>
                                                <div className="text-xs text-gray-500">{user.joinedDays} ngày trước</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-xs text-gray-500">
                                                    <div>Posts: {user.stats?.totalPosts || 0}</div>
                                                    <div>Orders: {user.stats?.totalOrders || 0}</div>
                                                </div>
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
                                                                setSelectedUser(user)
                                                                setShowDetailModal(true)
                                                            }}
                                                        >
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Xem chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setShowEditModal(true)
                                                            }}
                                                        >
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Chỉnh sửa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUserAction(user._id, "toggleStatus")}>
                                                            {user.isActive ? (
                                                                <UserX className="w-4 h-4 mr-2" />
                                                            ) : (
                                                                <UserCheck className="w-4 h-4 mr-2" />
                                                            )}
                                                            {user.isActive ? "Vô hiệu hóa" : "Kích hoạt"}
                                                        </DropdownMenuItem>
                                                        <Separator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleUserAction(user._id, "delete")}
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
                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} người
                                dùng
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
            {selectedUser && (
                <>
                    <UserDetailModal user={selectedUser} open={showDetailModal} onOpenChange={setShowDetailModal} />
                    <UserEditModal
                        user={selectedUser}
                        open={showEditModal}
                        onOpenChange={setShowEditModal}
                        onSuccess={() => {
                            fetchUsers()
                            setShowEditModal(false)
                        }}
                    />
                </>
            )}

            <UserStatistics open={showStatsModal} onOpenChange={setShowStatsModal} statistics={statistics} />

            <AdvancedUserSearchModal
                open={showAdvancedSearch}
                onOpenChange={setShowAdvancedSearch}
                onSearch={(searchParams) => {
                    setFilters((prev) => ({ ...prev, ...searchParams }))
                    setPagination((prev) => ({ ...prev, page: 1 }))
                    setShowAdvancedSearch(false)
                    fetchUsers()
                }}
            />
        </div>
    )
}
