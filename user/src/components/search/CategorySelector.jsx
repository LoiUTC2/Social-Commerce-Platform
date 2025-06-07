"use client"

import { useState, useEffect } from "react"
import { ChevronDown, ChevronRight, Folder, FolderOpen } from "lucide-react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { getCategoryTree } from "../../services/categoryService"

const CategorySelector = ({ onCategorySelect, selectedCategoryId, className = "" }) => {
    const [categoryTree, setCategoryTree] = useState([])
    const [expandedCategories, setExpandedCategories] = useState(new Set())
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadCategoryTree = async () => {
            try {
                setIsLoading(true)
                const response = await getCategoryTree({
                    includeInactive: false,
                    maxLevel: 3,
                    sortBy: "sortOrder",
                })

                if (response.success) {
                    setCategoryTree(response.data.tree)
                }
            } catch (error) {
                console.error("Error loading category tree:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadCategoryTree()
    }, [])

    const toggleExpanded = (categoryId) => {
        const newExpanded = new Set(expandedCategories)
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId)
        } else {
            newExpanded.add(categoryId)
        }
        setExpandedCategories(newExpanded)
    }

    const handleCategoryClick = (category) => {
        onCategorySelect(category)
    }

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
        if (num >= 1000) return (num / 1000).toFixed(1) + "K"
        return num.toString()
    }

    const renderCategory = (category, level = 0) => {
        const hasChildren = category.children && category.children.length > 0
        const isExpanded = expandedCategories.has(category._id)
        const isSelected = selectedCategoryId === category._id

        return (
            <div key={category._id} className="w-full">
                <div
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? "bg-pink-100 text-pink-700 border border-pink-300" : "hover:bg-gray-50"
                        } ${level > 0 ? "ml-4" : ""}`}
                    onClick={() => handleCategoryClick(category)}
                >
                    {hasChildren ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleExpanded(category._id)
                            }}
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    ) : (
                        <div className="w-6" />
                    )}

                    <div className="flex items-center gap-2 flex-1">
                        {category.icon ? (
                            <span className="text-lg">{category.icon}</span>
                        ) : hasChildren ? (
                            isExpanded ? (
                                <FolderOpen className="h-4 w-4" />
                            ) : (
                                <Folder className="h-4 w-4" />
                            )
                        ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-300" />
                        )}

                        <div className="flex-1">
                            <div className="font-medium text-sm">{category.name}</div>
                            {category.productCount > 0 && (
                                <div className="text-xs text-gray-500">{formatNumber(category.productCount)} sản phẩm</div>
                            )}
                        </div>

                        {category.productCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                                {formatNumber(category.productCount)}
                            </Badge>
                        )}
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="ml-2 mt-1 space-y-1">
                        {category.children.map((child) => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader>
                    <CardTitle>Danh mục</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Folder className="h-5 w-5" />
                    Danh mục sản phẩm
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto p-4 space-y-1">
                    {categoryTree.length > 0 ? (
                        <>
                            <Button
                                variant={!selectedCategoryId ? "default" : "ghost"}
                                className="w-full justify-start mb-2"
                                onClick={() => onCategorySelect(null)}
                            >
                                Tất cả danh mục
                            </Button>
                            {categoryTree.map((category) => renderCategory(category))}
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <Folder className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>Không có danh mục nào</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default CategorySelector
