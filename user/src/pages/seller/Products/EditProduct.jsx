import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '../../../components/ui/form';
import { Package, ArrowLeft, Upload, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { getDetailProductForSeller, updateProduct } from '../../../services/productService';
import { uploadToCloudinary } from '../../../utils/uploadToCloudinary';

// Schema validation với Yup
const schema = yup.object().shape({
    name: yup.string().trim().required('Tên sản phẩm là bắt buộc'),
    description: yup.string().trim().required('Mô tả sản phẩm là bắt buộc'),
    price: yup
        .number()
        .nullable()
        .transform((value) => (value === null || value === '' ? undefined : Number(value)))
        .required('Giá sản phẩm là bắt buộc')
        .positive('Giá phải là số dương'),
    stock: yup
        .number()
        .nullable()
        .transform((value) => (value === null || value === '' ? undefined : Number(value)))
        .required('Số lượng tồn kho là bắt buộc')
        .min(0, 'Số lượng phải là số không âm'),
    category: yup.string().required('Danh mục sản phẩm là bắt buộc'),
    discount: yup
        .number()
        .nullable()
        .transform((value) => (value === null || value === '' ? undefined : Number(value)))
        .min(0, 'Giảm giá phải là số không âm')
        .when('price', (price, schema) =>
            price && price > 0
                ? schema.test(
                    'discount-not-greater-than-price',
                    'Giảm giá không được lớn hơn giá bán',
                    (value) => value === undefined || value === null || value <= price
                )
                : schema
        )
        .nullable(),
    brand: yup.string().nullable(),
    condition: yup.string().oneOf(['new', 'used'], 'Tình trạng không hợp lệ').required('Tình trạng là bắt buộc'),
    tags: yup.string().nullable(),
    variants: yup.array().of(
        yup.object().shape({
            name: yup.string().trim().required('Tên biến thể là bắt buộc'),
            options: yup.array().of(yup.string().trim().required('Giá trị không được để trống')),
        })
    ),
});

// Mock data cho danh mục sản phẩm (lấy từ Product.js)
const productCategories = [
    "Điện thoại", "Laptop", "Tablet", "Phụ kiện", "Máy ảnh", "Thời trang", "Thể thao",
    "Sneakers", "Đồng hồ", "Mỹ phẩm", "Nước hoa", "Đồ gia dụng", "Nội thất", "Công nghệ", "Gaming", "Đồ ăn",
    "Đồ uống", "Sách", "Đồ chơi", "Xe cộ", "Âm thanh", "Máy tính bảng", "Flagship", "Nhiếp ảnh"
];

export default function EditProduct() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Khởi tạo form với React Hook Form và Yup
    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
            price: null,
            discount: null,
            stock: null,
            category: '',
            brand: '',
            condition: 'new',
            tags: '',
            variants: [],
            isActive: true,
        },
        resolver: yupResolver(schema),
    });

    // Quản lý variants với useFieldArray
    const { fields: variants, append, remove } = useFieldArray({
        control: form.control,
        name: 'variants',
    });

    // Lấy dữ liệu sản phẩm khi component mount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await getDetailProductForSeller(slug);
                const product = response.data;

                // Điền dữ liệu vào form
                form.reset({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    discount: product.discount,
                    stock: product.stock,
                    category: product.category[0], // Lấy danh mục đầu tiên
                    brand: product.brand || '',
                    condition: product.condition,
                    tags: product.tags.join(', '),
                    variants: product.variants,
                    isActive: product.isActive,
                });

                // Điền mediaFiles từ images và videos
                const existingMedia = [
                    ...product.images.map((url, index) => ({
                        id: `existing-image-${index}`,
                        preview: url,
                        type: 'image',
                    })),
                    ...product.videos.map((url, index) => ({
                        id: `existing-video-${index}`,
                        preview: url,
                        type: 'video',
                    })),
                ];
                setMediaFiles(existingMedia);
            } catch (error) {
                toast.error('Lỗi', { description: 'Không thể lấy thông tin sản phẩm. Vui lòng thử lại sau.' });
                console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
            }
        };

        fetchProduct();

        return () => {
            mediaFiles.forEach((media) => {
                if (media.file) URL.revokeObjectURL(media.preview);
            });
        };
    }, [slug]);

    // Xử lý upload media
    const handleMediaChange = (e) => {
        const files = Array.from(e.target.files);
        const newMediaFiles = files.map((file) => ({
            id: Date.now() + Math.random().toString(36),
            file,
            preview: URL.createObjectURL(file),
            type: file.type.startsWith('video') ? 'video' : 'image',
        }));
        setMediaFiles((prev) => [...prev, ...newMediaFiles]);
    };

    // Xử lý xóa media
    const removeMedia = (index) => {
        const updatedMediaFiles = [...mediaFiles];
        if (updatedMediaFiles[index].file) {
            URL.revokeObjectURL(updatedMediaFiles[index].preview);
        }
        updatedMediaFiles.splice(index, 1);
        setMediaFiles(updatedMediaFiles);
    };

    // Xử lý thêm option cho biến thể
    const addVariantOption = (variantIndex, option) => {
        if (!option.trim()) return;

        const currentVariants = form.getValues('variants') || [];
        const updatedVariants = [...currentVariants];
        if (!updatedVariants[variantIndex].options.includes(option)) {
            updatedVariants[variantIndex].options = [...(updatedVariants[variantIndex].options || []), option];
            form.setValue('variants', updatedVariants);
        }
    };

    // Xử lý xóa option của biến thể
    const removeVariantOption = (variantIndex, optionIndex) => {
        const currentVariants = form.getValues('variants') || [];
        const updatedVariants = [...currentVariants];
        updatedVariants[variantIndex].options.splice(optionIndex, 1);
        form.setValue('variants', updatedVariants);
    };

    // Xử lý submit form
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        let message = '';
        try {
            const imageUrls = [];
            const videoUrls = [];

            if (mediaFiles.length > 0) {
                setUploading(true);
                for (const media of mediaFiles) {
                    if (media.file) {
                        const url = await uploadToCloudinary(media.file);
                        if (media.type === 'image') imageUrls.push(url);
                        else videoUrls.push(url);
                    } else {
                        if (media.type === 'image') imageUrls.push(media.preview);
                        else videoUrls.push(media.preview);
                    }
                }
                setUploading(false);
            }

            const productData = {
                ...data,
                price: data.price || 0,
                discount: data.discount || 0,
                stock: data.stock || 0,
                tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag) : [],
                category: [data.category], // Đảm bảo category là mảng
                images: imageUrls,
                videos: videoUrls,
            };

            const res = await updateProduct(slug, productData);
            message = res.message;
            toast.success('Thành công', { description: 'Cập nhật sản phẩm thành công' });
            navigate(`/seller/product-detail/${slug}`);
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error.message);
            if (error.message.includes('validation')) {
                toast.error('Thất bại', { description: 'Vui lòng kiểm tra lại các trường nhập, đảm bảo giảm giá không lớn hơn giá bán.' });
            } else {
                toast.error('Thất bại', { description: `Thêm sản phẩm thất bại: ${error.message || 'Đã có lỗi xảy ra'}` });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Xử lý quay lại
    const handleGoBack = () => {
        if (form.formState.isDirty || mediaFiles.some((media) => media.file)) {
            const confirmLeave = window.confirm('Bạn đã thay đổi dữ liệu. Bạn có chắc muốn thoát mà không lưu?');
            if (!confirmLeave) return;
        }
        navigate(`/seller/product-detail/${slug}`);
    };

    return (
        <div className="container mx-auto py-1 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleGoBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Package className="w-6 h-6" /> Chỉnh sửa sản phẩm
                    </h1>
                </div>

                <div className="mt-1 flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleGoBack}>
                        Hủy
                    </Button>
                    <Button
                        type="submit"
                        form="editProductForm"
                        className="bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 disabled:cursor-not-allowed"
                        disabled={isSubmitting || uploading}
                    >
                        {isSubmitting || uploading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                </div>
            </div>

            <Form {...form}>
                <form id="editProductForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Thông tin cơ bản */}
                        <Card className="col-span-2">
                            <CardHeader>
                                <CardTitle>Thông tin sản phẩm</CardTitle>
                                <CardDescription>Chỉnh sửa thông tin chi tiết về sản phẩm của bạn</CardDescription>
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
                                            <FormDescription>
                                                Tên sản phẩm sẽ hiển thị cho khách hàng trên trang sản phẩm
                                            </FormDescription>
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

                                {/* Giá và số lượng */}
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
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
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
                                                <FormLabel>Giảm giá</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="Nhập giảm giá (VNĐ)"
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

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
                                                        value={field.value || ''}
                                                        onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
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
                                    <FormField
                                        control={form.control}
                                        name="category"
                                        render={({ field }) => (
                                            <FormItem className="space-y-2">
                                                <FormLabel>
                                                    Danh mục <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Chọn danh mục" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {productCategories.map((category) => (
                                                            <SelectItem key={category} value={category}>
                                                                {category}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

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

                                {/* Tags */}
                                <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem className="space-y-2">
                                            <FormLabel>Thẻ (Tags)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập các thẻ, phân tách bằng dấu phẩy" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Các thẻ giúp khách hàng tìm thấy sản phẩm của bạn dễ dàng hơn
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Media và Biến thể */}
                        <div className="col-span-1 space-y-6">
                            {/* Ảnh/Video sản phẩm */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Hình ảnh/Video sản phẩm</CardTitle>
                                    <CardDescription>Tải lên hình ảnh hoặc video chất lượng cao của sản phẩm</CardDescription>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {mediaFiles.map((media) => (
                                            <div key={media.id} className="relative group">
                                                {media.type === 'image' ? (
                                                    <img
                                                        src={media.preview}
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
                                    <CardDescription>Thêm hoặc chỉnh sửa các biến thể như màu sắc, kích cỡ...</CardDescription>
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
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => remove(variantIndex)}
                                                    >
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
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                addVariantOption(variantIndex, e.target.value);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            const input = e.target.previousSibling;
                                                            addVariantOption(variantIndex, input.value);
                                                            input.value = '';
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
                                        onClick={() => append({ name: '', options: [] })}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Thêm biến thể mới
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}