"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select"
import { Card, CardContent } from "../../ui/card"
import { Search, Filter, X } from "lucide-react"

export default function AdvancedSearchModal({ open, onOpenChange, onSearch }) {
    const [searchParams, setSearchParams] = useState({
        content: "",
        hashtags: "",
        tags: "",
        authorName: "",
        minLikes: "",
        maxLikes: "",
        minComments: "",
        maxComments: "",
        dateFrom: "",
        dateTo: "",
        hasProducts: "all", // Updated default value
        hasMedia: "all", // Updated default value
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
            content: "",
            hashtags: "",
            tags: "",
            authorName: "",
            minLikes: "",
            maxLikes: "",
            minComments: "",
            maxComments: "",
            dateFrom: "",
            dateTo: "",
            hasProducts: "all", // Updated default value
            hasMedia: "all", // Updated default value
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
                        Tìm kiếm nâng cao
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Content Search */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Tìm kiếm nội dung</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="content">Nội dung bài viết</Label>
                                    <Input
                                        id="content"
                                        value={searchParams.content}
                                        onChange={(e) => handleChange("content", e.target.value)}
                                        placeholder="Tìm trong nội dung..."
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="authorName">Tên tác giả</Label>
                                    <Input
                                        id="authorName"
                                        value={searchParams.authorName}
                                        onChange={(e) => handleChange("authorName", e.target.value)}
                                        placeholder="Tìm theo tên tác giả..."
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tags Search */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Tags và Hashtags</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hashtags">Hashtags</Label>
                                    <Input
                                        id="hashtags"
                                        value={searchParams.hashtags}
                                        onChange={(e) => handleChange("hashtags", e.target.value)}
                                        placeholder="hashtag1,hashtag2,..."
                                        className="border-pink-200"
                                    />
                                    <p className="text-xs text-gray-500">Phân cách bằng dấu phẩy</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tags">Tags</Label>
                                    <Input
                                        id="tags"
                                        value={searchParams.tags}
                                        onChange={(e) => handleChange("tags", e.target.value)}
                                        placeholder="tag1,tag2,..."
                                        className="border-pink-200"
                                    />
                                    <p className="text-xs text-gray-500">Phân cách bằng dấu phẩy</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Interaction Filters */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Lọc theo tương tác</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="minLikes">Likes tối thiểu</Label>
                                    <Input
                                        id="minLikes"
                                        type="number"
                                        value={searchParams.minLikes}
                                        onChange={(e) => handleChange("minLikes", e.target.value)}
                                        placeholder="0"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxLikes">Likes tối đa</Label>
                                    <Input
                                        id="maxLikes"
                                        type="number"
                                        value={searchParams.maxLikes}
                                        onChange={(e) => handleChange("maxLikes", e.target.value)}
                                        placeholder="1000"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minComments">Comments tối thiểu</Label>
                                    <Input
                                        id="minComments"
                                        type="number"
                                        value={searchParams.minComments}
                                        onChange={(e) => handleChange("minComments", e.target.value)}
                                        placeholder="0"
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxComments">Comments tối đa</Label>
                                    <Input
                                        id="maxComments"
                                        type="number"
                                        value={searchParams.maxComments}
                                        onChange={(e) => handleChange("maxComments", e.target.value)}
                                        placeholder="100"
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Range */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Khoảng thời gian</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="dateFrom">Từ ngày</Label>
                                    <Input
                                        id="dateFrom"
                                        type="date"
                                        value={searchParams.dateFrom}
                                        onChange={(e) => handleChange("dateFrom", e.target.value)}
                                        className="border-pink-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateTo">Đến ngày</Label>
                                    <Input
                                        id="dateTo"
                                        type="date"
                                        value={searchParams.dateTo}
                                        onChange={(e) => handleChange("dateTo", e.target.value)}
                                        className="border-pink-200"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content Type Filters */}
                    <Card className="border-pink-200">
                        <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-3">Loại nội dung</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Có sản phẩm</Label>
                                    <Select
                                        value={searchParams.hasProducts}
                                        onValueChange={(value) => handleChange("hasProducts", value)}
                                    >
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Tất cả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="true">Có sản phẩm</SelectItem>
                                            <SelectItem value="false">Không có sản phẩm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Có media</Label>
                                    <Select value={searchParams.hasMedia} onValueChange={(value) => handleChange("hasMedia", value)}>
                                        <SelectTrigger className="border-pink-200">
                                            <SelectValue placeholder="Tất cả" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tất cả</SelectItem>
                                            <SelectItem value="true">Có hình ảnh/video</SelectItem>
                                            <SelectItem value="false">Không có media</SelectItem>
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
