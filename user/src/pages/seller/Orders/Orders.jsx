"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Card, CardContent } from "../../../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis, } from "../../../components/ui/pagination"
import { ShoppingCart, Search, Download, Eye, Package, Clock, Truck, CheckCircle, XCircle, RefreshCw, Phone, MoreVertical, FileText, MessageSquare, Star, DollarSign, ShoppingBag, BarChart3, Mail,} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../components/ui/dropdown-menu"
import { Badge } from "../../../components/ui/badge"
import { Checkbox } from "../../../components/ui/checkbox"
import { DatePickerWithRange } from "../../../components/ui/date-range-picker"
import { toast } from "sonner"
import { useAuth } from "../../../contexts/AuthContext"
import OrderDetailModal from "../../../components/common/OrderDetailModal"
import {
  getOrdersForSeller,
  updateOrderStatus,
  getOrderStats,
  exportOrdersToExcel,
  bulkUpdateOrderStatus,
} from "../../../services/orderService"

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Order status mapping
const orderStatuses = {
  pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle },
  shipping: { label: "Đang giao hàng", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Truck },
  delivered: { label: "Đã giao hàng", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
  cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
}

// Payment status mapping
const paymentStatuses = {
  pending: { label: "Chưa thanh toán", color: "bg-yellow-100 text-yellow-800" },
  paid: { label: "Đã thanh toán", color: "bg-green-100 text-green-800" },
}

export default function Orders() {
  const navigate = useNavigate()
  const { user, setShowLoginModal } = useAuth()
  const [selectedOrders, setSelectedOrders] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all")
  const [dateRange, setDateRange] = useState(null)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [loading, setLoading] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)

  // Statistics data
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
    revenue: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
  })

  // Fetch orders
  const fetchOrders = async (page = 1) => {
    if (!user) return setShowLoginModal(true)
    setLoading(true)
    try {
      const params = {
        page,
        limit: pagination.limit,
        status: filterStatus,
        search: searchQuery,
      }

      // Add payment status filter logic
      if (filterPaymentStatus === "paid") {
        // Backend cần hỗ trợ filter này hoặc filter ở frontend
        params.isPaid = true
      } else if (filterPaymentStatus === "pending") {
        params.isPaid = false
      }

      if (dateRange?.from) {
        params.startDate = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.endDate = dateRange.to.toISOString()
      }

      const response = await getOrdersForSeller(user._id, params)

      if (response.success) {
        console.log("OrderInfo: ", response.data.orders)
        setOrders(response.data.orders || [])
        setPagination({
          page: response.data.pagination.currentPage,
          limit: response.data.pagination.limit || 10,
          total: response.data.pagination.totalOrders,
          totalPages: response.data.pagination.totalPages,
        })
      } else {
        throw new Error(response.message || "Không thể lấy danh sách đơn hàng")
      }
    } catch (error) {
      toast.error("Lỗi", { description: error.response.data.message || "Không thể lấy danh sách đơn hàng." })
      console.error("Lỗi khi lấy đơn hàng:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch statistics
  const fetchStats = async () => {
    if (!user) return
    try {
      const params = {}
      if (dateRange?.from) {
        params.startDate = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.endDate = dateRange.to.toISOString()
      }

      const response = await getOrderStats(user._id, params)
      if (response.success) {
        // Transform backend stats to match frontend format
        const backendStats = response.data
        const statusBreakdown = backendStats.statusBreakdown || []

        const transformedStats = {
          total: backendStats.totalOrders || 0,
          pending: statusBreakdown.find((s) => s._id === "pending")?.count || 0,
          confirmed: statusBreakdown.find((s) => s._id === "confirmed")?.count || 0,
          shipping: statusBreakdown.find((s) => s._id === "shipping")?.count || 0,
          delivered: statusBreakdown.find((s) => s._id === "delivered")?.count || 0,
          cancelled: statusBreakdown.find((s) => s._id === "cancelled")?.count || 0,
          revenue: backendStats.totalRevenue || 0,
          totalRevenue: backendStats.totalRevenue || 0,
          averageOrderValue: backendStats.totalOrders > 0 ? backendStats.totalRevenue / backendStats.totalOrders : 0,
        }

        setStats(transformedStats)
      }
    } catch (error) {
      console.error("Lỗi khi lấy thống kê:", error)
    }
  }

  useEffect(() => {
    fetchOrders(pagination.page)
    fetchStats()
  }, [pagination.page, filterStatus, filterPaymentStatus, searchQuery, dateRange])

  // Handle refresh
  const handleRefresh = () => {
    fetchOrders(pagination.page)
    fetchStats()
    toast.info("Đã làm mới danh sách đơn hàng.")
  }

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingStatus(orderId)
    try {
      const response = await updateOrderStatus(orderId, newStatus)
      if (response.success) {
        toast.success("Thành công", {
          description: `Cập nhật trạng thái đơn hàng thành ${orderStatuses[newStatus].label}.`,
        })
        fetchOrders(pagination.page)
        fetchStats()
      } else {
        throw new Error(response.message || "Cập nhật trạng thái thất bại")
      }
    } catch (error) {
      toast.error("Lỗi", { description: error.response.data.message || "Cập nhật trạng thái thất bại." })
    } finally {
      setUpdatingStatus(null)
    }
  }

  // Handle bulk status update
  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một đơn hàng")
      return
    }

    setBulkUpdating(true)
    try {
      const response = await bulkUpdateOrderStatus(selectedOrders, newStatus)
      if (response.success) {
        toast.success("Thành công", {
          description: `Cập nhật ${response.data.successCount}/${response.data.totalCount} đơn hàng thành công.`,
        })
        setSelectedOrders([])
        fetchOrders(pagination.page)
        fetchStats()
      } else {
        throw new Error("Cập nhật hàng loạt thất bại")
      }
    } catch (error) {
      toast.error("Lỗi", { description: error.message || "Cập nhật hàng loạt thất bại." })
    } finally {
      setBulkUpdating(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    setExporting(true)
    try {
      const params = {
        status: filterStatus,
        search: searchQuery,
      }

      if (filterPaymentStatus === "paid") {
        params.isPaid = true
      } else if (filterPaymentStatus === "pending") {
        params.isPaid = false
      }

      if (dateRange?.from) {
        params.startDate = dateRange.from.toISOString()
      }
      if (dateRange?.to) {
        params.endDate = dateRange.to.toISOString()
      }

      const response = await exportOrdersToExcel(user._id, params)
      if (response.success) {
        toast.success("Thành công", {
          description: `Xuất ${response.data.totalRecords} đơn hàng thành công.`,
        })

        // Trigger download
        const link = document.createElement("a")
        link.href = response.data.downloadUrl
        link.download = response.data.filename
        link.click()
      } else {
        throw new Error("Xuất báo cáo thất bại")
      }
    } catch (error) {
      toast.error("Lỗi", { description: error.message || "Xuất báo cáo thất bại." })
    } finally {
      setExporting(false)
    }
  }

  // Handle selection
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedOrders(orders.map((order) => order._id))
    } else {
      setSelectedOrders([])
    }
  }

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) => (prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]))
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }))
    }
  }

  // Handle view order detail
  const handleViewOrderDetail = (orderId) => {
    setSelectedOrderId(orderId)
    setShowOrderDetail(true)
  }

  // Calculate final amount for display
  const calculateFinalAmount = (order) => {
    return order.totalAmount + (order.shippingFee || 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" /> Quản lý đơn hàng
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button className="bg-pink-500 hover:bg-pink-600" onClick={handleExport} disabled={exporting}>
            <Download className="w-4 h-4 mr-2" />
            {exporting ? "Đang xuất..." : "Xuất báo cáo"}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-sm text-blue-600">Tổng đơn hàng</div>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                <div className="text-sm text-yellow-600">Chờ xác nhận</div>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-700">{stats.confirmed}</div>
                <div className="text-sm text-blue-600">Đã xác nhận</div>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-700">{stats.shipping}</div>
                <div className="text-sm text-orange-600">Đang giao</div>
              </div>
              <Truck className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-700">{stats.delivered}</div>
                <div className="text-sm text-green-600">Đã giao</div>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-700">{stats.cancelled}</div>
                <div className="text-sm text-red-600">Đã hủy</div>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-pink-50 to-pink-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-pink-700">
                  {formatCurrency(stats.revenue).replace("₫", "").trim()}₫
                </div>
                <div className="text-sm text-pink-600">Doanh thu</div>
              </div>
              <DollarSign className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-purple-700">
                  {formatCurrency(stats.averageOrderValue).replace("₫", "").trim()}₫
                </div>
                <div className="text-sm text-purple-600">Giá trị TB</div>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng, SĐT, email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái đơn hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {Object.entries(orderStatuses).map(([key, status]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Thanh toán" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="pending">Chưa thanh toán</SelectItem>
                </SelectContent>
              </Select>

              <DatePickerWithRange date={dateRange} onDateChange={setDateRange} className="w-[280px]" />
            </div>
          </div>

          {selectedOrders.length > 0 && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium mr-2">Đã chọn {selectedOrders.length} đơn hàng</span>
              <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
                <Download className="w-4 h-4 mr-1" />
                {exporting ? "Đang xuất..." : "Xuất Excel"}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={bulkUpdating}>
                    <Package className="w-4 h-4 mr-1" />
                    {bulkUpdating ? "Đang cập nhật..." : "Cập nhật hàng loạt"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(orderStatuses).map(([key, status]) => (
                    <DropdownMenuItem key={key} onClick={() => handleBulkStatusUpdate(key)}>
                      <status.icon className="w-4 h-4 mr-2" />
                      {status.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={orders.length > 0 && orders.every((order) => selectedOrders.includes(order._id))}
                      onCheckedChange={handleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead>Mã đơn hàng</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thanh toán</TableHead>
                  <TableHead>Ngày đặt</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mr-2"></div>
                        Đang tải...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                        <p>Không tìm thấy đơn hàng phù hợp</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedOrders.includes(order._id)}
                          onCheckedChange={() => handleSelectOrder(order._id)}
                          aria-label={`Chọn đơn hàng ${order._id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold text-blue-600">#{order._id.slice(-8)}</span>
                          <span className="text-xs text-gray-500">ID: {order._id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={order.buyer?._id?.avatar || "/placeholder.svg?height=32&width=32"}
                            alt={order.buyer?._id?.fullName || order.buyer?._id?.name ||"Khách hàng"}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium">{order.buyer?._id?.fullName || order.buyer?._id?.name || "Không có tên"}</div>
                            <div className="text-sm text-gray-600 flex items-center gap-1">
                              {order.buyer?._id?.phone || order.buyer?._id?.contact.phone ? (
                                <>
                                  <Phone className="w-3 h-3" />
                                  {order.buyer._id.phone || order.buyer?._id?.contact.phone} 
                                </>
                              ) : order.buyer?._id?.email || order.buyer?._id?.contact.email? (
                                <>
                                  <Mail className="w-3 h-3" />
                                  {order.buyer._id.email || order.buyer?._id?.contact.email}
                                </>
                              ) : (
                                "Không có liên hệ"
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {order.items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <img
                                src={item.product?.images?.[0] || "/placeholder.svg?height=40&width=40"}
                                alt={item.product?.name || "Sản phẩm"}
                                className="w-8 h-8 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium break-words">
                                  {item.product?.name || "Tên sản phẩm"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  x{item.quantity}
                                  {item.selectedVariant && Object.keys(item.selectedVariant).length > 0 && (
                                    <span> | {Object.values(item.selectedVariant).join(", ")}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          {order.items && order.items.length > 2 && (
                            <div className="text-xs text-gray-500">+{order.items.length - 2} sản phẩm khác</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-pink-600">{formatCurrency(calculateFinalAmount(order))}</div>
                        {order.shippingFee > 0 && (
                          <div className="text-xs text-gray-500">(+ {formatCurrency(order.shippingFee)} ship)</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(newStatus) => handleStatusUpdate(order._id, newStatus)}
                          disabled={updatingStatus === order._id}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(orderStatuses).map(([key, status]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <status.icon className="w-3 h-3" />
                                  {status.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge className={order.isPaid ? paymentStatuses.paid.color : paymentStatuses.pending.color}>
                          {order.isPaid ? paymentStatuses.paid.label : paymentStatuses.pending.label}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">{order.paymentMethod}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDate(order.createdAt)}</div>
                        {order.updatedAt !== order.createdAt && (
                          <div className="text-xs text-gray-500">Cập nhật: {formatDate(order.updatedAt)}</div>
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
                            <DropdownMenuItem onClick={() => handleViewOrderDetail(order._id)}>
                              <Eye className="w-4 h-4 mr-2" /> Chi tiết đơn hàng
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="w-4 h-4 mr-2" /> In hóa đơn
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="w-4 h-4 mr-2" /> Nhắn tin khách hàng
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Star className="w-4 h-4 mr-2" /> Đánh giá khách hàng
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
            <div className="p-4 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total} đơn
                  hàng
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className={pagination.page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const page = index + 1
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
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      }
                      if (
                        (page === pagination.page - 2 && pagination.page > 3) ||
                        (page === pagination.page + 2 && pagination.page < pagination.totalPages - 2)
                      ) {
                        return (
                          <PaginationItem key={page}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      return null
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className={
                          pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        isOpen={showOrderDetail}
        onClose={() => {
          setShowOrderDetail(false)
          setSelectedOrderId(null)
        }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}
