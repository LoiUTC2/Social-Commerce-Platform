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
import { getProductDetailForSeller, updateProduct } from '../../../services/productService';
import { getCategoryTree } from '../../../services/categoryService';
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

export default function EditProduct() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [mediaFiles, setMediaFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedLevel1, setSelectedLevel1] = useState('');
    const [selectedLevel2, setSelectedLevel2] = useState('');
    const [selectedLevel3, setSelectedLevel3] = useState('');
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

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

    // Lấy danh mục từ API
    const fetchCategories = async () => {
        setIsLoadingCategories(true);
        try {
            const response = await getCategoryTree();
            console.log('Categories fetched:', response.data.tree);
            setCategories(response.data.tree);
            return response.data || [];
        } catch (error) {
            toast.error('Lỗi', { description: 'Không thể tải danh mục. Vui lòng thử lại.' });
            console.error('Lỗi khi lấy danh mục:', error);
            return [];
        } finally {
            setIsLoadingCategories(false);
        }
    };

    // Tìm thông tin danh mục dựa trên _id
    const findCategoryPath = (categoryId, categories) => {
        // Kiểm tra categories có phải là mảng
        if (!Array.isArray(categories)) {
            console.error('Categories is not an array:', categories);
            return { level1: '', level2: '', level3: '', id: '' };
        }

        for (const cat of categories) {
            // Kiểm tra danh mục cấp 1
            if (cat._id === categoryId) {
                return { level1: cat.name, level2: '', level3: '', id: cat._id };
            }

            // Kiểm tra children của cấp 1
            if (Array.isArray(cat.children)) {
                for (const child of cat.children) {
                    // Kiểm tra danh mục cấp 2
                    if (child._id === categoryId) {
                        return { level1: cat.name, level2: child.name, level3: '', id: child._id };
                    }

                    // Kiểm tra children của cấp 2
                    if (Array.isArray(child.children)) {
                        for (const grandchild of child.children) {
                            // Kiểm tra danh mục cấp 3
                            if (grandchild._id === categoryId) {
                                return { level1: cat.name, level2: child.name, level3: grandchild.name, id: grandchild._id };
                            }
                        }
                    } else {
                        console.warn(`Child "${child.name}" has invalid children:`, child.children);
                    }
                }
            } else {
                console.warn(`Category "${cat.name}" has invalid children:`, cat.children);
            }
        }

        console.warn(`Category ID "${categoryId}" not found in categories`);
        return { level1: '', level2: '', level3: '', id: '' };
    };

    // Lấy dữ liệu sản phẩm và danh mục khi component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Lấy danh mục
                const categories = await fetchCategories();
                // Lấy sản phẩm
                const response = await getProductDetailForSeller(slug);
                const product = response.data.product;

                // Điền dữ liệu vào form
                form.reset({
                    name: product.name,
                    description: product.description,
                    price: product.price,
                    discount: product.discount,
                    stock: product.stock,
                    category: product.mainCategory?._id || '',
                    brand: product.brand || '',
                    condition: product.condition,
                    tags: product.tags?.join(', ') || '',
                    variants: product.variants || [],
                    isActive: product.isActive,
                });

                // Tìm và set danh mục cấp 1, 2, 3
                if (product.mainCategory?._id) {
                    const path = findCategoryPath(product.mainCategory._id, categories);
                    setSelectedLevel1(path.level1);
                    setSelectedLevel2(path.level2);
                    setSelectedLevel3(path.level3);
                    console.log('Category path:', path);
                }

                // Điền mediaFiles từ images và videos
                const existingMedia = [
                    ...(product.images || []).map((url, index) => ({
                        id: `existing-image-${index}`,
                        preview: url,
                        type: 'image',
                    })),
                    ...(product.videos || []).map((url, index) => ({
                        id: `existing-video-${index}`,
                        preview: url,
                        type: 'video',
                    })),
                ];
                setMediaFiles(existingMedia);
            } catch (error) {
                toast.error('Lỗi', { description: 'Không thể lấy thông tin sản phẩm hoặc danh mục. Vui lòng thử lại sau.' });
                console.error('Lỗi khi lấy dữ liệu:', error);
            }
        };

        fetchData();

        return () => {
            mediaFiles.forEach((media) => {
                if (media.file) URL.revokeObjectURL(media.preview);
            });
        };
    }, [slug]);

    // Xử lý khi danh mục cấp 1 thay đổi
    const handleLevel1Change = (name) => {
        const category = categories.find(cat => cat.name === name);
        setSelectedLevel1(name);
        setSelectedLevel2('');
        setSelectedLevel3('');
        form.setValue('category', category?._id || '');
        console.log('Selected Level 1:', { name, id: category?._id });
    };

    // Xử lý khi danh mục cấp 2 thay đổi
    const handleLevel2Change = (value) => {
        if (value === 'none') {
            const category = categories.find(cat => cat.name === selectedLevel1);
            setSelectedLevel2('');
            setSelectedLevel3('');
            form.setValue('category', category?._id || '');
            console.log('Selected Level 2: None, using Level 1:', { name: selectedLevel1, id: category?._id });
        } else {
            const category = categories.find(cat => cat.name === selectedLevel1)?.children.find(child => child.name === value);
            setSelectedLevel2(value);
            setSelectedLevel3('');
            form.setValue('category', category?._id || '');
            console.log('Selected Level 2:', { name: value, id: category?._id });
        }
    };

    // Xử lý khi danh mục cấp 3 thay đổi
    const handleLevel3Change = (value) => {
        if (value === 'none') {
            const category = categories
                .find(cat => cat.name === selectedLevel1)
                ?.children.find(child => child.name === selectedLevel2);
            setSelectedLevel3('');
            form.setValue('category', category?._id || '');
            console.log('Selected Level 3: None, using Level 2:', { name: selectedLevel2, id: category?._id });
        } else {
            const category = categories
                .find(cat => cat.name === selectedLevel1)
                ?.children.find(child => child.name === selectedLevel2)
                ?.children.find(grandchild => grandchild.name === value);
            setSelectedLevel3(value);
            form.setValue('category', category?._id || '');
            console.log('Selected Level 3:', { name: value, id: category?._id });
        }
    };

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
        try {
            console.log('Form data before submit:', data);
            console.log('Category ID to be sent:', data.category);

            // Kiểm tra category ID hợp lệ
            if (!data.category) {
                throw new Error('Danh mục sản phẩm không được để trống');
            }

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
                name: data.name,
                description: data.description,
                price: data.price || 0,
                discount: data.discount || 0,
                stock: data.stock || 0,
                mainCategory: data.category,
                tags: data.tags ? data.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag) : [],
                images: imageUrls,
                videos: videoUrls,
                brand: data.brand,
                condition: data.condition,
                variants: data.variants,
                isActive: data.isActive,
            };

            console.log('Product data to be sent:', productData);

            await updateProduct(slug, productData);
            toast.success('Thành công', { description: 'Cập nhật sản phẩm thành công' });
            navigate(`/seller/product-detail/${slug}`);
        } catch (error) {
            console.error('Lỗi khi cập nhật sản phẩm:', error);
            if (error.message.includes('validation')) {
                toast.error('Thất bại', { description: 'Vui lòng kiểm tra lại các trường nhập, đảm bảo giảm giá không lớn hơn giá bán.' });
            } else {
                toast.error('Thất bại', { description: `Cập nhật sản phẩm thất bại: ${error.response?.data?.message || error.message}` });
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
                                                        value={field.value ?? ''}
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
                                                        value={field.value ?? ''}
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
                                                        value={field.value ?? ''}
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
                                    <div className="space-y-2">
                                        {/* Select cho danh mục cấp 1 */}
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Danh mục cấp 1 <span className="text-red-500">*</span>
                                                    </FormLabel>
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
                                                    <FormDescription>
                                                        Chọn danh mục cấp 1 cho sản phẩm
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Select cho danh mục cấp 2 */}
                                        {selectedLevel1 && categories.find(cat => cat.name === selectedLevel1)?.children?.length > 0 && (
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Danh mục cấp 2</FormLabel>
                                                        <Select onValueChange={handleLevel2Change} value={selectedLevel2 || 'none'}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Chọn danh mục cấp 2" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="none">Không chọn</SelectItem>
                                                                {categories
                                                                    .find(cat => cat.name === selectedLevel1)
                                                                    ?.children.map((child) => (
                                                                        <SelectItem key={child._id} value={child.name}>
                                                                            {child.name}
                                                                        </SelectItem>
                                                                    ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>
                                                            Chọn danh mục cấp 2 nếu có
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}

                                        {/* Select cho danh mục cấp 3 */}
                                        {selectedLevel2 && selectedLevel2 !== 'none' &&
                                            categories.find(cat => cat.name === selectedLevel1)?.children?.find(child => child.name === selectedLevel2)?.children?.length > 0 && (
                                                <FormField
                                                    control={form.control}
                                                    name="category"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Danh mục cấp 3</FormLabel>
                                                            <Select onValueChange={handleLevel3Change} value={selectedLevel3 || 'none'}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Chọn danh mục cấp 3" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <SelectItem value="none">Không chọn</SelectItem>
                                                                    {categories
                                                                        .find(cat => cat.name === selectedLevel1)
                                                                        ?.children.find(child => child.name === selectedLevel2)
                                                                        ?.children.map((grandchild) => (
                                                                            <SelectItem key={grandchild._id} value={grandchild.name}>
                                                                                {grandchild.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormDescription>
                                                                Chọn danh mục cấp 3 nếu có
                                                            </FormDescription>
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

                    {/* Form Footer */}
                    <div className="mt-6 flex items-center justify-end gap-2">
                        <Button type="button" variant="outline" onClick={handleGoBack}>
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            className="bg-pink-500 hover:bg-pink-600"
                            disabled={isSubmitting || uploading}
                        >
                            {isSubmitting || uploading ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}