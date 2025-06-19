"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Search, Filter, X } from "lucide-react"

export default function AdvancedUserSearchModal({ open, onOpenChange, onSearch }) {
    const [searchParams, setSearchParams] = useState({
        email: "",
        phone: "",
        fullName: "",
        role: "all",
        hasShop: "all",
        shopName: "",
        joinedFrom: "",
        joinedTo: "",
        isActive: "all",
        minOrders: "",
        maxOrders: "",
    })

    const handleSubmit = (e) => {
        e.preventDefault()

        // Filter out empty values
        const filteredParams = Object.entries(searchParams).reduce((acc, [key, value]) => {
            if (value !== "") {
                acc[key] = value
            }
            return acc
        }, {})

        onSearch(filteredParams)
    }

    const handleReset = () => {
        setSearchParams({
            email: "",
            phone: "",
            fullName: "",
            role: "all",
            hasShop: "all",
            shopName: "",
            joinedFrom: "",
            joinedTo: "",
            isActive: "all",
            minOrders: "",
            maxOrders: "",
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
                        Tìm kiếm nâng cao người dùng
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information Search */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Thông tin cơ bản</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Họ và tên</Label>
                                    <Input
                                        id="fullName"
                                        value={searchParams.fullName}
                                        onChange={(e) => handleChange("fullName", e.target.value)}
                                        placeholder="Tìm theo tên..."
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={searchParams.email}
                                        onChange={(e) => handleChange("email", e.target.value)}
                                        placeholder="Tìm theo email..."
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Số điện thoại</Label>
                                    <Input
                                        id="phone"
                                        value={searchParams.phone}
                                        onChange={(e) => handleChange("phone", e.target.value)}
                                        placeholder="Tìm theo SĐT..."
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={searchParams.role} onValueChange={(value) => handleChange("role", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Chọn role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="buyer">Buyer</SelectItem>
                                            <SelectItem value="seller">Seller</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Status */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Trạng thái tài khoản</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Trạng thái hoạt động</Label>
                                    <Select value={searchParams.isActive} onValueChange={(value) => handleChange("isActive", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="true">Hoạt động</SelectItem>
                                            <SelectItem value="false">Không hoạt động</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Có shop</Label>
                                    <Select value={searchParams.hasShop} onValueChange={(value) => handleChange("hasShop", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Chọn trạng thái shop" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="true">Có shop</SelectItem>
                                            <SelectItem value="false">Không có shop</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shop Information */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Thông tin Shop</h4>
                            <div className="space-y-2">
                                <Label htmlFor="shopName">Tên shop</Label>
                                <Input
                                    id="shopName"
                                    value={searchParams.shopName}
                                    onChange={(e) => handleChange("shopName", e.target.value)}
                                    placeholder="Tìm theo tên shop..."
                                    className="border-pink-200"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Range */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Thời gian tham gia</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="joinedFrom">Từ ngày</Label>
                                    <Input
                                        id="joinedFrom"
                                        type="date"
                                        value={searchParams.joinedFrom}
                                        onChange={(e) => handleChange("joinedFrom", e.target.value)}
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="joinedTo">Đến ngày</Label>
                                    <Input
                                        id="joinedTo"
                                        type="date"
                                        value={searchParams.joinedTo}
                                        onChange={(e) => handleChange("joinedTo", e.target.value)}
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Activity Filters */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Hoạt động</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minOrders">Số đơn hàng tối thiểu</Label>
                                    <Input
                                        id="minOrders"
                                        type="number"
                                        value={searchParams.minOrders}
                                        onChange={(e) => handleChange("minOrders", e.target.value)}
                                        placeholder="0"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxOrders">Số đơn hàng tối đa</Label>
                                    <Input
                                        id="maxOrders"
                                        type="number"
                                        value={searchParams.maxOrders}
                                        onChange={(e) => handleChange("maxOrders", e.target.value)}
                                        placeholder="1000"
                                        className="border-pink-200"
                                    />
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
