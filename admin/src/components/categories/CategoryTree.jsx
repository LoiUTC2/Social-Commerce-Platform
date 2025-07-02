"use client"

import { useState } from "react"
import {
    FiFolder,
    FiChevronRight,
    FiChevronDown,
    FiEye,
    FiEdit3,
    FiTrash2,
    FiMoreHorizontal,
} from "react-icons/fi"
import { FaFolderOpen } from "react-icons/fa"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu"

const CategoryTreeNode = ({ category, level = 0, onEdit, onDelete, onView }) => {
    const [isExpanded, setIsExpanded] = useState(level < 2) // Auto expand first 2 levels
    const hasChildren = category.children && category.children.length > 0

    const getLevelColor = (level) => {
        const colors = [
            "border-l-pink-500",
            "border-l-purple-500",
            "border-l-blue-500",
            "border-l-green-500",
            "border-l-yellow-500",
        ]
        return colors[level % colors.length]
    }

    return (
        <div className="select-none">
            <div
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 border-l-4 ${getLevelColor(level)} ${level > 0 ? "ml-4" : ""
                    }`}
            >
                {/* Expand/Collapse Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => setIsExpanded(!isExpanded)}
                    disabled={!hasChildren}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <FiChevronDown className="w-4 h-4" />
                        ) : (
                            <FiChevronRight className="w-4 h-4" />
                        )
                    ) : (
                        <div className="w-4 h-4" />
                    )}
                </Button>

                {/* Category Icon */}
                <div className="flex-shrink-0">
                    {category.image ? (
                        <img
                            src={category.image || "/placeholder.svg"}
                            alt={category.name}
                            className="w-8 h-8 rounded object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded bg-pink-100 flex items-center justify-center">
                            {isExpanded && hasChildren ? (
                                <FaFolderOpen className="w-4 h-4 text-pink-600" />
                            ) : (
                                <FiFolder className="w-4 h-4 text-pink-600" />
                            )}
                        </div>
                    )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm truncate">{category.name}</h4>
                        <Badge variant="outline" className="text-xs">
                            Cấp {category.level}
                        </Badge>
                        <Badge variant={category.isActive ? "success" : "secondary"} className="text-xs">
                            {category.isActive ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                        <span>{category.productCount || 0} sản phẩm</span>
                        <span>{category.shopCount || 0} shop</span>
                        {hasChildren && <span>{category.children.length} danh mục con</span>}
                    </div>
                </div>

                {/* Actions */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <FiMoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(category._id)}>
                            <FiEye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(category._id)}>
                            <FiEdit3 className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(category._id)} className="text-red-600">
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Xóa
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="mt-1">
                    {category.children.map((child) => (
                        <CategoryTreeNode
                            key={child._id}
                            category={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={onView}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const CategoryTree = ({ data, onEdit, onDelete, onView }) => {
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <FiFolder className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có danh mục</h3>
                <p className="text-gray-600">Tạo danh mục đầu tiên để bắt đầu</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {data.map((category) => (
                <CategoryTreeNode
                    key={category._id}
                    category={category}
                    level={0}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onView={onView}
                />
            ))}
        </div>
    )
}

export default CategoryTree
