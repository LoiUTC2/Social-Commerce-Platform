"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { FiArrowLeft, FiMove, FiFolder, FiChevronRight, FiChevronDown } from "react-icons/fi"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group"
import { Label } from "../../../components/ui/label"
import { Badge } from "../../../components/ui/badge"
import { toast } from "sonner"
import { getCategoryById, getCategoryTree, moveCategory } from "../../../services/categoryService"

const CategoryMove = () => {
    const { categoryId } = useParams()
    const navigate = useNavigate()
    const [category, setCategory] = useState(null)
    const [categoryTree, setCategoryTree] = useState([])
    const [selectedParent, setSelectedParent] = useState("")
    const [loading, setLoading] = useState(true)
    const [moving, setMoving] = useState(false)
    const [expandedNodes, setExpandedNodes] = useState(new Set())

    useEffect(() => {
        fetchData()
    }, [categoryId])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [categoryResponse, treeResponse] = await Promise.all([
                getCategoryById(categoryId),
                getCategoryTree({ includeInactive: true }),
            ])

            if (categoryResponse.success) {
                setCategory(categoryResponse.data.category)
                setSelectedParent(categoryResponse.data.category.parent?._id || "")
            }

            if (treeResponse.success) {
                setCategoryTree(treeResponse.data.tree)
                // Auto expand first level
                const firstLevelIds = treeResponse.data.tree.map((cat) => cat._id)
                setExpandedNodes(new Set(firstLevelIds))
            }
        } catch (error) {
            toast.error("Lỗi khi tải dữ liệu")
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleMove = async () => {
        try {
            setMoving(true)
            const response = await moveCategory(categoryId, selectedParent || null)
            if (response.success) {
                toast.success("Di chuyển danh mục thành công")
                navigate(`/admin/categories/${categoryId}`)
            }
        } catch (error) {
            toast.error(error.message || "Có lỗi xảy ra khi di chuyển danh mục")
        } finally {
            setMoving(false)
        }
    }

    const toggleExpanded = (nodeId) => {
        const newExpanded = new Set(expandedNodes)
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId)
        } else {
            newExpanded.add(nodeId)
        }
        setExpandedNodes(newExpanded)
    }

    const isDescendant = (nodeId, targetId) => {
        // Check if nodeId is a descendant of targetId
        const findInTree = (nodes, searchId, ancestorId) => {
            for (const node of nodes) {
                if (node._id === searchId) {
                    return true
                }
                if (node._id === ancestorId) {
                    return false
                }
                if (node.children && findInTree(node.children, searchId, ancestorId)) {
                    return true
                }
            }
            return false
        }
        return findInTree(categoryTree, nodeId, targetId)
    }

    const renderTreeNode = (node, level = 0) => {
        const hasChildren = node.children && node.children.length > 0
        const isExpanded = expandedNodes.has(node._id)
        const isCurrentCategory = node._id === categoryId
        const isDescendantOfCurrent = isDescendant(categoryId, node._id)
        const isDisabled = isCurrentCategory || isDescendantOfCurrent

        return (
            <div key={node._id} className={`${level > 0 ? "ml-6" : ""}`}>
                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                    {/* Expand/Collapse Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() => toggleExpanded(node._id)}
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

                    {/* Radio Button */}
                    <RadioGroupItem value={node._id} id={node._id} disabled={isDisabled} className="flex-shrink-0" />

                    {/* Category Info */}
                    <Label
                        htmlFor={node._id}
                        className={`flex items-center gap-2 flex-1 cursor-pointer ${isDisabled ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        {node.image ? (
                            <img src={node.image || "/placeholder.svg"} alt={node.name} className="w-6 h-6 rounded object-cover" />
                        ) : (
                            <FiFolder className="w-6 h-6 text-pink-600" />
                        )}
                        <span className="font-medium">{node.name}</span>
                        <Badge variant="outline" className="text-xs">
                            Cấp {node.level}
                        </Badge>
                        {isCurrentCategory && (
                            <Badge variant="secondary" className="text-xs">
                                Danh mục hiện tại
                            </Badge>
                        )}
                        {isDescendantOfCurrent && (
                            <Badge variant="secondary" className="text-xs">
                                Danh mục con
                            </Badge>
                        )}
                    </Label>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="mt-1">{node.children.map((child) => renderTreeNode(child, level + 1))}</div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-48"></div>
                </div>
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <FiFolder className="w-16 h-16 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy danh mục</h2>
                <Button onClick={() => navigate("/admin/categories")}>
                    <FiArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại danh sách
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => navigate(`/admin/categories/${categoryId}`)}>
                        <FiArrowLeft className="w-4 h-4 mr-2" />
                        Quay lại
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Di chuyển danh mục</h1>
                        <p className="text-gray-600 mt-1">Chọn vị trí mới cho danh mục "{category.name}"</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chọn danh mục cha mới</CardTitle>
                            <CardDescription>Chọn danh mục cha mới hoặc để trống để đặt làm danh mục gốc</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RadioGroup value={selectedParent} onValueChange={setSelectedParent}>
                                {/* Root Option */}
                                <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
                                    <div className="w-6 h-6" />
                                    <RadioGroupItem value="" id="root" />
                                    <Label htmlFor="root" className="flex items-center gap-2 cursor-pointer">
                                        <FiFolder className="w-6 h-6 text-pink-600" />
                                        <span className="font-medium">Danh mục gốc (Không có cha)</span>
                                        <Badge variant="outline" className="text-xs">
                                            Cấp 1
                                        </Badge>
                                    </Label>
                                </div>

                                {/* Tree Nodes */}
                                {categoryTree.map((node) => renderTreeNode(node))}
                            </RadioGroup>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Current Category Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh mục hiện tại</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                {category.image ? (
                                    <img
                                        src={category.image || "/placeholder.svg"}
                                        alt={category.name}
                                        className="w-12 h-12 rounded object-cover"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded bg-pink-100 flex items-center justify-center">
                                        <FiFolder className="w-6 h-6 text-pink-600" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-semibold">{category.name}</h3>
                                    <p className="text-sm text-gray-600">Cấp {category.level}</p>
                                    <p className="text-sm text-gray-600">Cha hiện tại: {category.parent?.name || "Danh mục gốc"}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col gap-3">
                                <Button onClick={handleMove} className="bg-pink-600 hover:bg-pink-700" disabled={moving}>
                                    <FiMove className="w-4 h-4 mr-2" />
                                    {moving ? "Đang di chuyển..." : "Di chuyển danh mục"}
                                </Button>
                                <Button variant="outline" onClick={() => navigate(`/admin/categories/${categoryId}`)}>
                                    Hủy bỏ
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Warning */}
                    <Card className="border-yellow-200 bg-yellow-50">
                        <CardContent className="pt-6">
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-2">Lưu ý:</p>
                                <ul className="space-y-1 text-xs">
                                    <li>• Không thể di chuyển vào chính nó</li>
                                    <li>• Không thể di chuyển vào danh mục con của nó</li>
                                    <li>• Cấp độ sẽ được tự động cập nhật</li>
                                    <li>• Đường dẫn (path) sẽ được tính lại</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default CategoryMove
