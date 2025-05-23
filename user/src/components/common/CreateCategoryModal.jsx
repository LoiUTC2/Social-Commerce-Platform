import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { createCategory } from '../../services/categoryService';

// Schema validation cho form tạo danh mục
const categorySchema = yup.object().shape({
    name: yup
        .string()
        .trim()
        .required('Tên danh mục là bắt buộc'),
        // .test('unique-name', 'Tên danh mục đã tồn tại', function (value) {
        //     const categories = this.options.context?.categories || [];
        //     return !categories.some(cat => cat.name.toLowerCase() === value.toLowerCase());
        // }),
    level1: yup.string().nullable(),
    level2: yup.string().nullable(),
    description: yup.string().trim().nullable(),
});

export default function CreateCategoryModal({ open, onOpenChange, onCategoryCreated, categories, user }) {
    // State để quản lý danh mục cấp 1 và cấp 2
    const [selectedLevel1, setSelectedLevel1] = useState(null);

    // Form cho tạo danh mục
    const categoryForm = useForm({
        defaultValues: {
            name: '',
            level1: 'none',
            level2: 'none',
            description: '',
        },
        resolver: yupResolver(categorySchema),
        context: { categories },
    });

    // Reset level2 khi level1 thay đổi
    const handleLevel1Change = (value) => {
        setSelectedLevel1(value === 'none' ? null : value);
        categoryForm.setValue('level1', value);
        categoryForm.setValue('level2', 'none');
    };

    // Xử lý tạo danh mục mới
    const handleCreateCategory = async (data) => {
        try {
            let parentId = null;
            if (data.level1 !== 'none' && data.level2 !== 'none') {
                // Danh mục cấp 3: cha là cấp 2
                parentId = data.level2;
            } else if (data.level1 !== 'none') {
                // Danh mục cấp 2: cha là cấp 1
                parentId = data.level1;
            }
            // Nếu level1 là 'none', parentId giữ là null (danh mục cấp 1)

            const categoryData = {
                name: data.name,
                description: data.description || '',
                parent: parentId,
                createdBy: user?._id,
                updatedBy: user?._id,
            };
            console.log('Category data to be sent:', categoryData);
            await createCategory(categoryData);
            toast.success('Thành công', { description: 'Tạo danh mục mới thành công' });
            onOpenChange(false);
            categoryForm.reset();
            setSelectedLevel1(null);
            onCategoryCreated(); // Gọi callback để cập nhật danh sách danh mục
        } catch (error) {
            toast.error('Thất bại', {
                description: error.response?.data?.message || `Tạo danh mục thất bại: ${error.message || 'Đã có lỗi xảy ra'}`,
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Thêm danh mục mới</DialogTitle>
                </DialogHeader>
                <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(handleCreateCategory)} className="space-y-4">
                        <FormField
                            control={categoryForm.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên danh mục <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tên danh mục" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={categoryForm.control}
                            name="level1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Danh mục cấp 1 (tuỳ chọn)</FormLabel>
                                    <Select onValueChange={handleLevel1Change} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn danh mục cấp 1" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="none">Không có (cấp 1)</SelectItem>
                                            {categories.filter(cat => cat.level === 1).map((cat) => (
                                                <SelectItem key={cat._id} value={cat._id}>
                                                    {cat.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        Chọn danh mục cấp 1 nếu đây là danh mục cấp 2 hoặc cấp 3
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {selectedLevel1 && categories.find(cat => cat._id === selectedLevel1)?.children?.length > 0 && (
                            <FormField
                                control={categoryForm.control}
                                name="level2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Danh mục cấp 2 (tuỳ chọn)</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Chọn danh mục cấp 2" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Không chọn (cấp 2)</SelectItem>
                                                {categories
                                                    .find(cat => cat._id === selectedLevel1)
                                                    ?.children.map((child) => (
                                                        <SelectItem key={child._id} value={child._id}>
                                                            {child.name}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Chọn danh mục cấp 2 nếu đây là danh mục cấp 3
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={categoryForm.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả danh mục</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Nhập mô tả danh mục (tuỳ chọn)" rows={3} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => {
                                onOpenChange(false);
                                setSelectedLevel1(null);
                                categoryForm.reset();
                            }}>
                                Hủy
                            </Button>
                            <Button type="submit">Tạo danh mục</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}