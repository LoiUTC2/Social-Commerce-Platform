"use client"

import { useState } from "react"
import {
    FiUsers,
    FiShoppingBag,
    FiDollarSign,
    FiTrendingUp,
    FiFileText,
    FiAlertCircle,
    FiBell,
    FiEye,
    FiArrowUp,
    FiArrowDown,
    FiActivity,
    FiCalendar,
} from "react-icons/fi"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"

const Dashboard = () => {
    const [timeRange, setTimeRange] = useState("7days")
    const [stats, setStats] = useState({
        totalUsers: 12543,
        totalStores: 1234,
        totalRevenue: 2500000000,
        pendingPosts: 45,
        pendingComplaints: 12,
        activeDisputes: 8,
        todayRevenue: 150000000,
        monthlyGrowth: 15.2,
        userGrowth: 12.5,
        storeGrowth: 8.2,
        todayOrders: 298,
        orderGrowth: 18.7,
    })

    // Dữ liệu biểu đồ doanh thu 7 ngày qua
    const [revenueData] = useState([
        {
            day: "T2",
            date: "12/06",
            revenue: 120000000,
            orders: 245,
            users: 45,
        },
        {
            day: "T3",
            date: "13/06",
            revenue: 135000000,
            orders: 267,
            users: 52,
        },
        {
            day: "T4",
            date: "14/06",
            revenue: 142000000,
            orders: 289,
            users: 48,
        },
        {
            day: "T5",
            date: "15/06",
            revenue: 118000000,
            orders: 234,
            users: 41,
        },
        {
            day: "T6",
            date: "16/06",
            revenue: 165000000,
            orders: 312,
            users: 67,
        },
        {
            day: "T7",
            date: "17/06",
            revenue: 178000000,
            orders: 345,
            users: 73,
        },
        {
            day: "CN",
            date: "18/06",
            revenue: 150000000,
            orders: 298,
            users: 58,
        },
    ])

    // Dữ liệu phân bố người dùng
    const [userDistribution] = useState([
        { name: "Người mua", value: 8543, color: "#e91e63" },
        { name: "Người bán", value: 3234, color: "#2196f3" },
        { name: "Admin", value: 766, color: "#4caf50" },
    ])

    const [recentActivities] = useState([
        {
            id: 1,
            type: "post",
            message: "Bài đăng mới từ Shop ABC cần duyệt",
            time: "2 phút trước",
            priority: "high",
        },
        {
            id: 2,
            type: "dispute",
            message: "Tranh chấp giữa khách hàng và Shop XYZ",
            time: "5 phút trước",
            priority: "high",
        },
        {
            id: 3,
            type: "user",
            message: "Tài khoản người bán mới đăng ký",
            time: "10 phút trước",
            priority: "medium",
        },
        {
            id: 4,
            type: "revenue",
            message: "Doanh thu hôm nay đạt 150M VNĐ",
            time: "1 giờ trước",
            priority: "low",
        },
        {
            id: 5,
            type: "system",
            message: "Backup dữ liệu hoàn tất",
            time: "2 giờ trước",
            priority: "low",
        },
    ])

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const formatCompactCurrency = (amount) => {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(1)}B VNĐ`
        }
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M VNĐ`
        }
        return formatCurrency(amount)
    }

    // Custom tooltip cho biểu đồ
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900">{`${label} (${data.date})`}</p>
                    <div className="space-y-1 mt-2">
                        {payload.map((entry, index) => (
                            <p key={index} className="text-sm" style={{ color: entry.color }}>
                                {entry.name}: {entry.name === "revenue" ? formatCompactCurrency(entry.value) : entry.value}
                            </p>
                        ))}
                    </div>
                </div>
            )
        }
        return null
    }

    const StatCard = ({ icon: Icon, title, value, change, color, subtitle }) => (
        <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${color}15` }}>
                            <Icon className="w-6 h-6" style={{ color }} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{title}</p>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
                        </div>
                    </div>
                    {change !== undefined && (
                        <div className="text-right">
                            <div className={`flex items-center space-x-1 ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {change >= 0 ? <FiArrowUp className="w-4 h-4" /> : <FiArrowDown className="w-4 h-4" />}
                                <span className="text-sm font-semibold">{Math.abs(change)}%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">vs tháng trước</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    const PendingItem = ({ icon: Icon, title, count, color, priority = "medium" }) => (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg`} style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <div>
                    <p className="font-medium text-gray-900">{title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <Badge
                            variant={priority === "high" ? "destructive" : priority === "medium" ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {priority === "high" ? "Khẩn cấp" : priority === "medium" ? "Bình thường" : "Thấp"}
                        </Badge>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold" style={{ color }}>
                    {count}
                </span>
            </div>
        </div>
    )

    const ActivityItem = ({ activity }) => {
        const getActivityIcon = (type) => {
            switch (type) {
                case "post":
                    return FiFileText
                case "dispute":
                    return FiAlertCircle
                case "user":
                    return FiUsers
                case "revenue":
                    return FiDollarSign
                case "system":
                    return FiActivity
                default:
                    return FiBell
            }
        }

        const getActivityColor = (type) => {
            switch (type) {
                case "post":
                    return "#e91e63"
                case "dispute":
                    return "#f44336"
                case "user":
                    return "#2196f3"
                case "revenue":
                    return "#4caf50"
                case "system":
                    return "#9c27b0"
                default:
                    return "#666"
            }
        }

        const Icon = getActivityIcon(activity.type)
        const color = getActivityColor(activity.type)

        return (
            <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className={`p-2 rounded-lg mt-1`} style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">{activity.time}</span>
                        <Badge
                            variant={
                                activity.priority === "high" ? "destructive" : activity.priority === "medium" ? "default" : "secondary"
                            }
                            className="text-xs"
                        >
                            {activity.priority === "high" ? "Cao" : activity.priority === "medium" ? "Trung bình" : "Thấp"}
                        </Badge>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Tổng quan</h1>
                    <p className="text-gray-600 mt-1">Chào mừng trở lại! Đây là tổng quan về nền tảng HULO.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7days">7 ngày qua</SelectItem>
                            <SelectItem value="30days">30 ngày qua</SelectItem>
                            <SelectItem value="90days">3 tháng qua</SelectItem>
                            <SelectItem value="1year">1 năm qua</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                        <FiCalendar className="w-4 h-4 mr-2" />
                        Tùy chỉnh
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={FiUsers}
                    title="Tổng người dùng"
                    value={stats.totalUsers.toLocaleString()}
                    change={stats.userGrowth}
                    color="#e91e63"
                    subtitle="Người dùng hoạt động"
                />
                <StatCard
                    icon={FiShoppingBag}
                    title="Tổng gian hàng"
                    value={stats.totalStores.toLocaleString()}
                    change={stats.storeGrowth}
                    color="#2196f3"
                    subtitle="Gian hàng đang hoạt động"
                />
                <StatCard
                    icon={FiDollarSign}
                    title="Doanh thu tháng"
                    value={formatCompactCurrency(stats.totalRevenue)}
                    change={stats.monthlyGrowth}
                    color="#4caf50"
                    subtitle="Tổng doanh thu tháng này"
                />
                <StatCard
                    icon={FiTrendingUp}
                    title="Đơn hàng hôm nay"
                    value={stats.todayOrders.toLocaleString()}
                    change={stats.orderGrowth}
                    color="#ff9800"
                    subtitle={formatCompactCurrency(stats.todayRevenue)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Tasks */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FiAlertCircle className="w-5 h-5 text-pink-600" />
                            <span>Cần xử lý</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <PendingItem
                            icon={FiFileText}
                            title="Bài đăng chờ duyệt"
                            count={stats.pendingPosts}
                            color="#e91e63"
                            priority="high"
                        />
                        <PendingItem
                            icon={FiBell}
                            title="Khiếu nại chờ xử lý"
                            count={stats.pendingComplaints}
                            color="#f44336"
                            priority="high"
                        />
                        <PendingItem
                            icon={FiEye}
                            title="Tranh chấp đang xử lý"
                            count={stats.activeDisputes}
                            color="#ff9800"
                            priority="medium"
                        />
                    </CardContent>
                </Card>

                {/* User Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FiUsers className="w-5 h-5 text-pink-600" />
                            <span>Phân bố người dùng</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={userDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {userDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [value.toLocaleString(), "Người dùng"]} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {userDistribution.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{item.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="revenue" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
                    <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
                    <TabsTrigger value="users">Người dùng mới</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FiTrendingUp className="w-5 h-5 text-pink-600" />
                                <span>Biểu đồ doanh thu 7 ngày qua</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#666" }}
                                        tickFormatter={(value) => `${value / 1000000}M`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#4caf50"
                                        strokeWidth={3}
                                        dot={{ fill: "#4caf50", strokeWidth: 2, r: 6 }}
                                        activeDot={{ r: 8, stroke: "#4caf50", strokeWidth: 2 }}
                                        name="Doanh thu"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FiShoppingBag className="w-5 h-5 text-pink-600" />
                                <span>Số lượng đơn hàng 7 ngày qua</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                                    <Tooltip
                                        formatter={(value) => [value, "Đơn hàng"]}
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                        }}
                                    />
                                    <Bar dataKey="orders" fill="#2196f3" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FiUsers className="w-5 h-5 text-pink-600" />
                                <span>Người dùng mới 7 ngày qua</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#666" }} />
                                    <Tooltip
                                        formatter={(value) => [value, "Người dùng mới"]}
                                        contentStyle={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #ddd",
                                            borderRadius: "8px",
                                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                                        }}
                                    />
                                    <Bar dataKey="users" fill="#e91e63" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Recent Activities */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FiBell className="w-5 h-5 text-pink-600" />
                        <span>Hoạt động gần đây</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {recentActivities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} />
                        ))}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <Button variant="outline" className="w-full">
                            Xem tất cả hoạt động
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default Dashboard
