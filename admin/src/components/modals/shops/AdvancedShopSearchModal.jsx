"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Search, Filter, X } from "lucide-react"

export default function AdvancedShopSearchModal({ open, onOpenChange, onSearch }) {
    const [searchParams, setSearchParams] = useState({
        search: "",
        status: "all",
        featureLevel: "all",
        isApproved: "all",
        ownerEmail: "",
        minRevenue: "",
        maxRevenue: "",
        minRating: "",
        maxRating: "",
        createdFrom: "",
        createdTo: "",
        sortBy: "createdAt",
        sortOrder: "desc",
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        // Filter out empty values
        const filteredParams = Object.entries(searchParams).reduce((acc, [key, value]) => {
            if (value !== "" && value !== "all") {
                acc[key] = value
            }
            return acc
        }, {})

        onSearch(filteredParams)
    }

    const handleReset = () => {
        setSearchParams({
            search: "",
            status: "all",
            featureLevel: "all",
            isApproved: "all",
            ownerEmail: "",
            minRevenue: "",
            maxRevenue: "",
            minRating: "",
            maxRating: "",
            createdFrom: "",
            createdTo: "",
            sortBy: "createdAt",
            sortOrder: "desc",
        })
    }

    const handleChange = (key, value) => {
        setSearchParams((prev) => ({ ...prev, [key]: value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-pink-600" />
                        Tìm kiếm nâng cao Shop
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Search */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Tìm kiếm cơ bản</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Tên shop</Label>
                                    <Input
                                        id="search"
                                        value={searchParams.search}
                                        onChange={(e) => handleChange("search", e.target.value)}
                                        placeholder="Tìm theo tên shop..."
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ownerEmail">Email chủ shop</Label>
                                    <Input
                                        id="ownerEmail"
                                        type="email"
                                        value={searchParams.ownerEmail}
                                        onChange={(e) => handleChange("ownerEmail", e.target.value)}
                                        placeholder="Tìm theo email chủ shop..."
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Filters */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Trạng thái</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Trạng thái hoạt động</Label>
                                    <Select value={searchParams.status} onValueChange={(value) => handleChange("status", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="active">Hoạt động</SelectItem>
                                            <SelectItem value="inactive">Tạm dừng</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Gói dịch vụ</Label>
                                    <Select
                                        value={searchParams.featureLevel}
                                        onValueChange={(value) => handleChange("featureLevel", value)}
                                    >
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Chọn gói" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="premium">Premium</SelectItem>
                                            <SelectItem value="vip">VIP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Trạng thái duyệt</Label>
                                    <Select value={searchParams.isApproved} onValueChange={(value) => handleChange("isApproved", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Chọn trạng thái duyệt" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="true">Đã duyệt</SelectItem>
                                            <SelectItem value="false">Chưa duyệt</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance Filters */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Hiệu suất</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minRevenue">Doanh thu tối thiểu</Label>
                                    <Input
                                        id="minRevenue"
                                        type="number"
                                        value={searchParams.minRevenue}
                                        onChange={(e) => handleChange("minRevenue", e.target.value)}
                                        placeholder="0"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxRevenue">Doanh thu tối đa</Label>
                                    <Input
                                        id="maxRevenue"
                                        type="number"
                                        value={searchParams.maxRevenue}
                                        onChange={(e) => handleChange("maxRevenue", e.target.value)}
                                        placeholder="1000000000"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minRating">Đánh giá tối thiểu</Label>
                                    <Input
                                        id="minRating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={searchParams.minRating}
                                        onChange={(e) => handleChange("minRating", e.target.value)}
                                        placeholder="0.0"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxRating">Đánh giá tối đa</Label>
                                    <Input
                                        id="maxRating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        value={searchParams.maxRating}
                                        onChange={(e) => handleChange("maxRating", e.target.value)}
                                        placeholder="5.0"
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Range */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Thời gian tạo</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="createdFrom">Từ ngày</Label>
                                    <Input
                                        id="createdFrom"
                                        type="date"
                                        value={searchParams.createdFrom}
                                        onChange={(e) => handleChange("createdFrom", e.target.value)}
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="createdTo">Đến ngày</Label>
                                    <Input
                                        id="createdTo"
                                        type="date"
                                        value={searchParams.createdTo}
                                        onChange={(e) => handleChange("createdTo", e.target.value)}
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sorting */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Sắp xếp</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Sắp xếp theo</Label>
                                    <Select value={searchParams.sortBy} onValueChange={(value) => handleChange("sortBy", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="createdAt">Ngày tạo</SelectItem>
                                            <SelectItem value="name">Tên shop</SelectItem>
                                            <SelectItem value="revenue">Doanh thu</SelectItem>
                                            <SelectItem value="rating">Đánh giá</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Thứ tự</Label>
                                    <Select value={searchParams.sortOrder} onValueChange={(value) => handleChange("sortOrder", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="desc">Giảm dần</SelectItem>
                                            <SelectItem value="asc">Tăng dần</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={handleReset} className="border-gray-300">
                            <X className="w-4 h-4 mr-2" />
                            Xóa bộ lọc
                        </Button>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                            <Search className="w-4 h-4 mr-2" />
                            Tìm kiếm
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
