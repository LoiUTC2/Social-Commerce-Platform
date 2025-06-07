"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Textarea } from "../../../components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../../../components/ui/form"
import { Switch } from "../../../components/ui/switch" // Thêm Switch component cho allowPosts
import { Badge } from "../../../components/ui/badge" // Thêm Badge component cho hiển thị hashtags
import { Package, ArrowLeft, Upload, Plus, X, Hash, Users } from "lucide-react"
import { toast } from "sonner"
import { createProduct } from "../../../services/productService"
import { useForm, useFieldArray } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { useAuth } from "../../../contexts/AuthContext"
import { uploadToCloudinary } from "../../../utils/uploadToCloudinary"
import { getCategoryTree } from "../../../services/categoryService"
import CreateCategoryModal from "../../../components/common/CreateCategoryModal"

// Schema validation với Yup - thêm validation cho allowPosts
const schema = yup.object().shape({
    name: yup.string().trim().required("Tên sản phẩm là bắt buộc"),
    description: yup.string().trim().required("Mô tả sản phẩm là bắt buộc"),
    price: yup
        .number()
        .nullable()
        .transform((value) => (value === null || value === "" ? undefined : Number(value)))
        .required("Giá sản phẩm là bắt buộc")
        .positive("Giá phải là số dương"),
    stock: yup
        .number()
        .nullable()
        .transform((value) => (value === null || value === "" ? undefined : Number(value)))
        .required("Số lượng tồn kho là bắt buộc")
        .min(0, "Số lượng phải là số không âm"),
    category: yup.string().required("Danh mục sản phẩm là bắt buộc"),
    discount: yup
        .number()
        .nullable()
        .transform((value) => (value === null || value === "" ? undefined : Number(value)))
        .min(0, "Giảm giá phải là số không âm")
        .max(100, "Giảm giá tối đa 100%")
        .when("price", (price, schema) =>
            price && price > 0
                ? schema.test(
                    "discount-not-greater-than-price",
                    "Giảm giá không được lớn hơn giá bán",
                    (value) => value === undefined || value === null || value <= price,
                )
                : schema,
        )
        .nullable(),
    brand: yup.string().nullable(),
    condition: yup.string().oneOf(["new", "used"], "Tình trạng không hợp lệ").required("Tình trạng là bắt buộc"),
    allowPosts: yup.boolean(), // Thêm validation cho allowPosts
    variants: yup.array().of(
        yup.object().shape({
            name: yup.string().trim().required("Tên biến thể là bắt buộc"),
            options: yup.array().of(yup.string().trim().required("Giá trị không được để trống")),
        }),
    ),
})

// Hàm xử lý hashtag - loại bỏ dấu, khoảng cách, chuyển thành chữ thường
const processHashtag = (hashtag) => {
    return hashtag
        .toLowerCase() // Chuyển thành chữ thường
        .normalize("NFD") // Chuẩn hóa Unicode
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ dấu
        .replace(/[^a-z0-9]/g, "") // Chỉ giữ lại chữ cái và số
        .trim() // Loại bỏ khoảng trắng đầu cuối
}

// Hàm hiển thị hashtag đẹp cho người dùng
const displayHashtag = (hashtag) => {
    return `#${hashtag}`
}

export default function AddProduct() {
    const { user } = useAuth()
    const navigate = useNavigate()

    // State cho danh mục
    const [categories, setCategories] = useState([])
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)
    const [selectedLevel1, setSelectedLevel1] = useState("")
    const [selectedLevel2, setSelectedLevel2] = useState("")

    // State cho hashtags - thêm state để quản lý hashtags
    const [hashtagInput, setHashtagInput] = useState("")
    const [processedHashtags, setProcessedHashtags] = useState([])

    // Khởi tạo form với React Hook Form và Yup - thêm allowPosts vào defaultValues
    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            price: null,
            discount: null,
            stock: null,
            category: "",
            brand: "",
            condition: "new",
            allowPosts: true, // Mặc định cho phép đăng bài viết kèm sản phẩm
            images: [],
            videos: [],
            variants: [],
            isActive: true,
        },
        resolver: yupResolver(schema),
    })

    // Quản lý variants với useFieldArray
    const {
        fields: variants,
        append,
        remove,
    } = useFieldArray({
        control: form.control,
        name: "variants",
    })

    // State cho xử lý upload ảnh
    const [uploading, setUploading] = useState(false)
    const [mediaFiles, setMediaFiles] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Lấy danh mục từ API
    const fetchCategories = async () => {
        setIsLoadingCategories(true)
        try {
            const response = await getCategoryTree()
            setCategories(response.data.tree || [])
            console.log("Categories fetched:", response.data.tree)
        } catch (error) {
            toast.error("Lỗi", { description: "Không thể tải danh mục. Vui lòng thử lại." })
            console.error("Lỗi khi lấy danh mục:", error)
        } finally {
            setIsLoadingCategories(false)
        }
    }

    // Gọi API lấy danh mục khi component mount
    useEffect(() => {
        fetchCategories()
        return () => {
            mediaFiles.forEach((image) => URL.revokeObjectURL(image.preview))
        }
    }, [mediaFiles])

    // Xử lý khi danh mục cấp 1 thay đổi
    const handleLevel1Change = (name) => {
        const category = categories.find((cat) => cat.name === name)
        setSelectedLevel1(name)
        setSelectedLevel2("")
        form.setValue("category", category?._id || "")
        console.log("Selected Level 1:", { name, id: category?._id })
    }

    // Xử lý khi danh mục cấp 2 thay đổi
    const handleLevel2Change = (name) => {
        const category = name
            ? categories.find((cat) => cat.name === selectedLevel1)?.children.find((child) => child.name === name)
            : categories.find((cat) => cat.name === selectedLevel1)
        setSelectedLevel2(name)
        form.setValue("category", category?._id || "")
        console.log("Selected Level 2:", { name, id: category?._id })
    }

    // Xử lý khi danh mục cấp 3 thay đổi
    const handleLevel3Change = (name) => {
        const category = categories
            .find((cat) => cat.name === selectedLevel1)
            ?.children.find((child) => child.name === selectedLevel2)
            ?.children.find((grandchild) => grandchild.name === name)
        form.setValue("category", category?._id || "")
        console.log("Selected Level 3:", { name, id: category?._id })
    }

    // Xử lý thêm hashtag - cải tiến xử lý hashtag
    const handleAddHashtag = () => {
        if (!hashtagInput.trim()) return

        const processed = processHashtag(hashtagInput.trim())
        if (processed && !processedHashtags.includes(processed)) {
            setProcessedHashtags((prev) => [...prev, processed])
        }
        setHashtagInput("") // Reset input sau khi thêm
    }

    // Xử lý xóa hashtag
    const handleRemoveHashtag = (hashtagToRemove) => {
        setProcessedHashtags((prev) => prev.filter((tag) => tag !== hashtagToRemove))
    }

    // Xử lý khi nhấn Enter trong input hashtag
    const handleHashtagKeyPress = (e) => {
        if (e.key === "Enter") {
            e.preventDefault()
            handleAddHashtag()
        }
    }

    // Xử lý upload ảnh
    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files)
        const newMediaFiles = files.map((file) => ({
            id: Date.now() + Math.random().toString(36),
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith("video") ? "video" : "image",
        }))
        setMediaFiles((prev) => [...prev, ...newMediaFiles])
    }

    // Xử lý xóa ảnh
    const removeMedia = (index) => {
        const updatedMediaFiles = [...mediaFiles]
        URL.revokeObjectURL(updatedMediaFiles[index].preview)
        updatedMediaFiles.splice(index, 1)
        setMediaFiles(updatedMediaFiles)
    }

    // Xử lý thêm option cho biến thể
    const addVariantOption = (variantIndex, option) => {
        if (!option.trim()) return

        const currentVariants = form.getValues("variants") || []
        const updatedVariants = [...currentVariants]
        if (!updatedVariants[variantIndex].options.includes(option)) {
            updatedVariants[variantIndex].options = [...(updatedVariants[variantIndex].options || []), option]
            form.setValue("variants", updatedVariants)
        }
    }

    // Xử lý xóa option của biến thể
    const removeVariantOption = (variantIndex, optionIndex) => {
        const currentVariants = form.getValues("variants") || []
        const updatedVariants = [...currentVariants]
        updatedVariants[variantIndex].options.splice(optionIndex, 1)
        form.setValue("variants", updatedVariants)
    }

    // Xử lý submit form - cập nhật để gửi allowPosts và hashtags đã xử lý
    const onSubmit = async (data) => {
        setIsSubmitting(true)

        try {
            console.log("Form data before submit:", data)
            console.log("Category ID to be sent:", data.category)
            console.log("Processed hashtags:", processedHashtags) // Log hashtags đã xử lý

            // Kiểm tra category ID hợp lệ
            if (!data.category) {
                throw new Error("Danh mục sản phẩm không được để trống")
            }

            const imageUrls = []
            const videoUrls = []

            if (mediaFiles.length > 0) {
                setUploading(true)
                for (const media of mediaFiles) {
                    const url = await uploadToCloudinary(media.file)
                    if (media.type === "image") imageUrls.push(url)
                    else videoUrls.push(url)
                }
                setUploading(false)
            }

            // Chuẩn bị dữ liệu sản phẩm - thêm allowPosts và hashtags đã xử lý
            const productData = {
                name: data.name,
                description: data.description,
                price: data.price || 0,
                discount: data.discount || 0,
                stock: data.stock || 0,
                mainCategory: data.category, // Gửi _id của danh mục thấp nhất
                seller: user?._id,
                images: imageUrls,
                videos: videoUrls,
                brand: data.brand,
                condition: data.condition,
                variants: data.variants,
                allowPosts: data.allowPosts, // Thêm trường allowPosts
                hashtags: processedHashtags, // Gửi hashtags đã được xử lý
            }

            console.log("Product data to be sent:", productData)

            await createProduct(productData)

            toast.success("Thành công", { description: "Thêm sản phẩm mới thành công" })

            navigate("/seller/products")
        } catch (error) {
            console.error("Lỗi khi thêm sản phẩm:", error)
            if (error.message.includes("validation")) {
                toast.error("Thất bại", {
                    description: "Vui lòng kiểm tra lại các trường nhập, đảm bảo giảm giá không lớn hơn giá bán.",
                })
            } else {
                toast.error("Thất bại", {
                    description: `Thêm sản phẩm thất bại: ${error.response?.data?.message || error.message}`,
                })
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Xử lý quay lại trang danh sách
    const handleGoBack = () => {
        if (form.formState.isDirty || mediaFiles.length > 0 || processedHashtags.length > 0) {
            // Thêm check hashtags
            const confirmLeave = window.confirm("Bạn đã thay đổi dữ liệu. Bạn có chắc muốn thoát mà không lưu?")
            if (!confirmLeave) return
        }
        navigate("/seller/products")
    }

    return (
        <div className="container mx-auto py-1 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6" /> Thêm sản phẩm mới
                    </h1>
                </div>

                <div className="mt-1 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleGoBack}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        form="addProductForm"
                        className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed"
                        disabled={isSubmitting || uploading}
                    >
                        {isSubmitting || uploading ? "Đang lưu..." : "Lưu sản phẩm"}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form id="addProductForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Thông tin cơ bản */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Thông tin sản phẩm</CardTitle>
                                <CardDescription>Nhập thông tin chi tiết về sản phẩm của bạn</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Tên sản phẩm */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>
                                                Tên sản phẩm <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập tên sản phẩm" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                            <FormDescription>Tên sản phẩm sẽ hiển thị cho khách hàng trên trang sản phẩm</FormDescription>
                                        </FormItem>
                                    )}
                                />

                                {/* Mô tả sản phẩm */}
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>
                                                Mô tả sản phẩm <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Nhập mô tả chi tiết sản phẩm" rows={5} {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Giá */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>
                                                    Giá bán <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Nhập giá (VNĐ)"
                                                        value={field.value || ""}
                                                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="discount"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Giảm giá (%)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Nhập % giảm giá"
                                                        value={field.value || ""}
                                                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Số lượng */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="stock"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>
                                                    Số lượng tồn kho <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Nhập số lượng"
                                                        value={field.value || ""}
                                                        onChange={(e) => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="brand"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Thương hiệu</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Nhập tên thương hiệu" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Danh mục và trạng thái */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        {/* Select cho danh mục cấp 1 */}
                                        <FormItem>
                                            <FormLabel>
                                                Danh mục cấp 1 <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <div className="flex items-center gap-2">
                                                <Select onValueChange={handleLevel1Change} value={selectedLevel1}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn danh mục cấp 1" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.map((cat) => (
                                                            <SelectItem key={cat._id} value={cat.name}>
                                                                {cat.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Button type="button" variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)}>
                                                    <Plus className="h-4 w-4 mr-1" /> Thêm danh mục
                                                </Button>
                                            </div>
                                            <FormDescription>Chọn danh mục cấp 1 cho sản phẩm</FormDescription>
                                        </FormItem>

                                        {/* Select cho danh mục cấp 2 */}
                                        {selectedLevel1 && categories.find((cat) => cat.name === selectedLevel1)?.children?.length > 0 && (
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Danh mục cấp 2</FormLabel>
                                                        <Select onValueChange={handleLevel2Change} value={selectedLevel2}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Chọn danh mục cấp 2" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {categories
                                                                    .find((cat) => cat.name === selectedLevel1)
                                                                    ?.children.map((child) => (
                                                                        <SelectItem key={child._id} value={child.name}>
                                                                            {child.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>Chọn danh mục cấp 2 nếu có</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Select cho danh mục cấp 3 */}
                                        {selectedLevel2 &&
                                            categories
                                                .find((cat) => cat.name === selectedLevel1)
                                                ?.children?.find((child) => child.name === selectedLevel2)?.children?.length > 0 && (
                                                <FormField
                                                    control={form.control}
                                                    name="category"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Danh mục cấp 3</FormLabel>
                                                            <Select
                                                                onValueChange={handleLevel3Change}
                                                                value={
                                                                    field.value
                                                                        ? categories
                                                                            .find((cat) => cat.name === selectedLevel1)
                                                                            ?.children.find((child) => child.name === selectedLevel2)
                                                                            ?.children.find((grandchild) => grandchild._id === field.value)?.name || ""
                                                                        : ""
                                                                }
                                                            >
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn danh mục cấp 3" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {categories
                                                                        .find((cat) => cat.name === selectedLevel1)
                                                                        ?.children.find((child) => child.name === selectedLevel2)
                                                                        ?.children.map((grandchild) => (
                                                                            <SelectItem key={grandchild._id} value={grandchild.name}>
                                                                                {grandchild.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription>Chọn danh mục cấp 3 nếu có</FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="condition"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>Tình trạng</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn tình trạng" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="new">Mới</SelectItem>
                                                        <SelectItem value="used">Đã sử dụng</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Phần hashtags mới được thiết kế lại */}
                                <div className="space-y-3">
                                    <FormLabel className="flex items-center gap-2">
                                        <Hash className="h-4 w-4" />
                                        Thẻ (hashtags)
                                    </FormLabel>

                                    {/* Input để thêm hashtag */}
                                    <div className="flex items-center gap-2">
                                        <Input
                                            placeholder="Nhập hashtag (ví dụ: điện thoại, smartphone)"
                                            value={hashtagInput}
                                            onChange={(e) => setHashtagInput(e.target.value)}
                                            onKeyPress={handleHashtagKeyPress}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleAddHashtag}
                                            disabled={!hashtagInput.trim()}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Thêm
                                        </Button>
                                    </div>

                                    {/* Hiển thị hashtags đã được xử lý */}
                                    {processedHashtags.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-600">Hashtags đã thêm:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {processedHashtags.map((hashtag, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                                                    >
                                                        {displayHashtag(hashtag)}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveHashtag(hashtag)}
                                                            className="ml-1 text-blue-600 hover:text-blue-800"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <FormDescription>
                                        Hashtags sẽ được tự động xử lý: loại bỏ dấu, khoảng cách và chuyển thành chữ thường. Ví dụ: "Điện
                                        Thoại Thông Minh" → "#dienthoaithongminh"
                                    </FormDescription>
                                </div>

                                {/* Thêm trường allowPosts */}
                                <FormField
                                    control={form.control}
                                    name="allowPosts"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="flex items-center gap-2 text-base">
                                                    <Users className="h-4 w-4" />
                                                    Cho phép đăng bài viết kèm sản phẩm
                                                </FormLabel>
                                                <FormDescription>
                                                    Cho phép người dùng khác tạo bài viết và gắn thẻ sản phẩm này. Điều này giúp tăng độ phổ biến
                                                    và tiếp cận của sản phẩm.
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Media và Biến thể */}
                        <div className="col-span-1 space-y-6">
                            {/* Ảnh/video sản phẩm */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hình ảnh/Video sản phẩm</CardTitle>
                                    <CardDescription>Tải lên hình ảnh hoặc video chất lượng cao của sản phẩm</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {mediaFiles.map((media) => (
                                            <div key={media.id} className="relative group">
                                                {media.type === "image" ? (
                                                    <img
                                                        src={media.preview || "/placeholder.svg"}
                                                        alt={`Preview ${media.id}`}
                                                        className="h-24 w-full object-cover rounded-md border border-gray-200"
                                                    />
                                                ) : (
                                                    <video
                                                        src={media.preview}
                                                        controls
                                                        className="h-24 w-full object-cover rounded-md border border-gray-200"
                                                    />
                                                )}
                                                <button
                                                    type="button"
                                                    className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeMedia(mediaFiles.findIndex((m) => m.id === media.id))}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border border-dashed border-gray-300 rounded-lg p-4 text-center">
                                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Kéo thả ảnh/video vào đây hoặc bấm để chọn file</p>
                                        <p className="text-xs text-gray-400 mb-2">PNG, JPG, JPEG, MP4 (tối đa 5MB)</p>
                                        <Input
                                            type="file"
                                            accept="image/*,video/mp4"
                                            multiple
                                            className="hidden"
                                            id="media-upload"
                                            onChange={handleMediaChange}
                                        />
                                        <label htmlFor="media-upload">
                                            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                                <span>Chọn file</span>
                                            </Button>
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Biến thể sản phẩm */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Biến thể sản phẩm</CardTitle>
                                    <CardDescription>Thêm các biến thể như màu sắc, kích cỡ...</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {variants.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">Chưa có biến thể nào</div>
                                    ) : (
                                        variants.map((variant, variantIndex) => (
                                            <div key={variant.id} className="border rounded-md p-3 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <FormField
                                                        control={form.control}
                                                        name={`variants[${variantIndex}].name`}
                                                        render={({ field }) => (
                                                            <FormItem className="flex-1 mr-2">
                                                                <FormControl>
                                                                    <Input placeholder="Tên biến thể (ví dụ: Màu sắc)" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(variantIndex)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {(variant.options || []).map((option, optionIndex) => (
                                                        <div
                                                            key={optionIndex}
                                                            className="bg-gray-100 px-2 py-1 rounded-md text-sm flex items-center"
                                                        >
                                                            {option}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeVariantOption(variantIndex, optionIndex)}
                                                                className="ml-1 text-gray-500 hover:text-red-500"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        placeholder="Thêm giá trị (ví dụ: Đỏ)"
                                                        className="flex-1"
                                                        onKeyPress={(e) => {
                                                            if (e.key === "Enter") {
                                                                e.preventDefault()
                                                                addVariantOption(variantIndex, e.target.value)
                                                                e.target.value = ""
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            const input = e.target.previousSibling
                                                            addVariantOption(variantIndex, input.value)
                                                            input.value = ""
                                                        }}
                                                    >
                                                        Thêm
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => append({ name: "", options: [] })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Thêm biến thể mới
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Form Footer */}
                    <div className="mt-6 flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleGoBack}>
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-pink-500 hover:bg-pink-600" disabled={isSubmitting || uploading}>
                            {isSubmitting || uploading ? "Đang lưu..." : "Lưu sản phẩm"}
                        </Button>
                    </div>
                </form>
            </Form>

            <CreateCategoryModal
                open={isCategoryModalOpen}
                onOpenChange={setIsCategoryModalOpen}
                onCategoryCreated={() => {
                    fetchCategories()
                    setSelectedLevel2("")
                    form.setValue(
                        "category",
                        selectedLevel1 ? categories.find((cat) => cat.name === selectedLevel1)?._id || "" : "",
                    )
                }}
                categories={categories}
                user={user}
            />
        </div>
    )
}
