import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Store, Crown, Star, Package } from "lucide-react"

const COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function ShopStatistics({ open, onOpenChange, statistics }) {
    if (!statistics) return null

    // Prepare chart data
    const featureLevelData = [
        { name: "Normal", value: statistics.featureLevelStats.normal, color: "#6b7280" },
        { name: "Premium", value: statistics.featureLevelStats.premium, color: "#3b82f6" },
        { name: "VIP", value: statistics.featureLevelStats.vip, color: "#8b5cf6" },
    ]

    const statusData = [
        { name: "Hoạt động", value: statistics.totalStats.activeShops, color: "#10b981" },
        { name: "Tạm dừng", value: statistics.totalStats.inactiveShops, color: "#ef4444" },
    ]

    const topRevenueShops = statistics.topShops?.byRevenue || []
    const topRatingShops = statistics.topShops?.byRating || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-pink-600" />
                        Thống kê Shop
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-pink-200 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-pink-100 text-sm">Tổng shop</p>
                                        <p className="text-2xl font-bold">{statistics.totalStats.totalShops || 0}</p>
                                    </div>
                                    <Store className="w-8 h-8 text-pink-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-green-200 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Đang hoạt động</p>
                                        <p className="text-2xl font-bold">{statistics.totalStats.activeShops || 0}</p>
                                    </div>
                                    <Store className="w-8 h-8 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-yellow-100 text-sm">Chờ duyệt</p>
                                        <p className="text-2xl font-bold">{statistics.totalStats.pendingApproval || 0}</p>
                                    </div>
                                    <Package className="w-8 h-8 text-yellow-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Shop mới tháng này</p>
                                        <p className="text-2xl font-bold">{statistics.monthlyStats?.newShopsThisMonth || 0}</p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Feature Level Distribution */}
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Crown className="w-5 h-5 text-pink-600" />
                                    Phân bố theo gói dịch vụ
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={featureLevelData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {featureLevelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Status Distribution */}
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Store className="w-5 h-5 text-pink-600" />
                                    Phân bố theo trạng thái
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Shops */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Top Revenue Shops */}
                        {topRevenueShops.length > 0 && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-pink-600" />
                                        Top 10 Shop theo doanh thu
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {topRevenueShops.map((shop, index) => (
                                            <div key={shop._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                                                    >
                                                        {index + 1}
                                                    </Badge>
                                                    <div>
                                                        <span className="font-medium">{shop.name}</span>
                                                        <p className="text-xs text-gray-500">{shop.owner?.fullName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-green-100 text-green-800">
                                                        {shop.stats?.revenue?.toLocaleString("vi-VN") || 0}đ
                                                    </Badge>
                                                    <p className="text-xs text-gray-500">{shop.stats?.orderCount || 0} đơn hàng</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Top Rating Shops */}
                        {topRatingShops.length > 0 && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Star className="w-5 h-5 text-pink-600" />
                                        Top 10 Shop theo đánh giá
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {topRatingShops.map((shop, index) => (
                                            <div key={shop._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                                                    >
                                                        {index + 1}
                                                    </Badge>
                                                    <div>
                                                        <span className="font-medium">{shop.name}</span>
                                                        <p className="text-xs text-gray-500">{shop.owner?.fullName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge className="bg-yellow-100 text-yellow-800">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        {shop.stats?.rating?.avg?.toFixed(1) || "0.0"}
                                                    </Badge>
                                                    <p className="text-xs text-gray-500">{shop.stats?.rating?.count || 0} đánh giá</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Detailed Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle>Chi tiết gói dịch vụ</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-gray-100 text-gray-800">Normal</Badge>
                                        </div>
                                        <span className="font-medium">{statistics.featureLevelStats.normal || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-blue-100 text-blue-800">Premium</Badge>
                                        </div>
                                        <span className="font-medium">{statistics.featureLevelStats.premium || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-purple-100 text-purple-800">VIP</Badge>
                                        </div>
                                        <span className="font-medium">{statistics.featureLevelStats.vip || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle>Trạng thái duyệt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-100 text-green-800">Đã duyệt</Badge>
                                        </div>
                                        <span className="font-medium">{statistics.totalStats.approvedShops || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>
                                        </div>
                                        <span className="font-medium">{statistics.totalStats.pendingApproval || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-red-100 text-red-800">Bị từ chối</Badge>
                                        </div>
                                        <span className="font-medium">{statistics.totalStats.rejectedShops || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle>Thông tin bổ sung</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tỷ lệ hoạt động:</span>
                                        <span className="font-medium">
                                            {statistics.totalStats.totalShops > 0
                                                ? Math.round((statistics.totalStats.activeShops / statistics.totalStats.totalShops) * 100)
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tỷ lệ Premium+:</span>
                                        <span className="font-medium">
                                            {statistics.totalStats.totalShops > 0
                                                ? Math.round(
                                                    ((statistics.featureLevelStats.premium + statistics.featureLevelStats.vip) /
                                                        statistics.totalStats.totalShops) *
                                                    100,
                                                )
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Tỷ lệ duyệt:</span>
                                        <span className="font-medium">
                                            {statistics.totalStats.totalShops > 0
                                                ? Math.round((statistics.totalStats.approvedShops / statistics.totalStats.totalShops) * 100)
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Shop mới tháng này:</span>
                                        <span className="font-medium">{statistics.monthlyStats?.newShopsThisMonth || 0}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
