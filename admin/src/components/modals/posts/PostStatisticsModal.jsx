import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts"
import { TrendingUp, Users, MessageSquare, Heart, Share2, DollarSign, Calendar, Tag } from "lucide-react"

const COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function PostStatistics({ open, onOpenChange, statistics }) {
    if (!statistics) return null

    const { overview, authorTypeStats, privacyStats, categoryStats, interactionStats, timeStats } = statistics

    // Prepare chart data
    const authorTypeChartData =
        authorTypeStats?.map((stat) => ({
            name: stat._id === "User" ? "Người dùng" : "Shop",
            value: stat.count,
        })) || []

    const privacyChartData =
        privacyStats?.map((stat) => ({
            name: stat._id === "public" ? "Công khai" : stat._id === "friends" ? "Bạn bè" : "Riêng tư",
            value: stat.count,
        })) || []

    const categoryChartData =
        categoryStats?.slice(0, 8).map((stat) => ({
            name: stat.categoryName || "Không xác định",
            value: stat.count,
        })) || []

    const timeChartData =
        timeStats?.map((stat) => ({
            date: new Date(stat._id).toLocaleDateString("vi-VN", { month: "short", day: "numeric" }),
            posts: stat.count,
        })) || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-pink-600" />
                        Thống kê bài viết
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-pink-200 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-pink-100 text-sm">Tổng bài viết</p>
                                        <p className="text-2xl font-bold">{overview?.totalPosts || 0}</p>
                                    </div>
                                    <MessageSquare className="w-8 h-8 text-pink-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-purple-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Bài tài trợ</p>
                                        <p className="text-2xl font-bold">{overview?.totalSponsoredPosts || 0}</p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-rose-200 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-rose-100 text-sm">Bài chia sẻ</p>
                                        <p className="text-2xl font-bold">{overview?.totalSharePosts || 0}</p>
                                    </div>
                                    <Share2 className="w-8 h-8 text-rose-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-gray-200 bg-gradient-to-r from-gray-600 to-gray-800 text-white">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-300 text-sm">Bài thường</p>
                                        <p className="text-2xl font-bold">{overview?.totalNormalPosts || 0}</p>
                                    </div>
                                    <MessageSquare className="w-8 h-8 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Interaction Stats */}
                    {interactionStats && (
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-pink-600" />
                                    Thống kê tương tác
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="text-center p-3 bg-pink-50 rounded-lg">
                                        <p className="text-2xl font-bold text-pink-600">{interactionStats.totalLikes || 0}</p>
                                        <p className="text-sm text-gray-600">Tổng lượt thích</p>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-600">{interactionStats.totalComments || 0}</p>
                                        <p className="text-sm text-gray-600">Tổng bình luận</p>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-600">{interactionStats.totalShares || 0}</p>
                                        <p className="text-sm text-gray-600">Tổng chia sẻ</p>
                                    </div>
                                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                                        <p className="text-2xl font-bold text-purple-600">{Math.round(interactionStats.avgLikes || 0)}</p>
                                        <p className="text-sm text-gray-600">TB lượt thích</p>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <p className="text-2xl font-bold text-yellow-600">
                                            {Math.round(interactionStats.avgComments || 0)}
                                        </p>
                                        <p className="text-sm text-gray-600">TB bình luận</p>
                                    </div>
                                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                        <p className="text-2xl font-bold text-indigo-600">{Math.round(interactionStats.avgShares || 0)}</p>
                                        <p className="text-sm text-gray-600">TB chia sẻ</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Author Type Distribution */}
                        {authorTypeChartData.length > 0 && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-pink-600" />
                                        Phân bố theo loại tác giả
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={authorTypeChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {authorTypeChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}

                        {/* Privacy Distribution */}
                        {privacyChartData.length > 0 && (
                            <Card className="border-pink-200">
                                <CardHeader>
                                    <CardTitle>Phân bố theo quyền riêng tư</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={privacyChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {privacyChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Category Stats */}
                    {categoryChartData.length > 0 && (
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-pink-600" />
                                    Top danh mục
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={categoryChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#ec4899" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Time Series */}
                    {timeChartData.length > 0 && (
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-pink-600" />
                                    Xu hướng 7 ngày gần nhất
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeChartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="posts" stroke="#ec4899" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Category Details */}
                    {categoryStats && categoryStats.length > 0 && (
                        <Card className="border-pink-200">
                            <CardHeader>
                                <CardTitle>Chi tiết danh mục</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {categoryStats.slice(0, 10).map((category, index) => (
                                        <div key={category._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs"
                                                >
                                                    {index + 1}
                                                </Badge>
                                                <span className="font-medium">{category.categoryName || "Không xác định"}</span>
                                            </div>
                                            <Badge className="bg-pink-100 text-pink-800">{category.count} bài viết</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
