import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Badge } from "../../ui/badge"
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { TrendingUp, Users, UserCheck, UserX, Store, Shield } from "lucide-react"

const COLORS = ["#ec4899", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]

export default function UserStatistics({ open, onOpenChange, statistics }) {
  if (!statistics) return null

  // Prepare chart data
  const roleData = [
    { name: "Buyers", value: statistics.buyers, color: "#10b981" },
    { name: "Sellers", value: statistics.sellers, color: "#3b82f6" },
    { name: "Admins", value: statistics.admins, color: "#ef4444" },
  ]

  const statusData = [
    { name: "Hoạt động", value: statistics.activeUsers, color: "#10b981" },
    { name: "Không hoạt động", value: statistics.inactiveUsers, color: "#ef4444" },
  ]

  const shopData = [
    { name: "Có shop", value: statistics.usersWithShop, color: "#8b5cf6" },
    { name: "Không có shop", value: statistics.totalUsers - statistics.usersWithShop, color: "#6b7280" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-600" />
            Thống kê người dùng
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-pink-200 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pink-100 text-sm">Tổng người dùng</p>
                    <p className="text-2xl font-bold">{statistics.totalUsers || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-pink-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Đang hoạt động</p>
                    <p className="text-2xl font-bold">{statistics.activeUsers || 0}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-gradient-to-r from-red-500 to-rose-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Không hoạt động</p>
                    <p className="text-2xl font-bold">{statistics.inactiveUsers || 0}</p>
                  </div>
                  <UserX className="w-8 h-8 text-red-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Người dùng mới</p>
                    <p className="text-2xl font-bold">{statistics.newUsers || 0}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Role & Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution */}
            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-pink-600" />
                  Phân bố theo Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
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
                  <UserCheck className="w-5 h-5 text-pink-600" />
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

          {/* Shop Statistics */}
          <Card className="border-pink-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-pink-600" />
                Thống kê Shop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={shopData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {shopData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{statistics.usersWithShop || 0}</p>
                      <p className="text-sm text-gray-600">Người dùng có shop</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{statistics.approvedShops || 0}</p>
                      <p className="text-sm text-gray-600">Shop đã duyệt</p>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{statistics.pendingShops || 0}</p>
                      <p className="text-sm text-gray-600">Shop chờ duyệt</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle>Chi tiết Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Buyers</Badge>
                    </div>
                    <span className="font-medium">{statistics.buyers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Sellers</Badge>
                    </div>
                    <span className="font-medium">{statistics.sellers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">Admins</Badge>
                    </div>
                    <span className="font-medium">{statistics.admins || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-pink-200">
              <CardHeader>
                <CardTitle>Trạng thái hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Hoạt động</Badge>
                    </div>
                    <span className="font-medium">{statistics.activeUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-800">Không hoạt động</Badge>
                    </div>
                    <span className="font-medium">{statistics.inactiveUsers || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-100 text-purple-800">Mới ({statistics.period})</Badge>
                    </div>
                    <span className="font-medium">{statistics.newUsers || 0}</span>
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
                      {statistics.totalUsers > 0
                        ? Math.round((statistics.activeUsers / statistics.totalUsers) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tỷ lệ có shop:</span>
                    <span className="font-medium">
                      {statistics.totalUsers > 0
                        ? Math.round((statistics.usersWithShop / statistics.totalUsers) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tỷ lệ seller:</span>
                    <span className="font-medium">
                      {statistics.totalUsers > 0 ? Math.round((statistics.sellers / statistics.totalUsers) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thống kê tại:</span>
                    <span className="font-medium text-xs">
                      {statistics.generatedAt ? new Date(statistics.generatedAt).toLocaleString("vi-VN") : "N/A"}
                    </span>
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
