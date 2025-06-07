"use client"

import { useRef, useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog"
import { Textarea } from "../ui/textarea"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
    ImageIcon,
    Smile,
    Lock,
    Globe,
    Users,
    ShoppingBag,
    X,
    Hash,
    FolderTree,
    ChevronRight,
    Plus,
    Check,
} from "lucide-react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select"
import { uploadToCloudinary } from "../../utils/uploadToCloudinary"
import { createPost } from "../../services/postService"
import { getCategoryTree } from "../../services/categoryService"
import { toast } from "sonner"
import { useAuth } from "../../contexts/AuthContext"
import EmojiPicker from "emoji-picker-react"
import ProductSelectionModal from "../common/ProductSelectionModal"

const CreatePostModal = ({ open, onOpenChange }) => {
    const { user } = useAuth()
    const [privacy, setPrivacy] = useState("public")
    const [content, setContent] = useState("")
    const [mediaList, setMediaList] = useState([])
    const [selectedProducts, setSelectedProducts] = useState([])
    const [showProductModal, setShowProductModal] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    // New states for hashtags and categories
    const [hashtags, setHashtags] = useState([])
    const [hashtagInput, setHashtagInput] = useState("")
    const [selectedMainCategory, setSelectedMainCategory] = useState(null) // Chỉ 1 danh mục chính
    const [showCategorySelector, setShowCategorySelector] = useState(false)
    const [categoryTree, setCategoryTree] = useState([])
    const [selectedPath, setSelectedPath] = useState([]) // [level1, level2, level3] - để hiển thị navigation
    const [loadingCategories, setLoadingCategories] = useState(false)

    const textareaRef = useRef(null)

    // Load category tree when component mounts
    useEffect(() => {
        if (open) {
            loadCategoryTree()
        }
    }, [open])

    const loadCategoryTree = async () => {
        try {
            setLoadingCategories(true)
            const response = await getCategoryTree({
                includeInactive: false,
                maxLevel: 3,
                sortBy: "sortOrder",
            })
            setCategoryTree(response.data.tree || [])
        } catch (error) {
            console.error("Error loading categories:", error)
            toast.error("Không thể tải danh mục")
        } finally {
            setLoadingCategories(false)
        }
    }

    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files)
        const updated = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
        }))
        setMediaList((prev) => [...prev, ...updated])
    }

    const resetPost = () => {
        setContent("")
        setMediaList([])
        setSelectedProducts([])
        setHashtags([])
        setHashtagInput("")
        setSelectedMainCategory(null)
        setSelectedPath([])
        setPrivacy("public")
        setShowEmojiPicker(false)
        setShowCategorySelector(false)
    }

    const privacyIcons = {
        public: <Globe size={14} />,
        friends: <Users size={14} />,
        private: <Lock size={14} />,
    }

    // Handle hashtag input
    const handleHashtagKeyPress = (e) => {
        if (e.key === "Enter" || e.key === " " || e.key === ",") {
            e.preventDefault()
            addHashtag()
        }
    }

    const addHashtag = () => {
        const tag = hashtagInput.trim().replace(/^#/, "")
        if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
            setHashtags([...hashtags, tag])
            setHashtagInput("")
        }
    }

    const removeHashtag = (tagToRemove) => {
        setHashtags(hashtags.filter((tag) => tag !== tagToRemove))
    }

    // Extract hashtags from content
    const extractHashtagsFromContent = (text) => {
        const matches = text.match(/#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g) || []
        return matches.map((tag) => tag.substring(1))
    }

    // Handle category selection - cho phép chọn ở bất kỳ cấp nào
    const handleCategorySelect = (category, level) => {
        // Cập nhật path để hiển thị navigation
        const newPath = [...selectedPath]
        newPath[level] = category
        newPath.splice(level + 1) // Xóa các cấp sâu hơn
        setSelectedPath(newPath)
    }

    // Handle main category selection - có thể chọn ở bất kỳ cấp nào
    const handleMainCategorySelect = (category) => {
        setSelectedMainCategory(category)
        setShowCategorySelector(false)
        setSelectedPath([]) // Reset path sau khi chọn
        toast.success(`Đã chọn danh mục: ${category.name}`)
    }

    // Get breadcrumb for selected category
    const getCategoryBreadcrumb = (category) => {
        if (!category) return []

        // Tạo breadcrumb từ path của category
        const breadcrumb = []
        if (category.path && category.path.length > 0) {
            // Tìm các category cha từ categoryTree
            const findCategoryInTree = (tree, id) => {
                for (const cat of tree) {
                    if (cat._id === id) return cat
                    if (cat.children) {
                        const found = findCategoryInTree(cat.children, id)
                        if (found) return found
                    }
                }
                return null
            }

            category.path.forEach((pathId) => {
                const foundCat = findCategoryInTree(categoryTree, pathId)
                if (foundCat) breadcrumb.push(foundCat)
            })
        }
        breadcrumb.push(category)
        return breadcrumb
    }

    // Get categories for current level
    const getCategoriesForLevel = (level) => {
        if (level === 0) {
            return categoryTree
        }

        const parentCategory = selectedPath[level - 1]
        return parentCategory?.children || []
    }

    const handleEmojiClick = (emojiData) => {
        const textarea = textareaRef.current
        if (textarea) {
            const start = textarea.selectionStart
            const end = textarea.selectionEnd
            const newContent = content.substring(0, start) + emojiData.emoji + content.substring(end)
            setContent(newContent)
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length
                textarea.focus()
            }, 0)
        }
        setShowEmojiPicker(false)
    }

    const getDisplayMedia = () => {
        if (mediaList.length > 0) {
            return mediaList
        }
        if (selectedProducts.length > 0) {
            return selectedProducts.map((product) => ({
                preview: product.images,
                previewVideos: product.videos,
                type: "product",
                productId: product.id,
                productName: product.name,
            }))
        }
        return []
    }

    const handlePost = async () => {
        try {
            // Kiểm tra mainCategory bắt buộc
            if (!selectedMainCategory) {
                toast.error("Vui lòng chọn danh mục cho bài viết")
                return
            }

            const imageUrls = []
            const videoUrls = []

            // Upload media files
            for (const media of mediaList) {
                const url = await uploadToCloudinary(media.file)
                if (media.type === "image") imageUrls.push(url)
                else videoUrls.push(url)
            }

            // Combine hashtags from input and content
            const contentHashtags = extractHashtagsFromContent(content)
            const allHashtags = [...new Set([...hashtags, ...contentHashtags])]

            const productIds = selectedProducts.map((p) => p._id)

            const postData = {
                content,
                images: imageUrls,
                videos: videoUrls,
                productIds,
                hashtags: allHashtags,
                mainCategory: selectedMainCategory._id, // Gửi mainCategory thay vì categories
                location: "",
            }

            const res = await createPost(postData)
            toast.success("Đăng bài thành công!")
            console.log("Đăng bài thành công:", res)

            resetPost()
            onOpenChange(false)
        } catch (err) {
            toast.error("Đăng bài thất bại!")
            console.error("Lỗi đăng bài:", err)
        }
    }

    const displayMedia = getDisplayMedia()

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className="max-w-2xl bg-white rounded-xl shadow-lg max-h-[90vh] flex flex-col"
                    overlayClassName="bg-black/10 backdrop-blur-sm"
                >
                    <DialogHeader className="border-b pb-2 mb-2 flex-shrink-0">
                        <DialogTitle className="text-center text-lg font-semibold">Tạo bài viết</DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Avatar + quyền riêng tư */}
                        <div className="flex items-center gap-3 mb-4">
                            <img
                                src={user?.avatar || "/placeholder.svg"}
                                alt="avatar"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                            <div>
                                <div className="font-medium">{user?.fullName}</div>
                                <div className="flex items-center text-sm text-gray-500 gap-1">
                                    {privacyIcons[privacy]}
                                    <Select value={privacy} onValueChange={setPrivacy}>
                                        <SelectTrigger className="h-6 text-xs w-auto px-2 py-0 bg-gray-100 border-none">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">Công khai</SelectItem>
                                            <SelectItem value="friends">Bạn bè</SelectItem>
                                            <SelectItem value="private">Chỉ mình tôi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Nội dung bài viết */}
                        <div className="relative mb-4">
                            <Textarea
                                ref={textareaRef}
                                placeholder="Bạn đang nghĩ gì thế?"
                                className="min-h-[120px] resize-none text-base pr-10"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 p-1 h-8 w-8"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            >
                                <Smile size={16} />
                            </Button>

                            {showEmojiPicker && (
                                <div className="absolute top-12 right-0 z-50">
                                    <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                                </div>
                            )}
                        </div>

                        {/* Hashtag Section */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                                <Hash size={16} className="text-blue-600" />
                                <Label className="text-sm font-medium text-gray-700">Hashtags</Label>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-2">
                                {hashtags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">
                                        #{tag}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="ml-1 p-0 h-4 w-4 hover:bg-blue-300"
                                            onClick={() => removeHashtag(tag)}
                                        >
                                            <X size={10} />
                                        </Button>
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Nhập hashtag..."
                                    value={hashtagInput}
                                    onChange={(e) => setHashtagInput(e.target.value)}
                                    onKeyPress={handleHashtagKeyPress}
                                    className="flex-1 text-sm"
                                    maxLength={30}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addHashtag}
                                    disabled={!hashtagInput.trim() || hashtags.length >= 10}
                                >
                                    <Plus size={14} />
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Tối đa 10 hashtags. Nhấn Enter, Space hoặc dấu phẩy để thêm.</p>
                        </div>

                        {/* Main Category Selection */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <FolderTree size={16} className="text-green-600" />
                                    <Label className="text-sm font-medium text-gray-700">
                                        Danh mục chính <span className="text-red-500">*</span>
                                    </Label>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCategorySelector(!showCategorySelector)}
                                    disabled={loadingCategories}
                                >
                                    <Plus size={14} className="mr-1" />
                                    {selectedMainCategory ? "Thay đổi" : "Chọn danh mục"}
                                </Button>
                            </div>

                            {/* Selected Main Category */}
                            {selectedMainCategory && (
                                <div className="mb-2">
                                    <div className="flex items-center gap-2 p-2 bg-green-100 rounded-lg border border-green-200">
                                        <Check size={16} className="text-green-600" />
                                        <div className="flex-1">
                                            <div className="font-medium text-green-800">{selectedMainCategory.name}</div>
                                            {/* Breadcrumb */}
                                            <div className="text-xs text-green-600">
                                                {getCategoryBreadcrumb(selectedMainCategory)
                                                    .map((cat) => cat.name)
                                                    .join(" > ")}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="p-1 h-6 w-6 hover:bg-green-200"
                                            onClick={() => setSelectedMainCategory(null)}
                                        >
                                            <X size={12} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Category Selector */}
                            {showCategorySelector && (
                                <div className="border rounded-lg bg-white p-3 mt-2">
                                    <div className="mb-2 text-sm text-gray-600">
                                        Chọn danh mục ở bất kỳ cấp nào. Click vào tên danh mục để chọn làm danh mục chính.
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 min-h-[200px]">
                                        {/* Level 1 Categories */}
                                        <div className="border-r pr-3">
                                            <h4 className="font-medium text-sm text-gray-600 mb-2">Cấp 1</h4>
                                            <div className="h-[180px] overflow-y-auto custom-scrollbar">
                                                {getCategoriesForLevel(0).map((category) => (
                                                    <div key={category._id} className="mb-1">
                                                        <div
                                                            className={`p-2 rounded cursor-pointer text-sm hover:bg-gray-100 flex items-center justify-between ${selectedPath[0]?._id === category._id ? "bg-blue-100 text-blue-700" : ""
                                                                }`}
                                                            onClick={() => handleCategorySelect(category, 0)}
                                                        >
                                                            <span className="flex-1">{category.name}</span>
                                                            {category.children?.length > 0 && <ChevronRight size={14} />}
                                                        </div>
                                                        {/* Button để chọn làm main category */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full text-xs text-green-600 hover:text-green-700 hover:bg-green-50 py-1 h-6"
                                                            onClick={() => handleMainCategorySelect(category)}
                                                        >
                                                            <Check size={12} className="mr-1" />
                                                            Chọn cấp này
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Level 2 Categories */}
                                        <div className="border-r pr-3">
                                            <h4 className="font-medium text-sm text-gray-600 mb-2">Cấp 2</h4>
                                            <div className="h-[180px] overflow-y-auto custom-scrollbar">
                                                {selectedPath[0] &&
                                                    getCategoriesForLevel(1).map((category) => (
                                                        <div key={category._id} className="mb-1">
                                                            <div
                                                                className={`p-2 rounded cursor-pointer text-sm hover:bg-gray-100 flex items-center justify-between ${selectedPath[1]?._id === category._id ? "bg-blue-100 text-blue-700" : ""
                                                                    }`}
                                                                onClick={() => handleCategorySelect(category, 1)}
                                                            >
                                                                <span className="flex-1">{category.name}</span>
                                                                {category.children?.length > 0 && <ChevronRight size={14} />}
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full text-xs text-green-600 hover:text-green-700 hover:bg-green-50 py-1 h-6"
                                                                onClick={() => handleMainCategorySelect(category)}
                                                            >
                                                                <Check size={12} className="mr-1" />
                                                                Chọn cấp này
                                                            </Button>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Level 3 Categories */}
                                        <div>
                                            <h4 className="font-medium text-sm text-gray-600 mb-2">Cấp 3</h4>
                                            <div className="h-[180px] overflow-y-auto custom-scrollbar">
                                                {selectedPath[1] &&
                                                    getCategoriesForLevel(2).map((category) => (
                                                        <div key={category._id} className="mb-1">
                                                            <div
                                                                className="p-2 rounded cursor-pointer text-sm hover:bg-gray-100"
                                                                onClick={() => handleMainCategorySelect(category)}
                                                            >
                                                                <span className="flex-1">{category.name}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Hiển thị sản phẩm đã chọn */}
                        {selectedProducts.length > 0 && (
                            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShoppingBag size={16} className="text-blue-600" />
                                    <span className="text-sm font-medium text-blue-700">
                                        Sản phẩm được gắn thẻ ({selectedProducts.length})
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProducts.map((product) => (
                                        <Badge
                                            key={product.id}
                                            variant="secondary"
                                            className="bg-white border border-blue-300 text-blue-700 px-2 py-1"
                                        >
                                            <img
                                                src={product.images[0] || "/placeholder.svg"}
                                                alt={product.name}
                                                className="w-4 h-4 rounded mr-1"
                                            />
                                            {product.name}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="ml-1 p-0 h-4 w-4"
                                                onClick={() => {
                                                    setSelectedProducts((prev) => prev.filter((p) => p.id !== product.id))
                                                }}
                                            >
                                                <X size={12} />
                                            </Button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Preview ảnh/video */}
                        {displayMedia.length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                {displayMedia.map((media, idx) => (
                                    <div key={idx} className="relative">
                                        {media.type !== "product" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute top-1 right-1 z-10 bg-black/50 text-white hover:bg-black/70"
                                                onClick={() => {
                                                    const updated = [...mediaList]
                                                    updated.splice(idx, 1)
                                                    setMediaList(updated)
                                                }}
                                            >
                                                <X size={14} />
                                            </Button>
                                        )}

                                        {media.type === "image" ? (
                                            <img
                                                src={media.preview || "/placeholder.svg"}
                                                alt="preview"
                                                className="rounded-lg max-h-48 object-cover w-full"
                                            />
                                        ) : media.type === "video" ? (
                                            <video controls src={media.preview} className="rounded-lg max-h-48 w-full" />
                                        ) : (
                                            <div className="grid grid-cols-2 gap-2">
                                                {media.preview.map((imageUrl, index) => (
                                                    <div key={`img-${index}`} className="relative">
                                                        <img
                                                            src={imageUrl || "/placeholder.svg"}
                                                            alt={`Product ${index + 1}`}
                                                            className="rounded-lg w-full h-32 object-cover"
                                                        />
                                                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded flex items-center">
                                                            <ShoppingBag size={12} className="mr-1" />
                                                            Sản phẩm
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Khu vực chọn ảnh/video */}
                        <div className="border rounded-lg p-4 mb-4 text-center text-gray-500 bg-gray-50">
                            <label className="cursor-pointer flex flex-col items-center gap-1">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border">
                                    <ImageIcon size={20} />
                                </div>
                                <div className="font-medium mt-2">Thêm ảnh/video</div>
                                <p className="text-xs text-gray-400">hoặc kéo và thả</p>
                                <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleMediaChange} />
                            </label>
                        </div>

                        {/* Thêm hành động */}
                        <div className="border rounded-lg p-2 flex items-center justify-between text-gray-600 text-sm">
                            <span className="font-medium">Thêm vào bài viết của bạn</span>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => document.querySelector('input[type="file"]').click()}
                                    className="hover:bg-gray-100 p-1 rounded"
                                    title="Thêm ảnh/video"
                                >
                                    <ImageIcon size={18} className="text-green-500" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    className="hover:bg-gray-100 p-1 rounded"
                                    title="Thêm emoji"
                                >
                                    <Smile size={18} className="text-yellow-500" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowProductModal(true)}
                                    className="hover:bg-gray-100 p-1 rounded"
                                    title="Gắn thẻ sản phẩm"
                                >
                                    <ShoppingBag size={18} className="text-blue-500" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCategorySelector(!showCategorySelector)}
                                    className="hover:bg-gray-100 p-1 rounded"
                                    title="Chọn danh mục"
                                >
                                    <FolderTree size={18} className="text-green-500" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Nút đăng */}
                    <div className="flex-shrink-0 pt-3 border-t">
                        <Button
                            className="w-full"
                            disabled={
                                (content.trim() === "" && mediaList.length === 0 && selectedProducts.length === 0) ||
                                !selectedMainCategory
                            }
                            onClick={handlePost}
                        >
                            Đăng bài viết
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal chọn sản phẩm */}
            <ProductSelectionModal
                open={showProductModal}
                onOpenChange={setShowProductModal}
                selectedProducts={selectedProducts}
                onSelectProducts={setSelectedProducts}
            />

            {/* Custom scrollbar styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
                height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #d1d5db;
                border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background-color: #9ca3af;
                }
            `}</style>
        </>
    )
}

export default CreatePostModal
