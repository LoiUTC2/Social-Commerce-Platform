"use client"

import { useState, useEffect, useRef } from "react"
import { FiSearch, FiShoppingBag, FiCheck, FiGrid, FiList } from "react-icons/fi"
import { getAllProducts } from "../../../services/productService"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Badge } from "../../ui/badge"
import { Card, CardContent } from "../../ui/card"
import { ScrollArea } from "../../ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"

const ProductSelectionModal = ({ isOpen, onClose, onSelectProducts, selectedProductIds = [] }) => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedProducts, setSelectedProducts] = useState([])
    const [viewMode, setViewMode] = useState("grid") // "grid" or "list"
    const [sortBy, setSortBy] = useState("name") // "name", "price", "stock", "sold"
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 0,
    })

    const searchTimeout = useRef(null)

    useEffect(() => {
        if (!isOpen) return
        fetchProducts()
    }, [isOpen, pagination.page, sortBy])

    useEffect(() => {
        if (!isOpen) return
        clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            setPagination((prev) => ({ ...prev, page: 1 }))
            fetchProducts()
        }, 300)

        return () => clearTimeout(searchTimeout.current)
    }, [searchTerm])

    const fetchProducts = async () => {
        setLoading(true)
        try {
            const filters = {
                isActive: true,
                keyword: searchTerm || undefined,
                sortBy: sortBy,
            }

            const response = await getAllProducts(filters, pagination.page, pagination.limit)

            const productsData = Array.isArray(response?.data?.products) ? response.data.products : []
            setProducts(productsData)
            setPagination((prev) => ({ ...prev, ...response.data.pagination }))
        } catch (err) {
            console.error("Error loading products:", err)
            toast.error("Không thể tải sản phẩm")
        } finally {
            setLoading(false)
        }
    }

    const handleProductToggle = (product) => {
        const isSelected = selectedProducts.some((p) => p._id === product._id)

        if (isSelected) {
            setSelectedProducts((prev) => prev.filter((p) => p._id !== product._id))
        } else {
            if (selectedProductIds.includes(product._id)) {
                toast.warning("Sản phẩm này đã được thêm vào Flash Sale")
                return
            }
            setSelectedProducts((prev) => [...prev, product])
        }
    }

    const handleSelectAll = () => {
        const availableProducts = products.filter((product) => !selectedProductIds.includes(product._id))
        if (selectedProducts.length === availableProducts.length) {
            setSelectedProducts([])
        } else {
            setSelectedProducts(availableProducts)
        }
    }

    const handleConfirmSelection = () => {
        if (selectedProducts.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một sản phẩm")
            return
        }

        onSelectProducts(selectedProducts)
        setSelectedProducts([])
        onClose()
    }

    const handleClose = () => {
        setSelectedProducts([])
        setSearchTerm("")
        setPagination({ ...pagination, page: 1 })
        onClose()
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount)
    }

    const availableProducts = products.filter((product) => !selectedProductIds.includes(product._id))

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 flex-shrink-0">
                    <DialogTitle className="text-2xl font-bold text-gray-900">Chọn sản phẩm cho Flash Sale</DialogTitle>
                    <DialogDescription>Tìm kiếm và chọn các sản phẩm để thêm vào chương trình Flash Sale</DialogDescription>
                </DialogHeader>

                {/* Search and Filters - Fixed */}
                <div className="px-6 pb-4 flex-shrink-0 border-b">
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Sắp xếp" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="name">Tên A-Z</SelectItem>
                                    <SelectItem value="price">Giá thấp - cao</SelectItem>
                                    <SelectItem value="-price">Giá cao - thấp</SelectItem>
                                    <SelectItem value="-stock">Tồn kho nhiều</SelectItem>
                                    <SelectItem value="-soldCount">Bán chạy</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex border rounded-lg">
                                <Button
                                    variant={viewMode === "grid" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("grid")}
                                    className={viewMode === "grid" ? "bg-pink-600 hover:bg-pink-700" : ""}
                                >
                                    <FiGrid className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant={viewMode === "list" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setViewMode("list")}
                                    className={viewMode === "list" ? "bg-pink-600 hover:bg-pink-700" : ""}
                                >
                                    <FiList className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Selection Info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="text-sm">
                                Đã chọn: {selectedProducts.length} sản phẩm
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                                Tổng: {products.length} sản phẩm
                            </Badge>
                        </div>
                        {availableProducts.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
                            >
                                {selectedProducts.length === availableProducts.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                            </Button>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="px-6">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
                                    <p className="text-gray-600">Đang tải sản phẩm...</p>
                                </div>
                            ) : !Array.isArray(products) || products.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <FiShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                                    <p className="text-gray-600 text-center">Không có sản phẩm nào phù hợp với từ khóa tìm kiếm.</p>
                                </div>
                            ) : (
                                <div className="py-4">
                                    {viewMode === "grid" ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                            {products.map((product) => {
                                                const isSelected = selectedProducts.some((p) => p._id === product._id)
                                                const isAlreadyAdded = selectedProductIds.includes(product._id)

                                                return (
                                                    <Card
                                                        key={product._id}
                                                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${isSelected
                                                            ? "ring-2 ring-pink-500 bg-pink-50"
                                                            : isAlreadyAdded
                                                                ? "opacity-50 cursor-not-allowed bg-gray-50"
                                                                : "hover:shadow-md"
                                                            }`}
                                                        onClick={() => !isAlreadyAdded && handleProductToggle(product)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="relative">
                                                                {/* Product Image */}
                                                                <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-2 overflow-hidden">
                                                                    {product.images?.[0] ? (
                                                                        <img
                                                                            src={product.images[0] || "/placeholder.svg"}
                                                                            alt={product.name || "Không tên"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <FiShoppingBag className="w-6 h-6 text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Selection Indicator */}
                                                                {isSelected && (
                                                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                                                                        <FiCheck className="w-4 h-4 text-white" />
                                                                    </div>
                                                                )}

                                                                {/* Already Added Indicator */}
                                                                {isAlreadyAdded && (
                                                                    <div className="absolute top-2 left-2">
                                                                        <Badge className="bg-gray-600 hover:bg-gray-600">Đã thêm</Badge>
                                                                    </div>
                                                                )}

                                                                {/* Product Info */}
                                                                <div className="space-y-2">
                                                                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm">
                                                                        {product.name || "Không có tên"}
                                                                    </h3>
                                                                    <p className="text-pink-600 font-bold">{formatCurrency(product.price || 0)}</p>
                                                                    <div className="flex justify-between text-xs text-gray-600">
                                                                        <span>Kho: {product.stock || 0}</span>
                                                                        <span>Đã bán: {product.soldCount || 0}</span>
                                                                    </div>
                                                                    {product.seller && (
                                                                        <p className="text-xs text-gray-500 truncate">
                                                                            Shop: {product.seller.name || product.seller.fullName || "Không có tên shop"}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="space-y-2 mb-6">
                                            {products.map((product) => {
                                                const isSelected = selectedProducts.some((p) => p._id === product._id)
                                                const isAlreadyAdded = selectedProductIds.includes(product._id)

                                                return (
                                                    <Card
                                                        key={product._id}
                                                        className={`cursor-pointer transition-all duration-200 ${isSelected
                                                            ? "ring-2 ring-pink-500 bg-pink-50"
                                                            : isAlreadyAdded
                                                                ? "opacity-50 cursor-not-allowed bg-gray-50"
                                                                : "hover:shadow-sm"
                                                            }`}
                                                        onClick={() => !isAlreadyAdded && handleProductToggle(product)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                                    {product.images?.[0] ? (
                                                                        <img
                                                                            src={product.images[0] || "/placeholder.svg"}
                                                                            alt={product.name || "Không tên"}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <FiShoppingBag className="w-4 h-4 text-gray-400" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className="font-semibold text-gray-900 truncate">
                                                                        {product.name || "Không có tên"}
                                                                    </h3>
                                                                    <p className="text-pink-600 font-bold">{formatCurrency(product.price || 0)}</p>
                                                                    <div className="flex gap-4 text-sm text-gray-600">
                                                                        <span>Kho: {product.stock || 0}</span>
                                                                        <span>Đã bán: {product.soldCount || 0}</span>
                                                                    </div>
                                                                    {product.seller && (
                                                                        <p className="text-sm text-gray-500 truncate">
                                                                            Shop: {product.seller.name || product.seller.fullName || "Không có tên shop"}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="flex items-center gap-2">
                                                                    {isAlreadyAdded && <Badge className="bg-gray-600 hover:bg-gray-600">Đã thêm</Badge>}
                                                                    {isSelected && (
                                                                        <div className="w-6 h-6 bg-pink-600 rounded-full flex items-center justify-center">
                                                                            <FiCheck className="w-4 h-4 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Pagination */}
                                    {pagination.totalPages > 1 && (
                                        <div className="flex items-center justify-between py-4 border-t">
                                            <div className="text-sm text-gray-600">
                                                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                                                {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số {pagination.total}{" "}
                                                sản phẩm
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={pagination.page === 1}
                                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                                                >
                                                    Trước
                                                </Button>
                                                <div className="flex items-center gap-1">
                                                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                        // Tính toán range hiển thị
                                                        const currentPage = pagination.page
                                                        const totalPages = pagination.totalPages

                                                        let startPage = Math.max(1, currentPage - 2)
                                                        let endPage = Math.min(totalPages, startPage + 4)

                                                        // Điều chỉnh startPage nếu không đủ 5 trang ở cuối
                                                        if (endPage - startPage < 4) {
                                                            startPage = Math.max(1, endPage - 4)
                                                        }

                                                        const pageNum = startPage + i

                                                        // Chỉ render nếu pageNum nằm trong range hợp lệ
                                                        if (pageNum > endPage) return null

                                                        return (
                                                            <Button
                                                                key={pageNum}
                                                                variant={pagination.page === pageNum ? "default" : "outline"}
                                                                size="sm"
                                                                onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                                                                className={pagination.page === pageNum ? "bg-pink-600 hover:bg-pink-700" : ""}
                                                            >
                                                                {pageNum}
                                                            </Button>
                                                        )
                                                    }).filter(Boolean)}
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={pagination.page === pagination.totalPages}
                                                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                                                >
                                                    Sau
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Footer - Fixed */}
                <div className="flex-shrink-0 border-t">
                    <DialogFooter className="p-6">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-sm text-gray-600">
                                {selectedProducts.length > 0 && `Đã chọn ${selectedProducts.length} sản phẩm`}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClose}>
                                    Hủy
                                </Button>
                                <Button
                                    onClick={handleConfirmSelection}
                                    disabled={selectedProducts.length === 0}
                                    className="bg-pink-600 hover:bg-pink-700 text-white"
                                >
                                    Thêm {selectedProducts.length} sản phẩm
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default ProductSelectionModal
